import { DefaultTheme } from 'react-native-paper';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#2E7D32',      // Green for health
    secondary: '#FF6F00',    // Orange for urgency
    accent: '#1976D2',       // Blue for trust
    background: '#F8F9FA',   // Light gray
    surface: '#FFFFFF',      // White
    text: '#212121',         // Dark gray
    placeholder: '#757575',  // Medium gray
    error: '#D32F2F',        // Red for errors
    success: '#388E3C',      // Green for success
    warning: '#F57C00',      // Orange for warnings
    info: '#1976D2',         // Blue for info
    
    // Risk level colors
    riskHigh: '#D32F2F',     // Red
    riskMedium: '#FF6F00',   // Orange
    riskLow: '#388E3C',      // Green
    
    // Custom colors
    cardBackground: '#FFFFFF',
    borderColor: '#E0E0E0',
    shadowColor: '#000000',
  },
  
  // Typography
  fonts: {
    ...DefaultTheme.fonts,
    regular: {
      fontFamily: 'System',
      fontWeight: 'normal',
    },
    medium: {
      fontFamily: 'System',
      fontWeight: '500',
    },
    light: {
      fontFamily: 'System',
      fontWeight: '300',
    },
    thin: {
      fontFamily: 'System',
      fontWeight: '100',
    },
  },
  
  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  // Border radius
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    round: 50,
  },
  
  // Shadows
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.22,
      shadowRadius: 2.22,
      elevation: 3,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.30,
      shadowRadius: 4.65,
      elevation: 8,
    },
  },
};