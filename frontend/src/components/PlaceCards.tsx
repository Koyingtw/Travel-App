import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  GripVertical, 
  Clock, 
  MapPin, 
  Trash2, 
  Check,
  Plus,
  Mountain,
  Building,
  Utensils,
  Hotel,
  ShoppingBag,
  Ticket,
  Landmark,
  Bus,
  MoreHorizontal
} from 'lucide-react';
import type { BacklogPlace, ItineraryItem, PlaceCategory } from '../types';

// Category icons mapping
const categoryIcons: Record<PlaceCategory, any> = {
  nature: Mountain,
  museum: Building,
  restaurant: Utensils,
  hotel: Hotel,
  shopping: ShoppingBag,
  entertainment: Ticket,
  landmark: Landmark,
  transportation: Bus,
  other: MoreHorizontal,
};

const categoryColors: Record<PlaceCategory, string> = {
  nature: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  museum: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
  restaurant: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
  hotel: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  shopping: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300',
  entertainment: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
  landmark: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  transportation: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
  other: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
};

// ============ Backlog Place Card ============

interface BacklogPlaceCardProps {
  place: BacklogPlace;
  onRemove?: () => void;
  onAddToItinerary?: () => void;
}

export function BacklogPlaceCard({ place, onRemove, onAddToItinerary }: BacklogPlaceCardProps) {
  const CategoryIcon = categoryIcons[place.category] || categoryIcons.other;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 shadow-sm dark:shadow-gray-900/50 card-hover transition-all">
      <div className="flex items-start space-x-3">
        {/* Add to Itinerary Button */}
        {onAddToItinerary && (
          <button
            onClick={onAddToItinerary}
            className="mt-1 p-1 text-green-500 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/30 rounded transition-colors"
            title="加入今日行程"
          >
            <Plus size={18} />
          </button>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <span className={`p-1.5 rounded-lg flex-shrink-0 ${categoryColors[place.category]}`}>
                <CategoryIcon size={14} />
              </span>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 break-words">{place.name}</h4>
            </div>
            
            {onRemove && (
              <button
                onClick={onRemove}
                className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors flex-shrink-0"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>

          {place.address && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start space-x-1 mt-1 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <MapPin size={12} className="flex-shrink-0 mt-0.5" />
              <span className="break-words">{place.address}</span>
            </a>
          )}

          <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center space-x-1">
              <Clock size={12} />
              <span>{place.duration} 分鐘</span>
            </span>
            {place.rating && (
              <span className="flex items-center space-x-1">
                <span>⭐</span>
                <span>{place.rating}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ Itinerary Item Card ============

interface ItineraryItemCardProps {
  item: ItineraryItem;
  onRemove?: () => void;
  onToggleComplete?: () => void;
  isDragging?: boolean;
}

export function ItineraryItemCard({ 
  item, 
  onRemove, 
  onToggleComplete,
  isDragging 
}: ItineraryItemCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const CategoryIcon = categoryIcons[item.category] || categoryIcons.other;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white dark:bg-gray-800 rounded-lg border shadow-sm dark:shadow-gray-900/50 overflow-hidden transition-all ${
        isDragging ? 'opacity-50 ring-2 ring-maple-500 dark:ring-maple-400' : ''
      } ${item.completed ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-700'}`}
    >
      <div className="flex">
        {/* Time Column */}
        <div className="flex-shrink-0 w-20 bg-gray-50 dark:bg-gray-900 p-3 border-r border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center">
          <span className="text-sm font-bold text-maple-600 dark:text-maple-400">{item.time}</span>
          {item.end_time && (
            <>
              <span className="text-xs text-gray-400 dark:text-gray-500">↓</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{item.end_time}</span>
            </>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-3">
          <div className="flex items-start space-x-2">
            {/* Drag Handle */}
            <button
              {...attributes}
              {...listeners}
              className="mt-0.5 p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 cursor-grab active:cursor-grabbing transition-colors"
            >
              <GripVertical size={16} />
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <span className={`p-1.5 rounded-lg ${categoryColors[item.category]}`}>
                  <CategoryIcon size={14} />
                </span>
                <h4 className={`font-medium truncate ${
                  item.completed ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-900 dark:text-gray-100'
                }`}>
                  {item.place_name}
                </h4>
              </div>

              {item.address && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 mt-1 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <MapPin size={12} />
                  <span className="truncate">{item.address}</span>
                </a>
              )}

              {item.notes && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{item.notes}</p>
              )}

              <div className="flex items-center space-x-2 mt-2">
                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-1">
                  <Clock size={12} />
                  <span>{item.duration} 分鐘</span>
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-1">
              {onToggleComplete && (
                <button
                  onClick={onToggleComplete}
                  className={`p-1.5 rounded-lg transition-colors ${
                    item.completed
                      ? 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400'
                      : 'text-gray-400 dark:text-gray-500 hover:text-green-500 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30'
                  }`}
                >
                  <Check size={16} />
                </button>
              )}
              {onRemove && (
                <button
                  onClick={onRemove}
                  className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ Drop Zone ============

interface DropZoneProps {
  isOver: boolean;
  children?: React.ReactNode;
}

export function DropZone({ isOver, children }: DropZoneProps) {
  return (
    <div
      className={`min-h-[100px] rounded-lg border-2 border-dashed transition-colors ${
        isOver
          ? 'border-maple-400 dark:border-maple-500 bg-maple-50 dark:bg-maple-900/20'
          : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900'
      }`}
    >
      {children || (
        <div className="flex items-center justify-center h-24 text-gray-400 dark:text-gray-500 text-sm">
          拖拽景點到這裡
        </div>
      )}
    </div>
  );
}
