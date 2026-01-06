"""
Maple Planner Backend - Configuration Settings
"""
from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # MongoDB Atlas
    # 格式: mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
    mongodb_url: str = "mongodb+srv://user:password@cluster.mongodb.net/maple_planner?retryWrites=true&w=majority"
    database_name: str = "maple_planner"
    
    # Google Maps API
    google_maps_api_key: str = ""
    
    # Exchange Rate API
    exchange_rate_api_key: str = ""
    
    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = True
    
    # CORS
    cors_origins: str = "http://localhost:3000,http://localhost:5173"
    
    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
