import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { Card, Button, TextInput, Chip } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useLanguage } from '../context/LanguageContext';
import { useOffline } from '../context/OfflineContext';
import { symptomsAPI, offlineAPI } from '../services/api';
import { theme } from '../theme/theme';

const { width } = Dimensions.get('window');

const SymptomCheckerScreen = ({ navigation }) => {
  const { t } = useLanguage();
  const { isConnected } = useOffline();
  const [inputMode, setInputMode] = useState('text'); // 'text', 'voice', 'image'
  const [symptoms, setSymptoms] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const commonSymptoms = [
    { key: 'fever', label: t('fever') },
    { key: 'headache', label: t('headache') },
    { key: 'cough', label: t('cough') },
    { key: 'chest_pain', label: t('chest_pain') },
    { key: 'stomach_pain', label: t('stomach_pain') },
    { key: 'vomiting', label: t('vomiting') },
    { key: 'diarrhea', label: t('diarrhea') },
    { key: 'fatigue', label: t('fatigue') },
  ];

  const inputModes = [
    {
      key: 'text',
      title: t('text_input'),
      icon: 'keyboard',
      color: theme.colors.primary,
    },
    {
      key: 'voice',
      title: t('voice_input'),
      icon: 'mic',
      color: theme.colors.secondary,
    },
    {
      key: 'image',
      title: t('image_input'),
      icon: 'camera-alt',
      color: theme.colors.info,
    },
  ];

  const toggleSymptom = (symptom) => {
    setSelectedSymptoms(prev => {
      if (prev.includes(symptom.key)) {
        return prev.filter(s => s !== symptom.key);
      } else {
        return [...prev, symptom.key];
      }
    });
  };

  const startVoiceInput = () => {
    setIsListening(true);
    // Mock voice input for demo
    setTimeout(() => {
      setSymptoms('मुझे बुखार और सिरदर्द है');
      setIsListening(false);
      Alert.alert('Voice Input', 'Voice converted to text successfully!');
    }, 2000);
  };

  const analyzeSymptoms = async () => {
    const allSymptoms = [...selectedSymptoms];
    if (symptoms.trim()) {
      allSymptoms.push(symptoms.trim());
    }

    if (allSymptoms.length === 0) {
      Alert.alert(t('error'), 'Please describe your symptoms');
      return;
    }

    setIsAnalyzing(true);

    try {
      let result;
      
      if (isConnected) {
        // Use online AI analysis
        result = await symptomsAPI.analyzeSymptoms({
          symptoms: allSymptoms,
          inputType: inputMode,
          language: 'hi',
          patientAge: 30,
          patientGender: 'unknown',
        });
      } else {
        // Use offline analysis
        result = await offlineAPI.analyzeSymptoms(allSymptoms, 30, 'unknown');
      }

      if (result.success) {
        navigation.navigate('Result', { 
          analysis: result.analysis,
          symptoms: allSymptoms 
        });
      } else {
        Alert.alert(t('error'), 'Analysis failed. Please try again.');
      }
    } catch (error) {
      console.error('Symptom analysis error:', error);
      Alert.alert(t('error'), 'Something went wrong. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('symptom_checker')}</Text>
        <Text style={styles.subtitle}>{t('describe_symptoms')}</Text>
        
        {/* Connection Status */}
        <View style={[styles.connectionBadge, {
          backgroundColor: isConnected ? theme.colors.success : theme.colors.warning
        }]}>
          <Icon 
            name={isConnected ? 'wifi' : 'wifi-off'} 
            size={16} 
            color={theme.colors.surface} 
          />
          <Text style={styles.connectionText}>
            {isConnected ? 'Online AI' : 'Offline Mode'}
          </Text>
        </View>
      </View>

      {/* Input Mode Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How would you like to describe your symptoms?</Text>
        
        <View style={styles.inputModes}>
          {inputModes.map((mode) => (
            <TouchableOpacity
              key={mode.key}
              style={[
                styles.inputModeCard,
                {
                  backgroundColor: inputMode === mode.key 
                    ? `${mode.color}20` 
                    : theme.colors.surface,
                  borderColor: inputMode === mode.key 
                    ? mode.color 
                    : theme.colors.borderColor,
                }
              ]}
              onPress={() => setInputMode(mode.key)}
            >
              <Icon 
                name={mode.icon} 
                size={32} 
                color={inputMode === mode.key ? mode.color : theme.colors.placeholder} 
              />
              <Text style={[
                styles.inputModeText,
                { color: inputMode === mode.key ? mode.color : theme.colors.text }
              ]}>
                {mode.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Input Section */}
      <View style={styles.section}>
        {inputMode === 'text' && (
          <TextInput
            label="Describe your symptoms"
            value={symptoms}
            onChangeText={setSymptoms}
            mode="outlined"
            multiline
            numberOfLines={4}
            style={styles.textInput}
            placeholder="e.g., मुझे बुखार और सिरदर्द है"
          />
        )}

        {inputMode === 'voice' && (
          <Card style={styles.voiceCard}>
            <TouchableOpacity
              style={[
                styles.voiceButton,
                { backgroundColor: isListening ? theme.colors.secondary : theme.colors.primary }
              ]}
              onPress={startVoiceInput}
              disabled={isListening}
            >
              <Icon 
                name={isListening ? 'mic' : 'mic-none'} 
                size={48} 
                color={theme.colors.surface} 
              />
              <Text style={styles.voiceButtonText}>
                {isListening ? t('listening') : t('tap_to_speak')}
              </Text>
            </TouchableOpacity>
            
            {symptoms && (
              <View style={styles.voiceResult}>
                <Text style={styles.voiceResultLabel}>Recognized:</Text>
                <Text style={styles.voiceResultText}>{symptoms}</Text>
              </View>
            )}
          </Card>
        )}

        {inputMode === 'image' && (
          <Card style={styles.imageCard}>
            <TouchableOpacity style={styles.imageButton}>
              <Icon name="camera-alt" size={48} color={theme.colors.primary} />
              <Text style={styles.imageButtonText}>Take Photo</Text>
              <Text style={styles.imageButtonSubtext}>
                For skin conditions, wounds, or rashes
              </Text>
            </TouchableOpacity>
          </Card>
        )}
      </View>

      {/* Common Symptoms */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Or select common symptoms:</Text>
        
        <View style={styles.symptomsGrid}>
          {commonSymptoms.map((symptom) => (
            <Chip
              key={symptom.key}
              selected={selectedSymptoms.includes(symptom.key)}
              onPress={() => toggleSymptom(symptom)}
              style={[
                styles.symptomChip,
                {
                  backgroundColor: selectedSymptoms.includes(symptom.key)
                    ? theme.colors.primary
                    : theme.colors.surface,
                }
              ]}
              textStyle={{
                color: selectedSymptoms.includes(symptom.key)
                  ? theme.colors.surface
                  : theme.colors.text,
              }}
            >
              {symptom.label}
            </Chip>
          ))}
        </View>
      </View>

      {/* Analyze Button */}
      <View style={styles.analyzeSection}>
        <Button
          mode="contained"
          onPress={analyzeSymptoms}
          loading={isAnalyzing}
          disabled={isAnalyzing || (selectedSymptoms.length === 0 && !symptoms.trim())}
          style={styles.analyzeButton}
          contentStyle={styles.analyzeButtonContent}
          icon="health-and-safety"
        >
          {isAnalyzing ? t('processing') : t('analyze_symptoms')}
        </Button>

        {(selectedSymptoms.length > 0 || symptoms.trim()) && (
          <Text style={styles.analyzeHint}>
            {isConnected 
              ? 'AI will analyze your symptoms and provide recommendations'
              : 'Using offline analysis - basic recommendations only'
            }
          </Text>
        )}
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
    marginBottom: theme.spacing.md,
  },
  connectionBadge: {
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
  section: {
    padding: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  inputModes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputModeCard: {
    flex: 1,
    alignItems: 'center',
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.xs,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
  },
  inputModeText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  textInput: {
    backgroundColor: theme.colors.surface,
  },
  voiceCard: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
  },
  voiceButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceButtonText: {
    fontSize: 14,
    color: theme.colors.surface,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  voiceResult: {
    marginTop: theme.spacing.lg,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    width: '100%',
  },
  voiceResultLabel: {
    fontSize: 12,
    color: theme.colors.placeholder,
    marginBottom: theme.spacing.xs,
  },
  voiceResultText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  imageCard: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
  },
  imageButton: {
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  imageButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
    marginTop: theme.spacing.sm,
  },
  imageButtonSubtext: {
    fontSize: 12,
    color: theme.colors.placeholder,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  symptomsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  symptomChip: {
    marginBottom: theme.spacing.sm,
  },
  analyzeSection: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  analyzeButton: {
    backgroundColor: theme.colors.primary,
  },
  analyzeButtonContent: {
    paddingVertical: theme.spacing.sm,
  },
  analyzeHint: {
    fontSize: 12,
    color: theme.colors.placeholder,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    lineHeight: 16,
  },
});

export default SymptomCheckerScreen;