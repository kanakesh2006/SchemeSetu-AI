"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import * as Icons from "lucide-react";
import AppLayout from "../../components/AppLayout";
import { API_URL } from "../../lib/constants";
import { SkeletonCard } from "../../components/ui/Skeleton";
import SchemeCard from "../../components/schemes/SchemeCard";
import EmptyState from "../../components/ui/EmptyState";

const DICT = {
  en: {
    title: "Keyword & Intent Search",
    subtitle: "Search welfare schemes by category, benefits, or your situation",
    placeholder: "e.g. financial aid for poor SC female student to study...",
    btnSearch: "Search Schemes",
    searching: "Searching database...",
    hint: "Try typing your state, caste category, gender, and the assistance you need.",
    match: "Relevance Score",
    results: "Schemes matched by search term:",
    noResults: "No schemes matched your search query. Try describing your situation differently.",
    back: "Back to matched schemes"
  },
  ta: {
    title: "முக்கியவார்த்தை தேடல்",
    subtitle: "திட்டங்களை பாலினம், மாநிலம், அல்லது தேவைக்கேற்ப தேடுங்கள்",
    placeholder: "எ.கா. ஏழை ஆதிதிராவிடர் பெண் மாணவர் படிக்க கல்வி உதவித்தொகை...",
    btnSearch: "திட்டங்களை தேடு",
    searching: "தேடுகிறது...",
    hint: "உங்கள் பாலினம், மாநிலம், தொழில் மற்றும் தேவையான உதவியை விவரித்து எழுதவும்.",
    match: "பொருத்தமான அளவு",
    results: "உங்கள் சூழலுக்குப் பொருந்தும் திட்டங்கள்:",
    noResults: "உங்கள் தேடல் சூழலுக்குப் பொருந்தும் திட்டங்கள் எதுவும் இல்லை. மாற்று வார்த்தைகளில் விவரிக்கவும்.",
    back: "பின்னே செல்ல"
  },
  hi: {
    title: "कीवर्ड और स्थिति खोज",
    subtitle: "योजनाओं को श्रेणी, लाभ, या अपनी सामाजिक स्थिति के आधार पर खोजें",
    placeholder: "उदा. गरीब एससी महिला छात्र को पढ़ाई के लिए वित्तीय सहायता...",
    btnSearch: "योजनाएं खोजें",
    searching: "योजनाएं खोजी जा रही हैं...",
    hint: "अपना लिंग, राज्य, पेशा और आपको क्या मदद चाहिए, यह विस्तार से लिखें।",
    match: "समानता स्कोर",
    results: "आपकी स्थिति से मेल खाने वाली योजनाएं:",
    noResults: "आपकी खोज स्थिति से मेल खाने वाली कोई योजना नहीं मिली। कृपया भिन्न तरीके से लिखें।",
    back: "वापस जाएँ"
  }
};

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [language, setLanguage] = useState("en");
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const savedLang = localStorage.getItem("language") || "en";
    setLanguage(savedLang);
  }, []);

  const t = DICT[language] || DICT.en;

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim() || query.length < 2) return;

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      // Backend handles fallback logic transparently under /schemes/semantic-search
      const res = await fetch(`${API_URL}/schemes/semantic-search?q=${encodeURIComponent(query)}&lang=${language}`);
      if (!res.ok) throw new Error("Search service error");
      const data = await res.json();
      setResults(data.results || []);
    } catch (err) {
      setError("Could not connect to search server. Verify backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout activeTab="/search">
      <div className="w-full max-w-2xl mx-auto pb-24 md:pb-6 px-4 md:px-0">
        <div className="flex flex-col bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden animate-fade-in">
          
          {/* Header Banner */}
          <div className="bg-brand-navy-950 px-6 py-5 text-white flex-shrink-0 shadow-sm">
            <button 
              onClick={() => router.push("/schemes")}
              className="bg-transparent border-0 text-brand-amber-400 hover:text-white text-xs font-bold cursor-pointer p-0 mb-3.5 flex items-center gap-1.5 transition-colors"
            >
              <Icons.ArrowLeft className="w-3.5 h-3.5" />
              <span>{t.back}</span>
            </button>
            <h1 className="text-sm md:text-base font-extrabold uppercase tracking-wide m-0 flex items-center gap-2">
              <Icons.Search className="w-5 h-5 text-brand-amber-400 stroke-[2.2]" />
              <span>{t.title}</span>
            </h1>
            <p className="text-xs text-slate-300 mt-1 m-0 leading-relaxed font-semibold">
              {t.subtitle}
            </p>
          </div>

          {/* Search box controls */}
          <div className="p-5 border-b border-slate-100 bg-white flex-shrink-0">
            <form onSubmit={handleSearch} className="flex flex-col gap-3.5">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.placeholder}
                rows={3}
                className="w-full border border-slate-200 focus:border-brand-navy-950 focus:ring-2 focus:ring-brand-navy-100 rounded-2xl px-4 py-3 text-xs outline-none resize-none box-border font-sans font-semibold text-slate-700 leading-relaxed placeholder-slate-400 transition-all shadow-sm"
              />
              <div className="flex justify-between items-center gap-3">
                <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1 leading-normal flex-1 max-w-[70%]">
                  <Icons.Lightbulb className="w-3.5 h-3.5 text-brand-amber-500 shrink-0 stroke-[2.2]" />
                  <span>{t.hint}</span>
                </span>
                <button
                  type="submit"
                  disabled={loading || !query.trim()}
                  className="bg-brand-navy-950 hover:bg-brand-navy-800 text-white border-0 rounded-2xl px-5 py-3 text-xs font-bold cursor-pointer transition-transform duration-100 active:scale-95 shadow-sm disabled:opacity-50 whitespace-nowrap"
                >
                  {loading ? t.searching : t.btnSearch}
                </button>
              </div>
            </form>
          </div>

          {/* Results container */}
          <div className="flex-1 overflow-y-auto px-5 py-5 custom-scrollbar bg-slate-50/20 min-h-[300px]">
            {searched && !loading && (
              <h2 className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-3.5 m-0">
                {t.results}
              </h2>
            )}

            {loading && [1, 2, 3].map((i) => <SkeletonCard key={i} />)}

            {error && (
              <div className="bg-white border border-slate-200 rounded-3xl p-5 text-center shadow-sm">
                <Icons.AlertTriangle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-800 m-0 leading-normal">{error}</p>
              </div>
            )}

            {!loading && searched && results.length === 0 && !error && (
              <EmptyState
                iconName="SearchX"
                title="No Schemes Found"
                description={t.noResults}
              />
            )}

            {!loading && results.map((scheme) => (
              <SchemeCard
                key={scheme.scheme_id}
                scheme={scheme}
                matchLabel={t.match}
                onClick={() => router.push(`/schemes/${scheme.scheme_id}`)}
              />
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}