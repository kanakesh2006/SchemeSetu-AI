"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import * as Icons from "lucide-react";
import AppLayout from "../../components/AppLayout";
import { API_URL } from "../../lib/constants";
import { Skeleton } from "../../components/ui/Skeleton";

// Dynamically import Leaflet MapComponent with SSR disabled to prevent Next.js window compilation errors
const MapComponent = dynamic(() => import("../../components/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[450px] bg-slate-100 rounded-3xl flex flex-col items-center justify-center text-slate-400 font-extrabold border border-slate-200 shadow-inner select-none gap-2">
      <Icons.Loader2 className="w-6 h-6 animate-spin text-brand-navy-500" />
      <span>Loading Interactive Map...</span>
    </div>
  ),
});

const CITIES = [
  { name: "Chennai", stateCode: "TN", lat: 13.0827, lng: 80.2707 },
  { name: "Mumbai", stateCode: "MH", lat: 18.9220, lng: 72.8347 },
  { name: "Bengaluru", stateCode: "KA", lat: 12.9716, lng: 77.5946 },
  { name: "New Delhi", stateCode: "DL", lat: 28.6139, lng: 77.2090 },
  { name: "Lucknow", stateCode: "UP", lat: 26.8467, lng: 80.9462 },
  { name: "Pune", stateCode: "MH", lat: 18.5204, lng: 73.8567 },
  { name: "Hyderabad", stateCode: "TG", lat: 17.3850, lng: 78.4867 },
  { name: "Kolkata", stateCode: "WB", lat: 22.5726, lng: 88.3639 }
];

const DICT = {
  en: {
    title: "Nearby Assistance Centers",
    subtitle: "Find post offices and CSCs near you to help submit scheme applications",
    useLocation: "Find Centers Near Me",
    gpsDenied: "Location permission denied. Please select a city manually.",
    gpsError: "Could not retrieve your location. Try manually choosing a city.",
    manualSelect: "Choose Your City Manually",
    kmAway: "km away",
    hours: "Hours:",
    phone: "Phone:",
    getDirections: "Get Directions",
    postOffice: "Post Office",
    csc: "Common Service Centre (CSC)",
    tabFind: "Find Centers",
    tabAdd: "Add New Center",
    addSuccess: "Center added successfully!",
    addFailed: "Failed to add center. Try again.",
    fillGps: "Use Current GPS",
    centerName: "Center Name",
    centerType: "Center Type",
    address: "Address",
    state: "State",
    latitude: "Latitude",
    longitude: "Longitude",
    phoneNum: "Phone Number (Optional)",
    hoursVal: "Working Hours (e.g. 9:00 AM - 5:00 PM)",
    submitBtn: "Add Assistance Center"
  },
  ta: {
    title: "அருகிலுள்ள உதவி மையங்கள்",
    subtitle: "விண்ணப்பிக்க உதவ அருகிலுள்ள தபால் நிலையங்கள் மற்றும் இ-சேவை மையங்களைக் கண்டறியவும்",
    useLocation: "என் இருப்பிடத்தை பயன்படுத்து",
    gpsDenied: "இருப்பிட அனுமதி மறுக்கப்பட்டது. தயவுசெய்து நகரத்தை கைமுறையாக தேர்ந்தெடுக்கவும்.",
    gpsError: "உங்கள் இருப்பிடத்தைக் கண்டறிய முடியவில்லை. நகரத்தை தேர்ந்தெடுக்கவும்.",
    manualSelect: "கைமுறையாக நகரத்தை தேர்ந்தெடுக்கவும்",
    kmAway: "கி.மீ தூரம்",
    hours: "நேரம்:",
    phone: "தொலைபேசி:",
    getDirections: "வழித்தடம் காண்க",
    postOffice: "தபால் நிலையம்",
    csc: "இ-சேவை மையம் (CSC)",
    tabFind: "மையங்களை தேடு",
    tabAdd: "புதிய மையம் சேர்",
    addSuccess: "மையம் வெற்றிகரமாக சேர்க்கப்பட்டது!",
    addFailed: "சேர்க்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.",
    fillGps: "இருப்பிடத்தை நிரப்பு",
    centerName: "மையத்தின் பெயர்",
    centerType: "மையத்தின் வகை",
    address: "முகவரி",
    state: "மாநிலம்",
    latitude: "அட்சரேகை (Latitude)",
    longitude: "தீர்க்கரேகை (Longitude)",
    phoneNum: "தொலைபேசி எண் (விருப்பத்தேர்வு)",
    hoursVal: "வேலை நேரம் (எ.கா. 9:00 AM - 5:00 PM)",
    submitBtn: "உதவி மையத்தை சேர்"
  },
  hi: {
    title: "नज़दीकी सहायता केंद्र",
    subtitle: "योजना आवेदनों में सहायता के लिए अपने पास के डाकघर और सीएससी खोजें",
    useLocation: "मेरे पास के केंद्र खोजें",
    gpsDenied: "स्थान अनुमति अस्वीकृत। कृपया मैन्युअल रूप से राज्य का चयन करें।",
    gpsError: "स्थान प्राप्त नहीं किया जा सका। कृपया मैन्युअल रूप से चुनें।",
    manualSelect: "अपना राज्य मैन्युअल रूप से चुनें",
    kmAway: "किमी दूर",
    hours: "समय:",
    phone: "फ़ोन:",
    getDirections: "मार्गदर्शन प्राप्त करें",
    postOffice: "डाकघर",
    csc: "सामान्य सेवा केंद्र (CSC)",
    tabFind: "केंद्र खोजें",
    tabAdd: "नया केंद्र जोड़ें",
    addSuccess: "केंद्र सफलतापूर्वक जोड़ा गया!",
    addFailed: "जोड़ने में विफल। पुनः प्रयास करें।",
    fillGps: "जीपीएस का उपयोग करें",
    centerName: "केंद्र का नाम",
    centerType: "केंद्र का प्रकार",
    address: "पता",
    state: "राज्य",
    latitude: "अक्षांश (Latitude)",
    longitude: "देशांतर (Longitude)",
    phoneNum: "फ़ोन नंबर (वैकल्पिक)",
    hoursVal: "कार्य समय (जैसे 9:00 AM - 5:00 PM)",
    submitBtn: "सहायता केंद्र जोड़ें"
  }
};

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function CenterSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 mb-3.5 animate-pulse shadow-sm">
      <div className="flex justify-between items-start mb-3">
        <Skeleton className="h-5 w-3/5 rounded-md" />
        <Skeleton className="h-5 w-1/4 rounded-full" />
      </div>
      <Skeleton className="h-3 w-11/12 rounded-md mb-3" />
      <Skeleton className="h-3 w-2/5 rounded-md mb-4" />
      <Skeleton className="h-9 w-full rounded-2xl" />
    </div>
  );
}

function CenterCard({ center, dict, isActive, onSelect }) {
  const isCsc = center.type === "csc";
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${center.latitude},${center.longitude}`;

  return (
    <div
      onClick={onSelect}
      className={`bg-white border rounded-3xl p-5 mb-3.5 cursor-pointer shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 select-none ${
        isActive ? "border-brand-navy-950 ring-2 ring-brand-navy-950/10" : "border-slate-200"
      }`}
    >
      <div className="flex justify-between items-start mb-2.5 gap-3">
        <h3 className="text-xs font-extrabold text-slate-900 leading-snug flex-1">
          {center.name}
        </h3>
        <span
          className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full border whitespace-nowrap uppercase tracking-wider ${
            isCsc ? "bg-blue-50 text-blue-700 border-blue-100" : "bg-rose-50 text-rose-700 border-rose-100"
          }`}
        >
          {isCsc ? dict.csc : dict.postOffice}
        </span>
      </div>

      <p className="text-xs text-slate-500 mb-3.5 leading-relaxed flex items-start gap-1">
        <Icons.MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
        <span>{center.address}</span>
      </p>

      <div className="flex flex-col gap-2 mb-4 border-t border-slate-50 pt-3.5">
        {center.working_hours && (
          <div className="flex justify-between text-[11px] text-slate-400 font-semibold">
            <span className="flex items-center gap-1"><Icons.Clock className="w-3 h-3" /> {dict.hours}</span>
            <span className="font-bold text-slate-700">{center.working_hours}</span>
          </div>
        )}
        {center.phone_number && (
          <div className="flex justify-between text-[11px] text-slate-400 font-semibold">
            <span className="flex items-center gap-1"><Icons.Phone className="w-3 h-3" /> {dict.phone}</span>
            <a href={`tel:${center.phone_number}`} className="font-bold text-brand-navy-500 hover:text-brand-navy-700 no-underline transition-colors" onClick={e => e.stopPropagation()}>
              {center.phone_number}
            </a>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center">
        {center.distance !== undefined ? (
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
            {center.distance} {dict.kmAway}
          </span>
        ) : (
          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">{center.state}</span>
        )}

        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className="bg-brand-navy-950 hover:bg-brand-navy-800 text-white no-underline text-xs font-bold px-4 py-2.5 rounded-2xl inline-flex items-center gap-1.5 transition-transform duration-100 active:scale-95 shadow-sm"
        >
          <Icons.Navigation className="w-3.5 h-3.5 text-brand-amber-400" />
          <span>{dict.getDirections}</span>
        </a>
      </div>
    </div>
  );
}

export default function NearbyCentersPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("find"); // "find" or "add"
  const [language, setLanguage] = useState("en");
  const [loading, setLoading] = useState(false);
  const [centers, setCenters] = useState([]);
  const [statusMsg, setStatusMsg] = useState("");
  const [coords, setCoords] = useState(null);
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedCenterId, setSelectedCenterId] = useState(null);

  // Add Center Form State
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState("csc");
  const [formAddress, setFormAddress] = useState("");
  const [formState, setFormState] = useState("TN");
  const [formLat, setFormLat] = useState("");
  const [formLng, setFormLng] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formHours, setFormHours] = useState("");
  const [formMsg, setFormMsg] = useState({ text: "", type: "" }); // text, type: 'success' | 'error'

  useEffect(() => {
    const savedLang = localStorage.getItem("language") || "en";
    setLanguage(savedLang);
  }, []);

  const d = DICT[language] || DICT.en;

  const requestGPSLocation = () => {
    if (!navigator.geolocation) {
      setStatusMsg(d.gpsError);
      return;
    }
    
    setLoading(true);
    setStatusMsg("");
    setCenters([]);
    setSelectedCity("");
    setSelectedCenterId(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ latitude, longitude });
        fetchNearbyCenters(latitude, longitude);
      },
      (error) => {
        console.error("GPS access failed:", error);
        setLoading(false);
        setStatusMsg(d.gpsDenied);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const fetchNearbyCenters = async (lat, lng) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/centers/nearby?lat=${lat}&lng=${lng}`);
      if (!res.ok) throw new Error("Service error");
      const data = await res.json();
      
      let backendResults = data.results || [];
      
      const localAddedRaw = localStorage.getItem("added_centers");
      if (localAddedRaw) {
        try {
          const localAdded = JSON.parse(localAddedRaw);
          localAdded.forEach(c => {
            const dist = haversineDistance(lat, lng, c.latitude, c.longitude);
            backendResults.push({
              ...c,
              distance: roundToTwo(dist)
            });
          });
          
          backendResults = backendResults.filter((value, index, self) =>
            index === self.findIndex((t) => (
              t.name === value.name && t.latitude === value.latitude && t.longitude === value.longitude
            ))
          );
          
          backendResults.sort((a, b) => a.distance - b.distance);
        } catch (e) {
          console.error("Failed parsing added centers:", e);
        }
      }

      setCenters(backendResults.slice(0, 5));
    } catch (err) {
      setStatusMsg("Failed to connect to online location services. Using offline fallback.");
      calculateOfflineCenters(lat, lng);
    } finally {
      setLoading(false);
    }
  };

  const roundToTwo = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

  const calculateOfflineCenters = (lat, lng) => {
    const fallbackMock = [
      { center_id: 1, name: "Chennai GPO (India Post)", type: "post_office", address: "Rajaji Salai, George Town, Chennai", state: "TN", latitude: 13.0899, longitude: 80.2872, phone_number: "044-25220031", working_hours: "9:00 AM - 6:00 PM" },
      { center_id: 2, name: "CSC E-Sevai Centre George Town", type: "csc", address: "No 12, Armenian St, Chennai", state: "TN", latitude: 13.0885, longitude: 80.2835, phone_number: "9876543210", working_hours: "10:00 AM - 5:00 PM" },
      { center_id: 3, name: "CSC E-Sevai Centre Nungambakkam", type: "csc", address: "Corporation Building, College Rd, Nungambakkam, Chennai", state: "TN", latitude: 13.0612, longitude: 80.2461, phone_number: "9876543211", working_hours: "10:00 AM - 5:00 PM" },
      { center_id: 4, name: "Mumbai GPO (India Post)", type: "post_office", address: "Chhatrapati Shivaji Maharaj Terminus Area, Fort, Mumbai", state: "MH", latitude: 18.9401, longitude: 72.8358, phone_number: "022-22621671", working_hours: "9:00 AM - 6:00 PM" },
      { center_id: 5, name: "CSC Digital Seva Centre Andheri", type: "csc", address: "Shop 4, J.P. Road, Andheri West, Mumbai", state: "MH", latitude: 19.1202, longitude: 72.8465, phone_number: "9876543212", working_hours: "10:00 AM - 6:00 PM" }
    ];

    let results = [];
    
    fallbackMock.forEach(c => {
      results.push({ ...c, distance: roundToTwo(haversineDistance(lat, lng, c.latitude, c.longitude)) });
    });

    const localAddedRaw = localStorage.getItem("added_centers");
    if (localAddedRaw) {
      try {
        const localAdded = JSON.parse(localAddedRaw);
        localAdded.forEach(c => {
          results.push({ ...c, distance: roundToTwo(haversineDistance(lat, lng, c.latitude, c.longitude)) });
        });
      } catch (e) {
        console.error(e);
      }
    }

    results.sort((a, b) => a.distance - b.distance);
    setCenters(results.slice(0, 5));
  };

  const handleCityChange = async (cityName) => {
    if (!cityName) return;
    setSelectedCity(cityName);
    setLoading(true);
    setStatusMsg("");
    setCoords(null);
    setSelectedCenterId(null);
    
    const cityObj = CITIES.find(c => c.name === cityName);
    if (cityObj) {
      await fetchNearbyCenters(cityObj.lat, cityObj.lng);
    }
  };

  const fillGPSInForm = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormLat(position.coords.latitude.toFixed(6));
        setFormLng(position.coords.longitude.toFixed(6));
      },
      (err) => {
        console.error("GPS fetch failed for form:", err);
      }
    );
  };

  const handleAddCenter = async (e) => {
    e.preventDefault();
    if (!formName.trim() || !formAddress.trim() || !formLat || !formLng) {
      setFormMsg({ text: "Please fill in all required fields.", type: "error" });
      return;
    }

    const payload = {
      name: formName,
      type: formType,
      address: formAddress,
      state: formState,
      latitude: parseFloat(formLat),
      longitude: parseFloat(formLng),
      phone_number: formPhone.trim() || null,
      working_hours: formHours.trim() || null
    };

    try {
      const res = await fetch(`${API_URL}/centers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const localAddedRaw = localStorage.getItem("added_centers") || "[]";
      let localAdded = [];
      try {
        localAdded = JSON.parse(localAddedRaw);
      } catch (e) {}
      
      payload.center_id = Date.now();
      localAdded.push(payload);
      localStorage.setItem("added_centers", JSON.stringify(localAdded));

      setFormMsg({ text: d.addSuccess, type: "success" });
      
      setFormName("");
      setFormAddress("");
      setFormLat("");
      setFormLng("");
      setFormPhone("");
      setFormHours("");

      setTimeout(() => {
        setFormMsg({ text: "", type: "" });
        setActiveTab("find");
        if (coords) {
          fetchNearbyCenters(coords.latitude, coords.longitude);
        } else {
          handleCityChange(selectedCity || "Chennai");
        }
      }, 1500);

    } catch (err) {
      setFormMsg({ text: d.addFailed, type: "error" });
    }
  };

  const mapCenterLat = coords ? coords.latitude : (centers.length > 0 ? centers[0].latitude : 13.0827);
  const mapCenterLng = coords ? coords.longitude : (centers.length > 0 ? centers[0].longitude : 80.2707);

  const previewCenter = (formLat && formLng) ? {
    center_id: "preview",
    name: formName || "New Center Location",
    type: formType,
    latitude: parseFloat(formLat),
    longitude: parseFloat(formLng),
    address: formAddress || "Preview Location Address",
    state: formState
  } : null;

  return (
    <AppLayout activeTab="/nearby">
      <div className="w-full max-w-md mx-auto md:max-w-none md:mx-0 h-full flex flex-col md:flex-row gap-6 md:h-[calc(100vh-4rem)] box-border">
        
        {/* Left Column: Form and Centers list */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50 md:bg-white md:border md:border-slate-200/80 md:rounded-3xl md:shadow-sm overflow-hidden h-full">
          
          {/* Banner */}
          <div className="bg-brand-navy-950 px-6 py-5 text-white flex-shrink-0 md:rounded-t-3xl shadow-sm">
            <h1 className="text-sm md:text-base font-extrabold m-0 flex items-center gap-2 uppercase">
              <Icons.MapPin className="w-5 h-5 text-brand-amber-400 stroke-[2.2]" />
              <span>{d.title}</span>
            </h1>
            <p className="text-[11px] text-slate-300 mt-1.5 m-0 leading-relaxed font-semibold">
              {d.subtitle}
            </p>
          </div>

          {/* Tabs Selector */}
          <div className="flex bg-white border-b border-slate-100 px-3 flex-shrink-0 select-none">
            <button
              onClick={() => { setActiveTab("find"); setFormMsg({ text: "", type: "" }); }}
              className={`flex-1 py-4 bg-transparent border-0 border-b-2 font-bold text-xs transition-all duration-200 cursor-pointer ${
                activeTab === "find" 
                  ? "border-brand-navy-950 text-brand-navy-950" 
                  : "border-transparent text-slate-400 hover:text-slate-900"
              }`}
            >
              {d.tabFind}
            </button>
            <button
              onClick={() => { setActiveTab("add"); setStatusMsg(""); }}
              className={`flex-1 py-4 bg-transparent border-0 border-b-2 font-bold text-xs transition-all duration-200 cursor-pointer ${
                activeTab === "add" 
                  ? "border-brand-navy-950 text-brand-navy-950" 
                  : "border-transparent text-slate-400 hover:text-slate-900"
              }`}
            >
              {d.tabAdd}
            </button>
          </div>

          {/* Form Content Scroll Box */}
          <div className="flex-1 overflow-y-auto px-5 pb-24 md:pb-6 pt-4.5 custom-scrollbar bg-slate-50/30">
            
            {/* Tab 1: Find Centers */}
            {activeTab === "find" && (
              <div className="space-y-4 animate-fade-in">
                
                {/* Geolocation Lock box */}
                <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
                  <button
                    onClick={requestGPSLocation}
                    disabled={loading}
                    className="w-full bg-brand-navy-950 hover:bg-brand-navy-800 text-white border-none rounded-2xl py-3.5 text-xs font-bold cursor-pointer transition-all duration-150 active:scale-98 shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    <Icons.Navigation className="w-4 h-4 text-brand-amber-400 stroke-[2]" />
                    <span>{loading ? "Locating..." : d.useLocation}</span>
                  </button>

                  {statusMsg && (
                    <p className="text-xs font-bold text-rose-600 text-center m-0 leading-normal flex items-center justify-center gap-1 animate-fade-in">
                      <Icons.AlertTriangle className="w-3.5 h-3.5" />
                      <span>{statusMsg}</span>
                    </p>
                  )}

                  {coords && (
                    <p className="text-xs text-emerald-600 font-bold text-center m-0 flex items-center justify-center gap-1 animate-fade-in">
                      <Icons.CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                      <span>GPS Connected: {coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)}</span>
                    </p>
                  )}

                  <div className="flex items-center gap-3 py-1 select-none">
                    <hr className="flex-1 border-0 border-t border-slate-100" />
                    <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest">OR</span>
                    <hr className="flex-1 border-0 border-t border-slate-100" />
                  </div>

                  {/* City Select Fallback */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                      {d.manualSelect}
                    </label>
                    <select
                      value={selectedCity}
                      onChange={(e) => handleCityChange(e.target.value)}
                      className="w-full py-3 px-4 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white outline-none focus:border-brand-navy-950 cursor-pointer"
                    >
                      <option value="">-- Choose City --</option>
                      {CITIES.map(city => (
                        <option key={city.name} value={city.name}>{city.name} ({city.stateCode})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Mobile Map View */}
                <div className="md:hidden w-full h-64 flex-shrink-0 rounded-3xl overflow-hidden border border-slate-200 shadow-sm relative z-10">
                  <MapComponent 
                    centers={centers}
                    userCoords={coords}
                    centerLat={mapCenterLat}
                    centerLng={mapCenterLng}
                    selectedCenterId={selectedCenterId}
                    onSelectCenter={(center) => setSelectedCenterId(center.center_id)}
                    previewCenter={previewCenter}
                  />
                </div>

                {/* Centers Listings */}
                <div className="space-y-3 pt-1">
                  {loading && [1, 2, 3].map(i => <CenterSkeleton key={i} />)}

                  {!loading && centers.length > 0 && (
                    <div className="space-y-3">
                      {centers.map(center => (
                        <CenterCard 
                          key={center.center_id} 
                          center={center} 
                          dict={d} 
                          isActive={selectedCenterId === center.center_id}
                          onSelect={() => setSelectedCenterId(center.center_id)}
                        />
                      ))}
                    </div>
                  )}

                  {!loading && centers.length === 0 && !statusMsg && (
                    <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-sm select-none">
                      <Icons.Compass className="w-10 h-10 text-slate-300 mx-auto mb-3 animate-pulse-subtle" />
                      <p className="text-xs text-slate-400 leading-relaxed font-semibold m-0 max-w-[240px] mx-auto">
                        Connect your GPS coordinates or select a manual state fallback to discover nearby Post Offices and Common Service Centres.
                      </p>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* Tab 2: Add Center Form */}
            {activeTab === "add" && (
              <form onSubmit={handleAddCenter} className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4 animate-fade-in">
                
                {formMsg.text && (
                  <div className={`border rounded-2xl p-4 text-xs font-bold flex items-center gap-2 ${
                    formMsg.type === "success" 
                      ? "bg-emerald-50 text-emerald-800 border-emerald-100" 
                      : "bg-rose-50 text-rose-800 border-rose-100"
                  }`}>
                    <Icons.AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formMsg.text}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                    {d.centerName} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. George Town Sub Post Office"
                    className="w-full py-3 px-4 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-700 outline-none focus:border-brand-navy-950 box-border shadow-sm placeholder-slate-400"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                    {d.centerType} *
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormType("csc")}
                      className={`flex-1 py-3 rounded-2xl border font-bold text-xs cursor-pointer transition-colors active:scale-[0.99] ${
                        formType === "csc" 
                          ? "border-brand-navy-950 bg-brand-navy-50/50 text-brand-navy-950" 
                          : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800 hover:border-slate-300"
                      }`}
                    >
                      💻 {d.csc}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormType("post_office")}
                      className={`flex-1 py-3 rounded-2xl border font-bold text-xs cursor-pointer transition-colors active:scale-[0.99] ${
                        formType === "post_office" 
                          ? "border-brand-navy-950 bg-brand-navy-50/50 text-brand-navy-950" 
                          : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800 hover:border-slate-300"
                      }`}
                    >
                      📮 {d.postOffice}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                    {d.address} *
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    placeholder="Complete street address details..."
                    className="w-full py-3 px-4 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-700 outline-none resize-none box-border focus:border-brand-navy-950 font-sans leading-relaxed shadow-sm placeholder-slate-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                      {d.state} *
                    </label>
                    <select
                      value={formState}
                      onChange={(e) => setFormState(e.target.value)}
                      className="w-full py-3 px-3 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white outline-none focus:border-brand-navy-950 h-[45px] cursor-pointer"
                    >
                      {STATES.map(s => (
                        <option key={s.code} value={s.code}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={fillGPSInForm}
                      className="w-full h-[45px] bg-slate-100 border border-slate-200 rounded-2xl text-[10px] text-slate-700 font-extrabold cursor-pointer transition-colors hover:bg-slate-200 flex items-center justify-center gap-1.5 active:scale-98 uppercase tracking-wider"
                    >
                      <Icons.Navigation className="w-3.5 h-3.5 text-brand-navy-500" />
                      <span>{d.fillGps}</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                      {d.latitude} *
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      required
                      value={formLat}
                      onChange={(e) => setFormLat(e.target.value)}
                      placeholder="e.g. 13.0899"
                      className="w-full py-3.5 px-4 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-700 outline-none box-border focus:border-brand-navy-950 shadow-sm placeholder-slate-400"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                      {d.longitude} *
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      required
                      value={formLng}
                      onChange={(e) => setFormLng(e.target.value)}
                      placeholder="e.g. 80.2872"
                      className="w-full py-3.5 px-4 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-700 outline-none box-border focus:border-brand-navy-950 shadow-sm placeholder-slate-400"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                    {d.phoneNum}
                  </label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="e.g. 044-25220031"
                    className="w-full py-3 px-4 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-700 outline-none box-border focus:border-brand-navy-950 shadow-sm placeholder-slate-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                    {d.hoursVal}
                  </label>
                  <input
                    type="text"
                    value={formHours}
                    onChange={(e) => setFormHours(e.target.value)}
                    placeholder="e.g. 9:00 AM - 5:00 PM"
                    className="w-full py-3 px-4 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-700 outline-none box-border focus:border-brand-navy-950 shadow-sm placeholder-slate-400"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white border-0 rounded-2xl py-4 text-xs font-bold cursor-pointer transition-transform duration-100 active:scale-[0.99] shadow-md flex items-center justify-center gap-1.5"
                >
                  <Icons.Save className="w-4 h-4" />
                  <span>{d.submitBtn}</span>
                </button>
              </form>
            )}

          </div>
        </div>

        {/* Right Column: Desktop Map Pane */}
        <div className="hidden md:flex flex-1 bg-white border border-slate-200 rounded-3xl shadow-sm p-4 overflow-hidden h-full relative">
          <MapComponent 
            centers={centers}
            userCoords={coords}
            centerLat={mapCenterLat}
            centerLng={mapCenterLng}
            selectedCenterId={selectedCenterId}
            onSelectCenter={(center) => setSelectedCenterId(center.center_id)}
            previewCenter={previewCenter}
          />
        </div>
      </div>
    </AppLayout>
  );
}
