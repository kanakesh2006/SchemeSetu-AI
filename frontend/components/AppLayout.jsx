"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import * as Icons from "lucide-react";
import BottomNav from "./Bottomnav";
import ChatBot from "./ChatBot";
import { NAV_ITEMS, API_URL } from "../lib/constants";

export default function AppLayout({ children, activeTab }) {
  const router = useRouter();
  const pathname = usePathname();
  const [lang, setLang] = useState("en");
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const savedLang = localStorage.getItem("language") || "en";
    setLang(savedLang);

    // Track browser online/offline status
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  const changeLanguage = (newLang) => {
    setLang(newLang);
    localStorage.setItem("language", newLang);
    window.location.reload();
  };



  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans antialiased text-slate-800">
      {/* Offline Alert */}
      {!isOnline && (
        <div className="bg-brand-amber-600 text-white text-xs font-bold text-center py-3 px-4 sticky top-0 z-[1000] shadow-sm select-none flex items-center justify-center gap-2 animate-fade-in">
          <Icons.WifiOff className="w-4 h-4 shrink-0" />
          <span>Running in Offline Mode. Matched schemes are loaded from your device's cache.</span>
        </div>
      )}

      <div className="flex-1 flex flex-col md:flex-row">
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden md:flex flex-col w-[280px] bg-white border-r border-slate-200/80 h-screen sticky top-0 z-50 p-6 box-border justify-between select-none shrink-0 shadow-[4px_0_24px_rgba(15,23,42,0.01)]">
          <div className="flex flex-col gap-6">
            {/* Branding Header */}
            <div
              className="flex items-center gap-3.5 cursor-pointer group"
              onClick={() => router.push("/")}
            >
              <div className="w-11 h-11 rounded-2xl bg-brand-navy-950 flex items-center justify-center text-white shadow-lg shadow-brand-navy-950/10 group-hover:scale-105 transition-all duration-200">
                <Icons.Building2 className="w-5 h-5 text-brand-amber-400 stroke-[1.8]" />
              </div>
              <div>
                <h1 className="text-sm font-extrabold text-brand-navy-950 m-0 tracking-tight leading-tight">
                  Information Is Wealth
                </h1>
                <span className="text-[9px] font-bold text-brand-amber-600 tracking-wider uppercase">
                  Welfare Portal India
                </span>
              </div>
            </div>

            <hr className="border-slate-100/80 my-1" />

            {/* Main Navigation Links */}
            <nav className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.path || activeTab === item.path;
                const Icon = Icons[item.iconName] || Icons.HelpCircle;
                
                return (
                  <button
                    key={item.path}
                    onClick={() => router.push(item.path)}
                    className={`w-full flex items-center gap-3.5 px-5 py-3 rounded-2xl border-0 text-xs font-bold cursor-pointer transition-all duration-200 text-left ${
                      isActive
                        ? "bg-brand-navy-950 text-white shadow-md shadow-brand-navy-950/10 border-l-4 border-brand-amber-500"
                        : "bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isActive ? "scale-105" : "opacity-80"}`} />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Footer */}
          <div className="flex flex-col gap-4">
            
            {/* Language Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/50">
              <button
                onClick={() => changeLanguage("en")}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold border-0 cursor-pointer transition-all duration-200 ${
                  lang === "en" ? "bg-white text-brand-navy-950 shadow-sm" : "bg-transparent text-slate-400 hover:text-slate-900"
                }`}
              >
                ENGLISH
              </button>
              <button
                onClick={() => changeLanguage("ta")}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold border-0 cursor-pointer transition-all duration-200 ${
                  lang === "ta" ? "bg-white text-brand-navy-950 shadow-sm" : "bg-transparent text-slate-400 hover:text-slate-900"
                }`}
              >
                தமிழ்
              </button>
              <button
                onClick={() => changeLanguage("hi")}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold border-0 cursor-pointer transition-all duration-200 ${
                  lang === "hi" ? "bg-white text-brand-navy-950 shadow-sm" : "bg-transparent text-slate-400 hover:text-slate-900"
                }`}
              >
                हिंदी
              </button>
            </div>



            <span className="text-[9px] text-slate-400 text-center block mt-1 font-semibold tracking-wider">
              © 2026 INFORMATION IS WEALTH
            </span>
          </div>
        </aside>

        {/* Responsive Content Container */}
        <main className="flex-1 min-w-0 flex flex-col">
          <div className="flex-1 pb-20 md:pb-6 md:pt-4 md:px-6 w-full box-border">
            {children}
          </div>
          
          {/* Mobile Bottom Navigation Bar */}
          <BottomNav />
        </main>
      </div>
      <ChatBot language={lang} />
    </div>
  );
}
