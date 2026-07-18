import React from "react";
import * as Icons from "lucide-react";

export default function EmptyState({
  iconName = "FileQuestion",
  title = "No data found",
  description = "There is nothing to display right now.",
  actionLabel,
  onActionClick,
}) {
  const Icon = Icons[iconName] || Icons.FileQuestion;

  return (
    <div className="flex flex-col items-center justify-center p-8 md:p-12 text-center rounded-3xl bg-slate-50 border border-dashed border-slate-200 select-none">
      <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mb-4 shadow-inner">
        <Icon className="w-6 h-6 stroke-[1.5]" />
      </div>
      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-1.5">
        {title}
      </h3>
      <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-xs mb-5 m-0">
        {description}
      </p>
      {actionLabel && onActionClick && (
        <button
          onClick={onActionClick}
          className="px-4 py-2 border-0 bg-brand-navy-950 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer hover:bg-brand-navy-800 transition-all duration-150 active:scale-98"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
