import { useState, useMemo } from 'react';
import { Plus, DollarSign, Check } from 'lucide-react';
import { useTripStore } from '../store/tripStore';
import { tripApi } from '../services/api';
import type { BudgetItem } from '../types';
import toast from 'react-hot-toast';

const budgetCategories = [
  { value: 'flight', label: '機票', emoji: '✈️' },
  { value: 'hotel', label: '住宿', emoji: '🏨' },
  { value: 'transport', label: '交通', emoji: '🚗' },
  { value: 'food', label: '餐飲', emoji: '🍽️' },
  { value: 'activity', label: '活動', emoji: '🎫' },
  { value: 'shopping', label: '購物', emoji: '🛍️' },
  { value: 'other', label: '其他', emoji: '📝' },
];

export default function BudgetTracker() {
  const { currentTrip, selectedDate, fetchTrip } = useTripStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState({
    item: '',
    cost: '',
    category: 'other',
    currency: 'USD',
  });

  // Get current day's budget items
  const currentBudget = useMemo(() => {
    if (!currentTrip || !selectedDate) return [];
    
    const dayItinerary = currentTrip.itinerary.find((d) => d.date === selectedDate);
    return dayItinerary?.budget_items || [];
  }, [currentTrip, selectedDate]);

  // Calculate totals
  const totals = useMemo(() => {
    const byCategory: Record<string, number> = {};
    let total = 0;
    let paid = 0;

    currentBudget.forEach((item) => {
      total += item.cost;
      if (item.paid) paid += item.cost;
      byCategory[item.category] = (byCategory[item.category] || 0) + item.cost;
    });

    return { total, paid, unpaid: total - paid, byCategory };
  }, [currentBudget]);

  const handleAddItem = async () => {
    if (!currentTrip || !selectedDate || !newItem.item || !newItem.cost) return;

    const budgetItem: Omit<BudgetItem, 'id'> = {
      item: newItem.item,
      cost: parseFloat(newItem.cost),
      currency: newItem.currency,
      category: newItem.category,
      paid: false,
    };

    try {
      await tripApi.addBudgetItem(currentTrip._id, selectedDate, budgetItem);
      await fetchTrip(currentTrip._id);
      setNewItem({ item: '', cost: '', category: 'other', currency: 'USD' });
      setIsAdding(false);
      toast.success('已新增預算項目');
    } catch (error) {
      toast.error('新增失敗');
    }
  };

  if (!selectedDate) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <p className="text-gray-400 text-center">請選擇日期</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <DollarSign size={18} className="text-primary-500" />
          <h3 className="font-semibold text-gray-900">預算追蹤</h3>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="p-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Summary */}
      <div className="p-4 bg-gradient-to-r from-primary-50 to-forest-50 border-b border-gray-100">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-gray-500 mb-1">總預算</p>
            <p className="text-lg font-bold text-gray-900">
              ${totals.total.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">已付款</p>
            <p className="text-lg font-bold text-green-600">
              ${totals.paid.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">未付款</p>
            <p className="text-lg font-bold text-orange-500">
              ${totals.unpaid.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Add Item Form */}
      {isAdding && (
        <div className="p-4 bg-gray-50 border-b border-gray-100 space-y-3">
          <input
            type="text"
            value={newItem.item}
            onChange={(e) => setNewItem({ ...newItem, item: e.target.value })}
            placeholder="項目名稱"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              value={newItem.cost}
              onChange={(e) => setNewItem({ ...newItem, cost: e.target.value })}
              placeholder="金額"
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
            <select
              value={newItem.currency}
              onChange={(e) => setNewItem({ ...newItem, currency: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="TWD">TWD</option>
              <option value="JPY">JPY</option>
              <option value="CAD">CAD</option>
            </select>
          </div>
          <select
            value={newItem.category}
            onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            {budgetCategories.map(({ value, label, emoji }) => (
              <option key={value} value={value}>
                {emoji} {label}
              </option>
            ))}
          </select>
          <div className="flex space-x-2">
            <button
              onClick={handleAddItem}
              className="flex-1 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
            >
              新增
            </button>
            <button
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* Budget Items List */}
      <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
        {currentBudget.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <DollarSign size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">尚無預算紀錄</p>
          </div>
        ) : (
          currentBudget.map((item) => {
            const category = budgetCategories.find((c) => c.value === item.category);
            return (
              <div key={item.id} className="p-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{category?.emoji || '📝'}</span>
                  <div>
                    <p className={`font-medium ${item.paid ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                      {item.item}
                    </p>
                    <p className="text-xs text-gray-500">{category?.label}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`font-semibold ${item.paid ? 'text-gray-400' : 'text-gray-900'}`}>
                    ${item.cost.toFixed(2)} {item.currency}
                  </span>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    item.paid ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {item.paid ? <Check size={12} /> : null}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
