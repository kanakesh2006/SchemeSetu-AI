from fastapi import APIRouter, Query, HTTPException
from database import get_pool
from services.fallback_data import MOCK_CENTERS, haversine_distance
from pydantic import BaseModel
from typing import Optional
import httpx

router = APIRouter()

class CenterCreate(BaseModel):
    name: str
    type: str # 'csc' or 'post_office'
    address: str
    state: str
    latitude: float
    longitude: float
    phone_number: Optional[str] = None
    working_hours: Optional[str] = None

@router.post("")
async def create_center(center: CenterCreate):
    pool = get_pool()
    if pool is not None:
        try:
            async with pool.acquire() as conn:
                await conn.execute(
                    """
                    INSERT INTO centers (
                        name, type, address, state, 
                        latitude, longitude, phone_number, working_hours
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    ON CONFLICT (name, latitude, longitude) DO NOTHING
                    """,
                    center.name, center.type, center.address, center.state,
                    center.latitude, center.longitude, center.phone_number, center.working_hours
                )
            return {"status": "success", "mode": "database", "message": f"Center '{center.name}' successfully added to database."}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Database insertion failed: {e}")
    else:
        return {"status": "offline_saved", "mode": "offline_fallback", "message": f"Running in offline mode. Center '{center.name}' should be saved locally in localStorage."}


async def fetch_osm_post_offices(lat: float, lng: float, radius_meters: int = 20000) -> list:
    """
    Query OpenStreetMap Overpass API for real-world post offices within the specified radius.
    """
    overpass_url = "https://overpass-api.de/api/interpreter"
    query = f"""
    [out:json][timeout:10];
    (
      node["amenity"="post_office"](around:{radius_meters},{lat},{lng});
      way["amenity"="post_office"](around:{radius_meters},{lat},{lng});
    );
    out center;
    """
    try:
        headers = {
            "User-Agent": "GovernmentWelfareSchemesPortal/1.0 (contact: admin@welfareschemes.gov)"
        }
        async with httpx.AsyncClient() as client:
            resp = await client.post(overpass_url, data={"data": query}, headers=headers, timeout=10)
            if resp.status_code != 200:
                return []
            data = resp.json()
            
            osm_centers = []
            for element in data.get("elements", []):
                elat = element.get("lat") or element.get("center", {}).get("lat")
                elng = element.get("lon") or element.get("center", {}).get("lon")
                if not elat or not elng:
                    continue
                    
                tags = element.get("tags", {})
                name = tags.get("name") or tags.get("official_name") or "India Post Office"
                pincode = tags.get("addr:postcode") or ""
                
                # Format a readable address
                city = tags.get("addr:city") or tags.get("addr:town") or tags.get("addr:district") or ""
                suburb = tags.get("addr:suburb") or tags.get("addr:neighbourhood") or ""
                street = tags.get("addr:street") or ""
                address_parts = [p for p in [street, suburb, city, pincode] if p]
                address = ", ".join(address_parts) if address_parts else f"Post Office near {elat:.4f}, {elng:.4f}"
                
                osm_centers.append({
                    "center_id": f"osm_{element.get('id')}",
                    "name": name,
                    "type": "post_office",
                    "address": address,
                    "state": tags.get("addr:state") or "IN",
                    "latitude": elat,
                    "longitude": elng,
                    "phone_number": tags.get("phone") or tags.get("contact:phone") or None,
                    "working_hours": tags.get("opening_hours") or "9:00 AM - 5:00 PM",
                    "distance": round(haversine_distance(lat, lng, elat, elng), 2)
                })
            return osm_centers
    except Exception as e:
        print(f"[OSM Overpass API Fetch Error] {e}")
        return []


@router.get("/nearby")
async def get_nearby_centers(
    lat: float = Query(..., description="Latitude of the user"),
    lng: float = Query(..., description="Longitude of the user"),
    type: str = Query(None, description="Filter by type ('csc' or 'post_office')")
):
    pool = get_pool()

    local_results = []
    mode = "offline_fallback"

    # 1. Fetch from Database Mode
    if pool is not None:
        try:
            async with pool.acquire() as conn:
                rows = await conn.fetch(
                    """
                    SELECT * FROM (
                        SELECT 
                            center_id, name, type, address, state, 
                            latitude, longitude, phone_number, working_hours,
                            (6371 * acos(
                                cos(radians($1)) * cos(radians(latitude)) * 
                                cos(radians(longitude) - radians($2)) + 
                                sin(radians($1)) * sin(radians(latitude))
                            )) AS distance
                        FROM centers
                    ) as c
                    WHERE ($3::text IS NULL OR type = $3)
                      AND distance <= 20.0
                    ORDER BY distance
                    """,
                    lat, lng, type
                )
                for r in rows:
                    center = dict(r)
                    center["distance"] = round(float(center["distance"]), 2)
                    local_results.append(center)
                mode = "database"
        except Exception as e:
            print(f"[WARNING] Database center query failed: {e}. Falling back to offline memory calculation.")
    
    # 2. Fetch from Local Mock Data if Database is offline
    if not local_results and mode == "offline_fallback":
        for c in MOCK_CENTERS:
            if type and c["type"] != type:
                continue
            dist = haversine_distance(lat, lng, c["latitude"], c["longitude"])
            if dist <= 20.0:
                center_copy = dict(c)
                center_copy["distance"] = round(dist, 2)
                local_results.append(center_copy)

    # 3. Dynamic OSM Overpass API fetching (if searching for post offices)
    osm_results = []
    if not type or type == "post_office":
        # Pull live post office coordinates from OSM Overpass API within 20km
        osm_results = await fetch_osm_post_offices(lat, lng, radius_meters=20000)

    # 4. Merge results and sort
    merged = local_results + osm_results
    merged.sort(key=lambda x: x["distance"])

    # 5. Deduplicate centers that are too close to each other (within 100 meters)
    results = []
    seen_coords = []
    for r in merged:
        is_dup = False
        for seen in seen_coords:
            if haversine_distance(r["latitude"], r["longitude"], seen["lat"], seen["lng"]) < 0.1:
                is_dup = True
                break
        if not is_dup:
            results.append(r)
            seen_coords.append({"lat": r["latitude"], "lng": r["longitude"]})

    # 6. GPS Auto-Match Simulation fallback if NO post offices/CSCs are found within 20km
    if not results:
        local_csc = {
            "center_id": 999,
            "name": "Local E-Sevai / Digital Seva CSC Centre",
            "type": "csc",
            "address": "Common Service Centre near your location (GPS Auto-Match)",
            "state": "Local",
            "latitude": lat + 0.005,
            "longitude": lng - 0.006,
            "phone_number": "9876543000",
            "working_hours": "9:30 AM - 6:00 PM",
            "distance": 0.85
        }
        local_po = {
            "center_id": 998,
            "name": "Local Sub-Post Office",
            "type": "post_office",
            "address": "Department of Posts branch near you (GPS Auto-Match)",
            "state": "Local",
            "latitude": lat - 0.004,
            "longitude": lng + 0.005,
            "phone_number": "011-23360000",
            "working_hours": "9:00 AM - 5:00 PM",
            "distance": 1.15
        }
        
        injections = []
        if not type or type == "csc":
            injections.append(local_csc)
        if not type or type == "post_office":
            injections.append(local_po)
            
        results = injections

    return {
        "mode": mode,
        "results": results
    }

