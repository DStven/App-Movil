import { createContext, useContext } from 'react';
import { ColorScheme, getThemeColors } from '../constants/theme';

type ThemeContextType = {
  colors: ReturnType<typeof getThemeColors>;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const colorScheme: ColorScheme = 'light';
  const colors = getThemeColors(colorScheme);

  return (
    <ThemeContext.Provider value={{ colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
