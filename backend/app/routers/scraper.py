from typing import Annotated

from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.apartment import ScrapeJob
from app.schemas.apartment import ScrapeJobOut, ScrapeRequest
from app.services import apartment_service

router = APIRouter(prefix="/scraper", tags=["scraper"])


@router.post("/run", response_model=ScrapeJobOut)
async def run_scrape(
    req: ScrapeRequest,
    background_tasks: BackgroundTasks,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Start a scrape job in the background and return job info immediately."""
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
