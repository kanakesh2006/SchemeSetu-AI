"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import * as Icons from "lucide-react";
import AppLayout from "../../components/AppLayout";
import { STATUS_COLORS } from "../../lib/constants";
import EmptyState from "../../components/ui/EmptyState";

export default function TrackerPage() {
  const router = useRouter();
  const [trackedSchemes, setTrackedSchemes] = useState([]);
  const [filter, setFilter] = useState("all");
  const [editingId, setEditingId] = useState(null);
  const [noteForm, setNoteForm] = useState("");
  const [dateForm, setDateForm] = useState("");

  useEffect(() => {
    loadTracked();
  }, []);

  const loadTracked = () => {
    const raw = localStorage.getItem("tracked_schemes") || "[]";
    try {
      setTrackedSchemes(JSON.parse(raw));
    } catch (e) {
      setTrackedSchemes([]);
    }
  };

  const handleUpdateStatus = (schemeId, newStatus) => {
    const raw = localStorage.getItem("tracked_schemes") || "[]";
    let list = [];
    try { list = JSON.parse(raw); } catch(e) {}
    
    list = list.map((s) => {
      if (s.scheme_id === schemeId) {
        return { ...s, status: newStatus };
      }
      return s;
    });

    localStorage.setItem("tracked_schemes", JSON.stringify(list));
    setTrackedSchemes(list);
  };

  const handleSaveEdit = (schemeId) => {
    const raw = localStorage.getItem("tracked_schemes") || "[]";
    let list = [];
    try { list = JSON.parse(raw); } catch(e) {}
    
    list = list.map((s) => {
      if (s.scheme_id === schemeId) {
        return { ...s, notes: noteForm, reminder_date: dateForm };
      }
      return s;
    });

    localStorage.setItem("tracked_schemes", JSON.stringify(list));
    setTrackedSchemes(list);
    setEditingId(null);
  };

  const handleStartEdit = (scheme) => {
    setEditingId(scheme.scheme_id);
    setNoteForm(scheme.notes || "");
    setDateForm(scheme.reminder_date || "");
  };

  const handleRemove = (schemeId) => {
    if (confirm("Are you sure you want to stop tracking this scheme?")) {
      const raw = localStorage.getItem("tracked_schemes") || "[]";
      let list = [];
      try { list = JSON.parse(raw); } catch(e) {}
      
      list = list.filter((s) => s.scheme_id !== schemeId);
      localStorage.setItem("tracked_schemes", JSON.stringify(list));
      setTrackedSchemes(list);
    }
  };

  const calculateDaysLeft = (dateStr) => {
    if (!dateStr) return null;
    const diff = new Date(dateStr) - new Date();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  const filtered = filter === "all" ? trackedSchemes : trackedSchemes.filter((s) => s.status === filter);

  return (
    <AppLayout activeTab="/tracker">
      <div className="w-full max-w-4xl mx-auto pb-24 md:pb-6 px-4 md:px-0 box-border animate-[fadeIn_0.2s_ease-out]">
        
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 m-0 tracking-tight">
              Application Tracker
            </h1>
            <p className="text-xs text-slate-400 font-bold mt-1.5 m-0 uppercase tracking-wider">
              Monitor and schedule deadlines for saved welfare programs
            </p>
          </div>

          {/* Status filter chips */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 select-none">
            {["all", "saved", "applied", "under_review", "approved", "rejected"].map((st) => (
              <button
                key={st}
                onClick={() => setFilter(st)}
                className={`px-3 py-1.5 rounded-full border border-slate-200 text-[10px] font-extrabold cursor-pointer transition-all duration-150 uppercase tracking-wider whitespace-nowrap ${
                  filter === st
                    ? "bg-brand-navy-950 text-white shadow-sm border-transparent"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                {st === "all" ? "All" : st.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Empty State */}
        {filtered.length === 0 && (
          <EmptyState
            iconName="ClipboardList"
            title="No Tracked Schemes Found"
            description="Track schemes from your matches page to see and manage their application deadlines, notes, and statuses here."
            actionLabel="Explore Match Schemes"
            onActionClick={() => router.push("/schemes")}
          />
        )}

        {/* Cards Grid */}
        {filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((s) => {
              const label = STATUS_COLORS[s.status] || STATUS_COLORS.saved;
              const days = calculateDaysLeft(s.reminder_date);
              
              return (
                <div 
                  key={s.scheme_id} 
                  className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Title & Status Badge */}
                    <div className="flex justify-between items-start gap-4 mb-3">
                      <h3 
                        onClick={() => router.push(`/schemes/${s.scheme_id}`)}
                        className="text-sm font-bold text-slate-900 leading-snug m-0 cursor-pointer hover:text-brand-navy-950 transition-colors"
                      >
                        {s.name}
                      </h3>
                      <span className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase tracking-wider whitespace-nowrap ${label.color}`}>
                        {label.text}
                      </span>
                    </div>

                    {/* Deadline Reminder indicator */}
                    {s.reminder_date && (
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold border mb-4 ${
                        days < 0 
                          ? "bg-rose-50 text-rose-700 border-rose-100" 
                          : days <= 3 
                            ? "bg-amber-50 text-amber-800 border-amber-100 animate-pulse" 
                            : "bg-slate-50 text-slate-500 border-slate-100"
                      }`}>
                        <Icons.Calendar className="w-3.5 h-3.5" />
                        <span>
                          {days < 0 
                            ? `Overdue by ${Math.abs(days)} day${Math.abs(days) !== 1 ? "s" : ""}` 
                            : days === 0 
                              ? "Due today!" 
                              : `${days} day${days !== 1 ? "s" : ""} left (${s.reminder_date})`}
                        </span>
                      </div>
                    )}

                    {/* Notes Section */}
                    {editingId === s.scheme_id ? (
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 mb-4 space-y-3">
                        <div>
                          <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">
                            Deadline Reminder
                          </label>
                          <input 
                            type="date" 
                            value={dateForm}
                            onChange={(e) => setDateForm(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white font-semibold text-slate-700"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">
                            My Notes
                          </label>
                          <textarea 
                            rows="2"
                            value={noteForm}
                            onChange={(e) => setNoteForm(e.target.value)}
                            placeholder="Add reference code, steps, or custom info..."
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white font-semibold text-slate-700 resize-none box-border"
                          />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-3 py-1.5 border border-slate-200 bg-white text-slate-600 rounded-lg text-[10px] font-bold cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveEdit(s.scheme_id)}
                            className="px-3 py-1.5 border-0 bg-brand-navy-950 hover:bg-brand-navy-800 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      s.notes && (
                        <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-3.5 mb-4 text-xs font-medium text-slate-500 italic leading-relaxed">
                          {s.notes}
                        </div>
                      )
                    )}
                  </div>

                  {/* Actions footer */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3.5 mt-auto">
                    
                    {/* Status updater */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                        Status:
                      </span>
                      <select
                        value={s.status}
                        onChange={(e) => handleUpdateStatus(s.scheme_id, e.target.value)}
                        className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 px-2 py-1 outline-none cursor-pointer"
                      >
                        <option value="saved">Saved</option>
                        <option value="applied">Applied</option>
                        <option value="under_review">Under Review</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      {editingId !== s.scheme_id && (
                        <button
                          onClick={() => handleStartEdit(s)}
                          className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-xl text-[10px] font-bold cursor-pointer transition-colors shadow-sm flex items-center gap-1"
                        >
                          <Icons.Edit2 className="w-3.5 h-3.5" />
                          <span>Edit notes</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleRemove(s.scheme_id)}
                        className="px-3 py-1.5 border border-transparent bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1"
                      >
                        <Icons.Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
