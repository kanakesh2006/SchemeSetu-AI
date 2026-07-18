MOCK_SCHEMES = [
    {
        "scheme_id": "pm-kisan",
        "name": "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
        "name_ta": "பிரதம மந்திரி கிசான் சம்மான் நிதி (PM-KISAN)",
        "name_hi": "प्रधानमंत्री किसान सम्मान निधि (PM-KISAN)",
        "ministry": "Ministry of Agriculture and Farmers Welfare",
        "benefit_type": "cash_transfer",
        "benefit_amount": 6000,
        "benefit_frequency": "annual",
        "applicable_states": ["All"],
        "gender": "any",
        "caste_categories": ["All"],
        "min_age": 18,
        "max_age": 100,
        "max_income": None,
        "occupation_types": ["farmer"],
        "documents_required": ["Aadhaar Card", "Bank Account Details", "Land Holding Papers"],
        "application_url": "https://pmkisan.gov.in/",
        "application_deadline": None,
        "is_rolling": True,
        "verified_at": "2026-05-28",
        "active": True
    },
    {
        "scheme_id": "ab-pmjay",
        "name": "Ayushman Bharat Pradhan Mantri Jan Arogya Yojana (AB-PMJAY)",
        "name_ta": "ஆயுஷ்மான் பாரத் பிரதம மந்திரி ஜன் ஆரோக்யா யோஜனா (AB-PMJAY)",
        "name_hi": "आयुष्मान भारत प्रधानमंत्री जन आरोग्य योजना (AB-PMJAY)",
        "ministry": "Ministry of Health and Family Welfare",
        "benefit_type": "insurance",
        "benefit_amount": 500000,
        "benefit_frequency": "annual",
        "applicable_states": ["All"],
        "gender": "any",
        "caste_categories": ["All"],
        "min_age": 0,
        "max_age": 100,
        "max_income": None,
        "occupation_types": ["unorganised_worker", "unemployed"],
        "documents_required": ["Aadhaar Card", "Ration Card"],
        "application_url": "https://mera.pmjay.gov.in/",
        "application_deadline": None,
        "is_rolling": True,
        "verified_at": "2026-05-28",
        "active": True
    },
    {
        "scheme_id": "pmay-g",
        "name": "Pradhan Mantri Awas Yojana - Gramin (PMAY-G)",
        "name_ta": "பிரதம மந்திரி ஆவாஸ் யோஜனா - கிராமின் (PMAY-G)",
        "name_hi": "प्रधानमंत्री आवास योजना - ग्रामीण (PMAY-G)",
        "ministry": "Ministry of Rural Development",
        "benefit_type": "housing",
        "benefit_amount": 120000,
        "benefit_frequency": "one-time",
        "applicable_states": ["All"],
        "gender": "any",
        "caste_categories": ["All"],
        "min_age": 18,
        "max_age": 100,
        "max_income": None,
        "occupation_types": ["All"],
        "documents_required": ["Aadhaar Card", "Job Card", "Bank Account Details"],
        "application_url": "https://pmayg.nic.in/",
        "application_deadline": None,
        "is_rolling": True,
        "verified_at": "2026-05-28",
        "active": True
    },
    {
        "scheme_id": "mgnrega",
        "name": "Mahatma Gandhi National Rural Employment Guarantee Act (MGNREGA)",
        "name_ta": "மகாத்மா காந்தி தேசிய ஊரக வேலை உறுதி சட்டம் (MGNREGA)",
        "name_hi": "महात्मा गांधी राष्ट्रीय ग्रामीण रोजगार गारंटी अधिनियम (MGNREGA)",
        "ministry": "Ministry of Rural Development",
        "benefit_type": "employment",
        "benefit_amount": None,
        "benefit_frequency": "one-time",
        "applicable_states": ["All"],
        "gender": "any",
        "caste_categories": ["All"],
        "min_age": 18,
        "max_age": 100,
        "max_income": None,
        "occupation_types": ["unemployed", "unorganised_worker"],
        "documents_required": ["Aadhaar Card", "Bank Account Details", "Photograph"],
        "application_url": "https://nrega.nic.in/",
        "application_deadline": None,
        "is_rolling": True,
        "verified_at": "2026-05-28",
        "active": True
    },
    {
        "scheme_id": "ssy",
        "name": "Sukanya Samriddhi Yojana (SSY)",
        "name_ta": "சுகன்யா சம்ரித்தி யோஜனா (SSY)",
        "name_hi": "सुकन्या समृद्धि योजना (SSY)",
        "ministry": "Ministry of Finance",
        "benefit_type": "savings_scheme",
        "benefit_amount": None,
        "benefit_frequency": "one-time",
        "applicable_states": ["All"],
        "gender": "female",
        "caste_categories": ["All"],
        "min_age": 0,
        "max_age": 10,
        "max_income": None,
        "occupation_types": ["All"],
        "documents_required": ["Birth Certificate of Girl Child", "Identity Proof of Parent", "Address Proof"],
        "application_url": "https://www.nsiindia.gov.in/",
        "application_deadline": None,
        "is_rolling": True,
        "verified_at": "2026-05-28",
        "active": True
    },
    {
        "scheme_id": "apy",
        "name": "Atal Pension Yojana (APY)",
        "name_ta": "அடல் பென்ஷன் யோஜனா (APY)",
        "name_hi": "अटल पेंशन योजना (APY)",
        "ministry": "Ministry of Finance",
        "benefit_type": "insurance",
        "benefit_amount": 5000,
        "benefit_frequency": "monthly",
        "applicable_states": ["All"],
        "gender": "any",
        "caste_categories": ["All"],
        "min_age": 18,
        "max_age": 40,
        "max_income": None,
        "occupation_types": ["unorganised_worker", "self_employed"],
        "documents_required": ["Aadhaar Card", "Savings Bank Account"],
        "application_url": "https://www.pfrda.org.in/",
        "application_deadline": None,
        "is_rolling": True,
        "verified_at": "2026-05-28",
        "active": True
    }
]

import math

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great-circle distance between two points
    on the Earth in kilometers.
    """
    R = 6371.0  # Radius of the Earth in km
    
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    
    a = (math.sin(dlat / 2) ** 2 + 
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * 
         math.sin(dlon / 2) ** 2)
         
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

MOCK_CENTERS = [
    {
        "center_id": 1,
        "name": "Chennai GPO (India Post)",
        "type": "post_office",
        "address": "Rajaji Salai, George Town, Chennai",
        "state": "TN",
        "latitude": 13.0899,
        "longitude": 80.2872,
        "phone_number": "044-25220031",
        "working_hours": "9:00 AM - 6:00 PM"
    },
    {
        "center_id": 2,
        "name": "CSC E-Sevai Centre George Town",
        "type": "csc",
        "address": "No 12, Armenian St, Chennai",
        "state": "TN",
        "latitude": 13.0885,
        "longitude": 80.2835,
        "phone_number": "9876543210",
        "working_hours": "10:00 AM - 5:00 PM"
    },
    {
        "center_id": 3,
        "name": "CSC E-Sevai Centre Nungambakkam",
        "type": "csc",
        "address": "Corporation Building, College Rd, Nungambakkam, Chennai",
        "state": "TN",
        "latitude": 13.0612,
        "longitude": 80.2461,
        "phone_number": "9876543211",
        "working_hours": "10:00 AM - 5:00 PM"
    },
    {
        "center_id": 4,
        "name": "Mumbai GPO (India Post)",
        "type": "post_office",
        "address": "Chhatrapati Shivaji Maharaj Terminus Area, Fort, Mumbai",
        "state": "MH",
        "latitude": 18.9401,
        "longitude": 72.8358,
        "phone_number": "022-22621671",
        "working_hours": "9:00 AM - 6:00 PM"
    },
    {
        "center_id": 5,
        "name": "CSC Digital Seva Centre Andheri",
        "type": "csc",
        "address": "Shop 4, J.P. Road, Andheri West, Mumbai",
        "state": "MH",
        "latitude": 19.1202,
        "longitude": 72.8465,
        "phone_number": "9876543212",
        "working_hours": "10:00 AM - 6:00 PM"
    },
    {
        "center_id": 6,
        "name": "Bengaluru GPO (India Post)",
        "type": "post_office",
        "address": "Raj Bhawan Road, Bengaluru",
        "state": "KA",
        "latitude": 12.9818,
        "longitude": 77.5952,
        "phone_number": "080-22262330",
        "working_hours": "9:00 AM - 6:00 PM"
    },
    {
        "center_id": 7,
        "name": "CSC Common Service Center Indiranagar",
        "type": "csc",
        "address": "12th Main Road, Indiranagar, Bengaluru",
        "state": "KA",
        "latitude": 12.9718,
        "longitude": 77.6412,
        "phone_number": "9876543213",
        "working_hours": "10:00 AM - 6:00 PM"
    },
    {
        "center_id": 8,
        "name": "New Delhi GPO (India Post)",
        "type": "post_office",
        "address": "Ashoka Road, Connaught Place, New Delhi",
        "state": "DL",
        "latitude": 28.6273,
        "longitude": 77.2144,
        "phone_number": "011-23363385",
        "working_hours": "9:00 AM - 6:00 PM"
    },
    {
        "center_id": 9,
        "name": "CSC Digital Center Connaught Place",
        "type": "csc",
        "address": "Super Bazar, Connaught Circus, New Delhi",
        "state": "DL",
        "latitude": 28.6315,
        "longitude": 77.2198,
        "phone_number": "9876543214",
        "working_hours": "10:00 AM - 5:00 PM"
    },
    {
        "center_id": 10,
        "name": "CSC Seva Center Lucknow",
        "type": "csc",
        "address": "Hazratganj, Lucknow",
        "state": "UP",
        "latitude": 26.8467,
        "longitude": 80.9462,
        "phone_number": "9876543215",
        "working_hours": "10:00 AM - 5:00 PM"
    },
    {
        "center_id": 11,
        "name": "Hazratganj Post Office",
        "type": "post_office",
        "address": "Hazratganj, Lucknow",
        "state": "UP",
        "latitude": 26.8502,
        "longitude": 80.9441,
        "phone_number": "0522-2622415",
        "working_hours": "9:00 AM - 5:00 PM"
    }
]

