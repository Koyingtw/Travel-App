import { useState, useEffect, useCallback } from 'react';
import { useTripStore } from '../store/tripStore';
import { FileText, Save } from 'lucide-react';

export default function NoteEditor() {
  const { currentTrip, selectedDate, updateDailyNotes } = useTripStore();
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Get current day's notes
  useEffect(() => {
    if (!currentTrip || !selectedDate) return;
    
    const dayItinerary = currentTrip.itinerary.find((d) => d.date === selectedDate);
    setContent(dayItinerary?.daily_notes || '');
  }, [currentTrip, selectedDate]);

  // Debounced save
  const saveNotes = useCallback(async (notes: string) => {
    if (!selectedDate) return;
    setIsSaving(true);
    await updateDailyNotes(selectedDate, notes);
    setTimeout(() => setIsSaving(false), 500);
  }, [selectedDate, updateDailyNotes]);

  // Auto-save on change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (content !== undefined) {
        saveNotes(content);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [content, saveNotes]);

  if (!selectedDate) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <p className="text-gray-400 dark:text-gray-500 text-center">請選擇日期</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-700">
        <div className="flex items-center space-x-2">
          <FileText size={18} className="text-primary-500" />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">當日備註</h3>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
          {isSaving ? (
            <>
              <Save size={14} className="animate-pulse" />
              <span>儲存中...</span>
            </>
          ) : (
            <span>自動儲存</span>
          )}
        </div>
      </div>
      
      <div className="p-4 bg-gray-50 dark:bg-gray-900/50">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="記錄今日的重要事項、提醒或心得...&#10;&#10;例如：&#10;• 記得帶護照&#10;• 10:00 預約了餐廳&#10;• 天氣預報說可能下雨，帶傘"
          className="w-full h-48 p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-600 focus:border-primary-500 dark:focus:border-primary-600 outline-none"
        />
      </div>
    </div>
  );
}
