import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { Button } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useLanguage } from '../context/LanguageContext';
import { theme } from '../theme/theme';

const { width, height } = Dimensions.get('window');

const OnboardingScreen = ({ navigation }) => {
  const { t } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 1,
      title: t('onboarding_title_1'),
      description: t('onboarding_desc_1'),
      icon: 'health-and-safety',
      color: theme.colors.primary,
    },
    {
      id: 2,
      title: t('onboarding_title_2'),
      description: t('onboarding_desc_2'),
      icon: 'wifi-off',
      color: theme.colors.secondary,
    },
    {
      id: 3,
      title: t('onboarding_title_3'),
      description: t('onboarding_desc_3'),
      icon: 'people',
      color: theme.colors.info,
    },
  ];

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      navigation.navigate('Login');
    }
  };

  const skipOnboarding = () => {
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={theme.colors.primary} barStyle="light-content" />
      
      {/* Skip Button */}
      <TouchableOpacity style={styles.skipButton} onPress={skipOnboarding}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Slide Content */}
      <View style={styles.slideContainer}>
        <View style={[styles.iconContainer, { backgroundColor: slides[currentSlide].color }]}>
          <Icon 
            name={slides[currentSlide].icon} 
            size={80} 
            color={theme.colors.surface} 
          />
        </View>

        <Text style={styles.title}>{slides[currentSlide].title}</Text>
        <Text style={styles.description}>{slides[currentSlide].description}</Text>
      </View>

      {/* Pagination Dots */}
      <View style={styles.pagination}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor: index === currentSlide 
                  ? theme.colors.primary 
                  : theme.colors.placeholder
              }
            ]}
          />
        ))}
      </View>

      {/* Next Button */}
      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={nextSlide}
          style={styles.nextButton}
          contentStyle={styles.buttonContent}
        >
          {currentSlide === slides.length - 1 ? t('get_started') : t('continue')}
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    padding: theme.spacing.sm,
  },
  skipText: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  slideContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  description: {
    fontSize: 16,
    color: theme.colors.placeholder,
    textAlign: 'center',
    lineHeight: 24,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  buttonContainer: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
  },
  nextButton: {
    backgroundColor: theme.colors.primary,
  },
  buttonContent: {
    paddingVertical: theme.spacing.sm,
  },
});

export default OnboardingScreen;