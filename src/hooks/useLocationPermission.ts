import { useState, useCallback } from 'react';
import { validateCoordinates, type Coordinates } from '../utils/location';

type PermissionState = 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable' | 'error';

export function useLocationPermission() {
  const [state, setState] = useState<PermissionState>('idle');
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState('unavailable');
      setError('Geolocation is not supported by this browser.');
      return;
    }
    setState('requesting');
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        if (validateCoordinates(coords)) {
          setCoordinates(coords);
          setState('granted');
        } else {
          setState('error');
          setError('Invalid coordinates returned by browser. Please try manual location search.');
        }
      },
      (err) => {
        setState(err.code === err.PERMISSION_DENIED ? 'denied' : 'error');
        setError(err.code === err.PERMISSION_DENIED
          ? 'Location permission denied. Please use manual location search below.'
          : 'Could not determine your location. Please try again or use manual search.');
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  const clearLocation = useCallback(() => {
    setCoordinates(null);
    setState('idle');
    setError(null);
  }, []);

  return { state, coordinates, error, requestLocation, clearLocation };
}
