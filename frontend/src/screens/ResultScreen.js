import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { Card, Button, Chip } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useLanguage } from '../context/LanguageContext';
import { theme } from '../theme/theme';

const ResultScreen = ({ route, navigation }) => {
  const { t } = useLanguage();
  const { analysis, symptoms } = route.params;

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'red':
        return theme.colors.riskHigh;
      case 'amber':
        return theme.colors.riskMedium;
      case 'green':
        return theme.colors.riskLow;
      default:
        return theme.colors.placeholder;
    }
  };

  const getRiskIcon = (riskLevel) => {
    switch (riskLevel) {
      case 'red':
        return 'warning';
      case 'amber':
        return 'info';
      case 'green':
        return 'check-circle';
      default:
        return 'help';
    }
  };

  const getRiskTitle = (riskLevel) => {
    switch (riskLevel) {
      case 'red':
        return t('high_risk');
      case 'amber':
        return t('medium_risk');
      case 'green':
        return t('low_risk');
      default:
        return 'Unknown Risk';
    }
  };

  const handleEmergencyCall = () => {
    Alert.alert(
      'Emergency Call',
      'Do you want to call 108 for ambulance?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Call Now', 
          onPress: () => Linking.openURL('tel:108'),
          style: 'destructive'
        }
      ]
    );
  };

  const handleFindResources = () => {
    navigation.navigate('Resources');
  };

  const handleBookConsultation = () => {
    navigation.navigate('Teleconsult');
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Analysis Result</Text>
      </View>

      {/* Risk Assessment Card */}
      <Card style={styles.riskCard}>
        <View style={[styles.riskHeader, { backgroundColor: getRiskColor(analysis.riskLevel) }]}>
          <Icon 
            name={getRiskIcon(analysis.riskLevel)} 
            size={48} 
            color={theme.colors.surface} 
          />
          <View style={styles.riskInfo}>
            <Text style={styles.riskTitle}>{getRiskTitle(analysis.riskLevel)}</Text>
            <Text style={styles.riskScore}>Risk Score: {analysis.riskScore}/100</Text>
          </View>
        </View>

        <View style={styles.riskContent}>
          <Text style={styles.explanation}>{analysis.explanation}</Text>
        </View>
      </Card>

      {/* Symptoms Summary */}
      <Card style={styles.symptomsCard}>
        <View style={styles.cardHeader}>
          <Icon name="list" size={24} color={theme.colors.primary} />
          <Text style={styles.cardTitle}>Your Symptoms</Text>
        </View>
        
        <View style={styles.symptomsContainer}>
          {symptoms.map((symptom, index) => (
            <Chip key={index} style={styles.symptomChip}>
              {symptom}
            </Chip>
          ))}
        </View>
      </Card>

      {/* Recommendations */}
      <Card style={styles.recommendationsCard}>
        <View style={styles.cardHeader}>
          <Icon name="lightbulb" size={24} color={theme.colors.secondary} />
          <Text style={styles.cardTitle}>Recommendations</Text>
        </View>

        <View style={styles.recommendationsList}>
          {analysis.recommendations?.map((recommendation, index) => (
            <View key={index} style={styles.recommendationItem}>
              <Icon name="check" size={20} color={theme.colors.success} />
              <Text style={styles.recommendationText}>{recommendation}</Text>
            </View>
          ))}
        </View>
      </Card>

      {/* Action Buttons */}
      <View style={styles.actionsSection}>
        {analysis.riskLevel === 'red' && (
          <Button
            mode="contained"
            onPress={handleEmergencyCall}
            style={[styles.actionButton, { backgroundColor: theme.colors.error }]}
            contentStyle={styles.buttonContent}
            icon="phone"
          >
            Call Emergency (108)
          </Button>
        )}

        {(analysis.riskLevel === 'amber' || analysis.riskLevel === 'red') && (
          <Button
            mode="contained"
            onPress={handleFindResources}
            style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
            contentStyle={styles.buttonContent}
            icon="location-on"
          >
            Find Nearest Healthcare
          </Button>
        )}

        <Button
          mode="outlined"
          onPress={handleBookConsultation}
          style={styles.actionButton}
          contentStyle={styles.buttonContent}
          icon="video-call"
        >
          Book Teleconsultation
        </Button>

        <Button
          mode="text"
          onPress={() => navigation.navigate('Symptoms')}
          style={styles.actionButton}
          icon="refresh"
        >
          Check Again
        </Button>
      </View>

      {/* Additional Info */}
      <Card style={styles.infoCard}>
        <View style={styles.infoContent}>
          <Icon name="info" size={20} color={theme.colors.info} />
          <View style={styles.infoText}>
            <Text style={styles.infoTitle}>Important Note</Text>
            <Text style={styles.infoDescription}>
              This AI analysis is for guidance only and should not replace professional medical advice. 
              If symptoms persist or worsen, please consult a healthcare professional immediately.
            </Text>
          </View>
        </View>
      </Card>

      {/* Urgency Timeline */}
      {analysis.urgency && (
        <Card style={styles.timelineCard}>
          <View style={styles.cardHeader}>
            <Icon name="schedule" size={24} color={theme.colors.warning} />
            <Text style={styles.cardTitle}>Recommended Timeline</Text>
          </View>

          <View style={styles.timelineContent}>
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: getRiskColor(analysis.riskLevel) }]} />
              <View style={styles.timelineText}>
                <Text style={styles.timelineTitle}>
                  {analysis.urgency === 'immediate' ? 'Immediate Action Required' :
                   analysis.urgency === 'moderate' ? 'Seek Care Soon' : 'Monitor Symptoms'}
                </Text>
                <Text style={styles.timelineDescription}>
                  Expected wait time: {analysis.estimatedWaitTime}
                </Text>
              </View>
            </View>
          </View>
        </Card>
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
    alignItems: 'center',
    padding: theme.spacing.md,
    paddingTop: theme.spacing.xl,
  },
  backButton: {
    padding: theme.spacing.sm,
    marginRight: theme.spacing.sm,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  riskCard: {
    margin: theme.spacing.md,
    marginTop: 0,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.medium,
  },
  riskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  riskInfo: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  riskTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.surface,
  },
  riskScore: {
    fontSize: 16,
    color: theme.colors.surface,
    opacity: 0.9,
  },
  riskContent: {
    padding: theme.spacing.lg,
  },
  explanation: {
    fontSize: 16,
    color: theme.colors.text,
    lineHeight: 24,
  },
  symptomsCard: {
    margin: theme.spacing.md,
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
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
  },
  symptomsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  symptomChip: {
    backgroundColor: `${theme.colors.primary}20`,
  },
  recommendationsCard: {
    margin: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.small,
  },
  recommendationsList: {
    padding: theme.spacing.md,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  recommendationText: {
    fontSize: 16,
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
    flex: 1,
    lineHeight: 22,
  },
  actionsSection: {
    padding: theme.spacing.md,
  },
  actionButton: {
    marginBottom: theme.spacing.md,
  },
  buttonContent: {
    paddingVertical: theme.spacing.sm,
  },
  infoCard: {
    margin: theme.spacing.md,
    backgroundColor: `${theme.colors.info}10`,
    ...theme.shadows.small,
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: theme.spacing.md,
  },
  infoText: {
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  infoDescription: {
    fontSize: 14,
    color: theme.colors.placeholder,
    lineHeight: 20,
  },
  timelineCard: {
    margin: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.small,
  },
  timelineContent: {
    padding: theme.spacing.md,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: theme.spacing.md,
  },
  timelineText: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  timelineDescription: {
    fontSize: 14,
    color: theme.colors.placeholder,
  },
});

export default ResultScreen;