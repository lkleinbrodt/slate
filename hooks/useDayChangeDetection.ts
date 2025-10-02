import { useAppStore } from '@/lib/stores/appStore';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

/**
 * Hook that periodically checks for day changes and handles them automatically
 * This ensures the app stays in sync even if the user keeps it open overnight
 */
export function useDayChangeDetection() {
  const { checkAndHandleDayChange } = useAppStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check for day changes every minute
    const startPeriodicCheck = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      intervalRef.current = setInterval(() => {
        // Only check if app is active
        if (AppState.currentState === 'active') {
          checkAndHandleDayChange();
        }
      }, 60000); // Check every minute
    };

    // Start periodic checking
    startPeriodicCheck();

    // Listen for app state changes
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        // App became active, check immediately and start periodic checking
        checkAndHandleDayChange();
        startPeriodicCheck();
      } else {
        // App went to background, stop periodic checking
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    });

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      subscription.remove();
    };
  }, [checkAndHandleDayChange]);
}