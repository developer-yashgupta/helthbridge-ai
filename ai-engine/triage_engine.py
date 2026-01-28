import logging
from datetime import datetime
import json

logger = logging.getLogger(__name__)

class TriageEngine:
    def __init__(self):
        # Triage rules based on medical protocols
        self.triage_rules = {
            'emergency': {
                'min_score': 80,
                'symptoms': [
                    'chest_pain', 'difficulty_breathing', 'unconsciousness',
                    'severe_bleeding', 'stroke_symptoms'
                ],
                'age_factors': {
                    'infant': 1.5,  # 0-2 years
                    'elderly': 1.3,  # 65+ years
                    'adult': 1.0
                }
            },
            'urgent': {
                'min_score': 60,
                'symptoms': [
                    'high_fever', 'severe_headache', 'persistent_vomiting',
                    'severe_abdominal_pain', 'dehydration'
                ],
                'age_factors': {
                    'infant': 1.4,
                    'elderly': 1.2,
                    'adult': 1.0
                }
            },
            'semi_urgent': {
                'min_score': 40,
                'symptoms': [
                    'fever', 'moderate_pain', 'persistent_cough',
                    'diarrhea', 'vomiting'
                ],
                'age_factors': {
                    'infant': 1.2,
                    'elderly': 1.1,
                    'adult': 1.0
                }
            },
            'non_urgent': {
                'min_score': 0,
                'symptoms': [
                    'mild_headache', 'runny_nose', 'sore_throat',
                    'mild_cough', 'fatigue'
                ],
                'age_factors': {
                    'infant': 1.1,
                    'elderly': 1.0,
                    'adult': 1.0
                }
            }
        }
        
        # Medical history risk factors
        self.risk_factors = {
            'diabetes': 1.2,
            'hypertension': 1.15,
            'heart_disease': 1.3,
            'asthma': 1.2,
            'copd': 1.25,
            'kidney_disease': 1.2,
            'immunocompromised': 1.4,
            'pregnancy': 1.3
        }
        
        logger.info("Triage engine initialized")
    
    def make_decision(self, analysis, age=30, medical_history=None, vital_signs=None):
        """Make triage decision based on analysis and patient factors"""
        try:
            base_score = analysis.get('riskScore', 50)
            symptoms = analysis.get('symptoms', [])
            
            # Apply age adjustments
            age_category = self._categorize_age(age)
            adjusted_score = self._apply_age_adjustment(base_score, age_category, symptoms)
            
            # Apply medical history adjustments
            if medical_history:
                adjusted_score = self._apply_medical_history(adjusted_score, medical_history)
            
            # Apply vital signs adjustments
            if vital_signs:
                adjusted_score = self._apply_vital_signs(adjusted_score, vital_signs)
            
            # Determine triage category
            triage_category = self._determine_triage_category(adjusted_score, symptoms)
            
            # Generate decision
            decision = self._generate_decision(triage_category, adjusted_score, symptoms, age)
            
            return decision
            
        except Exception as e:
            logger.error(f"Triage decision error: {str(e)}")
            return self._default_decision()
    
    def _categorize_age(self, age):
        """Categorize age for risk assessment"""
        if age <= 2:
            return 'infant'
        elif age <= 12:
            return 'child'
        elif age <= 18:
            return 'adolescent'
        elif age <= 65:
            return 'adult'
        else:
            return 'elderly'
    
    def _apply_age_adjustment(self, score, age_category, symptoms):
        """Apply age-based risk adjustments"""
        # Find the highest applicable triage category
        max_adjustment = 1.0
        
        for category, rules in self.triage_rules.items():
            if any(symptom in symptoms for symptom in rules['symptoms']):
                adjustment = rules['age_factors'].get(age_category, 1.0)
                max_adjustment = max(max_adjustment, adjustment)
        
        return score * max_adjustment
    
    def _apply_medical_history(self, score, medical_history):
        """Apply medical history risk factors"""
        total_adjustment = 1.0
        
        for condition in medical_history:
            if condition in self.risk_factors:
                total_adjustment *= self.risk_factors[condition]
        
        # Cap the adjustment to prevent extreme scores
        total_adjustment = min(total_adjustment, 2.0)
        
        return score * total_adjustment
    
    def _apply_vital_signs(self, score, vital_signs):
        """Apply vital signs adjustments"""
        adjustment = 1.0
        
        # Temperature adjustments
        temp = vital_signs.get('temperature')
        if temp:
            if temp > 103:  # Very high fever
                adjustment *= 1.3
            elif temp > 101:  # High fever
                adjustment *= 1.2
            elif temp < 95:  # Hypothermia
                adjustment *= 1.4
        
        # Heart rate adjustments
        heart_rate = vital_signs.get('heart_rate')
        if heart_rate:
            if heart_rate > 120:  # Tachycardia
                adjustment *= 1.2
            elif heart_rate < 50:  # Bradycardia
                adjustment *= 1.3
        
        # Blood pressure adjustments
        systolic_bp = vital_signs.get('systolic_bp')
        if systolic_bp:
            if systolic_bp > 180:  # Hypertensive crisis
                adjustment *= 1.4
            elif systolic_bp < 90:  # Hypotension
                adjustment *= 1.3
        
        # Oxygen saturation
        oxygen_sat = vital_signs.get('oxygen_saturation')
        if oxygen_sat and oxygen_sat < 95:
            adjustment *= 1.5
        
        return score * adjustment
    
    def _determine_triage_category(self, score, symptoms):
        """Determine triage category based on score and symptoms"""
        # Check for emergency symptoms first
        emergency_symptoms = self.triage_rules['emergency']['symptoms']
        if any(symptom in symptoms for symptom in emergency_symptoms) or score >= 80:
            return 'emergency'
        
        # Check other categories by score
        if score >= 60:
            return 'urgent'
        elif score >= 40:
            return 'semi_urgent'
        else:
            return 'non_urgent'
    
    def _generate_decision(self, triage_category, score, symptoms, age):
        """Generate triage decision with recommendations"""
        decisions = {
            'emergency': {
                'action': 'emergency',
                'priority': 'critical',
                'timeframe': 'immediate',
                'destination': 'emergency_department',
                'transport': 'ambulance',
                'monitoring': 'continuous'
            },
            'urgent': {
                'action': 'phc_referral',
                'priority': 'high',
                'timeframe': 'within_2_hours',
                'destination': 'phc_or_chc',
                'transport': 'urgent_transport',
                'monitoring': 'frequent'
            },
            'semi_urgent': {
                'action': 'asha_visit',
                'priority': 'medium',
                'timeframe': 'within_24_hours',
                'destination': 'community_care',
                'transport': 'self_transport',
                'monitoring': 'regular'
            },
            'non_urgent': {
                'action': 'home_care',
                'priority': 'low',
                'timeframe': 'monitor_48_hours',
                'destination': 'home',
                'transport': 'none',
                'monitoring': 'self_monitoring'
            }
        }
        
        base_decision = decisions[triage_category]
        
        # Add specific instructions
        instructions = self._generate_instructions(triage_category, symptoms, age)
        
        return {
            **base_decision,
            'triage_score': int(score),
            'triage_category': triage_category,
            'instructions': instructions,
            'follow_up': self._determine_follow_up(triage_category),
            'red_flags': self._identify_red_flags(symptoms),
            'timestamp': datetime.now().isoformat()
        }
    
    def _generate_instructions(self, category, symptoms, age):
        """Generate specific instructions based on triage category"""
        instructions = {
            'emergency': [
                'Call 108 immediately for ambulance',
                'Do not delay - go to nearest hospital',
                'Keep patient calm and comfortable',
                'Monitor breathing and consciousness'
            ],
            'urgent': [
                'Visit PHC or CHC within 2 hours',
                'Arrange transportation',
                'Bring medical history if available',
                'Monitor symptoms closely'
            ],
            'semi_urgent': [
                'Contact ASHA worker for assessment',
                'Schedule PHC visit if symptoms persist',
                'Take prescribed medications',
                'Rest and maintain hydration'
            ],
            'non_urgent': [
                'Continue home care measures',
                'Monitor symptoms for changes',
                'Maintain good hygiene',
                'Seek care if symptoms worsen'
            ]
        }
        
        base_instructions = instructions[category]
        
        # Add age-specific instructions
        if age <= 5:
            base_instructions.append('Keep child hydrated and comfortable')
        elif age >= 65:
            base_instructions.append('Monitor for complications due to age')
        
        return base_instructions
    
    def _determine_follow_up(self, category):
        """Determine follow-up requirements"""
        follow_ups = {
            'emergency': 'hospital_admission',
            'urgent': 'doctor_consultation_24h',
            'semi_urgent': 'asha_follow_up_48h',
            'non_urgent': 'self_monitoring_72h'
        }
        
        return follow_ups[category]
    
    def _identify_red_flags(self, symptoms):
        """Identify red flag symptoms that require immediate attention"""
        red_flags = [
            'chest_pain', 'difficulty_breathing', 'unconsciousness',
            'severe_bleeding', 'stroke_symptoms', 'severe_abdominal_pain'
        ]
        
        return [symptom for symptom in symptoms if symptom in red_flags]
    
    def _default_decision(self):
        """Default decision when triage fails"""
        return {
            'action': 'asha_visit',
            'priority': 'medium',
            'timeframe': 'within_24_hours',
            'destination': 'community_care',
            'transport': 'self_transport',
            'monitoring': 'regular',
            'triage_score': 50,
            'triage_category': 'semi_urgent',
            'instructions': ['Contact ASHA worker for assessment'],
            'follow_up': 'asha_follow_up_48h',
            'red_flags': [],
            'timestamp': datetime.now().isoformat()
        }