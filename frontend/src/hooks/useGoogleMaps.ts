import { useLoadScript, Libraries } from '@react-google-maps/api';

// Define libraries to load - must be defined outside component to prevent re-renders
const libraries: Libraries = ['places', 'geometry'];

export function useGoogleMaps() {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  return { isLoaded, loadError };
}
