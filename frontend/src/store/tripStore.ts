import { create } from 'zustand';
import type { Trip, BacklogPlace, ItineraryItem } from '../types';
import { tripApi, routeApi } from '../services/api';
import toast from 'react-hot-toast';

interface TripStore {
  // State
  currentTrip: Trip | null;
  isLoading: boolean;
  error: string | null;
  selectedDate: string | null;

  // Actions
  setCurrentTrip: (trip: Trip | null) => void;
  setSelectedDate: (date: string | null) => void;
  fetchTrip: (tripId: string) => Promise<void>;
  
  // Backlog operations
  addBacklogPlace: (place: Omit<BacklogPlace, 'id'>) => Promise<void>;
  addBacklogPlaces: (places: Omit<BacklogPlace, 'id'>[]) => Promise<void>;
  removeBacklogPlace: (placeId: string) => Promise<void>;
  updateBacklogPlaces: (places: BacklogPlace[]) => void;
  
  // Itinerary operations
  moveToItinerary: (place: BacklogPlace, date: string, time: string) => Promise<void>;
  moveToBacklog: (item: ItineraryItem, date: string) => Promise<void>;
  addCustomActivity: (date: string, activity: Omit<ItineraryItem, 'id' | 'order'>) => Promise<void>;
  setDayAccommodation: (date: string, accommodation: Omit<ItineraryItem, 'id' | 'order'>) => Promise<void>;
  reorderItinerary: (date: string, items: ItineraryItem[]) => Promise<void>;
  updateItineraryItem: (date: string, itemId: string, updates: Partial<ItineraryItem>) => Promise<void>;
  removeItineraryItem: (date: string, itemId: string) => Promise<void>;
  
  // Route optimization
  optimizeRoute: (date: string) => Promise<void>;
  
  // Notes & Budget
  updateDailyNotes: (date: string, notes: string) => Promise<void>;
  
  // Save trip
  saveTrip: () => Promise<void>;
}

export const useTripStore = create<TripStore>((set, get) => ({
  currentTrip: null,
  isLoading: false,
  error: null,
  selectedDate: null,

  setCurrentTrip: (trip) => set({ currentTrip: trip }),
  
  setSelectedDate: (date) => set({ selectedDate: date }),

  fetchTrip: async (tripId: string) => {
    set({ isLoading: true, error: null });
    try {
      const trip = await tripApi.getById(tripId);
      console.log('Fetched trip:', trip);
      console.log('Trip _id:', trip._id);
      set({ currentTrip: trip, isLoading: false });
      
      // Auto-select first date
      if (trip.itinerary.length > 0) {
        set({ selectedDate: trip.itinerary[0].date });
      }
    } catch (error) {
      set({ error: 'Failed to fetch trip', isLoading: false });
      toast.error('無法載入行程');
    }
  },

  addBacklogPlace: async (place) => {
    const { currentTrip } = get();
    console.log('addBacklogPlace - currentTrip:', currentTrip);
    console.log('addBacklogPlace - currentTrip._id:', currentTrip?._id);
    
    if (!currentTrip || !currentTrip._id) {
      toast.error('行程尚未載入，請稍候');
      return;
    }

    try {
      const response = await tripApi.addBacklogPlace(currentTrip._id, place);
      if (response.success && response.data) {
        const newPlace: BacklogPlace = {
          ...place,
          id: response.data.place_id,
          created_at: new Date().toISOString(),
        } as BacklogPlace;
        
        const updatedBacklog = [...currentTrip.backlog_places, newPlace]
          .sort((a, b) => {
            const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return timeB - timeA; // 最新的在最前面
          });
        
        set({
          currentTrip: {
            ...currentTrip,
            backlog_places: updatedBacklog,
          },
        });
        toast.success('已新增景點');
      }
    } catch (error) {
      toast.error('新增景點失敗');
    }
  },

  addBacklogPlaces: async (places) => {
    const { currentTrip } = get();
    if (!currentTrip || !currentTrip._id) {
      toast.error('行程尚未載入，請稍候');
      return;
    }

    const newPlaces: BacklogPlace[] = [];
    let successCount = 0;

    for (const place of places) {
      try {
        const response = await tripApi.addBacklogPlace(currentTrip._id, place);
        if (response.success && response.data) {
          newPlaces.push({
            ...place,
            id: response.data.place_id,
            created_at: new Date().toISOString(),
          } as BacklogPlace);
          successCount++;
        }
      } catch (error) {
        console.error('Failed to add place:', place.name);
      }
    }

    if (newPlaces.length > 0) {
      const updatedBacklog = [...currentTrip.backlog_places, ...newPlaces]
        .sort((a, b) => {
          const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return timeB - timeA; // 最新的在最前面
        });
      
      set({
        currentTrip: {
          ...currentTrip,
          backlog_places: updatedBacklog,
        },
      });
      toast.success(`已匯入 ${successCount} 個景點`);
    } else {
      toast.error('匯入景點失敗');
    }
  },

  removeBacklogPlace: async (placeId) => {
    const { currentTrip } = get();
    if (!currentTrip || !currentTrip._id) return;

    try {
      await tripApi.removeBacklogPlace(currentTrip._id, placeId);
      set({
        currentTrip: {
          ...currentTrip,
          backlog_places: currentTrip.backlog_places.filter((p) => p.id !== placeId),
        },
      });
      toast.success('已移除景點');
    } catch (error) {
      toast.error('移除景點失敗');
    }
  },

  updateBacklogPlaces: (places) => {
    const { currentTrip } = get();
    if (!currentTrip) return;
    
    set({
      currentTrip: {
        ...currentTrip,
        backlog_places: places,
      },
    });
  },

  moveToItinerary: async (place, date, time) => {
    const { currentTrip } = get();
    if (!currentTrip || !currentTrip._id) return;

    // Find the day to calculate the correct time
    const dayItinerary = currentTrip.itinerary.find((d) => d.date === date);
    if (!dayItinerary) return;

    // 分離住宿項目
    const accommodationItems = dayItinerary.items.filter((item) => item.id.startsWith('accommodation-'));
    const regularItems = dayItinerary.items.filter((item) => !item.id.startsWith('accommodation-'));

    // 計算新項目的開始時間：接在最後一個一般行程後面
    let actualStartTime = time;
    if (regularItems.length > 0) {
      // 找出最後一個行程的結束時間
      const lastItem = regularItems[regularItems.length - 1];
      if (lastItem.end_time) {
        actualStartTime = lastItem.end_time;
      }
    }

    // Calculate end time based on actual start time
    const [hours, minutes] = actualStartTime.split(':').map(Number);
    const endMinutes = hours * 60 + minutes + place.duration;
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    const endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;

    const newItem: ItineraryItem = {
      id: `temp-${Date.now()}`,
      time: actualStartTime,
      end_time: endTime,
      place_name: place.name,
      address: place.address,
      coordinates: place.coordinates,
      duration: place.duration,
      notes: place.notes,
      category: place.category,
      completed: false,
      order: 0,
    };

    // Find the day and add the item
    const updatedItinerary = currentTrip.itinerary.map((day) => {
      if (day.date === date) {
        // 將新項目加入一般行程（不需要排序，直接放在最後）
        const updatedRegularItems = [...regularItems, newItem];
        
        // 合併：一般行程在前，住宿在後
        const items = [...updatedRegularItems, ...accommodationItems];
        
        // Update order
        items.forEach((item, index) => {
          item.order = index;
        });
        return { ...day, items };
      }
      return day;
    });

    // Remove from backlog
    const updatedBacklog = currentTrip.backlog_places.filter((p) => p.id !== place.id);

    set({
      currentTrip: {
        ...currentTrip,
        itinerary: updatedItinerary,
        backlog_places: updatedBacklog,
      },
    });

    // Save to backend
    try {
      const dayItinerary = updatedItinerary.find((d) => d.date === date);
      if (dayItinerary) {
        await tripApi.updateDayItinerary(currentTrip._id, date, dayItinerary.items);
        await tripApi.update(currentTrip._id, { backlog_places: updatedBacklog });
      }
      toast.success('已加入行程');
    } catch (error) {
      toast.error('更新行程失敗');
    }
  },

  moveToBacklog: async (item, date) => {
    const { currentTrip } = get();
    if (!currentTrip) return;

    const newPlace: BacklogPlace = {
      id: `backlog-${Date.now()}`,
      name: item.place_name,
      address: item.address,
      coordinates: item.coordinates,
      duration: item.duration,
      category: item.category,
      notes: item.notes,
      priority: 0,
    };

    // Remove from itinerary
    const updatedItinerary = currentTrip.itinerary.map((day) => {
      if (day.date === date) {
        return {
          ...day,
          items: day.items.filter((i) => i.id !== item.id),
        };
      }
      return day;
    });

    set({
      currentTrip: {
        ...currentTrip,
        itinerary: updatedItinerary,
        backlog_places: [...currentTrip.backlog_places, newPlace],
      },
    });

    toast.success('已移回候選清單');
  },

  addCustomActivity: async (date, activity) => {
    const { currentTrip } = get();
    if (!currentTrip || !currentTrip._id) return;

    const dayItinerary = currentTrip.itinerary.find((d) => d.date === date);
    if (!dayItinerary) return;

    const newItem: ItineraryItem = {
      ...activity,
      id: `custom-${Date.now()}`,
      order: dayItinerary.items.length,
    };

    const updatedItinerary = currentTrip.itinerary.map((day) => {
      if (day.date === date) {
        return {
          ...day,
          items: [...day.items, newItem],
        };
      }
      return day;
    });

    set({
      currentTrip: {
        ...currentTrip,
        itinerary: updatedItinerary,
      },
    });

    try {
      await tripApi.updateDayItinerary(currentTrip._id, date, [...dayItinerary.items, newItem]);
      toast.success('已新增自訂活動');
    } catch (error) {
      toast.error('新增活動失敗');
    }
  },

  setDayAccommodation: async (date, accommodation) => {
    const { currentTrip } = get();
    if (!currentTrip || !currentTrip._id) return;

    const dayItinerary = currentTrip.itinerary.find((d) => d.date === date);
    if (!dayItinerary) return;

    // 建立住宿項目
    const newAccommodation: ItineraryItem = {
      ...accommodation,
      id: `accommodation-${Date.now()}`,
      order: 9999, // 最後排序
    };

    // 移除舊的住宿（如果存在）
    const itemsWithoutOldAccommodation = dayItinerary.items.filter(
      (item) => !item.id.startsWith('accommodation-')
    );

    // 加入新住宿
    const updatedItems = [...itemsWithoutOldAccommodation, newAccommodation];

    const updatedItinerary = currentTrip.itinerary.map((day) => {
      if (day.date === date) {
        return {
          ...day,
          items: updatedItems,
          accommodation: newAccommodation, // 同時存在 accommodation 欄位供前端使用
        };
      }
      return day;
    });

    set({
      currentTrip: {
        ...currentTrip,
        itinerary: updatedItinerary,
      },
    });

    try {
      // 使用標準的 updateDayItinerary API
      await tripApi.updateDayItinerary(currentTrip._id, date, updatedItems);
      toast.success('已設定住宿');
    } catch (error) {
      toast.error('設定住宿失敗');
      console.error('Accommodation error:', error);
    }
  },

  reorderItinerary: async (date, items) => {
    const { currentTrip } = get();
    if (!currentTrip) return;

    // Update order
    items.forEach((item, index) => {
      item.order = index;
    });

    const updatedItinerary = currentTrip.itinerary.map((day) => {
      if (day.date === date) {
        return { ...day, items };
      }
      return day;
    });

    set({
      currentTrip: {
        ...currentTrip,
        itinerary: updatedItinerary,
      },
    });

    try {
      await tripApi.updateDayItinerary(currentTrip._id, date, items);
    } catch (error) {
      toast.error('更新順序失敗');
    }
  },

  updateItineraryItem: async (date, itemId, updates) => {
    const { currentTrip } = get();
    if (!currentTrip || !currentTrip._id) return;

    const updatedItinerary = currentTrip.itinerary.map((day) => {
      if (day.date === date) {
        return {
          ...day,
          items: day.items.map((item) =>
            item.id === itemId ? { ...item, ...updates } : item
          ),
        };
      }
      return day;
    });

    set({
      currentTrip: {
        ...currentTrip,
        itinerary: updatedItinerary,
      },
    });

    // 保存到資料庫
    try {
      const dayItinerary = updatedItinerary.find((d) => d.date === date);
      if (dayItinerary) {
        await tripApi.updateDayItinerary(currentTrip._id, date, dayItinerary.items);
      }
    } catch (error) {
      toast.error('更新行程失敗');
    }
  },

  removeItineraryItem: async (date, itemId) => {
    const { currentTrip } = get();
    if (!currentTrip || !currentTrip._id) return;

    // 找到要移除的項目
    const dayItinerary = currentTrip.itinerary.find((d) => d.date === date);
    const itemToRemove = dayItinerary?.items.find((i) => i.id === itemId);
    
    if (!itemToRemove) return;

    // 檢查是否為自訂活動或住宿
    const isCustomActivity = itemToRemove.is_custom;
    const isAccommodation = itemId.startsWith('accommodation-');

    // 從行程中移除
    const updatedItinerary = currentTrip.itinerary.map((day) => {
      if (day.date === date) {
        const updatedDay = {
          ...day,
          items: day.items.filter((i) => i.id !== itemId),
        };
        // 如果移除的是住宿，清除 accommodation 欄位
        if (isAccommodation) {
          delete updatedDay.accommodation;
        }
        return updatedDay;
      }
      return day;
    });

    // 如果不是自訂活動，轉換為候選景點
    let newBacklogPlaces = currentTrip.backlog_places;
    if (!isCustomActivity && !isAccommodation) {
      const newPlace: BacklogPlace = {
        id: `backlog-${Date.now()}`,
        name: itemToRemove.place_name,
        address: itemToRemove.address,
        coordinates: itemToRemove.coordinates,
        duration: itemToRemove.duration,
        category: itemToRemove.category,
        notes: itemToRemove.notes,
        priority: 0,
      };
      newBacklogPlaces = [...currentTrip.backlog_places, newPlace];
    }

    set({
      currentTrip: {
        ...currentTrip,
        itinerary: updatedItinerary,
        backlog_places: newBacklogPlaces,
      },
    });

    try {
      // 更新行程
      const updatedDay = updatedItinerary.find((d) => d.date === date);
      if (updatedDay) {
        await tripApi.updateDayItinerary(currentTrip._id, date, updatedDay.items);
      }
      
      // 如果不是自訂活動或住宿，添加到候選清單
      if (!isCustomActivity && !isAccommodation && newBacklogPlaces.length > currentTrip.backlog_places.length) {
        const newPlace = newBacklogPlaces[newBacklogPlaces.length - 1];
        await tripApi.addBacklogPlace(currentTrip._id, newPlace);
        toast.success('已移回候選景點');
      } else if (isAccommodation) {
        toast.success('已移除住宿');
      } else {
        toast.success('已刪除活動');
      }
    } catch (error) {
      toast.error('移除行程失敗');
    }
  },

  optimizeRoute: async (date) => {
    const { currentTrip } = get();
    if (!currentTrip || !currentTrip._id) return;

    const dayItinerary = currentTrip.itinerary.find((d) => d.date === date);
    if (!dayItinerary || dayItinerary.items.length < 2) {
      toast.error('至少需要 2 個景點才能優化路徑');
      return;
    }

    // Check if all items have coordinates
    const pointsWithCoords = dayItinerary.items.filter(
      (item) => item.coordinates?.lat && item.coordinates?.lng
    );

    if (pointsWithCoords.length < 2) {
      toast.error('需要景點座標才能優化路徑');
      return;
    }

    const points = pointsWithCoords.map((item) => ({
      id: item.id,
      name: item.place_name,
      lat: item.coordinates!.lat,
      lng: item.coordinates!.lng,
    }));

    try {
      const optimized = await routeApi.optimize({ points });
      
      // Reorder items based on optimization
      const idToItem = new Map(dayItinerary.items.map((item) => [item.id, item]));
      const optimizedItems: ItineraryItem[] = [];
      
      // First add optimized items
      optimized.ordered_points.forEach((point, index) => {
        const item = idToItem.get(point.id);
        if (item) {
          optimizedItems.push({ ...item, order: index });
          idToItem.delete(point.id);
        }
      });
      
      // Add remaining items (without coordinates) at the end
      idToItem.forEach((item, _) => {
        optimizedItems.push({ ...item, order: optimizedItems.length });
      });

      // Recalculate times
      let currentTime = optimizedItems[0]?.time || '09:00';
      optimizedItems.forEach((item, index) => {
        if (index === 0) return;
        
        const prevItem = optimizedItems[index - 1];
        const [hours, mins] = currentTime.split(':').map(Number);
        const endMinutes = hours * 60 + mins + prevItem.duration + 15; // 15 min travel buffer
        const newHours = Math.floor(endMinutes / 60);
        const newMins = endMinutes % 60;
        currentTime = `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
        item.time = currentTime;
        
        const itemEndMinutes = newHours * 60 + newMins + item.duration;
        const endHours = Math.floor(itemEndMinutes / 60);
        const endMins = itemEndMinutes % 60;
        item.end_time = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
      });

      await get().reorderItinerary(date, optimizedItems);
      
      toast.success(
        `路徑已優化！總距離: ${optimized.total_distance_km} km, 預計行車時間: ${optimized.estimated_duration_minutes} 分鐘`
      );
    } catch (error) {
      toast.error('路徑優化失敗');
    }
  },

  updateDailyNotes: async (date, notes) => {
    const { currentTrip } = get();
    if (!currentTrip || !currentTrip._id) return;

    const updatedItinerary = currentTrip.itinerary.map((day) => {
      if (day.date === date) {
        return { ...day, daily_notes: notes };
      }
      return day;
    });

    set({
      currentTrip: {
        ...currentTrip,
        itinerary: updatedItinerary,
      },
    });

    try {
      await tripApi.updateDailyNotes(currentTrip._id, date, notes);
    } catch (error) {
      // Silently fail for notes (auto-save)
    }
  },

  saveTrip: async () => {
    const { currentTrip } = get();
    if (!currentTrip || !currentTrip._id) return;

    try {
      await tripApi.update(currentTrip._id, {
        backlog_places: currentTrip.backlog_places,
        itinerary: currentTrip.itinerary,
      });
      toast.success('行程已儲存');
    } catch (error) {
      toast.error('儲存失敗');
    }
  },
}));
