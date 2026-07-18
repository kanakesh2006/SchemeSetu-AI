-- Connect to Supabase or your Postgres instance and run this
-- to initialize your database schema.

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS schemes (
    scheme_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    name_ta TEXT,
    name_hi TEXT,
    ministry TEXT,
    benefit_type TEXT,
    benefit_amount INTEGER,
    benefit_frequency TEXT,
    applicable_states TEXT[],
    gender TEXT,
    caste_categories TEXT[],
    min_age INTEGER,
    max_age INTEGER,
    max_income INTEGER,
    occupation_types TEXT[],
    documents_required TEXT[],
    application_url TEXT,
    application_deadline DATE,
    is_rolling BOOLEAN DEFAULT TRUE,
    verified_at DATE,
    embedding vector(768),
    active BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS schemes_embedding_idx ON schemes USING hnsw (embedding vector_cosine_ops);

-- Hardcoded Scheme Inserts

INSERT INTO schemes (
    scheme_id, name, ministry, benefit_type, benefit_amount, 
    applicable_states, gender, caste_categories, 
    min_age, max_age, occupation_types, documents_required, 
    application_url, is_rolling, active
) VALUES
('pm-kisan', 'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)', 'Ministry of Agriculture and Farmers Welfare', 'cash_transfer', 6000, 
 ARRAY['All'], 'any', ARRAY['All'], 18, 100, ARRAY['farmer'], ARRAY['Aadhaar Card', 'Bank Account Details', 'Land Holding Papers'], 
 'https://pmkisan.gov.in/', TRUE, TRUE)
ON CONFLICT (scheme_id) DO NOTHING;

INSERT INTO schemes (
    scheme_id, name, ministry, benefit_type, benefit_amount, 
    applicable_states, gender, caste_categories, 
    min_age, max_age, occupation_types, documents_required, 
    application_url, is_rolling, active
) VALUES
('ab-pmjay', 'Ayushman Bharat Pradhan Mantri Jan Arogya Yojana (AB-PMJAY)', 'Ministry of Health and Family Welfare', 'insurance', 500000, 
 ARRAY['All'], 'any', ARRAY['All'], 0, 100, ARRAY['unorganised_worker', 'unemployed'], ARRAY['Aadhaar Card', 'Ration Card'], 
 'https://mera.pmjay.gov.in/', TRUE, TRUE)
ON CONFLICT (scheme_id) DO NOTHING;

INSERT INTO schemes (
    scheme_id, name, ministry, benefit_type, benefit_amount, 
    applicable_states, gender, caste_categories, 
    min_age, max_age, occupation_types, documents_required, 
    application_url, is_rolling, active
) VALUES
('pmay-g', 'Pradhan Mantri Awas Yojana - Gramin (PMAY-G)', 'Ministry of Rural Development', 'housing', 120000, 
 ARRAY['All'], 'any', ARRAY['All'], 18, 100, ARRAY['All'], ARRAY['Aadhaar Card', 'Job Card', 'Bank Account Details'], 
 'https://pmayg.nic.in/', TRUE, TRUE)
ON CONFLICT (scheme_id) DO NOTHING;

INSERT INTO schemes (
    scheme_id, name, ministry, benefit_type, benefit_amount,
    applicable_states, gender, caste_categories,
    min_age, max_age, occupation_types, documents_required,
    application_url, is_rolling, active
) VALUES
('mgnrega', 'Mahatma Gandhi National Rural Employment Guarantee Act (MGNREGA)', 'Ministry of Rural Development', 'employment', NULL,
 ARRAY['All'], 'any', ARRAY['All'], 18, 100, ARRAY['unemployed', 'unorganised_worker'], ARRAY['Aadhaar Card', 'Bank Account Details', 'Photograph'],
 'https://nrega.nic.in/', TRUE, TRUE)
ON CONFLICT (scheme_id) DO NOTHING;

INSERT INTO schemes (
    scheme_id, name, ministry, benefit_type, benefit_amount,
    applicable_states, gender, caste_categories,
    min_age, max_age, occupation_types, documents_required,
    application_url, is_rolling, active
) VALUES
('ssy', 'Sukanya Samriddhi Yojana (SSY)', 'Ministry of Finance', 'saving', NULL,
 ARRAY['All'], 'female', ARRAY['All'], 0, 10, ARRAY['All'], ARRAY['Birth Certificate of Girl Child', 'Identity Proof of Parent', 'Address Proof'],
 'https://www.nsiindia.gov.in/', TRUE, TRUE)
ON CONFLICT (scheme_id) DO NOTHING;

INSERT INTO schemes (
    scheme_id, name, ministry, benefit_type, benefit_amount,
    applicable_states, gender, caste_categories,
    min_age, max_age, occupation_types, documents_required,
    application_url, is_rolling, active
) VALUES
('apy', 'Atal Pension Yojana (APY)', 'Ministry of Finance', 'pension', 5000,
 ARRAY['All'], 'any', ARRAY['All'], 18, 40, ARRAY['unorganised_worker', 'self_employed'], ARRAY['Aadhaar Card', 'Savings Bank Account'],
 'https://www.pfrda.org.in/', TRUE, TRUE)
ON CONFLICT (scheme_id) DO NOTHING;


-- Center Locator Table & Seed Data

CREATE TABLE IF NOT EXISTS centers (
    center_id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'csc' or 'post_office'
    address TEXT NOT NULL,
    state TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    phone_number TEXT,
    working_hours TEXT,
    CONSTRAINT centers_unique_name_coords UNIQUE (name, latitude, longitude)
);

INSERT INTO centers (name, type, address, state, latitude, longitude, phone_number, working_hours) VALUES
('Chennai GPO (India Post)', 'post_office', 'Rajaji Salai, George Town, Chennai', 'TN', 13.0899, 80.2872, '044-25220031', '9:00 AM - 6:00 PM'),
('CSC E-Sevai Centre George Town', 'csc', 'No 12, Armenian St, Chennai', 'TN', 13.0885, 80.2835, '9876543210', '10:00 AM - 5:00 PM'),
('CSC E-Sevai Centre Nungambakkam', 'csc', 'Corporation Building, College Rd, Nungambakkam, Chennai', 'TN', 13.0612, 80.2461, '9876543211', '10:00 AM - 5:00 PM'),
('Mumbai GPO (India Post)', 'post_office', 'Chhatrapati Shivaji Maharaj Terminus Area, Fort, Mumbai', 'MH', 18.9401, 72.8358, '022-22621671', '9:00 AM - 6:00 PM'),
('CSC Digital Seva Centre Andheri', 'csc', 'Shop 4, J.P. Road, Andheri West, Mumbai', 'MH', 19.1202, 72.8465, '9876543212', '10:00 AM - 6:00 PM'),
('Bengaluru GPO (India Post)', 'post_office', 'Raj Bhawan Road, Bengaluru', 'KA', 12.9818, 77.5952, '080-22262330', '9:00 AM - 6:00 PM'),
('CSC Common Service Center Indiranagar', 'csc', '12th Main Road, Indiranagar, Bengaluru', 'KA', 12.9718, 77.6412, '9876543213', '10:00 AM - 6:00 PM'),
('New Delhi GPO (India Post)', 'post_office', 'Ashoka Road, Connaught Place, New Delhi', 'DL', 28.6273, 77.2144, '011-23363385', '9:00 AM - 6:00 PM'),
('CSC Digital Center Connaught Place', 'csc', 'Super Bazar, Connaught Circus, New Delhi', 'DL', 28.6315, 77.2198, '9876543214', '10:00 AM - 5:00 PM'),
('CSC Seva Center Lucknow', 'csc', 'Hazratganj, Lucknow', 'UP', 26.8467, 80.9462, '9876543215', '10:00 AM - 5:00 PM'),
('Hazratganj Post Office', 'post_office', 'Hazratganj, Lucknow', 'UP', 26.8502, 80.9441, '0522-2622415', '9:00 AM - 5:00 PM')
ON CONFLICT (name, latitude, longitude) DO NOTHING;


