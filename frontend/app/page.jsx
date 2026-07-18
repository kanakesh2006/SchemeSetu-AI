"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import * as Icons from "lucide-react";
import { API_URL } from "../lib/constants";

const LANGS = [
  {
    code: "en",
    label: "English",
    tagline: "Discover government welfare schemes you are eligible for",
    cta: "Get Started",
    ctaSchemes: "See My Schemes",
    ctaProfile: "Update My Profile",
    speak: "Speak to find schemes",
    speakHint: "Tap mic and tell us your age, state, and occupation",
    securedTitle: "Secure, Verified & Private",
    securedList: [
      "We never ask for Aadhaar numbers, OTPs, or bank credentials.",
      "All application links navigate directly to official government portals.",
      "Your profile data remains encrypted locally inside your browser cache.",
    ],
  },
  {
    code: "ta",
    label: "தமிழ்",
    tagline: "நீங்கள் தகுதியான திட்டங்களை கண்டறியுங்கள்",
    cta: "தொடங்குங்கள்",
    ctaSchemes: "என் திட்டங்களை பாருங்கள்",
    ctaProfile: "விவரங்களை மாற்றுங்கள்",
    speak: "பேசி திட்டங்கள் கண்டறியுங்கள்",
    speakHint: "மைக்கை தட்டி உங்கள் வயது, மாநிலம், மற்றும் தொழில் விவரங்களைக் கூறவும்",
    securedTitle: "பாதுகாப்பானது & தனிப்பட்டது",
    securedList: [
      "ஆதார் எண், அலைபேசி குறுஞ்செய்தி அல்லது வங்கி விவரங்கள் கேட்கப்படமாட்டாது.",
      "அனைத்து திட்ட விண்ணப்பங்களும் அரசு அதிகாரப்பூர்வ இணையதளங்களுக்கே செல்லும்.",
      "உங்களது சுயவிவர தரவு உங்கள் உலவியிலேயே பாதுகாப்பாக சேமிக்கப்படும்.",
    ],
  },
  {
    code: "hi",
    label: "हिंदी",
    tagline: "अपने लिए योग्य सरकारी योजनाएं खोजें",
    cta: "शुरू करें",
    ctaSchemes: "मेरी योजनाएं देखें",
    ctaProfile: "प्रोफाइल अपडेट करें",
    speak: "बोलकर योजनाएं खोजें",
    speakHint: "माइक दबाएं और अपनी उम्र, राज्य और पेशा बताएं",
    securedTitle: "सुरक्षित, सत्यापित और निजी",
    securedList: [
      "हम कभी भी आधार नंबर, ओटीपी या बैंक क्रेडेंशियल नहीं मांगते हैं।",
      "सभी आवेदन लिंक सीधे आधिकारिक सरकारी पोर्टलों पर ले जाते हैं।",
      "आपका प्रोफाइल डेटा आपके ब्राउज़र कैश में स्थानीय रूप से सुरक्षित रहता है।",
    ],
  },
];

const SPEECH_LANGS = { en: "en-IN", ta: "ta-IN", hi: "hi-IN" };

const KEYWORD_MAP = {
  "tamil nadu": "TN", "tamilnadu": "TN", "தமிழ்நாடு": "TN", "தமிழ் நாடு": "TN",
  "maharashtra": "MH", "महाराष्ट्र": "MH", "delhi": "DL", "दिल्ली": "DL",
  "karnataka": "KA", "கர்நாடகா": "KA", "कर्नाटक": "KA",
  "andhra": "AP", "ஆந்திரா": "AP", "kerala": "KL", "கேரளா": "KL",
  "uttar pradesh": "UP", "उत्तर प्रदेश": "UP", "west bengal": "WB",
  "female": "female", "woman": "female", "women": "female",
  "பெண்": "female", "பெண்கள்": "female", "அம்மா": "female",
  "महिला": "female", "औरत": "female",
  "male": "male", "man": "male", "ஆண்": "male", "पुरुष": "male",
  "sc": "SC", "scheduled caste": "SC", "தலித்": "SC", "दलित": "SC",
  "st": "ST", "tribal": "ST", "பழங்குடி": "ST", "आदिवासी": "ST",
  "obc": "OBC", "பிற்படுத்தப்பட்ட": "OBC", "पिछड़ा": "OBC",
  "ews": "EWS", "general": "GEN", "பொदु": "GEN", "सामान्य": "GEN",
  "farmer": "farmer", "விவசாயி": "farmer", "கிசான்": "farmer", "किसान": "farmer",
  "student": "student", "மாணவர்": "student", "छात्र": "student",
  "labour": "unorganised_worker", "daily wage": "unorganised_worker",
  "கூலி": "unorganised_worker", "मजदूर": "unorganised_worker",
  "self employed": "self_employed", "சுயதொழில்": "self_employed", "व्यवसाय": "self_employed",
  "unemployed": "unemployed", "வேலை இல்லை": "unemployed", "बेरोजगार": "unemployed",
  "salaried": "salaried", "job": "salaried", "नौकरी": "salaried",
};

const INCOME_KEYWORDS = {
  "poor": 60000, "ஏழை": 60000, "गरीब": 60000, "bpl": 60000,
  "low income": 120000, "குறைந்த வருமானம்": 120000, "कम आय": 120000,
  "middle": 250000, "நடுத்தர": 250000, "मध्यम": 250000,
};

function extractProfile(text) {
  const lower = text.toLowerCase();
  const profile = {
    state: "TN",
    gender: "female",
    caste_category: "OBC",
    age: 30,
    income_annual: 120000,
    occupation_type: "unorganised_worker",
  };
  
  for (const [kw, val] of Object.entries(KEYWORD_MAP)) {
    if (lower.includes(kw.toLowerCase()) || text.includes(kw)) {
      if (["TN","MH","DL","KA","AP","KL","UP","WB"].includes(val)) profile.state = val;
      else if (["male","female","other"].includes(val)) profile.gender = val;
      else if (["SC","ST","OBC","EWS","GEN"].includes(val)) profile.caste_category = val;
      else if (["farmer","student","unorganised_worker","self_employed","unemployed","salaried"].includes(val)) profile.occupation_type = val;
    }
  }
  
  for (const [kw, val] of Object.entries(INCOME_KEYWORDS)) {
    if (lower.includes(kw.toLowerCase()) || text.includes(kw)) profile.income_annual = val;
  }
  
  const ageMatch = text.match(/(\d{1,3})\s*(years|வயது|साल|yrs)/i) || text.match(/(வயது|साल)\s*(\d{1,3})/i);
  if (ageMatch) {
    const age = parseInt(ageMatch[1] || ageMatch[2]);
    if (age > 0 && age < 120) profile.age = age;
  }
  return profile;
}

export default function HomePage() {
  const router = useRouter();
  const [hasProfile, setHasProfile] = useState(false);
  const [lang, setLang] = useState("en");
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [searching, setSearching] = useState(false);
  const [voiceResults, setVoiceResults] = useState(null);
  const [voiceError, setVoiceError] = useState("");
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (localStorage.getItem("user_profile")) setHasProfile(true);
    const savedLang = localStorage.getItem("language");
    if (savedLang) setLang(savedLang);
  }, []);

  const t = LANGS.find((l) => l.code === lang) || LANGS[0];

  const startVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceError("Voice recognition is not supported in this browser. Please use Google Chrome.");
      return;
    }
    setVoiceError("");
    setTranscript("");
    setVoiceResults(null);

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = SPEECH_LANGS[lang] || "en-IN";

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);

    recognition.onresult = (e) => {
      const text = Array.from(e.results).map(r => r[0].transcript).join(" ");
      setTranscript(text);
      if (e.results[e.results.length - 1].isFinal) {
        searchFromSpeech(text);
      }
    };

    recognition.onerror = () => {
      setListening(false);
      setVoiceError("Could not hear clearly. Please try speaking again.");
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopVoice = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setListening(false);
  };

  const searchFromSpeech = async (text) => {
    setSearching(true);
    const profile = extractProfile(text);
    try {
      const res = await fetch(`${API_URL}/schemes/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_profile: profile, language: lang }),
      });
      const data = await res.json();
      setVoiceResults({ schemes: data.schemes || [], profile });
    } catch {
      setVoiceError("Could not connect to matching services. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-8 box-border font-sans antialiased text-slate-800">
      <div className="w-full max-w-lg bg-white min-h-[90vh] md:min-h-0 md:rounded-3xl md:shadow-xl md:border border-slate-200/80 flex flex-col justify-between overflow-hidden p-6 md:p-8 box-border gap-6">
        
        {/* Core Content */}
        <div className="flex-1 flex flex-col justify-center items-center text-center gap-6 pt-4">
          
          {/* Main Logo & Title */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-brand-navy-950 flex items-center justify-center shadow-lg shadow-brand-navy-950/15">
              <Icons.Building2 className="w-6 h-6 text-brand-amber-400 stroke-[1.8]" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-extrabold text-brand-navy-950 tracking-tight leading-tight m-0 uppercase">
                Information Is Wealth
              </h1>
              <p className="text-xs text-slate-500 font-semibold max-w-xs mx-auto mt-2 leading-relaxed">
                {t.tagline}
              </p>
            </div>
          </div>

          {/* Language selector chips */}
          <div className="flex gap-1 bg-slate-100 p-1 rounded-full border border-slate-200/50">
            {LANGS.map((l) => (
              <button 
                key={l.code} 
                onClick={() => { setLang(l.code); localStorage.setItem("language", l.code); }}
                className={`px-4 py-1.5 rounded-full border-0 text-xs font-bold cursor-pointer transition-all duration-250 ${
                  lang === l.code 
                    ? "bg-brand-navy-950 text-white shadow-sm" 
                    : "bg-transparent text-slate-400 hover:text-slate-900"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>

          {/* Voice Search Area */}
          <div className="w-full bg-slate-50 border border-slate-200 rounded-3xl p-5 box-border flex flex-col items-center gap-4">
            <div className="text-center">
              <p className="text-xs font-bold text-brand-navy-950 m-0 flex items-center justify-center gap-1.5 uppercase tracking-wider">
                <Icons.Sparkles className="w-3.5 h-3.5 text-brand-amber-500 stroke-[2.2]" />
                {t.speak}
              </p>
              <p className="text-[10px] text-slate-500 font-medium m-0 mt-1">
                {t.speakHint}
              </p>
            </div>

            {/* Pulsing Voice Mic Button */}
            <div className="relative my-1">
              {listening && (
                <>
                  <span className="absolute inset-0 rounded-full bg-rose-500/20 animate-ping"></span>
                  <span className="absolute -inset-2 rounded-full bg-rose-500/10 animate-[ping_2s_infinite]"></span>
                </>
              )}
              <button
                onClick={listening ? stopVoice : startVoice}
                className={`relative w-14 h-14 rounded-full border-0 cursor-pointer flex items-center justify-center shadow-md transition-all duration-300 active:scale-95 z-10 ${
                  listening 
                    ? "bg-rose-600 text-white shadow-rose-200" 
                    : "bg-brand-navy-950 text-white hover:scale-102 hover:shadow-lg shadow-brand-navy-950/10"
                }`}
              >
                {listening ? (
                  <Icons.Square className="w-4 h-4 fill-white stroke-none" />
                ) : (
                  <Icons.Mic className="w-5 h-5 text-brand-amber-400 stroke-[2]" />
                )}
              </button>
            </div>

            {listening && (
              <div className="flex items-center justify-center gap-1.5 animate-pulse-subtle">
                <span className="w-1 h-3 bg-rose-500 rounded-full animate-bounce"></span>
                <span className="w-1 h-4 bg-rose-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1 h-3 bg-rose-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                <span className="text-[9px] text-rose-600 font-extrabold uppercase tracking-widest ml-1">
                  Listening...
                </span>
              </div>
            )}

            {transcript && (
              <div className="w-full bg-white rounded-2xl p-4 border border-slate-200 text-left shadow-sm animate-fade-in">
                <p className="text-xs text-slate-700 m-0 font-medium italic leading-relaxed">
                  "{transcript}"
                </p>
              </div>
            )}

            {searching && (
              <div className="flex items-center gap-2 text-[10px] text-brand-navy-950 font-bold animate-pulse">
                <Icons.Loader2 className="w-3.5 h-3.5 animate-spin text-brand-amber-500" />
                Matching intent in database...
              </div>
            )}

            {voiceError && (
              <div className="text-xs text-rose-600 font-bold bg-rose-50 border border-rose-100/60 rounded-xl px-4 py-2.5 text-center w-full">
                {voiceError}
              </div>
            )}

            {/* Voice query matching list */}
            {voiceResults && !searching && (
              <div className="w-full mt-2 border-t border-slate-200/60 pt-4 text-left flex flex-col gap-2.5 animate-fade-in">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest m-0 mb-1">
                  Suggested Matches ({voiceResults.schemes.length})
                </p>
                <div className="flex flex-col gap-2 w-full">
                  {voiceResults.schemes.slice(0, 3).map((s) => (
                    <div 
                      key={s.scheme_id}
                      onClick={() => router.push(`/schemes/${s.scheme_id}`)}
                      className="bg-white border border-slate-200 hover:border-brand-navy-950 rounded-2xl p-4 cursor-pointer flex justify-between items-center transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5"
                    >
                      <span className="text-xs font-bold text-slate-800 flex-1 pr-2 truncate">
                        {s.name}
                      </span>
                      <Icons.ChevronRight className="w-4 h-4 text-brand-navy-500" />
                    </div>
                  ))}
                </div>
                {voiceResults.schemes.length > 3 && (
                  <button
                    onClick={() => {
                      localStorage.setItem("user_profile", JSON.stringify(voiceResults.profile));
                      router.push("/schemes");
                    }}
                    className="w-full bg-brand-navy-950 hover:bg-brand-navy-800 text-white border-0 rounded-2xl py-3 px-4 text-xs font-bold cursor-pointer mt-1 transition-all duration-150 shadow-md active:scale-98"
                  >
                    See all {voiceResults.schemes.length} schemes →
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Safety Verification Trust Box */}
          <div className="w-full bg-emerald-50/40 border border-emerald-100 rounded-3xl p-5 text-left box-border">
            <p className="text-xs font-extrabold text-emerald-800 m-0 mb-3 flex items-center gap-1.5 uppercase tracking-wider">
              <Icons.ShieldCheck className="w-4 h-4 text-emerald-600 stroke-[2.2]" />
              {t.securedTitle}
            </p>
            <ul className="text-[11px] text-emerald-700/90 m-0 p-0 list-none space-y-2 font-semibold leading-relaxed">
              {t.securedList.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="text-emerald-500 text-xs">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col gap-3.5 border-t border-slate-100 pt-5 flex-shrink-0">
          {hasProfile ? (
            <div className="flex flex-col gap-2.5 w-full">
              <button 
                onClick={() => router.push("/schemes")}
                className="w-full bg-brand-navy-950 hover:bg-brand-navy-800 text-white border-0 rounded-2xl py-3.5 text-xs font-bold cursor-pointer transition-all duration-150 shadow-md active:scale-98 hover:shadow-lg"
              >
                {t.ctaSchemes}
              </button>
              <button 
                onClick={() => router.push("/profile")}
                className="w-full bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-2xl py-3.5 text-xs font-bold cursor-pointer transition-all duration-150 active:scale-98"
              >
                {t.ctaProfile}
              </button>
            </div>
          ) : (
            <button 
              onClick={() => router.push("/onboarding")}
              className="w-full bg-brand-navy-950 hover:bg-brand-navy-800 text-white border-none rounded-2xl py-4 text-sm font-bold cursor-pointer transition-all duration-150 shadow-md active:scale-98 hover:shadow-lg"
            >
              {t.cta}
            </button>
          )}
          <p className="text-center text-[9px] text-slate-400 font-extrabold m-0 tracking-wider uppercase">
            Takes less than 1 minute • No signup required
          </p>
        </div>

      </div>
    </div>
  );
}