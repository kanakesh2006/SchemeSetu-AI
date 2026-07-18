"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import * as Icons from "lucide-react";
import AppLayout from "../../../components/AppLayout";
import SchemeDetail from "../../../components/schemes/SchemeDetail";
import { API_URL } from "../../../lib/constants";
import { getStorageJSON, setStorageJSON } from "../../../lib/utils";

export default function SchemeDetailPage({ params }) {
  const router = useRouter();
  const id = params.id;

  const [scheme, setScheme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);
  const [eligibilityCheck, setEligibilityCheck] = useState(null);
  const [offlineMode, setOfflineMode] = useState(false);
  const [isTracked, setIsTracked] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("user_profile");
    if (raw) setProfile(JSON.parse(raw));

    if (!id) return;
    fetchSchemeAndCheck();
  }, [id]);

  useEffect(() => {
    if (!id) {
      setIsTracked(false);
      return;
    }
    const list = getStorageJSON("tracked_schemes", []);
    setIsTracked(list.some(s => s.scheme_id === id));
  }, [id]);

  const handleToggleTrack = () => {
    if (!scheme) return;
    let list = getStorageJSON("tracked_schemes", []);

    if (isTracked) {
      list = list.filter(s => s.scheme_id !== id);
      setIsTracked(false);
    } else {
      list.push({
        scheme_id: id,
        name: scheme.name,
        status: "saved",
        notes: "",
        reminder_date: "",
        saved_at: new Date().toISOString()
      });
      setIsTracked(true);
    }
    setStorageJSON("tracked_schemes", list);
  };

  const fetchSchemeAndCheck = async () => {
    try {
      // 1. Fetch details
      const res = await fetch(`${API_URL}/schemes/${id}`);
      if (!res.ok) throw new Error("Scheme not found");
      const data = await res.json();
      setScheme(data);
      setOfflineMode(false);

      // Cache details locally
      const cached = getStorageJSON("cached_scheme_details", {});
      cached[id] = data;
      setStorageJSON("cached_scheme_details", cached);

      // 2. Fetch eligibility logs if user profile exists
      const raw = localStorage.getItem("user_profile");
      if (raw) {
        const checkRes = await fetch(`${API_URL}/schemes/check/${id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: raw
        });
        if (checkRes.ok) {
          setEligibilityCheck(await checkRes.json());
        }
      }
    } catch (err) {
      console.warn("Failed to fetch scheme details. Trying cache fallback.", err);
      // Attempt offline fallback
      const cached = getStorageJSON("cached_scheme_details");
      if (cached && cached[id]) {
        setScheme(cached[id]);
        setOfflineMode(true);
        setError(null);
        return;
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout activeTab="/schemes">
        <div className="w-full max-w-xl mx-auto p-5 space-y-4 animate-pulse pt-10">
          <div className="h-4 bg-slate-100 rounded w-1/4" />
          <div className="h-8 bg-slate-100 rounded w-full" />
          <div className="h-6 bg-slate-100 rounded w-3/4" />
          <div className="h-24 bg-slate-100 rounded-2xl w-full" />
          <div className="h-40 bg-slate-100 rounded-2xl w-full" />
        </div>
      </AppLayout>
    );
  }

  if (error || !scheme) {
    return (
      <AppLayout activeTab="/schemes">
        <div className="w-full max-w-xl mx-auto p-6 text-center pt-16 select-none bg-white border border-slate-200 rounded-3xl shadow-sm">
          <Icons.AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-base font-extrabold text-slate-800 m-0 mb-3">Scheme Details Not Found</h2>
          <p className="text-xs text-slate-400 mb-6 font-medium">We could not locate this specific scheme in our database.</p>
          <button 
            onClick={() => router.back()} 
            className="bg-brand-navy-950 hover:bg-brand-navy-800 text-white border-0 rounded-2xl px-6 py-3.5 text-xs font-bold cursor-pointer shadow-sm active:scale-98"
          >
            Go Back
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout activeTab="/schemes">
      <div className="w-full max-w-xl mx-auto pb-24 md:pb-6 px-4 md:px-0">
        <div className="mb-4">
          <button 
            onClick={() => router.back()} 
            className="bg-white border border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-800 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all duration-150 flex items-center gap-1.5 shadow-sm"
          >
            <Icons.ArrowLeft className="w-4 h-4" /> Back to Schemes
          </button>
        </div>
        <SchemeDetail
          scheme={scheme}
          eligibility={eligibilityCheck}
          userProfile={profile}
          isTracked={isTracked}
          onToggleTrack={handleToggleTrack}
          showTracking={true}
        />
      </div>
    </AppLayout>
  );
}