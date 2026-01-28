import numpy as np
import json
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class SymptomAnalyzer:
    def __init__(self):
        self.symptom_weights = {
            # High risk symptoms
            'chest_pain': 0.9,
            'difficulty_breathing': 0.85,
            'severe_bleeding': 0.95,
            'unconsciousness': 1.0,
            'severe_abdominal_pain': 0.8,
            'high_fever': 0.7,
            
            # Medium risk symptoms
            'fever': 0.5,
            'persistent_cough': 0.4,
            'severe_headache': 0.6,
            'vomiting': 0.5,
            'diarrhea': 0.4,
            'body_ache': 0.3,
            
            # Low risk symptoms
            'mild_headache': 0.2,
            'runny_nose': 0.1,
            'sore_throat': 0.2,
            'fatigue': 0.2,
            'mild_cough': 0.15
        }
        
        self.symptom_combinations = {
            ('fever', 'cough', 'difficulty_breathing'): 0.8,  # COVID-like
            ('chest_pain', 'difficulty_breathing'): 0.9,      # Cardiac
            ('fever', 'severe_headache', 'vomiting'): 0.85,   # Meningitis-like
            ('abdominal_pain', 'vomiting', 'diarrhea'): 0.6   # GI issues
        }
        
        logger.info("Symptom analyzer initialized")
    
    def analyze(self, symptoms, age=30, gender='unknown'):
        """Analyze symptoms and return risk assessment"""
        try:
            if not symptoms:
                return self._default_response()
            
            # Normalize symptom names
            normalized_symptoms = [self._normalize_symptom(s) for s in symptoms]
            
            # Calculate base risk score
            base_score = self._calculate_base_score(normalized_symptoms)
            
            # Apply age and gender adjustments
            adjusted_score = self._apply_demographic_adjustments(
                base_score, age, gender
            )
            
            # Check for dangerous combinations
            combination_score = self._check_combinations(normalized_symptoms)
            
            # Final risk score
            final_score = min(100, max(0, adjusted_score + combination_score))
            
            # Determine risk level
            risk_level = self._determine_risk_level(final_score)
            
            # Generate recommendations
            recommendations = self._generate_recommendations(
                normalized_symptoms, risk_level, age
            )
            
            return {
                'riskScore': int(final_score),
                'riskLevel': risk_level,
                'symptoms': normalized_symptoms,
                'recommendations': recommendations,
                'analysis_timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Symptom analysis error: {str(e)}")
            return self._default_response()
    
    def _normalize_symptom(self, symptom):
        """Normalize symptom names for consistency"""
        symptom = symptom.lower().strip()
        
        # Mapping common variations
        mappings = {
            'बुखार': 'fever',
            'सिरदर्द': 'headache',
            'खांसी': 'cough',
            'सांस लेने में तकलीफ': 'difficulty_breathing',
            'छाती में दर्द': 'chest_pain',
            'पेट दर्द': 'abdominal_pain',
            'उल्टी': 'vomiting',
            'दस्त': 'diarrhea',
            'कमजोरी': 'fatigue',
            'गले में खराश': 'sore_throat'
        }
        
        return mappings.get(symptom, symptom)
    
    def _calculate_base_score(self, symptoms):
        """Calculate base risk score from symptoms"""
        total_weight = 0
        for symptom in symptoms:
            weight = self.symptom_weights.get(symptom, 0.1)  # Default low weight
            total_weight += weight
        
        # Normalize to 0-100 scale
        return min(100, total_weight * 50)
    
    def _apply_demographic_adjustments(self, score, age, gender):
        """Apply age and gender-based risk adjustments"""
        adjusted_score = score
        
        # Age adjustments
        if age < 5 or age > 65:
            adjusted_score *= 1.3  # Higher risk for very young or elderly
        elif age > 50:
            adjusted_score *= 1.1  # Slightly higher risk for middle-aged
        
        # Gender-specific adjustments (if needed)
        # This would be based on medical research
        
        return adjusted_score
    
    def _check_combinations(self, symptoms):
        """Check for dangerous symptom combinations"""
        combination_bonus = 0
        
        for combo, weight in self.symptom_combinations.items():
            if all(symptom in symptoms for symptom in combo):
                combination_bonus += weight * 20  # Boost score for dangerous combos
        
        return combination_bonus
    
    def _determine_risk_level(self, score):
        """Determine risk level based on score"""
        if score >= 80:
            return 'red'
        elif score >= 50:
            return 'amber'
        else:
            return 'green'
    
    def _generate_recommendations(self, symptoms, risk_level, age):
        """Generate appropriate recommendations"""
        if risk_level == 'red':
            return [
                'तुरंत नजदीकी अस्पताल जाएं',
                'एम्बुलेंस बुलाएं (108)',
                'किसी को साथ ले जाएं'
            ]
        elif risk_level == 'amber':
            return [
                'ASHA कार्यकर्ता से संपर्क करें',
                'PHC में जांच कराएं',
                'लक्षणों पर नजर रखें'
            ]
        else:
            return [
                'आराम करें और पानी पिएं',
                'घरेलू उपचार करें',
                'यदि बिगड़े तो डॉक्टर से मिलें'
            ]
    
    def _default_response(self):
        """Default response for errors"""
        return {
            'riskScore': 30,
            'riskLevel': 'green',
            'symptoms': [],
            'recommendations': ['कृपया अपने लक्षण स्पष्ट रूप से बताएं'],
            'analysis_timestamp': datetime.now().isoformat()
        }
    
    def analyze_image(self, image_data):
        """Analyze medical images (mock implementation)"""
        # Mock skin condition analysis
        conditions = [
            'skin_rash', 'eczema', 'fungal_infection', 
            'allergic_reaction', 'normal_skin'
        ]
        
        # Mock analysis result
        return {
            'condition': np.random.choice(conditions),
            'confidence': np.random.uniform(0.7, 0.95),
            'severity': np.random.choice(['mild', 'moderate', 'severe']),
            'recommendations': [
                'Keep area clean and dry',
                'Apply prescribed medication',
                'Avoid scratching'
            ]
        }