import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { theme } from '../theme/theme';

const { width, height } = Dimensions.get('window');

const SplashScreen = () => {
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={theme.colors.primary} barStyle="light-content" />
      
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.iconContainer}>
          <Icon name="health-and-safety" size={80} color={theme.colors.surface} />
        </View>
        
        <Text style={styles.title}>HealthBridge AI</Text>
        <Text style={styles.subtitle}>आपका स्वास्थ्य साथी</Text>
        
        <View style={styles.taglineContainer}>
          <Text style={styles.tagline}>AI-powered Healthcare for Rural India</Text>
        </View>
      </Animated.View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>Made for Rural India 🇮🇳</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.surface,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: theme.colors.surface,
    opacity: 0.9,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  taglineContainer: {
    paddingHorizontal: theme.spacing.xl,
  },
  tagline: {
    fontSize: 14,
    color: theme.colors.surface,
    opacity: 0.8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  footer: {
    position: 'absolute',
    bottom: theme.spacing.xl,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: theme.colors.surface,
    opacity: 0.7,
  },
});

export default SplashScreen;