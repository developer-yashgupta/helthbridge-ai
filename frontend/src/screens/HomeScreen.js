import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { Card, Button, Avatar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useLanguage } from '../context/LanguageContext';
import { useOffline } from '../context/OfflineContext';
import { theme } from '../theme/theme';

// Mock user data
const mockUser = {
  id: 'user_demo',
  name: 'राम कुमार',
  userType: 'citizen'
};

const HomeScreen = ({ navigation }) => {
  const { t } = useLanguage();
  const { isConnected } = useOffline();
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    setGreeting(getGreeting());
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('good_morning');
    if (hour < 17) return t('good_afternoon');
    return t('good_evening');
  };

  const handleEmergencyCall = () => {
    Alert.alert(
      'आपातकालीन सेवा',
      'क्या आप 108 पर कॉल करना चाहते हैं?',
      [
        { text: 'रद्द करें', style: 'cancel' },
        { 
          text: 'कॉल करें', 
          onPress: () => Linking.openURL('tel:108'),
          style: 'destructive'
        }
      ]
    );
  };

  const quickActions = [
    {
      id: 'symptoms',
      title: t('check_symptoms'),
      subtitle: 'AI से लक्षण जांचें',
      icon: 'health-and-safety',
      color: theme.colors.primary,
      onPress: () => navigation.navigate('Symptoms')
    },
    {
      id: 'resources',
      title: t('find_resources'),
      subtitle: 'नजदीकी PHC/ASHA खोजें',
      icon: 'location-on',
      color: theme.colors.info,
      onPress: () => navigation.navigate('Resources')
    },
    {
      id: 'teleconsult',
      title: t('book_consultation'),
      subtitle: 'डॉक्टर से बात करें',
      icon: 'video-call',
      color: theme.colors.secondary,
      onPress: () => navigation.navigate('Teleconsult')
    }
  ];

  const healthTips = [
    {
      id: 1,
      title: 'पानी पिएं',
      description: 'दिन में कम से कम 8-10 गिलास पानी पिएं',
      icon: 'water-drop'
    },
    {
      id: 2,
      title: 'व्यायाम करें',
      description: 'रोज़ाना 30 मिनट टहलें या व्यायाम करें',
      icon: 'directions-walk'
    },
    {
      id: 3,
      title: 'स्वच्छता बनाए रखें',
      description: 'बार-बार हाथ धोएं और साफ-सफाई रखें',
      icon: 'wash'
    }
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Avatar.Text 
            size={50} 
            label={mockUser?.name?.charAt(0) || 'U'} 
            style={styles.avatar}
          />
          <View style={styles.greetingContainer}>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.userName}>{mockUser?.name || 'उपयोगकर्ता'}</Text>
          </View>
        </View>
        
        {/* Connection Status */}
        <View style={[styles.connectionStatus, { 
          backgroundColor: isConnected ? theme.colors.success : theme.colors.warning 
        }]}>
          <Icon 
            name={isConnected ? 'wifi' : 'wifi-off'} 
            size={16} 
            color={theme.colors.surface} 
          />
          <Text style={styles.connectionText}>
            {isConnected ? 'ऑनलाइन' : 'ऑफलाइन'}
          </Text>
        </View>
      </View>

      {/* Emergency Button */}
      <Card style={styles.emergencyCard}>
        <TouchableOpacity 
          style={styles.emergencyButton}
          onPress={handleEmergencyCall}
        >
          <Icon name="emergency" size={32} color={theme.colors.surface} />
          <View style={styles.emergencyText}>
            <Text style={styles.emergencyTitle}>{t('emergency')}</Text>
            <Text style={styles.emergencySubtitle}>{t('call_108')}</Text>
          </View>
        </TouchableOpacity>
      </Card>

      {/* How are you feeling */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('how_are_you_feeling')}</Text>
        
        <View style={styles.quickActions}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.actionCard}
              onPress={action.onPress}
            >
              <View style={[styles.actionIcon, { backgroundColor: action.color }]}>
                <Icon name={action.icon} size={28} color={theme.colors.surface} />
              </View>
              <Text style={styles.actionTitle}>{action.title}</Text>
              <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Health Tips */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>आज के स्वास्थ्य सुझाव</Text>
        
        {healthTips.map((tip) => (
          <Card key={tip.id} style={styles.tipCard}>
            <View style={styles.tipContent}>
              <View style={styles.tipIcon}>
                <Icon name={tip.icon} size={24} color={theme.colors.primary} />
              </View>
              <View style={styles.tipText}>
                <Text style={styles.tipTitle}>{tip.title}</Text>
                <Text style={styles.tipDescription}>{tip.description}</Text>
              </View>
            </View>
          </Card>
        ))}
      </View>

      {/* Recent Activity */}
      {mockUser?.userType === 'asha' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>आज की गतिविधि</Text>
          
          <Card style={styles.activityCard}>
            <View style={styles.activityStats}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>12</Text>
                <Text style={styles.statLabel}>मरीज़ देखे</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>3</Text>
                <Text style={styles.statLabel}>रेफरल किए</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>1</Text>
                <Text style={styles.statLabel}>आपातकाल</Text>
              </View>
            </View>
          </Card>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    paddingTop: theme.spacing.xl,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: theme.colors.primary,
  },
  greetingContainer: {
    marginLeft: theme.spacing.md,
  },
  greeting: {
    fontSize: 14,
    color: theme.colors.placeholder,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
  },
  connectionText: {
    fontSize: 12,
    color: theme.colors.surface,
    marginLeft: theme.spacing.xs,
  },
  emergencyCard: {
    margin: theme.spacing.md,
    backgroundColor: theme.colors.error,
    ...theme.shadows.medium,
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  emergencyText: {
    marginLeft: theme.spacing.md,
  },
  emergencyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.surface,
  },
  emergencySubtitle: {
    fontSize: 14,
    color: theme.colors.surface,
    opacity: 0.9,
  },
  section: {
    padding: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionCard: {
    flex: 1,
    alignItems: 'center',
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.xs,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.small,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  actionSubtitle: {
    fontSize: 12,
    color: theme.colors.placeholder,
    textAlign: 'center',
  },
  tipCard: {
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.small,
  },
  tipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  tipIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${theme.colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  tipText: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  tipDescription: {
    fontSize: 14,
    color: theme.colors.placeholder,
  },
  activityCard: {
    backgroundColor: theme.colors.surface,
    ...theme.shadows.small,
  },
  activityStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: theme.spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.placeholder,
    marginTop: theme.spacing.xs,
  },
});

export default HomeScreen;