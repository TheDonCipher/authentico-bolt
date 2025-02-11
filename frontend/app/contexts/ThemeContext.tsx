'use client';

import React, { createContext, useState, useContext } from 'react';

interface ThemeContextProps {
  primaryColor: string;
  setPrimaryColor: (color: string) => void;
  secondaryColor: string;
  setSecondaryColor: (color: string) => void;
  theme: string;
  setTheme: (theme: string) => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [primaryColor, setPrimaryColor] = useState("#4A6741");
  const [secondaryColor, setSecondaryColor] = useState("#5D8C5D");
  const [theme, setTheme] = useState("light");

  const value: ThemeContextProps = {
    primaryColor,
    setPrimaryColor,
    secondaryColor,
    setSecondaryColor,
    theme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};