// hooks/useLoadingState.js
import { useState, useEffect } from "react";

export const useLoadingState = (dependencies = []) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const allDepsReady = dependencies.every((dep) => {
      if (Array.isArray(dep)) return dep.length > 0;
      if (typeof dep === "object" && dep !== null) return Object.keys(dep).length > 0;
      return !!dep;
    });

    if (allDepsReady) {
      // Small delay ensures DOM is ready and prevents race conditions
      const timer = setTimeout(() => setIsLoaded(true), 50);
      return () => clearTimeout(timer);
    } else {
      setIsLoaded(false);
    }
  }, dependencies);

  return isLoaded;
};