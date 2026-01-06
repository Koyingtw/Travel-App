import { useState, useEffect } from 'react';
import { X, Hotel, Clock, MapPin, Check } from 'lucide-react';
import PlaceAutocomplete from './PlaceAutocomplete';
import type { Coordinates } from '../types';

interface PlaceResult {
  name: string;
  address: string;
  coordinates?: Coordinates;
  rating?: number;
}

interface AccommodationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (accommodation: {
    place_name: string;
    address?: string;
    coordinates?: Coordinates;
    notes?: string;
    time: string;
  }) => void;
  currentAccommodation?: {
    place_name: string;
    address?: string;
    coordinates?: Coordinates;
    notes?: string;
    time: string;
  } | null;
}

export default function AccommodationModal({ 
  isOpen, 
  onClose, 
  onSave,
  currentAccommodation 
}: AccommodationModalProps) {
  const [formData, setFormData] = useState({
    place_name: '',
    address: '',
    coordinates: null as Coordinates | null,
    notes: '',
    time: '22:00',
  });
  const [placeSelected, setPlaceSelected] = useState(false);

  useEffect(() => {
    if (currentAccommodation) {
      setFormData({
        place_name: currentAccommodation.place_name,
        address: currentAccommodation.address || '',
        coordinates: currentAccommodation.coordinates || null,
        notes: currentAccommodation.notes || '',
        time: currentAccommodation.time,
      });
      setPlaceSelected(!!currentAccommodation.coordinates);
    } else {
      setFormData({
        place_name: '',
        address: '',
        coordinates: null,
        notes: '',
        time: '22:00',
      });
      setPlaceSelected(false);
    }
  }, [currentAccommodation, isOpen]);

  const handlePlaceSelect = (place: PlaceResult) => {
    if (place.coordinates) {
      setFormData({
        ...formData,
        place_name: place.name,
        address: place.address,
        coordinates: place.coordinates,
      });
      setPlaceSelected(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.place_name.trim()) return;

    onSave({
      place_name: formData.place_name,
      address: formData.address || undefined,
      coordinates: formData.coordinates || undefined,
      notes: formData.notes || undefined,
      time: formData.time,
    });
    onClose();
  };

  const handleClose = () => {
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
        <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl dark:shadow-gray-900/50 max-w-md w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-800">
            <div className="flex items-center space-x-2">
              <Hotel className="text-blue-600 dark:text-blue-400" size={24} />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">設定當日住宿</h2>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50">
            {/* Place Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                住宿地點 *
              </label>
              <PlaceAutocomplete
                value={formData.place_name}
                onChange={(value) => {
                  setFormData({ ...formData, place_name: value });
                  if (placeSelected) setPlaceSelected(false);
                }}
                onPlaceSelect={handlePlaceSelect}
                placeholder="輸入飯店名稱或地址..."
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                搜尋並選擇住宿地點
              </p>
            </div>

            {/* Selected place info */}
            {placeSelected && formData.coordinates && (
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
                </div>
              </div>
            )}

            {/* Check-in Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                入住時間
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
                <select
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-blue-500 appearance-none"
                >
                  <option value="18:00">18:00</option>
                  <option value="19:00">19:00</option>
                  <option value="20:00">20:00</option>
                  <option value="21:00">21:00</option>
                  <option value="22:00">22:00</option>
                  <option value="23:00">23:00</option>
                </select>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                住宿會自動安排在當日行程最後
              </p>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                備註
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="訂房資訊、確認碼等..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-blue-500 resize-none"
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
                disabled={!formData.place_name.trim()}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white rounded-lg hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
              >
                <Hotel size={18} />
                <span>設定住宿</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
