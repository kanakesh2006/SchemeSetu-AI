import React from "react";
import * as Icons from "lucide-react";
import { BENEFIT_COLORS } from "../../lib/constants";
import { formatAmount } from "../../lib/utils";
import Badge from "../ui/Badge";

export default function SchemeCard({ scheme, matchLabel, onClick, active = false }) {
  const benefitType = scheme.benefit_type || "other";
  const benefitConfig = BENEFIT_COLORS[benefitType] || BENEFIT_COLORS.other;

  // Format benefit amount
  const formattedBenefit = formatAmount(scheme.benefit_amount, scheme.benefit_frequency);

  // Compute display similarity score if present
  const showMatch = scheme.similarity !== undefined || scheme.match_score !== undefined;
  const matchScore = scheme.similarity ?? scheme.match_score;
  const matchPercent = showMatch ? Math.round(matchScore * 100) : null;

  return (
    <div
      onClick={onClick}
      className={`group w-full text-left bg-white border rounded-2xl p-5 mb-4 shadow-[0_2px_8px_rgba(15,23,42,0.01)] backdrop-blur-sm cursor-pointer transition-all duration-200 hover:-translate-y-[1px] hover:border-slate-300 hover:shadow-[0_6px_16px_rgba(15,23,42,0.03)] select-none ${
        active
          ? "border-brand-navy-950 ring-1 ring-brand-navy-950/20 bg-brand-navy-50/10"
          : "border-slate-200"
      }`}
    >
      <div className="flex justify-between items-start gap-4 mb-2">
        <div className="flex-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
            {scheme.ministry || "Ministry / Department"}
          </span>
          <h3 className="text-xs font-extrabold text-slate-900 group-hover:text-brand-navy-700 transition-colors leading-relaxed m-0">
            {scheme.name}
          </h3>
        </div>

        {/* Match score pill */}
        {showMatch && matchPercent !== null && (
          <Badge
            variant={matchPercent >= 80 ? "success" : matchPercent >= 60 ? "blue" : "default"}
            className="flex-shrink-0"
          >
            {matchLabel || "Match"}: {matchPercent}%
          </Badge>
        )}
      </div>

      <div className="flex flex-wrap gap-2 items-center mt-3 pt-3 border-t border-slate-100">
        {/* Benefit Type Badge */}
        <Badge
          className={benefitConfig.bg}
          style={{ borderWidth: "1px" }}
        >
          {benefitConfig.label}
        </Badge>

        {/* Benefit Amount Badge */}
        {formattedBenefit && (
          <Badge variant="accent" className="font-bold">
            {formattedBenefit}
          </Badge>
        )}

        {/* State requirement badge */}
        {scheme.applicable_states && scheme.applicable_states.length > 0 && (
          <Badge variant="default" className="text-slate-500 bg-slate-50 border-slate-200">
            <Icons.MapPin className="w-2.5 h-2.5 mr-1 stroke-[2]" />
            {scheme.applicable_states[0]}
            {scheme.applicable_states.length > 1 ? ` +${scheme.applicable_states.length - 1}` : ""}
          </Badge>
        )}

        {/* Documents count badge */}
        {scheme.documents_required && scheme.documents_required.length > 0 && (
          <Badge variant="default" className="text-slate-500 bg-slate-50 border-slate-200 ml-auto">
            <Icons.FileText className="w-2.5 h-2.5 mr-1 stroke-[2]" />
            {scheme.documents_required.length} Docs
          </Badge>
        )}
      </div>
    </div>
  );
}
