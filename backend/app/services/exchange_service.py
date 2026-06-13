"""
Exchange Rate Service
Fetches real-time exchange rates and performs currency conversions
"""
import httpx
from datetime import datetime, timedelta
from typing import Dict, Optional, List
from app.config import settings
from app.database import get_exchange_rates_collection
from app.models import ExchangeRateResponse, SupportedCurrency


# Common currencies for travelers
SUPPORTED_CURRENCIES: Dict[str, SupportedCurrency] = {
    "USD": SupportedCurrency(code="USD", name="US Dollar", symbol="$"),
    "CAD": SupportedCurrency(code="CAD", name="Canadian Dollar", symbol="$"),
    "EUR": SupportedCurrency(code="EUR", name="Euro", symbol="€"),
    "GBP": SupportedCurrency(code="GBP", name="British Pound", symbol="£"),
    "JPY": SupportedCurrency(code="JPY", name="Japanese Yen", symbol="¥"),
    "CNY": SupportedCurrency(code="CNY", name="Chinese Yuan", symbol="¥"),
    "TWD": SupportedCurrency(code="TWD", name="Taiwan Dollar", symbol="NT$"),
    "HKD": SupportedCurrency(code="HKD", name="Hong Kong Dollar", symbol="HK$"),
    "KRW": SupportedCurrency(code="KRW", name="South Korean Won", symbol="₩"),
    "AUD": SupportedCurrency(code="AUD", name="Australian Dollar", symbol="$"),
    "NZD": SupportedCurrency(code="NZD", name="New Zealand Dollar", symbol="$"),
    "SGD": SupportedCurrency(code="SGD", name="Singapore Dollar", symbol="$"),
    "CHF": SupportedCurrency(code="CHF", name="Swiss Franc", symbol="CHF"),
    "MXN": SupportedCurrency(code="MXN", name="Mexican Peso", symbol="$"),
    "SEK": SupportedCurrency(code="SEK", name="Swedish Krona", symbol="kr"),
    "DKK": SupportedCurrency(code="DKK", name="Danish Krone", symbol="kr"),
}

# Fallback rates (approximate relative to USD as 1.0, for when API is unavailable)
FALLBACK_RATES = {
    "USD": 1.0,
    "CAD": 1.35,
    "EUR": 0.92,
    "GBP": 0.79,
    "JPY": 155.0,
    "CNY": 7.25,
    "TWD": 32.0,
    "HKD": 7.8,
    "KRW": 1380.0,
    "AUD": 1.5,
    "NZD": 1.65,
    "SGD": 1.35,
    "CHF": 0.9,
    "MXN": 18.0,
    "SEK": 10.5,
    "DKK": 6.9,
}


class ExchangeRateService:
    """Service for currency exchange rate operations."""
    
    CACHE_DURATION_HOURS = 1
    
    @staticmethod
    async def get_cached_rates(base_currency: str = "USD") -> Optional[Dict]:
        """Get cached exchange rates from database."""
        collection = get_exchange_rates_collection()
        
        cached = await collection.find_one({"_id": f"latest_rates_{base_currency.upper()}"})
        
        if cached:
            cached_time = cached.get("timestamp")
            if cached_time:
                age = datetime.utcnow() - cached_time
                if age < timedelta(hours=ExchangeRateService.CACHE_DURATION_HOURS):
                    return cached.get("rates")
        
        return None
    
    @staticmethod
    async def cache_rates(rates: Dict, base_currency: str = "USD"):
        """Cache exchange rates to database."""
        collection = get_exchange_rates_collection()
        
        await collection.update_one(
            {"_id": f"latest_rates_{base_currency.upper()}"},
            {
                "$set": {
                    "rates": rates,
                    "timestamp": datetime.utcnow()
                }
            },
            upsert=True
        )
    
    @staticmethod
    async def fetch_rates_from_api(base_currency: str = "USD") -> Optional[Dict]:
        """Fetch exchange rates from external API."""
        # Using exchangerate-api.com (free tier available)
        api_key = settings.exchange_rate_api_key
        
        if not api_key or api_key == "your_exchange_rate_api_key_here":
            # Use fallback rates if no API key
            return None
        
        try:
            url = f"https://v6.exchangerate-api.com/v6/{api_key}/latest/{base_currency}"
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, timeout=10.0)
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("result") == "success":
                        return data.get("conversion_rates", {})
        except Exception as e:
            print(f"Error fetching exchange rates: {e}")
        
        return None
    
    @staticmethod
    async def get_exchange_rates(base_currency: str = "USD") -> Dict[str, float]:
        """Get current exchange rates (from cache, API, or fallback)."""
        base_currency = base_currency.upper()
        # Try cache first
        cached = await ExchangeRateService.get_cached_rates(base_currency)
        if cached:
            return cached
        
        # Try API
        api_rates = await ExchangeRateService.fetch_rates_from_api(base_currency)
        if api_rates:
            await ExchangeRateService.cache_rates(api_rates, base_currency)
            return api_rates
        
        # Use fallback rates
        if base_currency != "USD":
            base_rate = FALLBACK_RATES.get(base_currency, 1.0)
            return {cur: round(rate / base_rate, 6) for cur, rate in FALLBACK_RATES.items()}
            
        return FALLBACK_RATES
    
    @staticmethod
    async def convert(
        amount: float,
        from_currency: str,
        to_currency: str
    ) -> ExchangeRateResponse:
        """Convert an amount from one currency to another."""
        from_currency = from_currency.upper()
        to_currency = to_currency.upper()
        
        rates = await ExchangeRateService.get_exchange_rates("USD")
        
        # Convert to USD first (as base), then to target currency
        if from_currency == "USD":
            amount_in_usd = amount
        else:
            from_rate = rates.get(from_currency, 1.0)
            amount_in_usd = amount / from_rate
        
        if to_currency == "USD":
            converted = amount_in_usd
        else:
            to_rate = rates.get(to_currency, 1.0)
            converted = amount_in_usd * to_rate
        
        # Calculate direct exchange rate
        from_rate = rates.get(from_currency, 1.0)
        to_rate = rates.get(to_currency, 1.0)
        
        if from_currency == "USD":
            exchange_rate = to_rate
        elif to_currency == "USD":
            exchange_rate = 1 / from_rate
        else:
            exchange_rate = to_rate / from_rate
        
        return ExchangeRateResponse(
            original_amount=amount,
            converted_amount=round(converted, 2),
            from_currency=from_currency,
            to_currency=to_currency,
            exchange_rate=round(exchange_rate, 6),
            last_updated=datetime.utcnow()
        )
    
    @staticmethod
    def get_supported_currencies() -> List[SupportedCurrency]:
        """Get list of supported currencies."""
        return list(SUPPORTED_CURRENCIES.values())


exchange_service = ExchangeRateService()
