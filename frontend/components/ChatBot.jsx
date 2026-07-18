"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const DICT = {
  en: {
    title: "AI Scheme Assistant",
    subtitle: "Ask about welfare eligibility & rules",
    placeholder: "Type a question in English, தமிழ், or हिंदी...",
    safety: "Safe Chat: We never ask for Aadhaar or bank details.",
    suggestions: [
      "Am I eligible for PM-KISAN?",
      "Are there scholarships for students?",
      "Housing support for daily wage workers?",
      "SSY requirements for girls?"
    ],
    greeting: "Hello! I can explain the eligibility rules for all government schemes in Tamil, Hindi, or English. Ask me anything!",
    referenced: "Related schemes (click to view details):"
  },
  ta: {
    title: "AI திட்ட உதவியாளர்",
    subtitle: "தகுதி மற்றும் விதிகள் பற்றி கேளுங்கள்",
    placeholder: "தமிழ், English, அல்லது हिंदी-யில் கேளுங்கள்...",
    safety: "பாதுகாப்பான அரட்டை: ஆதார் அல்லது வங்கி எண்களை நாங்கள் கேட்பதில்லை.",
    suggestions: [
      "PM-KISAN தகுதி எனக்கு உண்டா?",
      "மாணவர்களுக்கான கல்வி உதவித்தொகை உள்ளதா?",
      "கூலித் தொழிலாளர்களுக்கு வீட்டு வசதி உள்ளதா?",
      "பெண் குழந்தைகளுக்கான SSY சேமிப்பு திட்டம்?"
    ],
    greeting: "வணக்கம்! நீங்கள் தகுதியான அரசு நலத்திட்டங்கள் மற்றும் அதன் விண்ணப்பிக்கும் தகுதிகளை தமிழ், இந்தி அல்லது ஆங்கிலத்தில் விளக்க முடியும். ஏதேனும் கேளுங்கள்!",
    referenced: "தொடர்புடைய திட்டங்கள் (விவரங்களைக் காண கிளிக் செய்யவும்):"
  },
  hi: {
    title: "AI योजना सहायक",
    subtitle: "पात्रता और नियमों के बारे में पूछें",
    placeholder: "हिंदी, English, या तमिल में पूछें...",
    safety: "सुरक्षित चैट: हम कभी भी आधार या बैंक विवरण नहीं मांगते हैं।",
    suggestions: [
      "क्या मैं PM-KISAN के लिए पात्र हूँ?",
      "क्या छात्रों के लिए कोई स्कॉलरशिप है?",
      "मजदूरों के लिए आवास सहायता?",
      "बालिकाओं के लिए SSY योजना नियम?"
    ],
    greeting: "नमस्ते! मैं सभी सरकारी योजनाओं की पात्रता नियमों को हिंदी, तमिल या अंग्रेजी में समझा सकता हूँ। कुछ भी पूछें!",
    referenced: "संबंधित योजनाएं (विवरण देखने के लिए क्लिक करें):"
  }
};

export default function ChatBot({ language = "en", isInline = false }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [schemesMap, setSchemesMap] = useState({});
  const messagesEndRef = useRef(null);

  const t = DICT[language] || DICT.en;

  // Initialize conversation history
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        { role: "assistant", content: t.greeting }
      ]);
    }
  }, [language]);

  // Autoscroll chat history
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  const handleSend = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    if (!textToSend) setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);

    // Retrieve local user profile from localStorage
    let userProfile = null;
    const rawProfile = localStorage.getItem("user_profile");
    if (rawProfile) {
      try {
        userProfile = JSON.parse(rawProfile);
      } catch (e) {
        console.error("Failed to parse local profile:", e);
      }
    }

    // Format message history (excluding greeting to save tokens)
    const formattedHistory = messages
      .slice(1)
      .map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user",
        content: msg.content
      }));

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: formattedHistory,
          user_profile: userProfile,
          language: language
        })
      });

      if (!res.ok) throw new Error("Chat service error");
      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply,
          references: data.matched_schemes || []
        }
      ]);

      // Fetch matching schemes names dynamically if they aren't loaded in schemesMap
      if (data.matched_schemes && data.matched_schemes.length > 0) {
        data.matched_schemes.forEach(async (sid) => {
          if (!schemesMap[sid]) {
            try {
              const sres = await fetch(`${API_URL}/schemes/${sid}`);
              if (sres.ok) {
                const sdata = await sres.json();
                setSchemesMap((prev) => ({
                  ...prev,
                  [sid]: sdata.name_ta && language === "ta" ? sdata.name_ta : (
                         sdata.name_hi && language === "hi" ? sdata.name_hi : sdata.name)
                }));
              }
            } catch (e) {
              console.error("Failed to load details for " + sid, e);
            }
          }
        });
      }

    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I am having trouble connecting to my servers right now. Please try again later." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (isInline) {
    return (
      <div className="flex flex-col h-full w-full bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm">
        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-900 to-blue-900 px-6 py-5 text-white flex-shrink-0">
          <h3 className="text-sm font-extrabold m-0 tracking-tight flex items-center gap-1.5">
            ✨ {t.title}
          </h3>
          <p className="text-[11px] text-blue-200/90 m-0 mt-1 leading-normal font-medium">
            {t.subtitle}
          </p>
        </div>

        {/* Safety Reminder Banner */}
        <div className="bg-emerald-50 border-b border-emerald-100/60 px-5 py-2.5 flex items-center gap-2">
          <span className="text-xs">🔒</span>
          <span className="text-[10px] font-bold text-emerald-800 leading-normal">
            {t.safety}
          </span>
        </div>

        {/* Conversation Window */}
        <div className="flex-1 p-5 overflow-y-auto bg-slate-50/50 flex flex-col gap-4.5 custom-scrollbar">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`max-w-[85%] flex flex-col gap-1.5 ${
                msg.role === "user" ? "self-end items-end" : "self-start items-start"
              }`}
            >
              <div
                className={`px-4 py-3 text-xs leading-relaxed shadow-sm transition-all duration-200 ${
                  msg.role === "user"
                    ? "bg-indigo-900 text-white rounded-2xl rounded-tr-sm"
                    : "bg-white text-slate-700 border border-slate-100 rounded-2xl rounded-tl-sm"
                } whitespace-pre-line word-break-words`}
              >
                {msg.content}
              </div>

              {/* Related Schemes */}
              {msg.references && msg.references.length > 0 && (
                <div className="mt-1 flex flex-col gap-1.5 w-full">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">
                    {t.referenced}
                  </span>
                  <div className="flex flex-col gap-1.5 w-full">
                    {msg.references.map((sid) => (
                      <button
                        key={sid}
                        onClick={() => router.push(`/schemes/${sid}`)}
                        className="w-full bg-white border border-slate-200 hover:border-indigo-600 hover:text-indigo-700 text-left px-3 py-2 rounded-xl text-[11px] font-bold text-indigo-600 cursor-pointer shadow-sm transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
                      >
                        🏛️ {schemesMap[sid] || sid.replace(/_/g, " ")} →
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="self-start flex gap-1.5 px-4 py-3 bg-white border border-slate-100 rounded-2xl rounded-tl-sm shadow-sm items-center">
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-[bounce_1.4s_infinite_ease-in-out_both]" />
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-[bounce_1.4s_infinite_ease-in-out_both_0.2s]" />
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-[bounce_1.4s_infinite_ease-in-out_both_0.4s]" />
            </div>
          )}

          {/* Quick Suggestions */}
          {!loading && messages.length <= 1 && (
            <div className="mt-2.5 flex flex-col gap-2">
              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider m-0 mb-1">
                ⚡ Popular Suggestions
              </p>
              <div className="flex flex-col gap-2">
                {t.suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(s)}
                    className="text-left bg-white border border-slate-200 hover:border-indigo-600 hover:bg-indigo-50/10 px-4 py-3 rounded-2xl text-[11px] font-bold text-slate-600 hover:text-indigo-900 cursor-pointer transition-all duration-200 shadow-sm hover:-translate-y-0.5 active:translate-y-0"
                  >
                    💡 {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="bg-white border-t border-slate-100 p-4 flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.placeholder}
            disabled={loading}
            className="flex-1 border border-slate-200 focus:border-indigo-600 rounded-2xl px-4 py-3 text-xs outline-none box-border transition-colors placeholder-slate-400"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-gradient-to-br from-indigo-900 to-blue-900 text-white border-none rounded-2xl px-5 text-xs font-bold cursor-pointer transition-all duration-200 disabled:opacity-50 shadow-sm active:scale-95 whitespace-nowrap"
          >
            Send
          </button>
        </form>
      </div>
    );
  }

  return (
    <>
      {/* Floating launcher button with pulsing rings */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[998] w-14 h-14 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white border-none cursor-pointer shadow-lg shadow-indigo-600/30 flex items-center justify-center text-xl transition-all duration-300 hover:scale-105 active:scale-95 group"
      >
        💬
        {/* Pulsing notification circle */}
        <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
      </button>

      {/* RAG chat drawer / overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 w-full h-full bg-slate-900/40 backdrop-blur-sm z-[999] flex justify-center items-end"
          onClick={() => setIsOpen(false)}
        >
          {/* Main Panel Content */}
          <div
            className="w-full max-w-[480px] h-[85vh] bg-white rounded-t-[32px] shadow-2xl flex flex-col overflow-hidden animate-[slideUp_0.3s_cubic-bezier(0.16,1,0.3,1)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-br from-indigo-900 to-blue-900 px-6 py-5 text-white flex-shrink-0 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-extrabold m-0 tracking-tight flex items-center gap-1.5">
                  ✨ {t.title}
                </h3>
                <p className="text-[11px] text-blue-200/90 m-0 mt-1 leading-normal font-medium">
                  {t.subtitle}
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="bg-white/10 hover:bg-white/20 border-none w-8 h-8 rounded-full text-white text-xs cursor-pointer flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Safety Reminder Banner */}
            <div className="bg-emerald-50 border-b border-emerald-100/60 px-5 py-2.5 flex items-center gap-2">
              <span className="text-xs">🔒</span>
              <span className="text-[10px] font-bold text-emerald-800 leading-normal">
                {t.safety}
              </span>
            </div>

            {/* Conversation Window */}
            <div className="flex-1 p-5 overflow-y-auto bg-slate-50/50 flex flex-col gap-4.5 custom-scrollbar">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`max-w-[80%] flex flex-col gap-1.5 ${
                    msg.role === "user" ? "self-end items-end" : "self-start items-start"
                  }`}
                >
                  <div
                    className={`px-4 py-3 text-xs leading-relaxed shadow-sm transition-all duration-200 ${
                      msg.role === "user"
                        ? "bg-indigo-900 text-white rounded-2xl rounded-tr-sm"
                        : "bg-white text-slate-700 border border-slate-100 rounded-2xl rounded-tl-sm"
                    } whitespace-pre-line word-break-words`}
                  >
                    {msg.content}
                  </div>

                  {/* Refered Matching Scheme Pill Buttons */}
                  {msg.references && msg.references.length > 0 && (
                    <div className="mt-1.5 flex flex-col gap-1.5 w-full">
                      <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide m-0">
                        {t.referenced}
                      </p>
                      <div className="flex flex-col gap-1.5 w-full">
                        {msg.references.map((sid) => (
                          <button
                            key={sid}
                            onClick={() => {
                              setIsOpen(false);
                              router.push(`/schemes/${sid}`);
                            }}
                            className="w-full bg-white border border-slate-200 hover:border-indigo-600 hover:text-indigo-700 text-left px-3 py-2 rounded-xl text-[11px] font-bold text-indigo-600 cursor-pointer shadow-sm transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
                          >
                            🏛️ {schemesMap[sid] || sid.replace(/_/g, " ")} →
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Wave typing loading indicator */}
              {loading && (
                <div className="self-start flex gap-1.5 px-4 py-3 bg-white border border-slate-100 rounded-2xl rounded-tl-sm shadow-sm items-center">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-[bounce_1.4s_infinite_ease-in-out_both]" />
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-[bounce_1.4s_infinite_ease-in-out_both_0.2s]" />
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-[bounce_1.4s_infinite_ease-in-out_both_0.4s]" />
                </div>
              )}

              {/* Suggestions Panel for starting chat */}
              {messages.length === 1 && !loading && (
                <div className="mt-2.5 flex flex-col gap-2">
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider m-0 mb-1">
                    ⚡ Popular Suggestions
                  </p>
                  <div className="flex flex-col gap-2">
                    {t.suggestions.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(s)}
                        className="text-left bg-white border border-slate-200 hover:border-indigo-600 hover:bg-indigo-50/10 px-4 py-3 rounded-2xl text-[11px] font-bold text-slate-600 hover:text-indigo-900 cursor-pointer transition-all duration-200 shadow-sm hover:-translate-y-0.5 active:translate-y-0"
                      >
                        💡 {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="bg-white border-t border-slate-100 p-4 pb-8 flex gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t.placeholder}
                disabled={loading}
                className="flex-1 border border-slate-200 focus:border-indigo-600 rounded-2xl px-4 py-3 text-xs outline-none box-border transition-colors placeholder-slate-400"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="bg-gradient-to-br from-indigo-900 to-blue-900 text-white border-none rounded-2xl px-5 text-xs font-bold cursor-pointer transition-all duration-200 disabled:opacity-50 shadow-sm active:scale-95 whitespace-nowrap"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Embedded Animations Stylesheet fallback classes */}
      <style jsx global>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1.0); }
        }
      `}</style>
    </>
  );
}
