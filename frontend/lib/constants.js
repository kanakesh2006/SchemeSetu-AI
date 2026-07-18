/**
 * constants.js — Single source of truth for all shared constants
 *
 * Previously duplicated across:
 *   - app/onboarding/page.jsx (STATES, OCCUPATIONS, INCOME_RANGES)
 *   - app/schemes/page.jsx (BENEFIT_COLORS, DOC_LABELS)
 *   - app/schemes/[id]/page.jsx (BENEFIT_COLORS, DOC_LABELS)
 *   - app/search/page.jsx (BENEFIT_COLORS)
 *   - app/tracker/page.jsx (STATUS_COLORS)
 *   - components/AppLayout.jsx (NAV_ITEMS)
 *   - components/Bottomnav.jsx (NAV_ITEMS)
 */

// ---------------------------------------------------------------------------
// Indian States & Union Territories — unified to { code, name } format
// ---------------------------------------------------------------------------
export const STATES = [
  { code: "AN", name: "Andaman & Nicobar" },
  { code: "AP", name: "Andhra Pradesh" },
  { code: "AR", name: "Arunachal Pradesh" },
  { code: "AS", name: "Assam" },
  { code: "BR", name: "Bihar" },
  { code: "CG", name: "Chhattisgarh" },
  { code: "CH", name: "Chandigarh" },
  { code: "DL", name: "Delhi" },
  { code: "GA", name: "Goa" },
  { code: "GJ", name: "Gujarat" },
  { code: "HP", name: "Himachal Pradesh" },
  { code: "HR", name: "Haryana" },
  { code: "JH", name: "Jharkhand" },
  { code: "JK", name: "Jammu & Kashmir" },
  { code: "KA", name: "Karnataka" },
  { code: "KL", name: "Kerala" },
  { code: "MH", name: "Maharashtra" },
  { code: "ML", name: "Meghalaya" },
  { code: "MN", name: "Manipur" },
  { code: "MP", name: "Madhya Pradesh" },
  { code: "MZ", name: "Mizoram" },
  { code: "NL", name: "Nagaland" },
  { code: "OD", name: "Odisha" },
  { code: "PB", name: "Punjab" },
  { code: "PY", name: "Puducherry" },
  { code: "RJ", name: "Rajasthan" },
  { code: "SK", name: "Sikkim" },
  { code: "TN", name: "Tamil Nadu" },
  { code: "TR", name: "Tripura" },
  { code: "TS", name: "Telangana" },
  { code: "UK", name: "Uttarakhand" },
  { code: "UP", name: "Uttar Pradesh" },
  { code: "WB", name: "West Bengal" },
];

// ---------------------------------------------------------------------------
// Occupation types
// ---------------------------------------------------------------------------
export const OCCUPATIONS = [
  { value: "farmer",             label: "Farmer / Agriculture" },
  { value: "student",            label: "Student" },
  { value: "unorganised_worker", label: "Daily Wage / Unorganised Worker" },
  { value: "self_employed",      label: "Self-employed / Small Business" },
  { value: "unemployed",         label: "Unemployed / Looking for Work" },
  { value: "salaried",           label: "Salaried Employee" },
];

// ---------------------------------------------------------------------------
// Annual household income ranges
// ---------------------------------------------------------------------------
export const INCOME_RANGES = [
  { value: 60000,   label: "Below ₹60,000 / year" },
  { value: 120000,  label: "₹60,000 – ₹1,20,000 / year" },
  { value: 180000,  label: "₹1,20,000 – ₹1,80,000 / year" },
  { value: 250000,  label: "₹1,80,000 – ₹2,50,000 / year" },
  { value: 500000,  label: "₹2,50,000 – ₹5,00,000 / year" },
  { value: 1000000, label: "Above ₹5,00,000 / year" },
];

// ---------------------------------------------------------------------------
// Benefit type → color & label mapping (used in scheme cards, badges, filters)
// ---------------------------------------------------------------------------
export const BENEFIT_COLORS = {
  cash_transfer:  { bg: "bg-blue-50/70 text-blue-700 border-blue-100",       accent: "border-l-blue-500",    label: "Cash Transfer" },
  scholarship:    { bg: "bg-emerald-50/70 text-emerald-700 border-emerald-100", accent: "border-l-emerald-500", label: "Scholarship" },
  subsidy:        { bg: "bg-amber-50/70 text-amber-800 border-amber-100",    accent: "border-l-amber-500",   label: "Subsidy" },
  insurance:      { bg: "bg-purple-50/70 text-purple-700 border-purple-100", accent: "border-l-purple-500",  label: "Insurance" },
  housing:        { bg: "bg-orange-50/70 text-orange-700 border-orange-100", accent: "border-l-orange-500",  label: "Housing" },
  employment:     { bg: "bg-teal-50/70 text-teal-700 border-teal-100",       accent: "border-l-teal-500",    label: "Employment" },
  healthcare:     { bg: "bg-rose-50/70 text-rose-700 border-rose-100",       accent: "border-l-rose-500",    label: "Healthcare" },
  food_subsidy:   { bg: "bg-orange-50/70 text-orange-800 border-orange-100", accent: "border-l-orange-600",  label: "Food Subsidy" },
  savings_scheme: { bg: "bg-indigo-50/70 text-indigo-700 border-indigo-100", accent: "border-l-indigo-500",  label: "Savings" },
  other:          { bg: "bg-slate-50 text-slate-700 border-slate-100",       accent: "border-l-slate-400",   label: "Scheme" },
};

// ---------------------------------------------------------------------------
// Document key → human-readable label
// ---------------------------------------------------------------------------
export const DOC_LABELS = {
  aadhaar:               "Aadhaar Card",
  ration_card:           "Ration Card",
  bank_passbook:         "Bank Passbook",
  caste_certificate:     "Caste Certificate",
  income_certificate:    "Income Certificate",
  land_records:          "Land Records",
  mark_sheet:            "Mark Sheet / Certificates",
  birth_certificate:     "Birth Certificate",
  guardian_id:           "Guardian ID Proof",
  education_certificate: "Education Certificate",
  project_report:        "Project Report",
  mobile_number:         "Mobile Number",
  bpl_card:              "BPL Card",
  none_required:         "No documents required",
};

// ---------------------------------------------------------------------------
// Navigation items — shared between desktop sidebar & mobile bottom nav
// ---------------------------------------------------------------------------
export const NAV_ITEMS = [
  { name: "Matched Schemes", shortName: "Schemes",    path: "/schemes",  iconName: "Landmark" },
  { name: "AI Search",       shortName: "AI Search",  path: "/search",   iconName: "Brain" },
  { name: "Tracker",         shortName: "Tracker",     path: "/tracker",  iconName: "ClipboardList" },
  { name: "Nearby Centers",  shortName: "Nearby",      path: "/nearby",   iconName: "MapPin" },
  { name: "My Profile",      shortName: "Profile",     path: "/profile",  iconName: "User" },
];

// ---------------------------------------------------------------------------
// Tracker status → label & color mapping
// ---------------------------------------------------------------------------
export const STATUS_COLORS = {
  saved:        { text: "Saved",        color: "bg-blue-50 text-blue-700 border-blue-100" },
  applied:      { text: "Applied",      color: "bg-amber-50 text-amber-800 border-amber-100" },
  under_review: { text: "Under Review", color: "bg-purple-50 text-purple-700 border-purple-100" },
  approved:     { text: "Approved",     color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  rejected:     { text: "Rejected",     color: "bg-rose-50 text-rose-700 border-rose-100" },
};

// ---------------------------------------------------------------------------
// Benefit type filter options (used in scheme listing pages)
// ---------------------------------------------------------------------------
export const BENEFIT_FILTERS = [
  "all",
  "cash_transfer",
  "scholarship",
  "subsidy",
  "insurance",
  "housing",
];

// ---------------------------------------------------------------------------
// API base URL
// ---------------------------------------------------------------------------
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
