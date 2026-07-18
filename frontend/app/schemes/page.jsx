"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import * as Icons from "lucide-react";
import AppLayout from "../../components/AppLayout";
import { BENEFIT_FILTERS, BENEFIT_COLORS, API_URL } from "../../lib/constants";
import { getStorageJSON, setStorageJSON } from "../../lib/utils";
import { SkeletonCard } from "../../components/ui/Skeleton";
import SchemeCard from "../../components/schemes/SchemeCard";
import SchemeDetail from "../../components/schemes/SchemeDetail";
import EmptyState from "../../components/ui/EmptyState";

export default function SchemesPage() {
  const router = useRouter();
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);
  const [filter, setFilter] = useState("all");
  const [language, setLanguage] = useState("en");
  const [offlineMode, setOfflineMode] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  // Desktop Master-Detail active selection
  const [selectedSchemeId, setSelectedSchemeId] = useState(null);
  const [selectedDetails, setSelectedDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState(null);
  const [isTracked, setIsTracked] = useState(false);

  // Real-time eligibility state
  const [eligibilityCheck, setEligibilityCheck] = useState(null);
  const [checkingEligibility, setCheckingEligibility] = useState(false);

  useEffect(() => {
    const p = getStorageJSON("user_profile");
    if (!p) {
      router.push("/onboarding");
      return;
    }
    setProfile(p);

    const savedLang = localStorage.getItem("language") || "en";
    setLanguage(savedLang);

    fetchSchemes(p, savedLang);
  }, []);

  const fetchSchemes = async (p, langCode = "en") => {
    setLoading(true);
    setError(null);
    setIsSearching(false);
    setSearchQuery("");
    setSearchResults([]);
    setSelectedSchemeId(null);
    try {
      const res = await fetch(`${API_URL}/schemes/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_profile: p, language: langCode }),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      const loadedSchemes = data.schemes || [];
      setSchemes(loadedSchemes);
      setOfflineMode(false);
      
      // Cache matching schemes for offline use
      setStorageJSON("cached_schemes", loadedSchemes);

      // Auto-select first scheme on desktop
      if (loadedSchemes.length > 0 && window.innerWidth >= 768) {
        setSelectedSchemeId(loadedSchemes[0].scheme_id);
      }
    } catch (err) {
      console.warn("Failed to fetch matching schemes. Trying local cache fallback.", err);
      // Attempt offline caching load
      const cached = getStorageJSON("cached_schemes");
      if (cached) {
        setSchemes(cached);
        setOfflineMode(true);
        if (cached.length > 0 && window.innerWidth >= 768) {
          setSelectedSchemeId(cached[0].scheme_id);
        }
        return;
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (q) => {
    const queryTerm = q || searchQuery;
    if (!queryTerm.trim() || queryTerm.length < 2) return;

    setLoading(true);
    setError(null);
    setIsSearching(true);
    setSelectedSchemeId(null);
    try {
      // Backend is updated to fall back to ILIKE keyword search dynamically
      const res = await fetch(`${API_URL}/schemes/semantic-search?q=${encodeURIComponent(queryTerm)}&lang=${language}`);
      if (!res.ok) throw new Error("Search service error");
      const data = await res.json();
      const results = data.results || [];
      setSearchResults(results);
      
      // Auto-select first search result on desktop
      if (results.length > 0 && window.innerWidth >= 768) {
        setSelectedSchemeId(results[0].scheme_id);
      }
    } catch (err) {
      setError("Could not connect to search server. Verify backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setIsSearching(false);
    setSearchResults([]);
    setError(null);
    setSelectedSchemeId(schemes.length > 0 ? schemes[0].scheme_id : null);
  };

  // Fetch full details of the active scheme for the desktop side-panel
  useEffect(() => {
    if (!selectedSchemeId) {
      setSelectedDetails(null);
      setEligibilityCheck(null);
      return;
    }

    const fetchDetailsAndCheck = async () => {
      setDetailsLoading(true);
      setDetailsError(null);
      setEligibilityCheck(null);
      
      try {
        // 1. Fetch details
        const res = await fetch(`${API_URL}/schemes/${selectedSchemeId}`);
        if (!res.ok) throw new Error("Scheme details not found");
        const details = await res.json();
        setSelectedDetails(details);

        // Cache scheme details locally
        const cached = getStorageJSON("cached_scheme_details", {});
        cached[selectedSchemeId] = details;
        setStorageJSON("cached_scheme_details", cached);

        // 2. Fetch eligibility logs in parallel
        if (profile) {
          setCheckingEligibility(true);
          const checkRes = await fetch(`${API_URL}/schemes/check/${selectedSchemeId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(profile)
          });
          if (checkRes.ok) {
            setEligibilityCheck(await checkRes.json());
          }
        }
      } catch (err) {
        console.warn("Failed to fetch scheme details. Trying cache fallback.", err);
        // Attempt offline fallback from cached details
        const cached = getStorageJSON("cached_scheme_details");
        if (cached && cached[selectedSchemeId]) {
          setSelectedDetails(cached[selectedSchemeId]);
          setOfflineMode(true);
          return;
        }
        setDetailsError(err.message);
      } finally {
        setDetailsLoading(false);
        setCheckingEligibility(false);
      }
    };

    fetchDetailsAndCheck();
  }, [selectedSchemeId, profile]);

  useEffect(() => {
    if (!selectedSchemeId) {
      setIsTracked(false);
      return;
    }
    const list = getStorageJSON("tracked_schemes", []);
    setIsTracked(list.some(s => s.scheme_id === selectedSchemeId));
  }, [selectedSchemeId]);

  const handleToggleTrack = () => {
    if (!selectedDetails) return;
    let list = getStorageJSON("tracked_schemes", []);

    if (isTracked) {
      list = list.filter(s => s.scheme_id !== selectedSchemeId);
      setIsTracked(false);
    } else {
      list.push({
        scheme_id: selectedSchemeId,
        name: selectedDetails.name,
        status: "saved",
        notes: "",
        reminder_date: "",
        saved_at: new Date().toISOString()
      });
      setIsTracked(true);
    }
    setStorageJSON("tracked_schemes", list);
  };

  const activeSchemes = isSearching ? searchResults : schemes;
  const filtered = filter === "all" ? activeSchemes : activeSchemes.filter((s) => s.benefit_type === filter);

  // Fallback to select first matching option if active selection gets filtered out
  useEffect(() => {
    if (window.innerWidth >= 768 && filtered.length > 0) {
      const isStillVisible = filtered.some(s => s.scheme_id === selectedSchemeId);
      if (!isStillVisible) {
        setSelectedSchemeId(filtered[0].scheme_id);
      }
    } else if (filtered.length === 0) {
      setSelectedSchemeId(null);
    }
  }, [filter, schemes, searchResults, isSearching]);

  const handleCardClick = (schemeId) => {
    if (window.innerWidth >= 768) {
      setSelectedSchemeId(schemeId);
    } else {
      router.push(`/schemes/${schemeId}`);
    }
  };

  return (
    <AppLayout activeTab="/schemes">
      <div className="w-full max-w-md mx-auto md:max-w-none md:mx-0 h-full flex flex-col md:flex-row gap-6 md:h-[calc(100vh-4rem)] box-border">
        
        {/* Left Column: List Pane */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50 md:bg-white md:border md:border-slate-200/80 md:rounded-3xl md:shadow-sm overflow-hidden h-full">
          
          {/* Header Controls */}
          <div className="bg-white border-b border-slate-100 p-5 sticky top-0 z-20 flex-shrink-0 md:rounded-t-3xl">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h1 className="text-base font-extrabold text-slate-900 m-0 tracking-tight">
                  {isSearching ? "Search Results" : "Your Matches"}
                </h1>
                {!loading && (
                  <div className="flex items-center gap-2 mt-1.5">
                    <p className="text-[10px] text-slate-400 font-bold m-0 uppercase tracking-widest">
                      {filtered.length} scheme{filtered.length !== 1 ? "s" : ""} matched
                    </p>
                    {offlineMode && (
                      <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider">
                        ⚠️ Offline
                      </span>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={() => { handleClearSearch(); if (profile) fetchSchemes(profile, language); }}
                className="bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold cursor-pointer transition-colors duration-150 shadow-sm"
              >
                {isSearching ? "Reset" : "Refresh"}
              </button>
            </div>

            {/* Keyword Search Box */}
            <form
              onSubmit={(e) => { e.preventDefault(); handleSearch(searchQuery); }}
              className="flex gap-2 mb-4"
            >
              <div className="relative flex-1">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type details (e.g. scholarship, farmer)..."
                  className="w-full py-2.5 pl-4 pr-10 rounded-2xl border border-slate-200 text-xs outline-none box-border transition-colors duration-150 focus:border-brand-navy-950 focus:ring-2 focus:ring-brand-navy-100 font-semibold text-slate-700 placeholder-slate-400 shadow-sm"
                />
                {searchQuery && (
                  <button 
                    type="button" 
                    onClick={handleClearSearch}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-transparent border-none text-slate-400 hover:text-slate-800 text-base cursor-pointer p-1 transition-colors"
                  >
                    ×
                  </button>
                )}
              </div>
              <button 
                type="submit" 
                className="bg-brand-navy-950 hover:bg-brand-navy-800 text-white border-0 rounded-2xl px-5 py-2.5 text-xs font-bold cursor-pointer transition-transform duration-100 active:scale-95 shadow-sm whitespace-nowrap"
              >
                Search
              </button>
            </form>

            {/* Filter chips */}
            <div className="flex gap-2 overflow-x-auto pb-1.5 custom-scrollbar select-none">
              {BENEFIT_FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-full border border-slate-200 text-xs font-bold cursor-pointer transition-all duration-150 whitespace-nowrap flex-shrink-0 ${
                    filter === f 
                      ? "bg-brand-navy-950 text-white border-transparent shadow-sm" 
                      : "bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-800 hover:border-slate-300"
                  }`}
                >
                  {f === "all" ? "All Schemes" : (BENEFIT_COLORS[f]?.label || f)}
                </button>
              ))}
            </div>
          </div>

          {/* Scheme Cards Feed */}
          <div className="flex-1 overflow-y-auto px-5 pb-24 md:pb-6 pt-4.5 custom-scrollbar bg-slate-50/30">
            {loading && [1, 2, 3].map((i) => <SkeletonCard key={i} />)}

            {error && !loading && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 text-center shadow-sm">
                <Icons.AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-3" />
                <p className="text-xs font-bold text-slate-800 mb-1">Could not load matches</p>
                <p className="text-[10px] text-slate-400 font-semibold mb-4">{error}</p>
                <button
                  onClick={() => profile && fetchSchemes(profile)}
                  className="bg-brand-navy-950 text-white border-0 rounded-2xl px-5 py-2.5 text-xs font-bold cursor-pointer shadow-sm hover:bg-brand-navy-800"
                >
                  Try Again
                </button>
              </div>
            )}

            {!loading && !error && filtered.length === 0 && (
              <EmptyState
                iconName="SearchX"
                title="No Matching Schemes"
                description="Try clearing filters, searching with different keywords, or adjusting your demographic profile constraints."
                actionLabel={filter !== "all" ? "Clear Filters" : "Update Profile"}
                onActionClick={() => filter !== "all" ? setFilter("all") : router.push("/profile")}
              />
            )}

            {!loading && !error && filtered.map((scheme) => (
              <SchemeCard
                key={scheme.scheme_id}
                scheme={scheme}
                active={selectedSchemeId === scheme.scheme_id}
                onClick={() => handleCardClick(scheme.scheme_id)}
              />
            ))}

            {/* Profile Summary Footer Tag */}
            {profile && !loading && (
              <div className="bg-slate-100/80 border border-slate-200/50 rounded-2xl px-4 py-3 mt-4.5 flex justify-between items-center text-[9px] font-bold text-slate-500 uppercase tracking-widest select-none">
                <span>
                  {profile.state} · {profile.caste_category} · Age {profile.age}
                </span>
                <button
                  onClick={() => router.push("/profile")}
                  className="text-[9px] text-brand-navy-500 bg-transparent border-0 font-extrabold cursor-pointer transition-colors hover:text-brand-navy-800"
                >
                  Edit Profile
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Desktop Detail Pane */}
        <div className="hidden md:flex flex-[1.4] flex-col h-full overflow-hidden">
          {detailsLoading ? (
            <div className="flex-1 bg-white border border-slate-200 rounded-3xl p-6 space-y-4 animate-pulse">
              <div className="h-12 bg-slate-100 rounded-2xl w-full" />
              <div className="h-28 bg-slate-100 rounded-2xl w-full" />
              <div className="h-40 bg-slate-100 rounded-2xl w-full" />
            </div>
          ) : detailsError ? (
            <div className="flex-1 bg-white border border-slate-200 rounded-3xl p-8 text-center flex flex-col items-center justify-center">
              <Icons.AlertTriangle className="w-8 h-8 text-rose-500 mb-3" />
              <p className="text-xs font-bold text-slate-700">Failed to load details</p>
              <p className="text-[10px] text-slate-400 mt-1 font-semibold">{detailsError}</p>
            </div>
          ) : (
            <SchemeDetail
              scheme={selectedDetails}
              eligibility={eligibilityCheck}
              userProfile={profile}
              isTracked={isTracked}
              onToggleTrack={handleToggleTrack}
              showTracking={true}
            />
          )}
        </div>
      </div>
    </AppLayout>
  );
}