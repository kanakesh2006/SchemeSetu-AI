"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import * as Icons from "lucide-react";
import { NAV_ITEMS } from "../lib/constants";

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-slate-200/80 flex justify-around items-center z-[990] shadow-[0_-4px_20px_rgba(0,0,0,0.03)] pb-[env(safe-area-inset-bottom,0px)] px-3 box-border">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.path;
        const IconComponent = Icons[item.iconName] || Icons.HelpCircle;
        
        return (
          <button
            key={item.path}
            onClick={() => router.push(item.path)}
            className={`flex-1 h-full flex flex-col items-center justify-center bg-transparent border-0 cursor-pointer gap-1 transition-all duration-200 select-none ${
              isActive ? "text-brand-navy-950" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <span
              className={`transition-all duration-200 ${
                isActive ? "scale-110 -translate-y-[2px]" : "scale-100"
              }`}
            >
              <IconComponent className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
            </span>
            <span
              className={`text-[10px] tracking-wide transition-all duration-200 ${
                isActive ? "font-bold text-brand-navy-950" : "font-semibold text-slate-400"
              }`}
            >
              {item.shortName}
            </span>
            {/* Active underline indicator */}
            {isActive && (
              <span className="w-5 h-0.5 bg-brand-navy-950 rounded-full animate-fade-in"></span>
            )}
          </button>
        );
      })}
    </div>
  );
}