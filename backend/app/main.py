"""
Maple Planner - FastAPI Main Application
楓葉行程助手後端 API 服務
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.database import connect_to_mongodb, close_mongodb_connection
from app.routes import trips, route_optimization, exchange


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup and shutdown events."""
    # Startup
    await connect_to_mongodb()
    yield
    # Shutdown
    await close_mongodb_connection()


# Create FastAPI application
app = FastAPI(
    title="Maple Planner API",
    description="""
    🍁 楓葉行程助手 API
    
    旅遊行程規劃後端服務，專為加拿大旅遊設計。
    
    ## 功能特色
    
    * **行程管理** - 建立、編輯、刪除旅程
    * **景點候選清單** - 管理想去的景點
    * **每日行程** - 拖拽排程、時間安排
    * **路徑優化** - TSP 演算法計算最短路徑
    * **預算記錄** - 追蹤旅遊開支
    * **匯率換算** - 即時匯率轉換
    
    ## 技術棧
    
    * FastAPI + Python
    * MongoDB (Motor async driver)
    * OR-Tools (route optimization)
    """,
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(trips.router, prefix="/api")
app.include_router(route_optimization.router, prefix="/api")
app.include_router(exchange.router, prefix="/api")


@app.get("/")
async def root():
    """API 根路徑 - 健康檢查"""
    return {
        "name": "Maple Planner API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """健康檢查端點"""
    return {
        "status": "healthy",
        "database": "connected"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug
    )
