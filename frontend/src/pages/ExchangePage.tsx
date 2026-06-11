import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowRightLeft, Loader2, RefreshCw } from 'lucide-react';
import { exchangeApi } from '../services/api';
import type { SupportedCurrency } from '../types';

export default function ExchangePage() {
  const [amount, setAmount] = useState('100');
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('EUR');

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

  // Common currency pairs
  const commonPairs = [
    { from: 'USD', to: 'TWD', label: '美元 → 台幣' },
    { from: 'USD', to: 'EUR', label: '美元 → 歐元' },
    { from: 'EUR', to: 'USD', label: '歐元 → 美元' },
    { from: 'USD', to: 'JPY', label: '美元 → 日圓' },
    { from: 'EUR', to: 'JPY', label: '歐元 → 日圓' },
    { from: 'USD', to: 'CNY', label: '美元 → 人民幣' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            💱 匯率換算
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            快速換算各國貨幣，讓您的旅遊預算更清晰
          </p>
        </div>

        {/* Main Converter */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
          {/* From Currency */}
          <div className="p-6 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-950/20 dark:to-primary-900/30">
            <label className="block text-sm font-medium text-gray-600 dark:text-primary-300 mb-2">
              換算金額
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1 text-3xl font-bold bg-transparent border-none focus:outline-none text-gray-900 dark:text-gray-100"
                placeholder="0"
              />
              <select
                value={fromCurrency}
                onChange={(e) => setFromCurrency(e.target.value)}
                className="text-lg font-semibold bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:outline-none"
              >
                {currencies?.map((c: SupportedCurrency) => (
                  <option key={c.code} value={c.code} className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
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
                      ? 'bg-primary-500 text-white'
                      : 'bg-white dark:bg-gray-750 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-650'
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
              className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-primary-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary-600 transition-colors"
            >
              <ArrowRightLeft size={20} className="rotate-90" />
            </button>
          </div>

          {/* To Currency */}
          <div className="p-6 bg-gradient-to-r from-forest-50 to-forest-100 dark:from-forest-950/20 dark:to-forest-900/30">
            <label className="block text-sm font-medium text-gray-600 dark:text-forest-300 mb-2">
              換算結果
            </label>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                {isLoadingRates ? (
                  <Loader2 className="animate-spin text-gray-400" size={32} />
                ) : (
                  <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {convertedAmount()}
                  </span>
                )}
              </div>
              <select
                value={toCurrency}
                onChange={(e) => setToCurrency(e.target.value)}
                className="text-lg font-semibold bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg px-4 py-2 focus:ring-2 focus:ring-forest-500 focus:outline-none"
              >
                {currencies?.map((c: SupportedCurrency) => (
                  <option key={c.code} value={c.code} className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                    {c.code}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Rate Display */}
          <div className="p-4 bg-gray-50 dark:bg-gray-850/80 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">1 {fromCurrency}</span>
              <span className="mx-2">=</span>
              <span className="font-bold text-gray-900 dark:text-gray-100">
                {getRate().toFixed(4)} {toCurrency}
              </span>
            </div>
            <button
              onClick={() => refetchRates()}
              className="flex items-center space-x-1 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
            >
              <RefreshCw size={14} />
              <span>更新匯率</span>
            </button>
          </div>
        </div>

        {/* Common Pairs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">常用換算</h3>
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
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/20 text-primary-700 dark:text-primary-300'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-650 text-gray-650 dark:text-gray-300'
                }`}
              >
                <span className="block font-medium">{pair.label}</span>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {pair.from} → {pair.to}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div className="mt-6 bg-primary-50 dark:bg-primary-950/10 rounded-xl p-6 border border-primary-100 dark:border-primary-900/30">
          <h3 className="font-semibold text-primary-800 dark:text-primary-300 mb-3">💡 旅遊小提醒</h3>
          <ul className="space-y-2 text-sm text-primary-700 dark:text-primary-450">
            <li>• 出發前建議準備少量目的地現金，以備不時之需</li>
            <li>• 信用卡與行動支付已日漸普及，但部分地區小店仍僅收現金</li>
            <li>• 建議在銀行或正規兌換處換匯，避免高額手續費</li>
            <li>• 注意各國小費文化：部分國家/地區（如美加）餐廳需要給小費，而日本、歐洲多數已含服務費</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
