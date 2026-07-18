"""
Scraper for https://www.myscheme.gov.in
Fetches ALL scheme listings and full details, extracting maximum data.

Usage:
    python scrapers/myscheme.py
"""

from curl_cffi import requests
import json
import time
import os
import re
from datetime import datetime

API_KEY = "tYTy5eEhlu9rFjyxuCr7ra7ACp4dv1RH8gWuHTDc"
BASE_URL = "https://api.myscheme.gov.in/search/v6/schemes"
DETAIL_URL = "https://api.myscheme.gov.in/schemes/v6/public/schemes"
OUTPUT_DIR = "scrapers/output"

HEADERS = {
    "x-api-key": API_KEY,
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Origin": "https://www.myscheme.gov.in",
    "Referer": "https://www.myscheme.gov.in/"
}


def extract_benefit_amount(text):
    """Use regex to find benefit amounts from text."""
    if not text:
        return None
    # Match patterns like Rs. 6,000 or INR 6000 or Rs 2,00,000
    matches = re.findall(r'(?:Rs\.?|INR|Amount)\s*([0-9,]+(?:\.\d+)?)', text, re.IGNORECASE)
    if not matches:
        matches = re.findall(r'([0-9,]+(?:\.\d+)?)\s*(?:per\s+(?:month|annum|year)|p\.a\.|/-)', text)
    if matches:
        amounts = []
        for m in matches:
            cleaned = m.replace(",", "").split(".")[0]
            if cleaned.isdigit() and int(cleaned) > 0:
                amounts.append(int(cleaned))
        if amounts:
            return max(amounts)
    return None


def extract_demographics(desc_text, elig_text, tags=None, brief=""):
    """Extract gender, caste, age, income, occupations from combined text."""
    combined = " ".join(filter(None, [desc_text, elig_text, brief])).lower()
    tag_text = " ".join(tags).lower() if tags else ""
    full = combined + " " + tag_text

    # 1. Gender
    gender = "any"
    female_kw = re.search(r'\bfemale\b|\bwomen\b|\bgirl\b|\bwidow\b|\bmother\b|\blady\b|\bmahila\b', full)
    male_kw = re.search(r'\b(?:male|men)\b', full) and not re.search(r'\bfemale\b|\bwomen\b', full)
    if female_kw and not male_kw:
        gender = "female"
    elif male_kw and not female_kw:
        gender = "male"

    # 2. Caste
    castes = []
    if re.search(r'\bsc\b|\bscheduled\s+caste', full):
        castes.append("SC")
    if re.search(r'\bst\b|\bscheduled\s+tribe', full):
        castes.append("ST")
    if re.search(r'\bobc\b|\bother\s+backward', full):
        castes.append("OBC")
    if re.search(r'\bews\b|\beconomically\s+weaker', full):
        castes.append("EWS")
    if re.search(r'\bgeneral\s+category\b|\bgen\s+cat', full):
        castes.append("GEN")
    if not castes:
        castes = ["GEN", "OBC", "SC", "ST", "EWS"]

    # 3. Age - look for multiple patterns
    min_age = None
    max_age = None
    # "18 to 35 years" / "18-35 years"
    age_range = re.search(r'(\d{1,2})\s*(?:to|-)\s*(\d{1,3})\s*years', full)
    if age_range:
        a, b = int(age_range.group(1)), int(age_range.group(2))
        if 0 < a < 100 and 0 < b < 120:
            min_age, max_age = a, b
    else:
        # "above 18 years" / "at least 18 years" / "minimum age 18"
        above = re.search(r'(?:above|at\s+least|minimum\s+(?:age\s+(?:of\s+)?)?|not\s+less\s+than)\s*(\d{1,2})\s*years', full)
        if above:
            val = int(above.group(1))
            if 0 < val < 100:
                min_age = val
        # "below 60 years" / "up to 60" / "maximum age 60"
        below = re.search(r'(?:below|up\s+to|under|maximum\s+(?:age\s+(?:of\s+)?)?|not\s+(?:more|exceed(?:ing)?)\s+than)\s*(\d{1,3})\s*years', full)
        if below:
            val = int(below.group(1))
            if 0 < val < 120:
                max_age = val

    # Also look for "age of X years"
    if not min_age and not max_age:
        age_of = re.search(r'age\s+(?:of\s+)?(\d{1,2})\s*years', full)
        if age_of:
            val = int(age_of.group(1))
            if val > 14:
                min_age = val

    # 4. Income
    max_income = None
    # "annual income not exceeding Rs. 2,50,000" / "income below Rs 1,00,000"
    inc_patterns = [
        r'(?:income|annual|family).{0,40}(?:Rs\.?|INR)\s*([0-9,]+)',
        r'(?:Rs\.?|INR)\s*([0-9,]+).{0,30}(?:income|annual|family)',
        r'(?:income|annual|family).{0,40}([0-9,]+)\s*(?:per\s+(?:annum|year|month))',
        r'(?:bpl|below\s+poverty)',
    ]
    for pat in inc_patterns:
        m = re.search(pat, full)
        if m:
            if 'bpl' in pat:
                max_income = 100000  # approximate BPL threshold
                break
            raw = m.group(1).replace(",", "")
            if raw.isdigit() and int(raw) > 1000:
                max_income = int(raw)
                break

    # 5. Occupations
    occ_map = {
        "farmer": ["farmer", "agriculture", "cultivator", "kisan", "crop", "horticulture"],
        "student": ["student", "scholar", "school", "college", "education", "university", "tuition"],
        "unorganised_worker": ["unorganised", "informal", "labour", "worker", "artisan", "construction", "migrant"],
        "self_employed": ["self-employed", "entrepreneur", "business", "startup", "msme"],
        "unemployed": ["unemployed", "job seeker", "jobless"],
        "salaried": ["salaried", "employee", "government servant", "pensioner"],
        "fisherman": ["fisherman", "fisher", "fishing"],
    }
    occupations = []
    for occ, keywords in occ_map.items():
        for kw in keywords:
            if re.search(r'\b' + re.escape(kw) + r'\b', full):
                occupations.append(occ)
                break
    if not occupations:
        occupations = ["All"]

    return gender, castes, min_age, max_age, max_income, occupations


def extract_benefit_type(text):
    """Classify scheme into a benefit type."""
    t = text.lower().replace("crop health", "crop")

    benefit_keywords = {
        "scholarship":    ["scholarship", "fellowship", "tuition", "education grant"],
        "cash_transfer":  ["cash", "dbt", "financial assistance", "stipend", "grant", "subsidy",
                          "incentive", "income support", "assistance", "installments", "allowance", "honorarium"],
        "housing":        ["house", "housing", "awas", "flat", "shelter", "dwelling"],
        "insurance":      ["insurance", "pension", "maan-dhan", "social security", "provident fund"],
        "food_subsidy":   ["food", "ration", "nutrition", "meal", "grain", "mid-day"],
        "healthcare":     ["health", "medical", "treatment", "hospital", "ayushman", "surgery", "medicine"],
        "employment":     ["employment", "job", "rozgar", "work opportunity", "placement", "skill training"],
        "subsidy":        ["subsidy", "loan", "credit", "interest subvention", "margin money"],
    }
    for btype, keywords in benefit_keywords.items():
        for kw in keywords:
            if re.search(r'\b' + re.escape(kw) + r'\b', t):
                return btype
    return "other"


def parse_from_listing(fields):
    """Extract data from search listing fields."""
    return {
        "slug": fields.get("slug", ""),
        "name": fields.get("schemeName", ""),
        "ministry": fields.get("nodalMinistryName", ""),
        "level": fields.get("level", ""),  # Central / State
        "brief": fields.get("briefDescription", ""),
        "categories": fields.get("schemeCategory", []),
        "tags": fields.get("tags", []),
        "states": fields.get("beneficiaryState", ["All"]),
        "scheme_for": fields.get("schemeFor", ""),
        "close_date": fields.get("schemeCloseDate"),
    }


def fetch_detail(slug, retries=2):
    """Fetch full scheme detail from the detail API."""
    for attempt in range(retries):
        try:
            r = requests.get(
                f"{DETAIL_URL}?slug={slug}&lang=en",
                impersonate="chrome120", headers=HEADERS, timeout=20
            )
            if r.status_code != 200:
                time.sleep(1)
                continue
            data = r.json().get("data")
            if data and isinstance(data, dict):
                return data
        except Exception:
            time.sleep(1)
    return None


def build_scheme(listing_fields, detail_data):
    """Build a scheme record from listing + detail data."""
    listing = parse_from_listing(listing_fields)
    slug = listing["slug"]
    name = listing["name"]
    ministry = listing["ministry"] or ""

    # Combine all text for analysis
    desc_md = ""
    benefits_md = ""
    elig_md = ""
    docs_list = []
    app_url = f"https://www.myscheme.gov.in/schemes/{slug}"

    if detail_data:
        en = detail_data.get("en", {}) or {}
        bd = en.get("basicDetails", {}) or {}
        sc = en.get("schemeContent", {}) or {}
        ec = en.get("eligibilityCriteria", {}) or {}

        # Get ministry from detail if listing didn't have it
        if not ministry:
            nm = bd.get("nodalMinistryName")
            if isinstance(nm, dict):
                ministry = nm.get("label", "")
            elif isinstance(nm, str):
                ministry = nm

        # Get department as fallback
        if not ministry:
            dept = bd.get("nodalDepartmentName")
            if isinstance(dept, dict):
                ministry = dept.get("label", "")
            elif isinstance(dept, str):
                ministry = dept

        desc_md = sc.get("detailedDescription_md", "") or ""
        benefits_md = sc.get("benefits_md", "") or ""
        elig_md = ec.get("eligibilityDescription_md", "") or ""

        # Get documents from detail
        scheme_id = detail_data.get("_id")
        if scheme_id:
            try:
                dr = requests.get(
                    f"{DETAIL_URL}/{scheme_id}/documents?lang=en",
                    impersonate="chrome120", headers=HEADERS, timeout=10
                )
                if dr.status_code == 200:
                    docs_data = dr.json().get("data", {})
                    if isinstance(docs_data, dict):
                        req_docs = docs_data.get("en", {}).get("documents_required", [])
                        if isinstance(req_docs, list):
                            for doc in req_docs:
                                if isinstance(doc, str) and doc.strip():
                                    docs_list.append(doc.strip())
                                elif isinstance(doc, dict):
                                    for child in doc.get("children", []):
                                        txt = child.get("text", "").strip() if isinstance(child, dict) else ""
                                        if txt:
                                            docs_list.append(txt)
                                        for sub in (child.get("children", []) if isinstance(child, dict) else []):
                                            txt2 = sub.get("text", "").strip() if isinstance(sub, dict) else ""
                                            if txt2:
                                                docs_list.append(txt2)
            except Exception:
                pass

            # Get application URL
            try:
                ar = requests.get(
                    f"{DETAIL_URL}/{scheme_id}/applicationchannel",
                    impersonate="chrome120", headers=HEADERS, timeout=10
                )
                if ar.status_code == 200:
                    ac_data = ar.json().get("data", {})
                    if isinstance(ac_data, dict):
                        channels = ac_data.get("applicationChannel", [])
                        if channels and isinstance(channels, list):
                            url = channels[0].get("applicationUrl")
                            if url:
                                app_url = url
            except Exception:
                pass

    # If no docs from detail, provide sensible defaults
    docs_list = [d for d in docs_list if d and len(d) > 3][:10]
    if not docs_list:
        docs_list = ["Aadhaar Card", "Identity Proof", "Address Proof"]

    # Build combined text for extraction
    all_text = " ".join(filter(None, [name, listing["brief"], desc_md, benefits_md, elig_md]))
    tag_text = " ".join(listing.get("tags", []))

    # Extract structured data
    benefit_amt = extract_benefit_amount(benefits_md + " " + desc_md + " " + listing["brief"])
    benefit_type = extract_benefit_type(all_text + " " + tag_text)
    gender, castes, min_age, max_age, max_income, occupations = extract_demographics(
        desc_md, elig_md, listing.get("tags"), listing["brief"]
    )

    # States
    states = listing.get("states", ["All"])
    if not states:
        states = ["All"]

    # Build scheme_id
    sid_base = slug.upper().replace("-", "_")
    scheme_id = f"{sid_base}_SCRAPED"

    # Check if scheme is active
    active = True
    close_date = listing.get("close_date")
    if close_date:
        try:
            cd = datetime.strptime(close_date, "%Y-%m-%d")
            if cd < datetime.now():
                active = False
        except Exception:
            pass

    return {
        "scheme_id": scheme_id,
        "name": name,
        "ministry": ministry,
        "benefit_type": benefit_type,
        "benefit_amount": benefit_amt,
        "applicable_states": states,
        "gender": gender,
        "caste_categories": castes,
        "min_age": min_age,
        "max_age": max_age,
        "max_income": max_income,
        "occupation_types": occupations,
        "documents_required": docs_list,
        "application_url": app_url,
        "is_rolling": close_date is None,
        "verified_at": datetime.today().strftime("%Y-%m-%d"),
        "active": active,
    }


def run_scraper():
    """
    Main entry point: paginate through ALL schemes in the search API,
    fetch full details for each, and save to JSON.
    """
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    all_schemes = []
    seen_slugs = set()
    failed_slugs = []

    PAGE_SIZE = 100
    offset = 0
    consecutive_empty = 0
    total_available = 0

    print("[SCRAPER] Starting full scrape of myscheme.gov.in ...")

    while True:
        print(f"\n--- Fetching listing page at offset={offset} ---")
        params = {
            "lang": "en",
            "q": "[]",
            "keyword": "",
            "from": offset,
            "size": PAGE_SIZE
        }

        try:
            resp = requests.get(
                BASE_URL, params=params,
                impersonate="chrome120", headers=HEADERS, timeout=20
            )
            if resp.status_code != 200:
                print(f"  [WARN] Status {resp.status_code}, retrying in 3s...")
                time.sleep(3)
                resp = requests.get(
                    BASE_URL, params=params,
                    impersonate="chrome120", headers=HEADERS, timeout=20
                )
                if resp.status_code != 200:
                    print(f"  [ERROR] Retry failed. Skipping page.")
                    offset += PAGE_SIZE
                    continue

            res_json = resp.json()
            hits = res_json.get("data", {}).get("hits", {})
            page_info = hits.get("page", {})
            total_available = page_info.get("total", total_available)
            items = hits.get("items", [])

            if offset == 0:
                print(f"[SCRAPER] Total schemes on platform: {total_available}")

            print(f"  Got {len(items)} items (offset={offset}, total={total_available})")

            if not items:
                consecutive_empty += 1
                if consecutive_empty >= 2:
                    print("[SCRAPER] No more results.")
                    break
                offset += PAGE_SIZE
                time.sleep(2)
                continue

            consecutive_empty = 0

            for item in items:
                fields = item.get("fields", {})
                slug = fields.get("slug")
                if not slug or slug in seen_slugs:
                    continue
                seen_slugs.add(slug)

                # 1. Fetch detail (may be None for some schemes)
                detail = fetch_detail(slug)

                # 2. Build scheme from listing + detail
                try:
                    scheme = build_scheme(fields, detail)
                    if scheme and scheme.get("name"):
                        all_schemes.append(scheme)
                        n = len(all_schemes)
                        has_detail = "FULL" if detail else "LISTING"
                        name_short = scheme["name"][:45]
                        ministry_short = (scheme["ministry"] or "?")[:30]
                        print(f"    [{n}] [{has_detail}] {name_short} | {ministry_short}")
                    else:
                        failed_slugs.append(slug)
                except Exception as ex:
                    failed_slugs.append(slug)
                    print(f"    [ERROR] {slug}: {ex}")

                time.sleep(0.3)

            # Save progress after every page
            progress_path = os.path.join(OUTPUT_DIR, "schemes_scraped.json")
            with open(progress_path, "w", encoding="utf-8") as f:
                json.dump(all_schemes, f, ensure_ascii=False, indent=2)
            print(f"  [SAVED] {len(all_schemes)} schemes ({len(failed_slugs)} failed)")

            offset += PAGE_SIZE
            if offset >= total_available:
                print("[SCRAPER] Reached end of results.")
                break

            time.sleep(0.5)

        except Exception as e:
            print(f"  [ERROR] Page {offset}: {e}")
            time.sleep(3)
            offset += PAGE_SIZE
            continue

    # Final save
    output_path = os.path.join(OUTPUT_DIR, "schemes_scraped.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(all_schemes, f, ensure_ascii=False, indent=2)

    # Save failures for debugging
    if failed_slugs:
        with open(os.path.join(OUTPUT_DIR, "failed_slugs.json"), "w") as f:
            json.dump(failed_slugs, f, indent=2)

    print(f"\n{'='*50}")
    print(f"[DONE] Scraped {len(all_schemes)} schemes -> {output_path}")
    print(f"  Unique slugs seen: {len(seen_slugs)}")
    print(f"  Failed: {len(failed_slugs)}")
    print(f"  Platform total: {total_available}")

    # Data quality summary
    empty_ministry = sum(1 for s in all_schemes if not s.get("ministry"))
    empty_benefit = sum(1 for s in all_schemes if not s.get("benefit_amount"))
    empty_age = sum(1 for s in all_schemes if not s.get("min_age") and not s.get("max_age"))
    print(f"\n  Data Quality:")
    print(f"    With ministry: {len(all_schemes) - empty_ministry}/{len(all_schemes)}")
    print(f"    With benefit_amount: {len(all_schemes) - empty_benefit}/{len(all_schemes)}")
    print(f"    With age info: {len(all_schemes) - empty_age}/{len(all_schemes)}")

    return all_schemes


if __name__ == "__main__":
    run_scraper()