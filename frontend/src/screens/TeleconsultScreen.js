import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Card, Button, Avatar, Chip } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useLanguage } from '../context/LanguageContext';
import { theme } from '../theme/theme';

const TeleconsultScreen = ({ navigation }) => {
  const { t } = useLanguage();
  const [selectedTab, setSelectedTab] = useState('doctors');

  const mockDoctors = [
    {
      id: 'doc_001',
      name: 'Dr. Rajesh Kumar',
      specialization: 'General Medicine',
      experience: '15 years',
      rating: 4.8,
      languages: ['Hindi', 'English'],
      availability: 'available',
      consultationFee: 200,
      nextSlot: '2:30 PM Today'
    },
    {
      id: 'doc_002',
      name: 'Dr. Priya Sharma',
      specialization: 'Pediatrics',
      experience: '12 years',
      rating: 4.9,
      languages: ['Hindi', 'English'],
      availability: 'busy',
      consultationFee: 250,
      nextSlot: '4:00 PM Today'
    },
    {
      id: 'doc_003',
      name: 'Dr. Amit Singh',
      specialization: 'Cardiology',
      experience: '20 years',
      rating: 4.7,
      languages: ['Hindi', 'English', 'Punjabi'],
      availability: 'available',
      consultationFee: 400,
      nextSlot: '3:15 PM Today'
    }
  ];

  const mockConsultations = [
    {
      id: 'consult_001',
      doctorName: 'Dr. Rajesh Kumar',
      specialization: 'General Medicine',
      scheduledTime: '2024-01-25 14:30',
      status: 'upcoming',
      meetingLink: 'https://meet.esanjeevani.in/room/12345',
      symptoms: 'Fever, Headache'
    },
    {
      id: 'consult_002',
      doctorName: 'Dr. Priya Sharma',
      specialization: 'Pediatrics',
      scheduledTime: '2024-01-20 10:00',
      status: 'completed',
      diagnosis: 'Viral fever',
      prescription: 'Paracetamol 500mg twice daily'
    }
  ];

  const getAvailabilityColor = (availability) => {
    switch (availability) {
      case 'available':
        return theme.colors.success;
      case 'busy':
        return theme.colors.warning;
      case 'offline':
        return theme.colors.error;
      default:
        return theme.colors.placeholder;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming':
        return theme.colors.info;
      case 'completed':
        return theme.colors.success;
      case 'cancelled':
        return theme.colors.error;
      default:
        return theme.colors.placeholder;
    }
  };

  const handleBookConsultation = (doctor) => {
    Alert.alert(
      'Book Consultation',
      `Book consultation with ${doctor.name}?\nFee: ₹${doctor.consultationFee}\nNext available: ${doctor.nextSlot}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Book Now', 
          onPress: () => {
            Alert.alert('Success', 'Consultation booked successfully!');
          }
        }
      ]
    );
  };

  const handleJoinMeeting = (meetingLink) => {
    Alert.alert(
      'Join Consultation',
      'This will open the video consultation in your browser.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Join Now', onPress: () => console.log('Opening:', meetingLink) }
      ]
    );
  };

  const renderDoctors = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {mockDoctors.map((doctor) => (
        <Card key={doctor.id} style={styles.doctorCard}>
          <View style={styles.doctorHeader}>
            <Avatar.Text 
              size={60} 
              label={doctor.name.split(' ').map(n => n[0]).join('')}
              style={styles.doctorAvatar}
            />
            <View style={styles.doctorInfo}>
              <Text style={styles.doctorName}>{doctor.name}</Text>
              <Text style={styles.doctorSpecialization}>{doctor.specialization}</Text>
              <Text style={styles.doctorExperience}>{doctor.experience} experience</Text>
              
              <View style={styles.doctorMeta}>
                <View style={styles.ratingContainer}>
                  <Icon name="star" size={16} color={theme.colors.warning} />
                  <Text style={styles.rating}>{doctor.rating}</Text>
                </View>
                
                <View style={[
                  styles.availabilityBadge,
                  { backgroundColor: getAvailabilityColor(doctor.availability) }
                ]}>
                  <Text style={styles.availabilityText}>{doctor.availability}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.doctorDetails}>
            <View style={styles.languagesContainer}>
              <Text style={styles.languagesLabel}>Languages:</Text>
              <View style={styles.languagesList}>
                {doctor.languages.map((lang, index) => (
                  <Chip key={index} style={styles.languageChip} compact>
                    {lang}
                  </Chip>
                ))}
              </View>
            </View>

            <View style={styles.consultationInfo}>
              <View style={styles.feeContainer}>
                <Icon name="currency-rupee" size={16} color={theme.colors.success} />
                <Text style={styles.consultationFee}>₹{doctor.consultationFee}</Text>
              </View>
              
              <Text style={styles.nextSlot}>Next: {doctor.nextSlot}</Text>
            </View>
          </View>

          <View style={styles.doctorActions}>
            <Button
              mode="contained"
              onPress={() => handleBookConsultation(doctor)}
              disabled={doctor.availability === 'offline'}
              style={styles.bookButton}
              icon="video-call"
            >
              {t('book_appointment')}
            </Button>
          </View>
        </Card>
      ))}
    </ScrollView>
  );

  const renderConsultations = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {mockConsultations.map((consultation) => (
        <Card key={consultation.id} style={styles.consultationCard}>
          <View style={styles.consultationHeader}>
            <View style={styles.consultationInfo}>
              <Text style={styles.consultationDoctor}>{consultation.doctorName}</Text>
              <Text style={styles.consultationSpecialization}>{consultation.specialization}</Text>
              <Text style={styles.consultationTime}>
                {new Date(consultation.scheduledTime).toLocaleString()}
              </Text>
            </View>
            
            <Chip 
              style={[
                styles.statusChip,
                { backgroundColor: getStatusColor(consultation.status) }
              ]}
              textStyle={{ color: theme.colors.surface }}
            >
              {consultation.status}
            </Chip>
          </View>

          {consultation.symptoms && (
            <View style={styles.consultationDetails}>
              <Text style={styles.detailLabel}>Symptoms:</Text>
              <Text style={styles.detailText}>{consultation.symptoms}</Text>
            </View>
          )}

          {consultation.diagnosis && (
            <View style={styles.consultationDetails}>
              <Text style={styles.detailLabel}>Diagnosis:</Text>
              <Text style={styles.detailText}>{consultation.diagnosis}</Text>
            </View>
          )}

          {consultation.prescription && (
            <View style={styles.consultationDetails}>
              <Text style={styles.detailLabel}>Prescription:</Text>
              <Text style={styles.detailText}>{consultation.prescription}</Text>
            </View>
          )}

          <View style={styles.consultationActions}>
            {consultation.status === 'upcoming' && consultation.meetingLink && (
              <Button
                mode="contained"
                onPress={() => handleJoinMeeting(consultation.meetingLink)}
                style={styles.joinButton}
                icon="video-call"
              >
                Join Meeting
              </Button>
            )}
            
            {consultation.status === 'completed' && (
              <Button
                mode="outlined"
                onPress={() => Alert.alert('Prescription', consultation.prescription)}
                style={styles.prescriptionButton}
                icon="receipt"
              >
                View Prescription
              </Button>
            )}
          </View>
        </Card>
      ))}
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('teleconsult')}</Text>
        <Text style={styles.subtitle}>Connect with doctors remotely</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'doctors' && styles.activeTab
          ]}
          onPress={() => setSelectedTab('doctors')}
        >
          <Text style={[
            styles.tabText,
            selectedTab === 'doctors' && styles.activeTabText
          ]}>
            {t('available_doctors')}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'consultations' && styles.activeTab
          ]}
          onPress={() => setSelectedTab('consultations')}
        >
          <Text style={[
            styles.tabText,
            selectedTab === 'consultations' && styles.activeTabText
          ]}>
            {t('my_consultations')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {selectedTab === 'doctors' ? renderDoctors() : renderConsultations()}
      </View>

      {/* Emergency Note */}
      <Card style={styles.emergencyNote}>
        <View style={styles.emergencyContent}>
          <Icon name="info" size={20} color={theme.colors.warning} />
          <Text style={styles.emergencyText}>
            For medical emergencies, call 108 immediately. Teleconsultation is for non-emergency cases only.
          </Text>
        </View>
      </Card>
    </View>
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
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.placeholder,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    borderRadius: theme.borderRadius.sm,
  },
  activeTab: {
    backgroundColor: theme.colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.placeholder,
  },
  activeTabText: {
    color: theme.colors.surface,
  },
  content: {
    flex: 1,
    padding: theme.spacing.md,
  },
  doctorCard: {
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.small,
  },
  doctorHeader: {
    flexDirection: 'row',
    padding: theme.spacing.md,
  },
  doctorAvatar: {
    backgroundColor: theme.colors.primary,
    marginRight: theme.spacing.md,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  doctorSpecialization: {
    fontSize: 14,
    color: theme.colors.primary,
    marginTop: theme.spacing.xs,
  },
  doctorExperience: {
    fontSize: 14,
    color: theme.colors.placeholder,
    marginTop: theme.spacing.xs,
  },
  doctorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  rating: {
    fontSize: 14,
    color: theme.colors.text,
    marginLeft: theme.spacing.xs,
  },
  availabilityBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  availabilityText: {
    fontSize: 12,
    color: theme.colors.surface,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  doctorDetails: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  languagesContainer: {
    marginBottom: theme.spacing.md,
  },
  languagesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  languagesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  languageChip: {
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
    backgroundColor: `${theme.colors.info}20`,
  },
  consultationInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  consultationFee: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.success,
    marginLeft: theme.spacing.xs,
  },
  nextSlot: {
    fontSize: 14,
    color: theme.colors.info,
  },
  doctorActions: {
    padding: theme.spacing.md,
    paddingTop: 0,
  },
  bookButton: {
    backgroundColor: theme.colors.primary,
  },
  consultationCard: {
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.small,
  },
  consultationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: theme.spacing.md,
  },
  consultationInfo: {
    flex: 1,
  },
  consultationDoctor: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  consultationSpecialization: {
    fontSize: 14,
    color: theme.colors.primary,
    marginTop: theme.spacing.xs,
  },
  consultationTime: {
    fontSize: 14,
    color: theme.colors.placeholder,
    marginTop: theme.spacing.xs,
  },
  statusChip: {
    marginLeft: theme.spacing.sm,
  },
  consultationDetails: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  detailText: {
    fontSize: 14,
    color: theme.colors.placeholder,
  },
  consultationActions: {
    padding: theme.spacing.md,
    paddingTop: 0,
  },
  joinButton: {
    backgroundColor: theme.colors.success,
  },
  prescriptionButton: {
    borderColor: theme.colors.primary,
  },
  emergencyNote: {
    margin: theme.spacing.md,
    backgroundColor: `${theme.colors.warning}10`,
    ...theme.shadows.small,
  },
  emergencyContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: theme.spacing.md,
  },
  emergencyText: {
    fontSize: 12,
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
    flex: 1,
    lineHeight: 16,
  },
});

export default TeleconsultScreen;