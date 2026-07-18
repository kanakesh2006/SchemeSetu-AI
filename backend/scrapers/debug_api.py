"""Debug: check what fields are available in the search listing."""
from curl_cffi import requests
import json

HEADERS = {
    "x-api-key": "tYTy5eEhlu9rFjyxuCr7ra7ACp4dv1RH8gWuHTDc",
    "Origin": "https://www.myscheme.gov.in",
    "Referer": "https://www.myscheme.gov.in/"
}

# Try the search API and dump full fields for first 2 items
r = requests.get(
    "https://api.myscheme.gov.in/search/v6/schemes",
    params={"lang": "en", "q": "[]", "keyword": "", "from": 0, "size": 2},
    impersonate="chrome120", headers=HEADERS, timeout=15
)
data = r.json()
items = data.get("data", {}).get("hits", {}).get("items", [])
print(f"Got {len(items)} items\n")

for i, item in enumerate(items):
    print(f"=== Item {i} ===")
    print(f"Top-level keys: {list(item.keys())}")
    fields = item.get("fields", {})
    print(f"Fields keys: {sorted(fields.keys())}")
    print()
    for k in sorted(fields.keys()):
        v = fields[k]
        if isinstance(v, str) and len(v) > 200:
            print(f"  {k}: ({len(v)} chars) {v[:200]}...")
        else:
            print(f"  {k}: {json.dumps(v, ensure_ascii=False)}")
    print()

# Also try the detail endpoint with POST instead of GET
print("\n=== Trying POST detail endpoint ===")
slug = items[0]["fields"]["slug"] if items else "stand-up-india"
print(f"Using slug: {slug}")

# Try different URL patterns
urls_to_try = [
    f"https://api.myscheme.gov.in/schemes/v6/public/schemes?slug={slug}&lang=en",
    f"https://api.myscheme.gov.in/schemes/v6/public/schemes/{slug}?lang=en",
]
for url in urls_to_try:
    print(f"\n  GET {url}")
    try:
        r2 = requests.get(url, impersonate="chrome120", headers=HEADERS, timeout=10)
        resp = r2.json()
        d = resp.get("data")
        if d is None:
            print(f"    data is null")
        elif isinstance(d, dict):
            print(f"    data keys: {list(d.keys())[:10]}")
            print(f"    data: {json.dumps(d, ensure_ascii=False)[:300]}")
        else:
            print(f"    data type: {type(d).__name__}")
    except Exception as e:
        print(f"    Error: {e}")

# Try POST
print(f"\n  POST https://api.myscheme.gov.in/schemes/v6/public/schemes")
try:
    r3 = requests.post(
        "https://api.myscheme.gov.in/schemes/v6/public/schemes",
        json={"slugs": [slug], "lang": "en"},
        impersonate="chrome120", headers=HEADERS, timeout=10
    )
    print(f"    Status: {r3.status_code}")
    resp = r3.json()
    d = resp.get("data")
    if d is None:
        print(f"    data is null. Full: {json.dumps(resp, ensure_ascii=False)[:300]}")
    elif isinstance(d, dict):
        print(f"    data keys: {list(d.keys())[:10]}")
    elif isinstance(d, list):
        print(f"    data is list[{len(d)}]")
        if d:
            print(f"    first item keys: {list(d[0].keys())[:10]}")
except Exception as e:
    print(f"    Error: {e}")
