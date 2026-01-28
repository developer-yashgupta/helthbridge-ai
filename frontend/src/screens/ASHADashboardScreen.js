import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Card, Button, Avatar, Chip } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useLanguage } from '../context/LanguageContext';
import { theme } from '../theme/theme';

const ASHADashboardScreen = ({ navigation }) => {
  const { t } = useLanguage();
  const [dashboardData, setDashboardData] = useState({
    totalPatients: 150,
    highRiskPatients: 8,
    mediumRiskPatients: 23,
    lowRiskPatients: 119,
    todayVisits: 12,
    pendingFollowUps: 5,
    weeklyStats: {
      visitsCompleted: 45,
      referralsMade: 8,
      emergenciesHandled: 2
    }
  });

  const [recentAlerts, setRecentAlerts] = useState([
    {
      id: 1,
      patientName: 'राम कुमार',
      message: 'Blood sugar levels high - needs immediate attention',
      priority: 'high',
      timestamp: '2 hours ago'
    },
    {
      id: 2,
      patientName: 'सुनीता देवी',
      message: 'Pregnancy checkup due',
      priority: 'medium',
      timestamp: '4 hours ago'
    }
  ]);

  const [recentPatients, setRecentPatients] = useState([
    {
      id: 1,
      name: 'राम कुमार',
      age: 45,
      riskLevel: 'high',
      lastVisit: '2024-01-20',
      condition: 'Diabetes, Hypertension'
    },
    {
      id: 2,
      name: 'सुनीता देवी',
      age: 32,
      riskLevel: 'medium',
      lastVisit: '2024-01-18',
      condition: 'Pregnancy care'
    },
    {
      id: 3,
      name: 'मोहन सिंह',
      age: 28,
      riskLevel: 'low',
      lastVisit: '2024-01-15',
      condition: 'General checkup'
    }
  ]);

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'high':
        return theme.colors.riskHigh;
      case 'medium':
        return theme.colors.riskMedium;
      case 'low':
        return theme.colors.riskLow;
      default:
        return theme.colors.placeholder;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return theme.colors.error;
      case 'medium':
        return theme.colors.warning;
      case 'low':
        return theme.colors.success;
      default:
        return theme.colors.placeholder;
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Avatar.Text size={50} label="SD" style={styles.avatar} />
          <View>
            <Text style={styles.greeting}>नमस्कार</Text>
            <Text style={styles.userName}>Sunita Devi</Text>
            <Text style={styles.userRole}>ASHA Worker - Rampur Village</Text>
          </View>
        </View>
      </View>

      {/* Stats Overview */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Today's Overview</Text>
        
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <View style={styles.statContent}>
              <Icon name="people" size={32} color={theme.colors.primary} />
              <Text style={styles.statNumber}>{dashboardData.totalPatients}</Text>
              <Text style={styles.statLabel}>{t('total_patients')}</Text>
            </View>
          </Card>

          <Card style={styles.statCard}>
            <View style={styles.statContent}>
              <Icon name="warning" size={32} color={theme.colors.riskHigh} />
              <Text style={styles.statNumber}>{dashboardData.highRiskPatients}</Text>
              <Text style={styles.statLabel}>{t('high_risk_patients')}</Text>
            </View>
          </Card>

          <Card style={styles.statCard}>
            <View style={styles.statContent}>
              <Icon name="home" size={32} color={theme.colors.success} />
              <Text style={styles.statNumber}>{dashboardData.todayVisits}</Text>
              <Text style={styles.statLabel}>{t('today_visits')}</Text>
            </View>
          </Card>

          <Card style={styles.statCard}>
            <View style={styles.statContent}>
              <Icon name="schedule" size={32} color={theme.colors.warning} />
              <Text style={styles.statNumber}>{dashboardData.pendingFollowUps}</Text>
              <Text style={styles.statLabel}>{t('pending_followups')}</Text>
            </View>
          </Card>
        </View>
      </View>

      {/* Risk Distribution */}
      <Card style={styles.riskCard}>
        <View style={styles.cardHeader}>
          <Icon name="pie-chart" size={24} color={theme.colors.info} />
          <Text style={styles.cardTitle}>Patient Risk Distribution</Text>
        </View>
        
        <View style={styles.riskDistribution}>
          <View style={styles.riskItem}>
            <View style={[styles.riskDot, { backgroundColor: theme.colors.riskHigh }]} />
            <Text style={styles.riskLabel}>High Risk</Text>
            <Text style={styles.riskCount}>{dashboardData.highRiskPatients}</Text>
          </View>
          
          <View style={styles.riskItem}>
            <View style={[styles.riskDot, { backgroundColor: theme.colors.riskMedium }]} />
            <Text style={styles.riskLabel}>Medium Risk</Text>
            <Text style={styles.riskCount}>{dashboardData.mediumRiskPatients}</Text>
          </View>
          
          <View style={styles.riskItem}>
            <View style={[styles.riskDot, { backgroundColor: theme.colors.riskLow }]} />
            <Text style={styles.riskLabel}>Low Risk</Text>
            <Text style={styles.riskCount}>{dashboardData.lowRiskPatients}</Text>
          </View>
        </View>
      </Card>

      {/* Recent Alerts */}
      <Card style={styles.alertsCard}>
        <View style={styles.cardHeader}>
          <Icon name="notifications" size={24} color={theme.colors.warning} />
          <Text style={styles.cardTitle}>Recent Alerts</Text>
        </View>

        {recentAlerts.map((alert) => (
          <View key={alert.id} style={styles.alertItem}>
            <View style={[
              styles.alertPriority,
              { backgroundColor: getPriorityColor(alert.priority) }
            ]} />
            <View style={styles.alertContent}>
              <Text style={styles.alertPatient}>{alert.patientName}</Text>
              <Text style={styles.alertMessage}>{alert.message}</Text>
              <Text style={styles.alertTime}>{alert.timestamp}</Text>
            </View>
            <TouchableOpacity style={styles.alertAction}>
              <Icon name="arrow-forward" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
        ))}
      </Card>

      {/* Recent Patients */}
      <Card style={styles.patientsCard}>
        <View style={styles.cardHeader}>
          <Icon name="recent-actors" size={24} color={theme.colors.primary} />
          <Text style={styles.cardTitle}>Recent Patients</Text>
          <TouchableOpacity style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {recentPatients.map((patient) => (
          <TouchableOpacity key={patient.id} style={styles.patientItem}>
            <Avatar.Text 
              size={40} 
              label={patient.name.charAt(0)} 
              style={[styles.patientAvatar, { backgroundColor: getRiskColor(patient.riskLevel) }]}
            />
            <View style={styles.patientInfo}>
              <Text style={styles.patientName}>{patient.name}</Text>
              <Text style={styles.patientCondition}>{patient.condition}</Text>
              <Text style={styles.patientLastVisit}>Last visit: {patient.lastVisit}</Text>
            </View>
            <Chip 
              style={[styles.riskChip, { backgroundColor: getRiskColor(patient.riskLevel) }]}
              textStyle={{ color: theme.colors.surface }}
            >
              {patient.riskLevel}
            </Chip>
          </TouchableOpacity>
        ))}
      </Card>

      {/* Quick Actions */}
      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionCard}>
            <Icon name="add" size={32} color={theme.colors.primary} />
            <Text style={styles.actionText}>{t('add_visit')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <Icon name="list" size={32} color={theme.colors.secondary} />
            <Text style={styles.actionText}>{t('patient_list')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <Icon name="history" size={32} color={theme.colors.info} />
            <Text style={styles.actionText}>{t('visit_history')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <Icon name="analytics" size={32} color={theme.colors.success} />
            <Text style={styles.actionText}>Analytics</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Weekly Performance */}
      <Card style={styles.performanceCard}>
        <View style={styles.cardHeader}>
          <Icon name="trending-up" size={24} color={theme.colors.success} />
          <Text style={styles.cardTitle}>This Week's Performance</Text>
        </View>

        <View style={styles.performanceStats}>
          <View style={styles.performanceItem}>
            <Text style={styles.performanceNumber}>{dashboardData.weeklyStats.visitsCompleted}</Text>
            <Text style={styles.performanceLabel}>Visits Completed</Text>
          </View>
          
          <View style={styles.performanceItem}>
            <Text style={styles.performanceNumber}>{dashboardData.weeklyStats.referralsMade}</Text>
            <Text style={styles.performanceLabel}>Referrals Made</Text>
          </View>
          
          <View style={styles.performanceItem}>
            <Text style={styles.performanceNumber}>{dashboardData.weeklyStats.emergenciesHandled}</Text>
            <Text style={styles.performanceLabel}>Emergencies Handled</Text>
          </View>
        </View>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: theme.spacing.md,
    paddingTop: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: theme.colors.primary,
    marginRight: theme.spacing.md,
  },
  greeting: {
    fontSize: 14,
    color: theme.colors.placeholder,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  userRole: {
    fontSize: 14,
    color: theme.colors.placeholder,
  },
  statsSection: {
    padding: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.small,
  },
  statContent: {
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: theme.spacing.sm,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.placeholder,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
  riskCard: {
    margin: theme.spacing.md,
    marginTop: 0,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.small,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderColor,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  riskDistribution: {
    padding: theme.spacing.md,
  },
  riskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  riskDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: theme.spacing.md,
  },
  riskLabel: {
    fontSize: 16,
    color: theme.colors.text,
    flex: 1,
  },
  riskCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  alertsCard: {
    margin: theme.spacing.md,
    marginTop: 0,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.small,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderColor,
  },
  alertPriority: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: theme.spacing.md,
  },
  alertContent: {
    flex: 1,
  },
  alertPatient: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  alertMessage: {
    fontSize: 14,
    color: theme.colors.placeholder,
    marginTop: theme.spacing.xs,
  },
  alertTime: {
    fontSize: 12,
    color: theme.colors.placeholder,
    marginTop: theme.spacing.xs,
  },
  alertAction: {
    padding: theme.spacing.sm,
  },
  patientsCard: {
    margin: theme.spacing.md,
    marginTop: 0,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.small,
  },
  viewAllButton: {
    marginLeft: 'auto',
  },
  viewAllText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  patientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderColor,
  },
  patientAvatar: {
    marginRight: theme.spacing.md,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  patientCondition: {
    fontSize: 14,
    color: theme.colors.placeholder,
    marginTop: theme.spacing.xs,
  },
  patientLastVisit: {
    fontSize: 12,
    color: theme.colors.placeholder,
    marginTop: theme.spacing.xs,
  },
  riskChip: {
    marginLeft: theme.spacing.sm,
  },
  actionsSection: {
    padding: theme.spacing.md,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    alignItems: 'center',
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.small,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  performanceCard: {
    margin: theme.spacing.md,
    marginTop: 0,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.small,
  },
  performanceStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: theme.spacing.md,
  },
  performanceItem: {
    alignItems: 'center',
  },
  performanceNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.success,
  },
  performanceLabel: {
    fontSize: 12,
    color: theme.colors.placeholder,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
});

export default ASHADashboardScreen;