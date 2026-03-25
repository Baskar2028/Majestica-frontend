import { useState, useRef, useEffect } from "react";

export default function App() {

  // 🧠 Load saved chat
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem("majestica_chat");
    return saved
      ? JSON.parse(saved)
      : [
          {
            role: "assistant",
            content: "Hi 💛 I’m Majestica. How are you feeling today?",
          },
        ];
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatRef = useRef(null);

  // 🔥 Auto-scroll
  useEffect(() => {
    chatRef.current?.scrollTo(0, chatRef.current.scrollHeight);
  }, [messages]);

  // 💾 Save chat
  useEffect(() => {
    localStorage.setItem("majestica_chat", JSON.stringify(messages));
  }, [messages]);

const sendMessage = async () => {
  if (!input.trim()) return;

  const userMsg = { role: "user", content: input };
  const updated = [...messages, userMsg];

  setMessages(updated);
  setInput("");
  setLoading(true); // ⭐ start typing indicator

  try {
    const res = await fetch("https://majestica-1.onrender.com/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages: updated }),
    });

    const botMsg = await res.json();

    setMessages([...updated, botMsg]);
  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false); // ⭐ stop typing indicator
  }
};

  // 🧹 Clear chat
  const clearChat = () => {
    const starter = [
      {
        role: "assistant",
        content: "Hi 💛 I’m Majestica. How are you feeling today?",
      },
    ];

    setMessages(starter);
    localStorage.removeItem("majestica_chat");
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-[#0f0c29] via-[#1a1a2e] to-[#0b0b15] text-gray-100">

      {/* 👑 HEADER */}
      <div className="p-4 flex justify-between items-center bg-black/30 backdrop-blur shadow-lg">

        {/* Gradient Title */}
        <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
          👑 Majestica
        </h1>

        {/* 🤍 Soft White Clear Button */}
        <button
          onClick={clearChat}
          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-200 hover:text-white transition text-sm font-semibold border border-white/20"
        >
          Clear Chat
        </button>

      </div>

      {/* 💬 CHAT AREA */}
     <div
  ref={chatRef}
  className="flex-1 overflow-y-auto p-5 space-y-4"
>

  {/* 💬 Existing Messages */}
  {messages.map((msg, i) => (
    <div
      key={i}
      className={`max-w-md px-4 py-3 rounded-2xl shadow-lg ${
        msg.role === "user"
          ? "ml-auto bg-gradient-to-r from-purple-600 to-pink-600"
          : "bg-[#1f1f35]"
      }`}
    >
      {msg.content}
    </div>
  ))}

  {/* ✨ ADD THIS BELOW (Typing Indicator) */}
  {loading && (
    <div className="bg-[#1f1f35] px-4 py-3 rounded-2xl w-fit animate-pulse">
        Typing
    </div>
  )}

</div>

      {/* ✏️ INPUT AREA */}
      <div className="p-4 bg-black/40 backdrop-blur flex gap-3">

        <input
          className="flex-1 p-3 rounded-2xl bg-[#1e1e30] border border-gray-700 outline-none focus:ring-2 focus:ring-purple-500"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Share what’s on your mind..."
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />

        <button
          onClick={sendMessage}
          className="px-6 rounded-2xl font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:scale-105 transition"
        >
          Send
        </button>

      </div>
    </div>
  );
}