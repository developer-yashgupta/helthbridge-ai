import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Card, Button, Avatar, List, Switch } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useLanguage } from '../context/LanguageContext';
import { theme } from '../theme/theme';

const ProfileScreen = ({ navigation }) => {
  const { t, currentLanguage, changeLanguage, getSupportedLanguages } = useLanguage();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);

  // Mock user data
  const userData = {
    name: 'राम कुमार',
    phone: '+91-9876543210',
    age: 45,
    gender: 'Male',
    location: 'Rampur Village, Gurugram',
    userType: 'citizen',
    abhaId: 'ABHA123456789',
    emergencyContacts: [
      { name: 'सुनीता देवी (पत्नी)', phone: '+91-9876543211' },
      { name: 'राज कुमार (भाई)', phone: '+91-9876543212' }
    ],
    medicalHistory: [
      'Diabetes Type 2',
      'Hypertension',
      'No known allergies'
    ]
  };

  const handleLanguageChange = () => {
    const languages = getSupportedLanguages();
    const languageOptions = languages.map(lang => ({
      text: `${lang.name} (${lang.nativeName})`,
      onPress: () => changeLanguage(lang.code)
    }));

    Alert.alert(
      'Select Language',
      'Choose your preferred language',
      [
        ...languageOptions,
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: () => {
            // Handle logout
            Alert.alert('Success', 'Logged out successfully');
          }
        }
      ]
    );
  };

  const profileSections = [
    {
      title: t('personal_info'),
      icon: 'person',
      items: [
        { label: 'Name', value: userData.name },
        { label: 'Phone', value: userData.phone },
        { label: 'Age', value: `${userData.age} years` },
        { label: 'Gender', value: userData.gender },
        { label: 'Location', value: userData.location },
        { label: 'ABHA ID', value: userData.abhaId }
      ]
    },
    {
      title: t('medical_history'),
      icon: 'medical-services',
      items: userData.medicalHistory.map(condition => ({
        label: condition,
        value: ''
      }))
    },
    {
      title: t('emergency_contacts'),
      icon: 'emergency',
      items: userData.emergencyContacts.map(contact => ({
        label: contact.name,
        value: contact.phone
      }))
    }
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Avatar.Text 
          size={80} 
          label={userData.name.charAt(0)} 
          style={styles.avatar}
        />
        <Text style={styles.userName}>{userData.name}</Text>
        <Text style={styles.userType}>
          {userData.userType === 'citizen' ? 'Community Member' : 'ASHA Worker'}
        </Text>
        <Text style={styles.userLocation}>{userData.location}</Text>
      </View>

      {/* Profile Sections */}
      {profileSections.map((section, sectionIndex) => (
        <Card key={sectionIndex} style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Icon name={section.icon} size={24} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>{section.title}</Text>
          </View>

          {section.items.map((item, itemIndex) => (
            <View key={itemIndex} style={styles.infoItem}>
              <Text style={styles.infoLabel}>{item.label}</Text>
              {item.value && <Text style={styles.infoValue}>{item.value}</Text>}
            </View>
          ))}
        </Card>
      ))}

      {/* Settings */}
      <Card style={styles.settingsCard}>
        <View style={styles.sectionHeader}>
          <Icon name="settings" size={24} color={theme.colors.primary} />
          <Text style={styles.sectionTitle}>Settings</Text>
        </View>

        <List.Item
          title={t('language_settings')}
          description={`Current: ${getSupportedLanguages().find(l => l.code === currentLanguage)?.name}`}
          left={props => <List.Icon {...props} icon="language" />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
          onPress={handleLanguageChange}
          style={styles.settingItem}
        />

        <List.Item
          title="Notifications"
          description="Receive health alerts and reminders"
          left={props => <List.Icon {...props} icon="notifications" />}
          right={() => (
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              color={theme.colors.primary}
            />
          )}
          style={styles.settingItem}
        />

        <List.Item
          title="Offline Mode"
          description="Prioritize offline functionality"
          left={props => <List.Icon {...props} icon="wifi-off" />}
          right={() => (
            <Switch
              value={offlineMode}
              onValueChange={setOfflineMode}
              color={theme.colors.primary}
            />
          )}
          style={styles.settingItem}
        />

        <List.Item
          title="Privacy Settings"
          description="Manage your data and privacy"
          left={props => <List.Icon {...props} icon="privacy-tip" />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => Alert.alert('Privacy', 'Privacy settings coming soon')}
          style={styles.settingItem}
        />
      </Card>

      {/* Health Stats */}
      <Card style={styles.statsCard}>
        <View style={styles.sectionHeader}>
          <Icon name="analytics" size={24} color={theme.colors.success} />
          <Text style={styles.sectionTitle}>Health Stats</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Symptom Checks</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>3</Text>
            <Text style={styles.statLabel}>ASHA Visits</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>1</Text>
            <Text style={styles.statLabel}>Teleconsultations</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Emergencies</Text>
          </View>
        </View>
      </Card>

      {/* Quick Actions */}
      <Card style={styles.actionsCard}>
        <View style={styles.sectionHeader}>
          <Icon name="flash-on" size={24} color={theme.colors.secondary} />
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </View>

        <View style={styles.actionsList}>
          <TouchableOpacity style={styles.actionItem}>
            <Icon name="download" size={20} color={theme.colors.info} />
            <Text style={styles.actionText}>Download Health Report</Text>
            <Icon name="chevron-right" size={20} color={theme.colors.placeholder} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem}>
            <Icon name="share" size={20} color={theme.colors.info} />
            <Text style={styles.actionText}>Share with Doctor</Text>
            <Icon name="chevron-right" size={20} color={theme.colors.placeholder} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem}>
            <Icon name="backup" size={20} color={theme.colors.info} />
            <Text style={styles.actionText}>Backup Data</Text>
            <Icon name="chevron-right" size={20} color={theme.colors.placeholder} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem}>
            <Icon name="help" size={20} color={theme.colors.info} />
            <Text style={styles.actionText}>Help & Support</Text>
            <Icon name="chevron-right" size={20} color={theme.colors.placeholder} />
          </TouchableOpacity>
        </View>
      </Card>

      {/* App Info */}
      <Card style={styles.infoCard}>
        <View style={styles.appInfo}>
          <Text style={styles.appName}>HealthBridge AI</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
          <Text style={styles.appDescription}>
            AI-powered healthcare for rural India
          </Text>
        </View>
      </Card>

      {/* Logout Button */}
      <View style={styles.logoutSection}>
        <Button
          mode="outlined"
          onPress={handleLogout}
          style={styles.logoutButton}
          contentStyle={styles.logoutButtonContent}
          icon="logout"
        >
          {t('logout')}
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    alignItems: 'center',
    padding: theme.spacing.xl,
    paddingTop: theme.spacing.xxl,
    backgroundColor: theme.colors.surface,
  },
  avatar: {
    backgroundColor: theme.colors.primary,
    marginBottom: theme.spacing.md,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  userType: {
    fontSize: 16,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  userLocation: {
    fontSize: 14,
    color: theme.colors.placeholder,
    textAlign: 'center',
  },
  sectionCard: {
    margin: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.small,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderColor,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderColor,
  },
  infoLabel: {
    fontSize: 16,
    color: theme.colors.text,
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    color: theme.colors.placeholder,
    textAlign: 'right',
    flex: 1,
  },
  settingsCard: {
    margin: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.small,
  },
  settingItem: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderColor,
  },
  statsCard: {
    margin: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.small,
  },
  statsGrid: {
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
    color: theme.colors.success,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.placeholder,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  actionsCard: {
    margin: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.small,
  },
  actionsList: {
    padding: theme.spacing.md,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderColor,
  },
  actionText: {
    fontSize: 16,
    color: theme.colors.text,
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  infoCard: {
    margin: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.small,
  },
  appInfo: {
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  appVersion: {
    fontSize: 14,
    color: theme.colors.placeholder,
    marginBottom: theme.spacing.sm,
  },
  appDescription: {
    fontSize: 14,
    color: theme.colors.placeholder,
    textAlign: 'center',
  },
  logoutSection: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  logoutButton: {
    borderColor: theme.colors.error,
  },
  logoutButtonContent: {
    paddingVertical: theme.spacing.sm,
  },
});

export default ProfileScreen;