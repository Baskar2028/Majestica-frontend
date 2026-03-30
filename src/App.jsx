import { useState, useRef, useEffect } from "react";

export default function App() {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem("majestica_chat");
    return saved ? JSON.parse(saved) : [];
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatRef = useRef(null);

  useEffect(() => {
    chatRef.current?.scrollTo({
      top: chatRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  useEffect(() => {
    localStorage.setItem("majestica_chat", JSON.stringify(messages));
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
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
    localStorage.removeItem("majestica_chat");
  };

  return (
    <div className="h-screen flex flex-col bg-[#F8FAFC] text-slate-600 font-sans selection:bg-indigo-100">
      
      <header className="p-5 md:px-10 flex justify-between items-center bg-white/60 backdrop-blur-md sticky top-0 z-20 border-b border-slate-100">
        <h1 className="text-2xl md:text-3xl font-serif italic text-slate-400 tracking-tight">
          Majestica
        </h1>

        <div className="flex gap-4 items-center">
          {messages.length > 0 && (
            <button
              onClick={restoreSession}
              className="text-[10px] md:text-xs uppercase tracking-[0.2em] font-bold text-slate-400 hover:text-indigo-500 transition-colors duration-300"
            >
              Restore Session
            </button>
          )}
        </div>
      </header>

      <main ref={chatRef} className="flex-1 overflow-y-auto relative px-4 md:px-0">
        <div className="max-w-3xl mx-auto h-full flex flex-col">
          
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in zoom-in duration-1000">
              <div className="w-24 h-24 bg-gradient-to-b from-white to-slate-50 rounded-full flex items-center justify-center shadow-sm border border-slate-100">
                <span className="text-4xl opacity-50">🌿</span>
              </div>
              <div className="space-y-2">
                <h2 className="text-4xl md:text-6xl font-serif text-slate-400 leading-tight">
                  Breath in, <br /> Speak out.
                </h2>
                <p className="text-slate-500 font-light text-lg max-w-sm mx-auto">
                  Your journey to a calmer mind starts with a single word.
                </p>
              </div>
            </div>
          ) : (
            <div className="py-8 space-y-8">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-2 duration-500`}>
                  <div className={`max-w-[85%] md:max-w-[75%] px-6 py-4 rounded-[28px] text-sm md:text-base leading-relaxed shadow-sm transition-all ${
                    msg.role === "user" ? "bg-indigo-500 text-white rounded-tr-none" : "bg-white border border-slate-100 text-slate-600 rounded-tl-none"
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start animate-pulse">
                  <div className="bg-white border border-slate-100 px-6 py-4 rounded-[28px] rounded-tl-none flex items-center gap-2">
                    <span className="text-xs text-slate-300 font-medium tracking-widest uppercase">Majestica is reflecting</span>
                    <span className="flex gap-1">
                      <span className="w-1 h-1 bg-slate-300 rounded-full animate-bounce"></span>
                      <span className="w-1 h-1 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-1 h-1 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <footer className="p-6 md:pb-12 bg-gradient-to-t from-[#F8FAFC] via-[#F8FAFC] to-transparent">
        <div className="max-w-3xl mx-auto relative">
          <input
            className="w-full p-5 md:p-6 pr-20 md:pr-24 rounded-[30px] bg-white shadow-2xl shadow-indigo-100/40 border border-slate-100 outline-none focus:ring-4 focus:ring-indigo-50 transition-all text-slate-700 placeholder:text-slate-300 text-sm md:text-base"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Share your heart..."
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button
            onClick={sendMessage}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-indigo-500 text-white px-5 py-2 md:py-3 rounded-full font-medium hover:bg-indigo-600 transition-all shadow-md active:scale-95"
          >
            Send
          </button>
        </div>
        {/* Updated text-slate-300 to text-slate-500 for better visibility */}
        <p className="text-center text-[9px] uppercase tracking-[0.3em] text-slate-500 mt-6">
          Encrypted & Private Sanctuary
        </p>
      </footer>
    </div>
  );
}
