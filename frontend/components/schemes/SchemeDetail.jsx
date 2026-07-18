import React from "react";
import * as Icons from "lucide-react";
import { BENEFIT_COLORS, DOC_LABELS } from "../../lib/constants";
import { formatAmount, snakeToTitle } from "../../lib/utils";
import Badge from "../ui/Badge";

export default function SchemeDetail({
  scheme,
  eligibility,
  userProfile,
  isTracked,
  onToggleTrack,
  showTracking = false,
}) {
  if (!scheme) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/30 select-none">
        <Icons.Landmark className="w-12 h-12 text-slate-300 stroke-[1.5] mb-4 animate-pulse-subtle" />
        <h3 className="text-sm font-extrabold text-slate-700 mb-2 uppercase tracking-wide">
          No Scheme Selected
        </h3>
        <p className="text-xs text-slate-500 max-w-xs leading-relaxed m-0 font-medium">
          Select a welfare scheme from the list on the left to inspect eligibility checklists, required application files, and verify credentials.
        </p>
      </div>
    );
  }

  const benefitType = scheme.benefit_type || "other";
  const benefitConfig = BENEFIT_COLORS[benefitType] || BENEFIT_COLORS.other;
  const formattedBenefit = formatAmount(scheme.benefit_amount, scheme.benefit_frequency);

  // Check eligibility details
  const hasEligibility = eligibility !== undefined && eligibility !== null;
  const isEligible = hasEligibility ? eligibility.eligible : true;
  const mismatchReasons = hasEligibility ? eligibility.reasons || [] : [];

  return (
    <div className="flex-1 flex flex-col h-full bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden animate-fade-in">
      {/* Header Banner */}
      <div className="p-6 md:p-8 border-b border-slate-100 flex-shrink-0 bg-slate-50/50">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {scheme.ministry || "Ministry / Department"}
          </span>
          {scheme.is_rolling && (
            <Badge variant="blue" className="ml-auto text-[9px] font-extrabold px-2 py-0.5">
              ⚡ Rolling Application
            </Badge>
          )}
        </div>
        
        <h2 className="text-sm md:text-base font-extrabold text-slate-900 leading-snug mb-3.5 m-0 uppercase tracking-wide">
          {scheme.name}
        </h2>
 
        <div className="flex flex-wrap gap-2">
          <Badge className={benefitConfig.bg} style={{ borderWidth: "1px" }}>
            {benefitConfig.label}
          </Badge>
          {formattedBenefit && (
            <Badge variant="accent" className="font-bold">
              {formattedBenefit}
            </Badge>
          )}
        </div>
      </div>
 
      {/* Main Details Body */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 custom-scrollbar bg-slate-50/10">
        
        {/* 1. User Eligibility Card (if matching results present) */}
        {hasEligibility && (
          <div
            className={`border rounded-2xl p-4 flex items-start gap-4 ${
              isEligible
                ? "bg-emerald-50/30 border-emerald-100/80 text-emerald-800"
                : "bg-rose-50/30 border-rose-100/80 text-rose-800"
            }`}
          >
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-xl shrink-0 ${
                isEligible ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
              }`}
            >
              {isEligible ? (
                <Icons.CheckCircle2 className="w-5 h-5" />
              ) : (
                <Icons.AlertTriangle className="w-5 h-5" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-extrabold uppercase tracking-wide m-0 mb-1">
                {isEligible ? "Profile Match Confirmed" : "Eligibility Mismatch Warning"}
              </h4>
              <p className="text-xs font-medium m-0 leading-relaxed opacity-95">
                {isEligible
                  ? "Based on your citizen profile, you satisfy all requirements for this scheme."
                  : "You do not meet the criteria due to the following requirements:"}
              </p>
              {!isEligible && mismatchReasons.length > 0 && (
                <ul className="list-disc pl-5 mt-2 space-y-1 text-xs font-semibold">
                  {mismatchReasons.map((reason, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {reason}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* 2. Detailed Criteria Fields */}
        <div className="bg-white border border-slate-200/80 rounded-3xl px-5 py-2.5 shadow-sm">
          <h3 className="text-xs font-bold text-slate-900 mt-3.5 mb-2 uppercase tracking-wide">
            Eligibility Checklist
          </h3>
          {[
            ["States", scheme.applicable_states ? scheme.applicable_states.join(", ") : "All India"],
            ["Gender", scheme.gender ? snakeToTitle(scheme.gender) : "All"],
            ["Categories", scheme.caste_categories ? scheme.caste_categories.join(", ") : "All categories"],
            ["Age Bounds", scheme.min_age && scheme.max_age ? `${scheme.min_age} – ${scheme.max_age} years` : scheme.min_age ? `${scheme.min_age}+ years` : scheme.max_age ? `Up to ${scheme.max_age} years` : "No restrictions"],
            ["Max Income", scheme.max_income ? `Rs.${scheme.max_income.toLocaleString("en-IN")}/year` : "No limit"],
            ["Occupation", scheme.occupation_types ? scheme.occupation_types.map(o => snakeToTitle(o)).join(", ") : "Any occupation"],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between items-start py-3.5 border-b border-slate-100 last:border-b-0">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">{label}</span>
              <span className="text-xs font-bold text-slate-800 text-right max-w-[60%]">{value}</span>
            </div>
          ))}
        </div>

        {/* 3. Apply Link Button Card */}
        {scheme.application_url && (
          <div className="p-5 bg-white border border-slate-200/80 rounded-3xl shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Application link
              </span>
              <span className="text-[9px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100 font-extrabold flex items-center gap-1">
                <Icons.Check className="w-2.5 h-2.5" /> Verified official URL
              </span>
            </div>
            <a
              href={scheme.application_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl py-4 text-xs font-bold text-center no-underline shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.99] cursor-pointer"
            >
              Apply Now — Official Site ↗
            </a>
          </div>
        )}

        {/* 4. Required Documents Section */}
        {scheme.documents_required && scheme.documents_required.length > 0 && (
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm">
            <h3 className="text-xs font-bold text-slate-900 mb-3.5 uppercase tracking-wide">Required Documents</h3>
            <div className="grid grid-cols-1 gap-3">
              {scheme.documents_required.map((docKey) => (
                <div key={docKey} className="flex items-center gap-3 text-xs font-semibold text-slate-600">
                  <Icons.FileText className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{DOC_LABELS[docKey] || snakeToTitle(docKey)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
 
        {/* 5. Verification & Deadline row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {scheme.verified_at && (
            <div className="bg-white border border-slate-200/80 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-[0_1px_4px_rgba(15,23,42,0.01)]">
              <Icons.ShieldCheck className="w-5 h-5 text-emerald-600" />
              <div>
                <span className="text-[9px] text-slate-400 block font-extrabold uppercase tracking-widest">Verified On</span>
                <span className="text-xs font-bold text-slate-700">{scheme.verified_at}</span>
              </div>
            </div>
          )}
          {scheme.application_deadline ? (
            <div className="bg-white border border-slate-200/80 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-[0_1px_4px_rgba(15,23,42,0.01)]">
              <Icons.Calendar className="w-5 h-5 text-rose-500" />
              <div>
                <span className="text-[9px] text-slate-400 block font-extrabold uppercase tracking-widest">Apply By</span>
                <span className="text-xs font-bold text-rose-600">{scheme.application_deadline}</span>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200/80 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-[0_1px_4px_rgba(15,23,42,0.01)]">
              <Icons.Calendar className="w-5 h-5 text-emerald-600" />
              <div>
                <span className="text-[9px] text-slate-400 block font-extrabold uppercase tracking-widest">Deadline</span>
                <span className="text-xs font-bold text-emerald-600">Open (Rolling)</span>
              </div>
            </div>
          )}
        </div>
 
        {/* 6. Application Tracking Panel (optional) */}
        {showTracking && onToggleTrack && (
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm">
            <h3 className="text-xs font-bold text-slate-900 mb-1.5 uppercase tracking-wide">Application Tracking</h3>
            <p className="text-[11px] text-slate-400 font-semibold mb-4 leading-relaxed">
              {isTracked
                ? "This scheme is saved to your tracker. You can set reminders and write notes."
                : "Save this scheme to your tracker to monitor your application progress."}
            </p>
            <button
              onClick={onToggleTrack}
              className={`w-full rounded-2xl py-3.5 text-xs font-bold text-center border cursor-pointer transition-all duration-200 active:scale-[0.99] flex items-center justify-center gap-2 ${
                isTracked
                  ? "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100"
                  : "bg-brand-navy-950 border-transparent text-white hover:bg-brand-navy-800"
              }`}
            >
              <Icons.ClipboardList className="w-4 h-4" />
              <span>{isTracked ? "Stop Tracking Scheme" : "Track & Save Scheme"}</span>
            </button>
          </div>
        )}
 
        {/* 7. myScheme Government Cross-Check Finder */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm">
          <h3 className="text-xs font-bold text-slate-900 mb-1.5 uppercase tracking-wide">
            Cross-check on national database
          </h3>
          <p className="text-[11px] text-slate-400 font-semibold mb-4 leading-relaxed">
            Verify eligibility restrictions and submit documents on the central myScheme welfare portal.
          </p>
          <a
            href={`https://www.myscheme.gov.in/search?q=${encodeURIComponent(scheme.name)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-brand-navy-950 hover:bg-brand-navy-800 text-white rounded-2xl py-3.5 text-xs font-bold text-center no-underline shadow-sm transition-transform duration-100 active:scale-[0.99]"
          >
            <Icons.Building className="w-4 h-4 text-brand-amber-400" />
            <span>Verify on myScheme.gov.in ↗</span>
          </a>
        </div>
      </div>
    </div>
  );
}
