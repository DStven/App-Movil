import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import { ColorScheme, getThemeColors } from '../constants/theme';

type ThemeContextType = {
  colorScheme: ColorScheme;
  colors: ReturnType<typeof getThemeColors>;
  toggleTheme: () => void;
  setTheme: (scheme: ColorScheme) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_KEY = 'APP_THEME';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useSystemColorScheme();
  const [colorScheme, setColorScheme] = useState<ColorScheme>('light');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_KEY);
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setColorScheme(savedTheme);
      } else {
        // Usar el tema del sistema si no hay guardado
        setColorScheme(systemScheme === 'dark' ? 'dark' : 'light');
      }
    } catch (error) {
      setColorScheme('light');
    } finally {
      setIsLoaded(true);
    }
  };

  const setTheme = async (scheme: ColorScheme) => {
    setColorScheme(scheme);
    await AsyncStorage.setItem(THEME_KEY, scheme);
  };

  const toggleTheme = () => {
    const newScheme = colorScheme === 'light' ? 'dark' : 'light';
    setTheme(newScheme);
  };

  if (!isLoaded) {
    return null;
  }

  const colors = getThemeColors(colorScheme);

  return (
    <ThemeContext.Provider value={{ colorScheme, colors, toggleTheme, setTheme }}>
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
