// Color palette
export const colors = {
  primary: '#E45A92',
  primaryDark: '#C74A7F',
  primaryLight: '#F08AB6',
  
  success: '#4CAF50',
  warning: '#FFEB3B',
  warningDark: '#FF9800',
  error: '#F44336',
  
  green: {
    light: '#E6F5E9',
    main: '#2E8B57',
    dark: '#1E5F3D',
  },
  
  background: {
    primary: '#FFFFFF',
    secondary: '#FBFBFB',
    card: '#F5F5F5',
  },
  
  text: {
    primary: '#000000',
    secondary: '#444444',
    disabled: '#999999',
  },
  
  border: {
    light: '#E0E0E0',
    main: '#CCCCCC',
  },
  
  shadow: '#000000',
};

// Typography
export const typography = {
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    md: 17,
    lg: 18,
    xl: 19,
    '2xl': 20,
    '3xl': 21,
    '4xl': 24,
    '5xl': 30,
  },
  
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  
  lineHeights: {
    tight: 20,
    normal: 24,
    relaxed: 28,
  },
};

// Spacing scale
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 15,
  lg: 20,
  xl: 25,
  '2xl': 30,
  '3xl': 40,
  '4xl': 50,
  '5xl': 55,
  '6xl': 80,
  '7xl': 90,
  '8xl': 100,
  '9xl': 200,
};

// Border radius
export const borderRadius = {
  sm: 5,
  md: 10,
  lg: 15,
  xl: 30,
  full: 999,
};

// Shadows (Android elevation)
export const shadows = {
  sm: {
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  md: {
    elevation: 5,
    shadowColor: colors.shadow,
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  lg: {
    elevation: 8,
    shadowColor: colors.shadow,
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 1, height: 1 },
  },
  xl: {
    elevation: 10,
    shadowColor: colors.shadow,
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 1, height: 1 },
  },
};

// Common styles
export const commonStyles = {
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  
  screenPadding: {
    paddingHorizontal: spacing.lg,
  },
  
  centerContent: {
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
};
