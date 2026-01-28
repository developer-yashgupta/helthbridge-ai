import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { TextInput, Button, Card } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { theme } from '../theme/theme';

const LoginScreen = ({ navigation }) => {
  const { login, sendOTP, loading } = useAuth();
  const { t } = useLanguage();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOTP = async () => {
    if (!phone || phone.length < 10) {
      Alert.alert(t('error'), 'Please enter a valid phone number');
      return;
    }

    setIsLoading(true);
    try {
      const result = await sendOTP(phone);
      if (result.success) {
        setOtpSent(true);
        Alert.alert(t('success'), t('otp_sent'));
      } else {
        Alert.alert(t('error'), result.error || 'Failed to send OTP');
      }
    } catch (error) {
      Alert.alert(t('error'), 'Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!otp || otp.length < 4) {
      Alert.alert(t('error'), 'Please enter the OTP');
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(phone, otp);
      if (result.success) {
        // Navigation will be handled by AuthContext
      } else {
        Alert.alert(t('error'), result.error || t('invalid_otp'));
      }
    } catch (error) {
      Alert.alert(t('error'), 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhoneNumber = (text) => {
    // Remove non-digits
    const cleaned = text.replace(/\D/g, '');
    
    // Limit to 10 digits
    const limited = cleaned.slice(0, 10);
    
    setPhone(limited);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Icon name="health-and-safety" size={60} color={theme.colors.primary} />
          </View>
          <Text style={styles.title}>{t('app_title')}</Text>
          <Text style={styles.subtitle}>{t('app_subtitle')}</Text>
        </View>

        {/* Login Form */}
        <Card style={styles.loginCard}>
          <View style={styles.cardContent}>
            <Text style={styles.loginTitle}>{t('login_title')}</Text>

            {/* Phone Number Input */}
            <TextInput
              label={t('phone_number')}
              value={phone}
              onChangeText={formatPhoneNumber}
              keyboardType="phone-pad"
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="phone" />}
              placeholder={t('enter_phone')}
              disabled={otpSent}
            />

            {/* OTP Input (shown after OTP is sent) */}
            {otpSent && (
              <TextInput
                label={t('enter_otp')}
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                mode="outlined"
                style={styles.input}
                left={<TextInput.Icon icon="lock" />}
                placeholder="Enter 6-digit OTP"
                maxLength={6}
              />
            )}

            {/* Action Button */}
            {!otpSent ? (
              <Button
                mode="contained"
                onPress={handleSendOTP}
                loading={isLoading}
                disabled={isLoading || phone.length < 10}
                style={styles.button}
                contentStyle={styles.buttonContent}
              >
                {t('send_otp')}
              </Button>
            ) : (
              <View>
                <Button
                  mode="contained"
                  onPress={handleLogin}
                  loading={isLoading}
                  disabled={isLoading || otp.length < 4}
                  style={styles.button}
                  contentStyle={styles.buttonContent}
                >
                  {t('verify_otp')}
                </Button>

                <Button
                  mode="text"
                  onPress={() => {
                    setOtpSent(false);
                    setOtp('');
                  }}
                  style={styles.resendButton}
                >
                  Change Phone Number
                </Button>
              </View>
            )}

            {/* Demo Login */}
            <View style={styles.demoSection}>
              <Text style={styles.demoText}>For demo purposes:</Text>
              <Button
                mode="outlined"
                onPress={() => {
                  setPhone('9876543210');
                  setOtpSent(true);
                  setOtp('123456');
                }}
                style={styles.demoButton}
              >
                Use Demo Login
              </Button>
            </View>
          </View>
        </Card>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.md,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${theme.colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.placeholder,
  },
  loginCard: {
    backgroundColor: theme.colors.surface,
    ...theme.shadows.medium,
  },
  cardContent: {
    padding: theme.spacing.xl,
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  input: {
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  button: {
    backgroundColor: theme.colors.primary,
    marginTop: theme.spacing.md,
  },
  buttonContent: {
    paddingVertical: theme.spacing.sm,
  },
  resendButton: {
    marginTop: theme.spacing.sm,
  },
  demoSection: {
    marginTop: theme.spacing.xl,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  demoText: {
    fontSize: 14,
    color: theme.colors.placeholder,
    marginBottom: theme.spacing.sm,
  },
  demoButton: {
    borderColor: theme.colors.primary,
  },
  footer: {
    marginTop: theme.spacing.xl,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: theme.colors.placeholder,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default LoginScreen;