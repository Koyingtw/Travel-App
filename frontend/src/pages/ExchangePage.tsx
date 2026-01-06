import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowRightLeft, Loader2, RefreshCw } from 'lucide-react';
import { exchangeApi } from '../services/api';
import type { SupportedCurrency } from '../types';

export default function ExchangePage() {
  const [amount, setAmount] = useState('100');
  const [fromCurrency, setFromCurrency] = useState('CAD');
  const [toCurrency, setToCurrency] = useState('TWD');

  const { data: currencies } = useQuery({
    queryKey: ['currencies'],
    queryFn: exchangeApi.getCurrencies,
  });

  const { data: rates, isLoading: isLoadingRates, refetch: refetchRates } = useQuery({
    queryKey: ['rates', fromCurrency],
    queryFn: () => exchangeApi.getRates(fromCurrency),
  });

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const convertedAmount = () => {
    if (!rates?.rates || !amount) return 0;
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum)) return 0;
    
    const rate = rates.rates[toCurrency] || 1;
    return (amountNum * rate).toFixed(2);
  };

  const getRate = () => {
    if (!rates?.rates) return 0;
    return rates.rates[toCurrency] || 0;
  };

  // Quick conversion amounts
  const quickAmounts = [10, 50, 100, 500, 1000];

  // Common currency pairs for Canada travelers
  const commonPairs = [
    { from: 'CAD', to: 'TWD', label: '加幣 → 台幣' },
    { from: 'CAD', to: 'USD', label: '加幣 → 美元' },
    { from: 'USD', to: 'CAD', label: '美元 → 加幣' },
    { from: 'CAD', to: 'JPY', label: '加幣 → 日圓' },
    { from: 'CAD', to: 'EUR', label: '加幣 → 歐元' },
    { from: 'CAD', to: 'CNY', label: '加幣 → 人民幣' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            💱 匯率換算
          </h1>
          <p className="text-gray-600">
            快速換算各國貨幣，讓您的旅遊預算更清晰
          </p>
        </div>

        {/* Main Converter */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden mb-6">
          {/* From Currency */}
          <div className="p-6 bg-gradient-to-r from-maple-50 to-maple-100">
            <label className="block text-sm font-medium text-gray-600 mb-2">
              換算金額
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1 text-3xl font-bold bg-transparent border-none focus:outline-none text-gray-900"
                placeholder="0"
              />
              <select
                value={fromCurrency}
                onChange={(e) => setFromCurrency(e.target.value)}
                className="text-lg font-semibold bg-white border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-maple-500"
              >
                {currencies?.map((c: SupportedCurrency) => (
                  <option key={c.code} value={c.code}>
                    {c.code}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Quick Amounts */}
            <div className="flex flex-wrap gap-2 mt-4">
              {quickAmounts.map((amt) => (
                <button
                  key={amt}
                  onClick={() => setAmount(amt.toString())}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    amount === amt.toString()
                      ? 'bg-maple-500 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  {amt}
                </button>
              ))}
            </div>
          </div>

          {/* Swap Button */}
          <div className="relative h-0">
            <button
              onClick={handleSwap}
              className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-maple-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-maple-600 transition-colors"
            >
              <ArrowRightLeft size={20} className="rotate-90" />
            </button>
          </div>

          {/* To Currency */}
          <div className="p-6 bg-gradient-to-r from-forest-50 to-forest-100">
            <label className="block text-sm font-medium text-gray-600 mb-2">
              換算結果
            </label>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                {isLoadingRates ? (
                  <Loader2 className="animate-spin text-gray-400" size={32} />
                ) : (
                  <span className="text-3xl font-bold text-gray-900">
                    {convertedAmount()}
                  </span>
                )}
              </div>
              <select
                value={toCurrency}
                onChange={(e) => setToCurrency(e.target.value)}
                className="text-lg font-semibold bg-white border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-forest-500"
              >
                {currencies?.map((c: SupportedCurrency) => (
                  <option key={c.code} value={c.code}>
                    {c.code}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Rate Display */}
          <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <span className="font-medium">1 {fromCurrency}</span>
              <span className="mx-2">=</span>
              <span className="font-bold text-gray-900">
                {getRate().toFixed(4)} {toCurrency}
              </span>
            </div>
            <button
              onClick={() => refetchRates()}
              className="flex items-center space-x-1 text-sm text-maple-600 hover:text-maple-700"
            >
              <RefreshCw size={14} />
              <span>更新匯率</span>
            </button>
          </div>
        </div>

        {/* Common Pairs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">常用換算</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {commonPairs.map((pair) => (
              <button
                key={`${pair.from}-${pair.to}`}
                onClick={() => {
                  setFromCurrency(pair.from);
                  setToCurrency(pair.to);
                }}
                className={`p-3 rounded-lg border text-sm text-left transition-colors ${
                  fromCurrency === pair.from && toCurrency === pair.to
                    ? 'border-maple-500 bg-maple-50 text-maple-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
              >
                <span className="block font-medium">{pair.label}</span>
                <span className="text-xs text-gray-400">
                  {pair.from} → {pair.to}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div className="mt-6 bg-maple-50 rounded-xl p-6 border border-maple-100">
          <h3 className="font-semibold text-maple-800 mb-3">💡 旅遊小提醒</h3>
          <ul className="space-y-2 text-sm text-maple-700">
            <li>• 加拿大主要使用加幣 (CAD)，美金在邊境地區也可使用</li>
            <li>• 信用卡在加拿大非常普遍，大部分商店都接受</li>
            <li>• 建議在銀行或正規兌換處換匯，避免高額手續費</li>
            <li>• 小費文化：餐廳通常 15-20%，服務業 10-15%</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
