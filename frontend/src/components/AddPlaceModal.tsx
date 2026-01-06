import { useState } from 'react';
import { Plus, X, Clock, MapPin, Check } from 'lucide-react';
import PlaceAutocomplete from './PlaceAutocomplete';
import type { BacklogPlace, PlaceCategory } from '../types';

interface AddPlaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (place: Omit<BacklogPlace, 'id'>) => void;
}

const categories: { value: PlaceCategory; label: string; emoji: string }[] = [
  { value: 'nature', label: '自然景觀', emoji: '🏔️' },
  { value: 'museum', label: '博物館', emoji: '🏛️' },
  { value: 'restaurant', label: '餐廳', emoji: '🍽️' },
  { value: 'hotel', label: '住宿', emoji: '🏨' },
  { value: 'shopping', label: '購物', emoji: '🛍️' },
  { value: 'entertainment', label: '娛樂', emoji: '🎭' },
  { value: 'landmark', label: '地標', emoji: '🗼' },
  { value: 'transportation', label: '交通', emoji: '🚌' },
  { value: 'other', label: '其他', emoji: '📍' },
];

// Map Google place types to our categories
function mapGoogleTypeToCategory(types: string[]): PlaceCategory {
  const typeMap: Record<string, PlaceCategory> = {
    // Nature
    'natural_feature': 'nature',
    'park': 'nature',
    'campground': 'nature',
    // Museums
    'museum': 'museum',
    'art_gallery': 'museum',
    // Restaurants
    'restaurant': 'restaurant',
    'cafe': 'restaurant',
    'bar': 'restaurant',
    'bakery': 'restaurant',
    'food': 'restaurant',
    'meal_takeaway': 'restaurant',
    'meal_delivery': 'restaurant',
    // Hotels
    'lodging': 'hotel',
    'hotel': 'hotel',
    // Shopping
    'shopping_mall': 'shopping',
    'store': 'shopping',
    'supermarket': 'shopping',
    'clothing_store': 'shopping',
    // Entertainment
    'amusement_park': 'entertainment',
    'aquarium': 'entertainment',
    'zoo': 'entertainment',
    'movie_theater': 'entertainment',
    'stadium': 'entertainment',
    'casino': 'entertainment',
    'night_club': 'entertainment',
    'bowling_alley': 'entertainment',
    // Landmarks
    'tourist_attraction': 'landmark',
    'point_of_interest': 'landmark',
    'place_of_worship': 'landmark',
    'church': 'landmark',
    'mosque': 'landmark',
    'synagogue': 'landmark',
    'hindu_temple': 'landmark',
    // Transportation
    'airport': 'transportation',
    'bus_station': 'transportation',
    'train_station': 'transportation',
    'transit_station': 'transportation',
    'subway_station': 'transportation',
    'taxi_stand': 'transportation',
  };

  for (const type of types) {
    if (typeMap[type]) {
      return typeMap[type];
    }
  }
  return 'other';
}

export default function AddPlaceModal({ isOpen, onClose, onAdd }: AddPlaceModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    duration: 60,
    category: 'other' as PlaceCategory,
    notes: '',
    priority: 0,
    lat: null as number | null,
    lng: null as number | null,
    rating: null as number | null,
  });
  
  const [placeSelected, setPlaceSelected] = useState(false);

  const handlePlaceSelect = (place: {
    placeId: string;
    name: string;
    address: string;
    lat: number;
    lng: number;
    types: string[];
    rating?: number;
  }) => {
    const detectedCategory = mapGoogleTypeToCategory(place.types);
    
    setFormData({
      ...formData,
      name: place.name,
      address: place.address,
      lat: place.lat,
      lng: place.lng,
      category: detectedCategory,
      rating: place.rating || null,
    });
    setPlaceSelected(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) return;

    const place: Omit<BacklogPlace, 'id'> = {
      name: formData.name.trim(),
      address: formData.address.trim() || undefined,
      duration: formData.duration,
      category: formData.category,
      notes: formData.notes.trim() || undefined,
      priority: formData.priority,
      coordinates: formData.lat !== null && formData.lng !== null
        ? { lat: formData.lat, lng: formData.lng }
        : undefined,
      rating: formData.rating || undefined,
    };

    onAdd(place);
    
    // Reset form
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      duration: 60,
      category: 'other',
      notes: '',
      priority: 0,
      lat: null,
      lng: null,
      rating: null,
    });
    setPlaceSelected(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 dark:bg-black/70 transition-opacity"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl dark:shadow-gray-900/50 max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-750">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">新增景點</h2>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50">
            {/* Place Search with Autocomplete */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                搜尋景點 *
              </label>
              <PlaceAutocomplete
                value={formData.name}
                onChange={(value) => {
                  setFormData({ ...formData, name: value });
                  if (placeSelected) setPlaceSelected(false);
                }}
                onPlaceSelect={handlePlaceSelect}
                placeholder="輸入地點名稱搜尋..."
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                輸入地點名稱，選擇建議的地點自動填入座標
              </p>
            </div>

            {/* Selected place info */}
            {placeSelected && formData.lat !== null && formData.lng !== null && (
              <div className="p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center text-green-700 dark:text-green-300 mb-2">
                  <Check size={16} className="mr-2" />
                  <span className="text-sm font-medium">已選取地點</span>
                </div>
                <div className="text-sm text-green-800 dark:text-green-200 space-y-1">
                  <div className="flex items-start">
                    <MapPin size={14} className="mr-2 mt-0.5 flex-shrink-0" />
                    <span className="truncate">{formData.address}</span>
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-400">
                    📍 {formData.lat.toFixed(6)}, {formData.lng.toFixed(6)}
                    {formData.rating && (
                      <span className="ml-2">⭐ {formData.rating.toFixed(1)}</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Manual coordinate input (collapsible) */}
            {!placeSelected && (
              <details className="group">
                <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 list-none flex items-center">
                  <span className="mr-2">▶</span>
                  <span className="group-open:hidden">手動輸入座標（選填）</span>
                  <span className="hidden group-open:inline">手動輸入座標</span>
                </summary>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      緯度 (Lat)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.lat ?? ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        lat: e.target.value ? parseFloat(e.target.value) : null 
                      })}
                      placeholder="51.4968"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-maple-500 dark:focus:ring-maple-600 focus:border-maple-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      經度 (Lng)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.lng ?? ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        lng: e.target.value ? parseFloat(e.target.value) : null 
                      })}
                      placeholder="-115.9281"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-maple-500 dark:focus:ring-maple-600 focus:border-maple-500 text-sm"
                    />
                  </div>
                </div>
              </details>
            )}

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                預計停留時間
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
                <select
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-maple-500 dark:focus:ring-maple-600 focus:border-maple-500 appearance-none"
                >
                  <option value={30}>30 分鐘</option>
                  <option value={60}>1 小時</option>
                  <option value={90}>1.5 小時</option>
                  <option value={120}>2 小時</option>
                  <option value={180}>3 小時</option>
                  <option value={240}>4 小時</option>
                  <option value={360}>6 小時</option>
                  <option value={480}>整天</option>
                </select>
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                類別
                {placeSelected && (
                  <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">（已自動偵測）</span>
                )}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {categories.map(({ value, label, emoji }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: value })}
                    className={`flex items-center justify-center space-x-1 px-3 py-2 rounded-lg border text-sm transition-colors ${
                      formData.category === value
                        ? 'border-maple-500 dark:border-maple-600 bg-maple-50 dark:bg-maple-900/30 text-maple-700 dark:text-maple-300'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <span>{emoji}</span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                優先程度
              </label>
              <div className="flex space-x-2">
                {[0, 1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setFormData({ ...formData, priority: level })}
                    className={`flex-1 py-2 rounded-lg border text-sm transition-colors ${
                      formData.priority === level
                        ? 'border-maple-500 dark:border-maple-600 bg-maple-50 dark:bg-maple-900/30 text-maple-700 dark:text-maple-300'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {level === 0 ? '無' : '⭐'.repeat(level)}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                備註
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="任何想記下的事項..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-maple-500 dark:focus:ring-maple-600 focus:border-maple-500 resize-none"
              />
            </div>

            {/* Submit */}
            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={!formData.name.trim()}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-maple-500 to-maple-600 dark:from-maple-600 dark:to-maple-700 text-white rounded-lg hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
              >
                <Plus size={18} />
                <span>新增景點</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
