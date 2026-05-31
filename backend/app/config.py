from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://dirasearch:dirasearch@localhost:5432/dirasearch"
    redis_url: str = "redis://localhost:6379"
    yad2_proxy_url: str = ""
    scraper_interval_hours: int = 6

    class Config:
        env_file = ".env"


settings = Settings()
