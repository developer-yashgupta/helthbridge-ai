import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Screens
import SplashScreen from './src/screens/SplashScreen';
import HomeScreen from './src/screens/HomeScreen';
import SymptomCheckerScreen from './src/screens/SymptomCheckerScreen';
import ResultScreen from './src/screens/ResultScreen';
import ResourcesScreen from './src/screens/ResourcesScreen';
import ASHADashboardScreen from './src/screens/ASHADashboardScreen';
import TeleconsultScreen from './src/screens/TeleconsultScreen';
import ProfileScreen from './src/screens/ProfileScreen';

// Context
import { OfflineProvider } from './src/context/OfflineContext';
import { LanguageProvider } from './src/context/LanguageContext';

// Theme
import { theme } from './src/theme/theme';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Mock user for demo
const mockUser = {
  id: 'user_demo',
  name: 'राम कुमार',
  phone: '+91-9876543210',
  userType: 'citizen', // Change to 'asha' to see ASHA dashboard
  language: 'hi'
};

// Main Tab Navigator
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          
          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'Symptoms') {
            iconName = 'health-and-safety';
          } else if (route.name === 'Resources') {
            iconName = 'location-on';
          } else if (route.name === 'ASHA') {
            iconName = 'dashboard';
          } else if (route.name === 'Teleconsult') {
            iconName = 'video-call';
          } else if (route.name === 'Profile') {
            iconName = 'person';
          }
          
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ title: 'होम' }}
      />
      <Tab.Screen 
        name="Symptoms" 
        component={SymptomCheckerScreen}
        options={{ title: 'लक्षण जांच' }}
      />
      <Tab.Screen 
        name="Resources" 
        component={ResourcesScreen}
        options={{ title: 'संसाधन' }}
      />
      {mockUser?.userType === 'asha' && (
        <Tab.Screen 
          name="ASHA" 
          component={ASHADashboardScreen}
          options={{ title: 'ASHA डैशबोर्ड' }}
        />
      )}
      <Tab.Screen 
        name="Teleconsult" 
        component={TeleconsultScreen}
        options={{ title: 'टेली परामर्श' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'प्रोफाइल' }}
      />
    </Tab.Navigator>
  );
}

// Main App Navigator
function AppNavigator() {
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Simulate app initialization
    setTimeout(() => {
      setLoading(false);
    }, 2000);
  }, []);
  
  if (loading) {
    return <SplashScreen />;
  }
  
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="Result" component={ResultScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <PaperProvider theme={theme}>
      <LanguageProvider>
        <OfflineProvider>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </OfflineProvider>
      </LanguageProvider>
    </PaperProvider>
  );
}