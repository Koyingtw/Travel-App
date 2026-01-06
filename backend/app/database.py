"""
MongoDB Database Connection and Utilities
"""
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from typing import Optional
from app.config import settings


class Database:
    """MongoDB database connection manager."""
    
    client: Optional[AsyncIOMotorClient] = None
    db: Optional[AsyncIOMotorDatabase] = None


database = Database()


async def connect_to_mongodb():
    """Establish connection to MongoDB."""
    database.client = AsyncIOMotorClient(settings.mongodb_url)
    database.db = database.client[settings.database_name]
    
    # Create indexes for better query performance
    await create_indexes()
    
    print(f"✅ Connected to MongoDB: {settings.database_name}")


async def close_mongodb_connection():
    """Close MongoDB connection."""
    if database.client:
        database.client.close()
        print("🔌 Disconnected from MongoDB")


async def create_indexes():
    """Create database indexes for optimal query performance."""
    # Trip collection indexes
    trips_collection = database.db.trips
    await trips_collection.create_index("user_id")
    await trips_collection.create_index("start_date")
    await trips_collection.create_index("end_date")
    
    # Compound index for date range queries
    await trips_collection.create_index([("start_date", 1), ("end_date", 1)])


def get_database() -> AsyncIOMotorDatabase:
    """Get database instance."""
    return database.db


def get_trips_collection():
    """Get trips collection."""
    return database.db.trips


def get_exchange_rates_collection():
    """Get exchange rates collection (for caching)."""
    return database.db.exchange_rates
