import React, { createContext, useContext, useState, useEffect } from 'react';

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Move useTheme outside of any conditional logic to make it compatible with Fast Refresh
const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export { useTheme };

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    // Check if we're in the browser environment
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      return saved ? JSON.parse(saved) : true; // Default to dark theme
    }
    return true; // Default to dark theme
  });

  useEffect(() => {
    // Only access localStorage in browser environment
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', JSON.stringify(isDark));
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};