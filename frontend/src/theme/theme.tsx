import React, {createContext, useContext, useEffect, useState} from 'react';
import {useColorScheme} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEY_THEME = 'vaanisetu.theme_mode';

export type ThemeMode = 'light' | 'dark';

export const lightColors = {
  // Brand Blues & Purples (High Contrast)
  primary: '#0052CC',
  primaryDark: '#0747A6',
  primaryLight: '#EBF3FF',
  primaryLighter: '#F2F7FE',
  primaryBorder: '#85B8FF',
  primaryGlow: 'rgba(0, 82, 204, 0.25)',

  accent: '#4F46E5',
  accentLight: '#EEF2FF',
  cyan: '#0E7490',
  cyanLight: '#ECFEFF',

  // Deep High-Contrast Navies & Slates
  navy: '#091E42',
  navyDark: '#040D21',
  navySecondary: '#172B4D',
  slate: '#334155',
  slateMuted: '#475569',
  slateLight: '#64748B',
  slateUltraLight: '#CBD5E1',

  // Surfaces & Borders (Clear Definition)
  background: '#F1F5F9',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceSubtle: '#F8FAFC',
  border: '#CBD5E1',
  borderLight: '#E2E8F0',
  borderDark: '#94A3B8',
  cardHighlight: 'rgba(255, 255, 255, 0.9)',

  // Semantic Status (Deep, Readable Text)
  success: '#16A34A',
  successLight: '#DCFCE7',
  successDark: '#0D6832',
  warning: '#D97706',
  warningLight: '#FEF3C7',
  warningDark: '#92400E',
  error: '#DC2626',
  errorLight: '#FEE2E2',
  errorDark: '#991B1B',
  info: '#0284C7',
  infoLight: '#E0F2FE',

  // Audio / Interaction States
  recordingRed: '#DC2626',
  recordingRedLight: '#FEE2E2',
  recordingGlow: 'rgba(220, 38, 38, 0.35)',
  processingAmber: '#D97706',
  processingAmberLight: '#FEF3C7',
  playingGreen: '#16A34A',
  playingGreenLight: '#DCFCE7',

  // Text Tokens (High Contrast)
  textPrimary: '#091E42',
  textSecondary: '#172B4D',
  textMuted: '#475569',
  textInverse: '#FFFFFF',
} as const;

export const darkColors = {
  // Brand Blues & Electric Accents
  primary: '#3B82F6',
  primaryDark: '#2563EB',
  primaryLight: 'rgba(59, 130, 246, 0.15)',
  primaryLighter: 'rgba(59, 130, 246, 0.08)',
  primaryBorder: 'rgba(59, 130, 246, 0.35)',
  primaryGlow: 'rgba(59, 130, 246, 0.4)',

  accent: '#818CF8',
  accentLight: 'rgba(129, 140, 248, 0.15)',
  cyan: '#22D3EE',
  cyanLight: 'rgba(34, 211, 238, 0.12)',

  // Deep Obsidian Navies
  navy: '#F8FAFC',
  navyDark: '#FFFFFF',
  navySecondary: '#E2E8F0',
  slate: '#94A3B8',
  slateMuted: '#64748B',
  slateLight: '#475569',
  slateUltraLight: '#334155',

  // Surfaces & Borders (Deep Space)
  background: '#0B0F19',
  surface: '#131B2E',
  surfaceElevated: '#17223B',
  surfaceSubtle: '#1C2844',
  border: 'rgba(255, 255, 255, 0.08)',
  borderLight: 'rgba(255, 255, 255, 0.04)',
  borderDark: 'rgba(255, 255, 255, 0.16)',
  cardHighlight: 'rgba(255, 255, 255, 0.03)',

  // Semantic Status
  success: '#22C55E',
  successLight: 'rgba(34, 197, 94, 0.15)',
  successDark: '#4ADE80',
  warning: '#F59E0B',
  warningLight: 'rgba(245, 158, 11, 0.15)',
  warningDark: '#FBBF24',
  error: '#EF4444',
  errorLight: 'rgba(239, 68, 68, 0.15)',
  errorDark: '#F87171',
  info: '#38BDF8',
  infoLight: 'rgba(56, 189, 248, 0.15)',

  // Audio / Interaction States
  recordingRed: '#F43F5E',
  recordingRedLight: 'rgba(244, 63, 94, 0.2)',
  recordingGlow: 'rgba(244, 63, 94, 0.5)',
  processingAmber: '#F59E0B',
  processingAmberLight: 'rgba(245, 158, 11, 0.2)',
  playingGreen: '#10B981',
  playingGreenLight: 'rgba(16, 185, 129, 0.2)',

  // Text
  textPrimary: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textMuted: '#94A3B8',
  textInverse: '#0B0F19',
} as const;

export type ThemeColors = {
  [K in keyof typeof lightColors]: string;
};

// Default exported colors (light mode as baseline)
export const colors = lightColors;

export const typography = {
  fontSizes: {
    xxs: 9,
    xs: 11,
    sm: 12,
    base: 14,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    brand: 32,
    nativeLarge: 22,
  },
  lineHeights: {
    xxs: 13,
    xs: 15,
    sm: 17,
    base: 20,
    md: 22,
    lg: 24,
    xl: 28,
    xxl: 32,
    brand: 40,
    nativeLarge: 30,
  },
  fontWeights: {
    regular: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
    extraBold: '800' as const,
  },
};

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const borderRadius = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 26,
  pill: 9999,
};

export const shadows = {
  card: {
    shadowColor: '#0A192F',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  cardSelected: {
    shadowColor: '#0062FF',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 4,
  },
  button: {
    shadowColor: '#0062FF',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  ptt: {
    shadowColor: '#0062FF',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
};

type ThemeContextType = {
  theme: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  isDark: false,
  colors: lightColors,
  toggleTheme: () => {},
  setTheme: () => {},
});

export function ThemeProvider({children}: {children: React.ReactNode}) {
  const systemScheme = useColorScheme();
  const [theme, setThemeState] = useState<ThemeMode>(systemScheme === 'dark' ? 'dark' : 'light');

  useEffect(() => {
    void (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY_THEME);
        if (saved === 'dark' || saved === 'light') {
          setThemeState(saved);
        } else if (systemScheme) {
          setThemeState(systemScheme === 'dark' ? 'dark' : 'light');
        }
      } catch {
        // Ignore read errors
      }
    })();
  }, [systemScheme]);

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
    void AsyncStorage.setItem(STORAGE_KEY_THEME, mode);
  };

  const toggleTheme = () => {
    const nextMode = theme === 'light' ? 'dark' : 'light';
    setTheme(nextMode);
  };

  const activeColors = theme === 'dark' ? (darkColors as ThemeColors) : lightColors;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark: theme === 'dark',
        colors: activeColors,
        toggleTheme,
        setTheme,
      }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
