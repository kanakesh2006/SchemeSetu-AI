# Government Welfare Schemes - Platform Features

This document provides a detailed, non-technical overview of the user-facing features and functionalities of the **Government Welfare Schemes** platform.

---

## 1. Privacy-First Local Profile System
To ensure user safety and trust, the application does not store any personal, demographic, or financial information on external servers.
* **Zero Registration:** Users can access the platform instantly. There are no registration forms, usernames, passwords, email verifications, or mobile OTP requirements.
* **Device-Only Storage:** All profile criteria (such as your age, state, gender, income, caste, and occupation) are saved directly in your web browser's local cache. As soon as you clear your browser history or profile data, it is permanently wiped.
* **Sensitive Data Protection:** The system explicitly guarantees that it will never ask for sensitive identifiers like Aadhaar numbers, bank account details, or security PINs.
* **Stepped Onboarding Flow:** A simple, conversational questionnaire wizard guides you through setting up your profile step-by-step using large, user-friendly buttons and progress indicators.

---

## 2. Interactive Schemes Matching Dashboard
Once you complete your profile, the platform generates a personalized catalog of welfare schemes you qualify for.
* **Automatic Compatibility Assessment:** The dashboard compares your profile demographics against a wide matrix of government rules (such as state-specific residency, gender eligibility, age limits, caste categories, income caps, and occupation types) to filter out schemes you cannot apply for.
* **Smart Relevance Ranking:** Schemes are automatically sorted so that the most relevant ones are positioned at the top. Programs that match your profile traits with the highest specificity (e.g. a program specifically for "female farmers in Tamil Nadu") appear first, followed by general schemes. Under matching conditions, schemes offering the highest financial benefits are prioritized.
* **Status Tags:** Active matching schemes feature clear indicators, such as a green "Open Now" label for schemes with rolling application dates.
* **Structured Details Panel:** Clicking on any matched scheme opens a clean, well-spaced details drawer containing:
  * The administering Ministry or Department.
  * Precise benefit amounts (e.g. annual, monthly, or one-time cash transfers).
  * A clear checklist of required documents (e.g. Caste Certificate, Land holding papers, Bank passbook).
  * Direct official links to submit your application.
* **"Why Am I Not Eligible?" Explainer:** If you look up a scheme that you do not qualify for, the system lists the exact reasons why (for example: *"Your annual income is higher than the allowed limit"* or *"This scheme is only for residents of Karnataka"*).

---

## 3. Natural Language Search (AI Concept Search)
Instead of forcing users to guess the exact name of a welfare program, the search engine allows users to query using normal, conversational language.
* **Intent-Based Matching:** You can describe your situation in your own words (e.g., *"I am a poor student from Maharashtra who needs help paying for college"* or *"financial assistance for small agricultural farmers"*).
* **Concept Understanding:** The search engine understands context and synonyms. It will fetch relevant matching schemes even if the name of the scheme doesn't contain the specific words you typed in.
* **Match Similarity Percentage:** Each search result displays a calculated match score (e.g., "🎯 92% Match") so you can see how closely a scheme fits your search description.

---

## 4. Live Nearest Assistance Finder Map
Many users need in-person help to fill out online welfare applications. The platform includes a visual locator map to find the nearest physical support centers.
* **Device GPS Auto-Location:** The app requests permission to locate your device and automatically centers the map around your physical coordinates.
* **20km Radius Support Hubs:** It scans and loads all registered support points within a 20-kilometer radius around you, categorized into:
  * **E-Sevai / Common Service Centres (CSCs):** Local digital booths where operators can assist you in submitting online government forms.
  * **India Post Offices:** Local post office branches that handle physical application submissions.
* **Interactive Leaflet Map Pins:**
  * Displays a full-screen, responsive map with unique, color-coded badges (e.g. a pulsing circle for your location, laptop icon for CSCs, envelope icon for Post Offices).
  * Clicking any map pin displays the center's name, precise address, operational working hours, distance in kilometers, and contact numbers.
  * Includes a direct **"Get Directions"** button to open the route on Google Maps.
* **Testing Coordinates Fallback:** If you are testing from an area where no official database centers are currently registered within 20km, the finder automatically places simulated local CSC and Post Office branches nearby so you can test map navigation.
* **Crowdsourced Submissions:** Users can register new assistance centers they know about by filling out a quick name/address form and clicking directly on the map to drop a pin.

---

## 5. Conversational AI Counselor (Multilingual Companion)
A friendly conversational counselor helps you navigate complex government processes.
* **Context-Aware Chat:** The chat counselor acts like a personal caseworker. It automatically checks your saved local profile so you don't have to repeat your age, state, or occupation during the chat.
* **Voice-Enabled Options:** Includes audio capabilities, allowing you to tap a microphone and speak your query instead of typing it.
* **Full Translation Support:** The entire chatbot interface, pre-filled prompts, and conversational responses adapt instantly to your selected language: **English**, **Tamil (தமிழ்)**, or **Hindi (हिंदी)**.
* **Layout Adaptability:** The chat layout is designed to remain out of your way. On desktop screens, it is nested as a persistent split-pane counselor. On mobile screens, it acts as a floating action button that slides up into a full-screen drawer when tapped.

---

## 6. Background Government Portal Sync
To make sure scheme rules and guidelines are never outdated, the system runs an automated sync pipeline.
* **Direct Official Sourcing:** The application syncs with **https://www.myscheme.gov.in** (the official national portal for government schemes).
* **Live Update Registry:** Pulls fresh updates, updates eligibility rules, checks document checklists, and updates vector indexes so that search results remain accurate.
