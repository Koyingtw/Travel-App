import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Loader2, Search } from 'lucide-react';

interface PlaceResult {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  types: string[];
  rating?: number;
}

interface PlaceAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect: (place: PlaceResult) => void;
  placeholder?: string;
  disabled?: boolean;
}

// Declare google maps types
declare global {
  interface Window {
    google: typeof google;
  }
}

export default function PlaceAutocomplete({
  value,
  onChange,
  onPlaceSelect,
  placeholder = '搜尋地點...',
  disabled = false,
}: PlaceAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const sessionToken = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Initialize Google Places services
  useEffect(() => {
    const initServices = () => {
      if (window.google?.maps?.places) {
        autocompleteService.current = new window.google.maps.places.AutocompleteService();
        // PlacesService requires a map or div element
        const dummyDiv = document.createElement('div');
        placesService.current = new window.google.maps.places.PlacesService(dummyDiv);
        sessionToken.current = new window.google.maps.places.AutocompleteSessionToken();
        setIsGoogleLoaded(true);
      }
    };

    // Check if already loaded
    if (window.google?.maps?.places) {
      initServices();
    } else {
      // Wait for Google Maps to load
      const checkGoogle = setInterval(() => {
        if (window.google?.maps?.places) {
          initServices();
          clearInterval(checkGoogle);
        }
      }, 100);

      // Cleanup after 10 seconds
      setTimeout(() => clearInterval(checkGoogle), 10000);
    }
  }, []);

  // Fetch suggestions with debounce
  const fetchSuggestions = useCallback((input: string) => {
    if (!autocompleteService.current || !input.trim()) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);

    autocompleteService.current.getPlacePredictions(
      {
        input,
        sessionToken: sessionToken.current!,
        // Optionally bias towards Canada
        componentRestrictions: undefined, // Remove to search globally, or set { country: 'ca' } for Canada only
      },
      (predictions, status) => {
        setIsLoading(false);
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          setSuggestions(predictions);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
        }
      }
    );
  }, []);

  // Handle input change with debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Debounce API calls
    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(newValue);
    }, 300);
  };

  // Handle place selection
  const handleSelectPlace = (prediction: google.maps.places.AutocompletePrediction) => {
    if (!placesService.current) return;

    setIsLoading(true);
    setShowSuggestions(false);

    placesService.current.getDetails(
      {
        placeId: prediction.place_id,
        fields: ['name', 'formatted_address', 'geometry', 'types', 'rating', 'place_id'],
        sessionToken: sessionToken.current!,
      },
      (place, status) => {
        setIsLoading(false);
        
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
          const result: PlaceResult = {
            placeId: place.place_id || prediction.place_id,
            name: place.name || prediction.structured_formatting.main_text,
            address: place.formatted_address || prediction.description,
            lat: place.geometry?.location?.lat() || 0,
            lng: place.geometry?.location?.lng() || 0,
            types: place.types || [],
            rating: place.rating,
          };
          
          onChange(result.name);
          onPlaceSelect(result);
          
          // Generate new session token for next search
          sessionToken.current = new window.google.maps.places.AutocompleteSessionToken();
        }
      }
    );
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={inputRef}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          disabled={disabled || !isGoogleLoaded}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maple-500 focus:border-maple-500 disabled:bg-gray-50 disabled:text-gray-500"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" size={18} />
        )}
        {!isLoading && value && (
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {suggestions.map((prediction) => (
            <button
              key={prediction.place_id}
              type="button"
              onClick={() => handleSelectPlace(prediction)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
            >
              <div className="flex items-start space-x-3">
                <MapPin className="text-maple-500 mt-0.5 flex-shrink-0" size={16} />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-gray-900 truncate">
                    {prediction.structured_formatting.main_text}
                  </div>
                  <div className="text-sm text-gray-500 truncate">
                    {prediction.structured_formatting.secondary_text}
                  </div>
                </div>
              </div>
            </button>
          ))}
          {/* Google attribution */}
          <div className="px-4 py-2 bg-gray-50 text-xs text-gray-400 flex items-center justify-end">
            <span>Powered by</span>
            <img 
              src="https://developers.google.com/static/maps/documentation/images/google_on_white.png" 
              alt="Google" 
              className="h-4 ml-1"
            />
          </div>
        </div>
      )}

      {/* Loading state when Google isn't ready */}
      {!isGoogleLoaded && (
        <div className="absolute z-50 w-full mt-1 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
          正在載入 Google Maps...
        </div>
      )}
    </div>
  );
}
