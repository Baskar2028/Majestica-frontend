import { useState, useRef, useEffect, useMemo } from "react";
// Import Recharts components
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function App() {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem("majestica_chat");
    return saved ? JSON.parse(saved) : [];
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("majestica_theme");
    return savedTheme === "dark";
  });

  // Mood Snapshot State
  const [moodHistory, setMoodHistory] = useState(() => {
    const savedHistory = localStorage.getItem("majestica_history");
    return savedHistory ? JSON.parse(savedHistory) : [];
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false); // Toggle for Analysis View
  const [showSnapshot, setShowSnapshot] = useState(false); // Toggle for Mood Snapshot View
  const chatRef = useRef(null);

  // --- STRESS ANALYSIS LOGIC ---
  const stressData = useMemo(() => {
    const keywords = ["sad", "stressed", "anxious", "tired", "angry", "worried", "pressure", "help", "burnout", "depressed", "failure"];
    let currentStress = 30; // Starting baseline
    
    return messages.map((msg, index) => {
      if (msg.role === "user") {
        const foundKeywords = keywords.filter(word => msg.content.toLowerCase().includes(word));
        currentStress += foundKeywords.length > 0 ? foundKeywords.length * 18 : 5;
      } else {
        currentStress -= 12; 
      }
      currentStress = Math.max(10, Math.min(100, currentStress));
      return {
        name: `Point ${index + 1}`,
        level: Math.round(currentStress),
      };
    });
  }, [messages]);

  const currentStressLevel = stressData.length > 0 ? stressData[stressData.length - 1].level : 0;

  // Save Mood Snapshot logic
  useEffect(() => {
    if (currentStressLevel > 0) {
      const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const newEntry = { date: today, level: currentStressLevel };
      
      setMoodHistory(prev => {
        const filtered = prev.filter(item => item.date !== today);
        const updated = [newEntry, ...filtered].slice(0, 7); // Keep last 7 days
        localStorage.setItem("majestica_history", JSON.stringify(updated));
        return updated;
      });
    }
  }, [currentStressLevel]);

  useEffect(() => {
    chatRef.current?.scrollTo({
      top: chatRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  useEffect(() => {
    localStorage.setItem("majestica_chat", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem("majestica_theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    if (input.toLowerCase().trim() === "/analyse") {
      setShowAnalysis(true);
      setShowSnapshot(false);
      setInput("");
      return;
    }

    const userMsg = { role: "user", content: input };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("https://majestica-1.onrender.com/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated }),
      });
      const botMsg = await res.json();
      setMessages([...updated, botMsg]);
    } catch (err) {
      console.error("Connection Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const restoreSession = () => {
    setMessages([]);
    setShowAnalysis(false);
    setShowSnapshot(false);
    localStorage.removeItem("majestica_chat");
    localStorage.removeItem("majestica_history");
    setMoodHistory([]);
  };

  return (
    <div className={`h-screen flex flex-col font-sans transition-colors duration-500 ${
      isDarkMode ? "bg-slate-900 text-slate-300 selection:bg-indigo-900" : "bg-[#F8FAFC] text-slate-600 selection:bg-indigo-100"
    }`}>
      
      <header className={`p-5 md:px-10 flex justify-between items-center backdrop-blur-md sticky top-0 z-20 border-b transition-colors duration-500 ${
        isDarkMode ? "bg-slate-900/80 border-slate-800" : "bg-white/60 border-slate-100"
      }`}>
        <h1 className={`text-2xl md:text-3xl font-serif italic tracking-tight transition-colors duration-500 ${
          isDarkMode ? "text-slate-500" : "text-slate-400"
        }`}>
          Majestica
        </h1>

        <div className="flex gap-4 md:gap-6 items-center">
          <button
            onClick={() => { setShowSnapshot(!showSnapshot); setShowAnalysis(false); }}
            className={`text-[10px] md:text-xs uppercase tracking-[0.2em] font-bold transition-colors duration-300 ${
              showSnapshot ? "text-indigo-500" : (isDarkMode ? "text-slate-500" : "text-slate-400")
            }`}
          >
            Snapshot
          </button>
          <button
            onClick={() => { setShowAnalysis(!showAnalysis); setShowSnapshot(false); }}
            className={`text-[10px] md:text-xs uppercase tracking-[0.2em] font-bold transition-colors duration-300 ${
              showAnalysis ? "text-indigo-500" : (isDarkMode ? "text-indigo-400" : "text-indigo-600")
            }`}
          >
            {showAnalysis ? "Back" : "Analyse"}
          </button>
          <button
            onClick={restoreSession}
            className={`text-[10px] md:text-xs uppercase tracking-[0.2em] font-bold hover:text-red-400 transition-colors duration-300 ${
              isDarkMode ? "text-slate-500" : "text-slate-400"
            }`}
          >
            Restore
          </button>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`text-[10px] md:text-xs uppercase tracking-[0.2em] font-bold hover:text-indigo-500 transition-colors duration-300 ${
              isDarkMode ? "text-slate-500" : "text-slate-400"
            }`}
          >
            {isDarkMode ? "Light" : "Dark"}
          </button>
        </div>
      </header>

      <main ref={chatRef} className="flex-1 overflow-y-auto relative px-4 md:px-0">
        <div className="max-w-3xl mx-auto h-full flex flex-col">
          
          {showSnapshot ? (
            // --- DAILY MOOD SNAPSHOT VIEW ---
            <div className="flex-1 py-12 flex flex-col items-center animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className={`text-2xl font-serif mb-8 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Weekly Mood Snapshot</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full px-4">
                {moodHistory.length > 0 ? moodHistory.map((day, i) => (
                  <div key={i} className={`p-6 rounded-[32px] text-center border transition-all ${
                    isDarkMode ? "bg-slate-800/40 border-slate-700" : "bg-white border-slate-100 shadow-sm"
                  }`}>
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-2">{day.date}</p>
                    <p className={`text-2xl font-bold ${day.level > 60 ? "text-red-400" : "text-indigo-500"}`}>{day.level}%</p>
                    <p className="text-[9px] text-slate-500 mt-1">Stress Level</p>
                  </div>
                )) : (
                  <div className="col-span-full text-center opacity-40 italic py-10">No history snapshots yet. Start a conversation to track your mood.</div>
                )}
              </div>
            </div>
          ) : showAnalysis ? (
            // --- ANALYSIS VIEW ---
            <div className="flex-1 py-12 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="text-center mb-10">
                <h2 className={`text-3xl font-serif mb-2 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Emotional Insights</h2>
                <div className={`text-5xl font-bold ${currentStressLevel > 60 ? "text-red-400" : "text-indigo-500"}`}>
                  {currentStressLevel}% <span className="text-sm uppercase tracking-widest font-medium text-slate-400">Stress Level</span>
                </div>
              </div>

              <div className={`w-full h-80 p-6 rounded-[40px] border transition-all ${
                isDarkMode ? "bg-slate-800/40 border-slate-700" : "bg-white border-slate-100 shadow-xl shadow-indigo-100/10"
              }`}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stressData}>
                    <defs>
                      <linearGradient id="colorLevel" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#334155" : "#f1f5f9"} />
                    <XAxis dataKey="name" hide />
                    <YAxis domain={[0, 100]} hide />
                    <Tooltip 
                      contentStyle={{ borderRadius: '24px', backgroundColor: isDarkMode ? '#1e293b' : '#fff', border: 'none' }}
                      itemStyle={{ color: '#6366f1', fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="level" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorLevel)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-10 grid grid-cols-2 gap-4 w-full px-4">
                <div className={`p-4 rounded-3xl border ${isDarkMode ? "bg-slate-800/20 border-slate-800" : "bg-white border-slate-100"}`}>
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">Stability</p>
                  <p className="text-lg font-medium">{currentStressLevel < 40 ? "High" : "Fluctuating"}</p>
                </div>
                <div className={`p-4 rounded-3xl border ${isDarkMode ? "bg-slate-800/20 border-slate-800" : "bg-white border-slate-100"}`}>
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">Recommendation</p>
                  <p className="text-lg font-medium">{currentStressLevel > 50 ? "Deep Breathing" : "Keep Venting"}</p>
                </div>
              </div>
            </div>
          ) : messages.length === 0 ? (
            // --- EMPTY STATE ---
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in zoom-in duration-1000">
              <div className={`w-24 h-24 rounded-full flex items-center justify-center shadow-sm border transition-colors duration-500 ${
                isDarkMode ? "bg-gradient-to-b from-slate-800 to-slate-900 border-slate-800" : "bg-gradient-to-b from-white to-slate-50 border-slate-100"
              }`}>
                <span className="text-4xl opacity-50">🌿</span>
              </div>
              <div className="space-y-2">
                <h2 className={`text-4xl md:text-6xl font-serif leading-tight transition-colors duration-500 ${
                  isDarkMode ? "text-slate-500" : "text-slate-400"
                }`}>Breath in, <br /> Speak out.</h2>
                <p className={`font-light text-lg max-w-sm mx-auto transition-colors duration-500 ${
                  isDarkMode ? "text-slate-400" : "text-slate-500"
                }`}>Your heart is safe here. Type <span className="font-mono text-indigo-500">/analyse</span> to see your graph.</p>
              </div>
            </div>
          ) : (
            // --- MESSAGES LIST ---
            <div className="py-8 space-y-8">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-2 duration-500`}>
                  <div className={`max-w-[85%] md:max-w-[75%] px-6 py-4 rounded-[28px] text-sm md:text-base leading-relaxed shadow-sm transition-all ${
                    msg.role === "user" ? "bg-indigo-500 text-white rounded-tr-none" : isDarkMode ? "bg-slate-800 border border-slate-700 text-slate-300 rounded-tl-none" : "bg-white border border-slate-100 text-slate-600 rounded-tl-none"
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start animate-pulse px-2">
                  <span className={`text-[10px] font-bold tracking-[0.2em] uppercase ${isDarkMode ? "text-slate-500" : "text-slate-300"}`}>Majestica is reflecting</span>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <footer className={`p-6 md:pb-12 bg-gradient-to-t transition-colors duration-500 ${
        isDarkMode ? "from-slate-900 via-slate-900 to-transparent" : "from-[#F8FAFC] via-[#F8FAFC] to-transparent"
      }`}>
        <div className="max-w-3xl mx-auto relative">
          <input
            className={`w-full p-5 md:p-6 pr-20 md:pr-24 rounded-[30px] outline-none focus:ring-4 transition-all text-sm md:text-base ${
              isDarkMode ? "bg-slate-800 border border-slate-700 text-slate-200 focus:ring-indigo-900/50" : "bg-white border border-slate-100 text-slate-700 focus:ring-indigo-50 shadow-2xl shadow-indigo-100/40"
            }`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Share your heart..."
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button
            onClick={sendMessage}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-indigo-500 text-white px-5 py-2 md:py-3 rounded-full font-medium hover:bg-indigo-600 active:scale-95 transition-all shadow-md"
          >
            Send
          </button>
        </div>
      </footer>
    </div>
  );
}
