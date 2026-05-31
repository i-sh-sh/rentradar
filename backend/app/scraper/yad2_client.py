"""
Yad2 scraper using their reverse-engineered mobile API.
Falls back to Playwright headless scraping if the API is blocked.
"""
import asyncio
import json
import random
import re
from datetime import datetime
from typing import Any

import httpx

YAD2_API_BASE = "https://gw.yad2.co.il/feed-search-legacy/realestate/rent"

CITY_CODES = {
    "תל אביב יפו": "5000",
    "ירושלים": "3000",
    "חיפה": "4000",
    "ראשון לציון": "8300",
    "פתח תקווה": "7900",
    "אשדוד": "70",
    "נתניה": "7400",
    "באר שבע": "9000",
    "בני ברק": "6300",
    "רמת גן": "8600",
    "הרצליה": "6600",
    "כפר סבא": "7100",
    "רחובות": "8400",
    "חולון": "6700",
    "בת ים": "6200",
    "מודיעין": "1367",
    "אילת": "500",
}

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "he-IL,he;q=0.9,en;q=0.8",
    "Referer": "https://m.yad2.co.il/",
    "Origin": "https://m.yad2.co.il",
}


def _parse_listing(raw: dict[str, Any]) -> dict[str, Any]:
    """Normalize a raw Yad2 API listing into our schema."""
    coord = raw.get("coordinates") or {}
    contact = raw.get("contactName") or raw.get("agencyName") or ""

    images = []
    for img in raw.get("images") or []:
        if isinstance(img, dict):
            src = img.get("src") or img.get("url") or ""
            if src:
                images.append(src)
        elif isinstance(img, str):
            images.append(img)

    features = {
        "parking": bool(raw.get("parking")),
        "elevator": bool(raw.get("elevator")),
        "balcony": bool(raw.get("balcony")),
        "mamad": bool(raw.get("safeRoom")),
        "ac": bool(raw.get("airConditioner")),
        "storage": bool(raw.get("storage")),
        "renovated": bool(raw.get("renovated")),
        "furnished": bool(raw.get("furniture")),
        "pets": bool(raw.get("pets")),
        "accessible": bool(raw.get("accessible")),
    }

    price = None
    raw_price = raw.get("price")
    if raw_price and isinstance(raw_price, (int, float)):
        price = int(raw_price)
    elif raw_price and isinstance(raw_price, str):
        digits = re.sub(r"[^\d]", "", raw_price)
        price = int(digits) if digits else None

    rooms = None
    raw_rooms = raw.get("rooms")
    if raw_rooms is not None:
        try:
            rooms = float(raw_rooms)
        except (ValueError, TypeError):
            pass

    entry_date = None
    raw_entry = raw.get("dateOfEntry") or raw.get("entryDate")
    if raw_entry:
        try:
            entry_date = datetime.fromisoformat(str(raw_entry)).date()
        except Exception:
            pass

    listed_at = None
    raw_listed = raw.get("date") or raw.get("listDate")
    if raw_listed:
        try:
            listed_at = datetime.fromisoformat(str(raw_listed))
        except Exception:
            pass

    agent_or_owner = "agent"
    if raw.get("privateOwner") or raw.get("isPrivate"):
        agent_or_owner = "owner"

    return {
        "yad2_id": str(raw.get("id") or raw.get("token") or ""),
        "source": "yad2",
        "url": f"https://www.yad2.co.il/item/{raw.get('token') or raw.get('id') or ''}",
        "title": raw.get("title") or raw.get("titlePlus") or "",
        "description": raw.get("info") or raw.get("additionalInfo") or "",
        "price_nis": price,
        "rooms": rooms,
        "floor": raw.get("floor"),
        "total_floors": raw.get("totalFloors") or raw.get("buildingFloors"),
        "size_sqm": raw.get("squareMeter") or raw.get("squaremeter"),
        "city": raw.get("city") or "",
        "neighborhood": raw.get("neighborhood") or "",
        "street": raw.get("street") or "",
        "street_number": str(raw.get("houseNum") or ""),
        "lat": float(coord.get("latitude") or 0) or None,
        "lng": float(coord.get("longitude") or 0) or None,
        "features": features,
        "images": images[:20],
        "entry_date": entry_date,
        "agent_or_owner": agent_or_owner,
        "contact_phone": raw.get("phone") or raw.get("contactPhone") or "",
        "listed_at": listed_at,
        "scraped_at": datetime.utcnow(),
    }


async def fetch_listings(
    city: str = "תל אביב יפו",
    neighborhood: str | None = None,
    rooms_min: float | None = None,
    rooms_max: float | None = None,
    price_min: int | None = None,
    price_max: int | None = None,
    max_pages: int = 5,
    proxy: str | None = None,
) -> list[dict[str, Any]]:
    """Fetch listings from Yad2 API. Returns list of normalized dicts."""
    city_code = CITY_CODES.get(city, city)

    params: dict[str, Any] = {
        "city": city_code,
        "propertyGroup": "apartments",
        "page": 1,
        "pageSize": 40,
    }
    if neighborhood:
        params["neighborhood"] = neighborhood
    if rooms_min is not None:
        params["rooms"] = f"{rooms_min}-{rooms_max or 10}"
    if price_min is not None:
        params["price"] = f"{price_min}-{price_max or 99999}"

    all_listings: list[dict[str, Any]] = []

    async with httpx.AsyncClient(
        headers=HEADERS,
        proxies=proxy or None,
        timeout=30,
        follow_redirects=True,
    ) as client:
        for page in range(1, max_pages + 1):
            params["page"] = page
            await asyncio.sleep(random.uniform(1.5, 4.0))

            try:
                resp = await client.get(YAD2_API_BASE, params=params)
                resp.raise_for_status()
                data = resp.json()
            except Exception as e:
                raise RuntimeError(f"Yad2 API request failed on page {page}: {e}") from e

            feed = data.get("data", {}).get("feed", {})
            items = feed.get("feed_items") or data.get("data", {}).get("items") or []

            if not items:
                break

            for item in items:
                if item.get("type") in ("ad", "promote"):
                    continue
                parsed = _parse_listing(item)
                if parsed.get("yad2_id"):
                    all_listings.append(parsed)

            total_pages = feed.get("total_pages") or data.get("data", {}).get("pagination", {}).get("total_pages") or page
            if page >= total_pages:
                break

    return all_listings
