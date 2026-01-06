"""
Exchange Rate API Routes
"""
from fastapi import APIRouter, Query
from typing import List
from app.models import ExchangeRateRequest, ExchangeRateResponse, SupportedCurrency
from app.services.exchange_service import exchange_service

router = APIRouter(prefix="/exchange", tags=["Exchange Rates"])


@router.get("/currencies", response_model=List[SupportedCurrency])
async def get_supported_currencies():
    """
    獲取支援的貨幣清單
    
    Get list of all supported currencies for conversion.
    """
    return exchange_service.get_supported_currencies()


@router.get("/rates")
async def get_exchange_rates(
    base: str = Query("CAD", description="Base currency code")
):
    """
    獲取匯率
    
    Get current exchange rates for all supported currencies.
    Rates are cached for 1 hour.
    """
    rates = await exchange_service.get_exchange_rates(base.upper())
    return {
        "base": base.upper(),
        "rates": rates
    }


@router.post("/convert", response_model=ExchangeRateResponse)
async def convert_currency(request: ExchangeRateRequest):
    """
    貨幣換算
    
    Convert an amount from one currency to another.
    
    Common use cases:
    - CAD to TWD (Canadian Dollar to Taiwan Dollar)
    - USD to CAD
    - EUR to CAD
    """
    return await exchange_service.convert(
        amount=request.amount,
        from_currency=request.from_currency,
        to_currency=request.to_currency
    )


@router.get("/quick-convert")
async def quick_convert(
    amount: float = Query(..., gt=0, description="Amount to convert"),
    from_currency: str = Query("CAD", description="Source currency"),
    to_currency: str = Query("TWD", description="Target currency")
):
    """
    快速換算
    
    Quick currency conversion via GET request.
    Useful for simple conversions without full request body.
    """
    result = await exchange_service.convert(
        amount=amount,
        from_currency=from_currency,
        to_currency=to_currency
    )
    
    return {
        "original": f"{result.original_amount} {result.from_currency}",
        "converted": f"{result.converted_amount} {result.to_currency}",
        "rate": result.exchange_rate
    }
