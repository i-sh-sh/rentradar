from typing import Annotated, Any

from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.apartment import ScrapeJob
from app.schemas.apartment import ScrapeJobOut, ScrapeRequest
from app.services import apartment_service
from app.scraper.yad2_client import parse_next_data

router = APIRouter(prefix="/scraper", tags=["scraper"])


class BookmarkletImport(BaseModel):
    next_data: dict[str, Any]


@router.post("/import", response_model=dict)
async def bookmarklet_import(
    payload: BookmarkletImport,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Receives __NEXT_DATA__ JSON from the bookmarklet and imports listings."""
    listings = parse_next_data(payload.next_data)
    if not listings:
        raise HTTPException(400, "לא נמצאו דירות בדף זה")

    for raw in listings:
        await apartment_service.upsert_from_scrape(db, raw)

    return {"imported": len(listings)}


@router.get("/bookmarklet", response_class=HTMLResponse)
async def get_bookmarklet_page():
    """Returns an HTML page with the bookmarklet and instructions."""
    js = """(function(){
  var d=window.__NEXT_DATA__;
  if(!d){alert('לא נמצאו נתונים בדף זה. פתח דף תוצאות של יד2.');return;}
  var s=JSON.stringify({next_data:d});
  navigator.clipboard.writeText(s).then(function(){
    alert('✅ הנתונים הועתקו! כעת חזור ל-RentRadar ולחץ "הדבק וייבא".');
  }).catch(function(){
    alert('❌ לא ניתן להעתיק. נסה שוב.');
  });
})();"""

    bookmarklet = f"javascript:{js}"

    return f"""<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8"/>
  <title>RentRadar — ייבוא מיד2</title>
  <style>
    body {{ font-family: Arial, sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; }}
    h1 {{ color: #2563eb; }}
    .bookmarklet {{ display:inline-block; background:#2563eb; color:#fff; padding:12px 24px;
      border-radius:12px; text-decoration:none; font-size:18px; margin:20px 0; }}
    .step {{ background:#f0f4ff; border-radius:10px; padding:15px; margin:10px 0; }}
    code {{ background:#e5e7eb; padding:2px 6px; border-radius:4px; }}
  </style>
</head>
<body>
  <h1>📡 RentRadar — ייבוא מיד2</h1>

  <div class="step">
    <b>שלב 1:</b> גרור את הכפתור הזה לסרגל הסימניות שלך:
    <br/><br/>
    <a class="bookmarklet" href="{bookmarklet}">📥 ייבא לRentRadar</a>
  </div>

  <div class="step">
    <b>שלב 2:</b> גלוש ל-<a href="https://www.yad2.co.il/realestate/rent" target="_blank">יד2 דירות להשכרה</a>
    וסנן לפי מה שאתה רוצה (עיר, מחיר, חדרים וכו׳)
  </div>

  <div class="step">
    <b>שלב 3:</b> לחץ על הסימנייה <b>"ייבא לRentRadar"</b> — הנתונים יועתקו ללוח העריכה
  </div>

  <div class="step">
    <b>שלב 4:</b> חזור ל-<a href="http://localhost:5173/admin" target="_blank">RentRadar — אדמין</a>
    ולחץ על <b>"הדבק וייבא"</b>
  </div>

  <p style="color:#888; font-size:13px;">
    * עובד בדפי תוצאות בלבד (לא בדפי דירה בודדת). כל לחיצה מייבאת עמוד אחד של תוצאות (~40 דירות).
  </p>
</body>
</html>"""


@router.post("/run", response_model=ScrapeJobOut)
async def run_scrape(
    req: ScrapeRequest,
    background_tasks: BackgroundTasks,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    from app.database import AsyncSessionLocal

    job = ScrapeJob(search_params=req.model_dump(), status="running")
    db.add(job)
    await db.commit()
    await db.refresh(job)

    async def _run():
        async with AsyncSessionLocal() as session:
            await apartment_service.run_scrape_job(session, req)

    background_tasks.add_task(_run)
    return ScrapeJobOut.model_validate(job)


@router.get("/jobs", response_model=list[ScrapeJobOut])
async def list_jobs(db: Annotated[AsyncSession, Depends(get_db)], limit: int = 20):
    result = await db.execute(select(ScrapeJob).order_by(desc(ScrapeJob.started_at)).limit(limit))
    return [ScrapeJobOut.model_validate(j) for j in result.scalars().all()]
