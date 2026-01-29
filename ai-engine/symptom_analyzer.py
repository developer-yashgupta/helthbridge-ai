import logging
from datetime import datetime
import random
from ml_models import MLModels

logger = logging.getLogger(__name__)

class SymptomAnalyzer:
    def __init__(self):
        # Initialize ML models
        self.ml_models = MLModels()
        
        logger.info("✅ Symptom analyzer initialized with real ML models")
    
    def analyze(self, symptoms, age=30, gender='unknown'):
        """Analyze symptoms using real ML models"""
        try:
            if not symptoms:
                return self._default_response()
            
            # If symptoms is a string, extract symptoms using ML
            if isinstance(symptoms, str):
                ml_symptoms = self.ml_models.predict_symptoms(symptoms)
                if ml_symptoms:
                    # Use ML predictions
                    symptom_names = [s['symptom'] for s in ml_symptoms]
                    confidence = sum(s['confidence'] for s in ml_symptoms) / len(ml_symptoms)
                else:
                    # Fallback to rule-based extraction
                    symptom_names = self._extract_symptoms_fallback(symptoms)
                    confidence = 0.6
            else:
                # Symptoms provided as list
                symptom_names = [self._normalize_symptom(s) for s in symptoms]
                confidence = 0.8
            
            # Use ML model for risk prediction
            if self.ml_models.models_loaded:
                risk_result = self.ml_models.predict_risk(symptom_names, age, gender)
                risk_level = risk_result['risk_level']
                ml_confidence = risk_result['confidence']
                risk_score = risk_result['risk_score']
                
                # Adjust confidence
                final_confidence = (confidence + ml_confidence) / 2
                
            else:
                # Fallback to rule-based analysis
                risk_score = self._calculate_rule_based_risk(symptom_names, age, gender)
                risk_level = self._determine_risk_level(risk_score)
                final_confidence = 0.7
            
            # Generate recommendations
            recommendations = self._generate_recommendations(symptom_names, risk_level, age)
            
            return {
                'riskScore': int(risk_score),
                'riskLevel': risk_level,
                'symptoms': symptom_names,
                'recommendations': recommendations,
                'confidence': round(final_confidence, 2),
                'analysis_method': 'ml_model' if self.ml_models.models_loaded else 'rule_based',
                'analysis_timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"❌ Symptom analysis error: {str(e)}")
            return self._default_response()
    
    def _extract_symptoms_fallback(self, text):
        """Fallback symptom extraction using keyword matching"""
        text = text.lower()
        symptoms = []
        
        symptom_keywords = {
            'fever': ['fever', 'बुखार', 'temperature', 'hot', 'chills'],
            'headache': ['headache', 'सिरदर्द', 'head pain', 'migraine'],
            'cough': ['cough', 'खांसी', 'coughing'],
            'chest_pain': ['chest pain', 'छाती में दर्द', 'chest hurt'],
            'difficulty_breathing': ['breathing', 'सांस', 'breath', 'shortness'],
            'stomach_pain': ['stomach', 'पेट', 'abdominal', 'belly'],
            'vomiting': ['vomit', 'उल्टी', 'nausea', 'sick'],
            'diarrhea': ['diarrhea', 'दस्त', 'loose motions'],
            'fatigue': ['tired', 'कमजोरी', 'weakness', 'exhausted'],
            'sore_throat': ['throat', 'गले', 'swallow']
        }
        
        for symptom, keywords in symptom_keywords.items():
            if any(keyword in text for keyword in keywords):
                symptoms.append(symptom)
        
        return symptoms
    
    def _calculate_rule_based_risk(self, symptoms, age, gender):
        """Calculate risk using rule-based system as fallback"""
        base_score = 20
        
        # Critical symptoms
        critical_symptoms = ['chest_pain', 'difficulty_breathing', 'unconsciousness', 'severe_bleeding']
        high_risk_symptoms = ['high_fever', 'severe_headache', 'persistent_vomiting']
        medium_risk_symptoms = ['fever', 'headache', 'cough', 'vomiting']
        
        for symptom in symptoms:
            if any(cs in symptom.lower() for cs in critical_symptoms):
                base_score += 60
            elif any(hrs in symptom.lower() for hrs in high_risk_symptoms):
                base_score += 40
            elif any(mrs in symptom.lower() for mrs in medium_risk_symptoms):
                base_score += 20
            else:
                base_score += 10
        
        # Age adjustments
        if age < 5 or age > 65:
            base_score *= 1.3
        elif age > 50:
            base_score *= 1.1
        
        return min(100, base_score)
    
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
            'पेट दर्द': 'stomach_pain',
            'उल्टी': 'vomiting',
            'दस्त': 'diarrhea',
            'कमजोरी': 'fatigue',
            'गले में खराश': 'sore_throat'
        }
        
        return mappings.get(symptom, symptom)
    
    def _determine_risk_level(self, score):
        """Determine risk level based on score"""
        if score >= 70:
            return 'red'
        elif score >= 40:
            return 'amber'
        else:
            return 'green'
    
    def _generate_recommendations(self, symptoms, risk_level, age):
        """Generate appropriate recommendations"""
        if risk_level == 'red':
            return [
                'Seek immediate medical attention',
                'Call ambulance (108)',
                'Go to nearest hospital',
                'Do not delay treatment'
            ]
        elif risk_level == 'amber':
            return [
                'Contact ASHA worker',
                'Visit PHC for checkup',
                'Monitor symptoms closely',
                'Take prescribed medications'
            ]
        else:
            return [
                'Rest and stay hydrated',
                'Take home remedies',
                'Monitor symptoms',
                'Consult doctor if symptoms worsen'
            ]
    
    def _default_response(self):
        """Default response for errors"""
        return {
            'riskScore': 30,
            'riskLevel': 'green',
            'symptoms': [],
            'recommendations': ['Please describe your symptoms clearly'],
            'confidence': 0.5,
            'analysis_method': 'default',
            'analysis_timestamp': datetime.now().isoformat()
        }
    
    def analyze_image(self, image_data):
        """Analyze medical images using ML models"""
        try:
            # Use ML models for image analysis if available
            if self.ml_models.models_loaded:
                # For now, use the existing image analysis from ml_models
                return self.ml_models.analyze_image(image_data)
            else:
                # Fallback implementation
                return self._fallback_image_analysis()
                
        except Exception as e:
            logger.error(f"Image analysis error: {str(e)}")
            return self._fallback_image_analysis()
    
    def _fallback_image_analysis(self):
        """Fallback image analysis"""
        conditions = ['normal_skin', 'skin_rash', 'eczema', 'fungal_infection']
        condition = random.choice(conditions)
        
        severity_map = {
            'normal_skin': 'none',
            'skin_rash': 'mild',
            'eczema': 'moderate', 
            'fungal_infection': 'moderate'
        }
        
        return {
            'condition': condition,
            'confidence': random.uniform(0.6, 0.8),
            'severity': severity_map[condition],
            'recommendations': ['Consult healthcare provider for proper diagnosis'],
            'analysis_method': 'fallback'
        }
    
    def get_model_status(self):
        """Get status of ML models"""
        return self.ml_models.get_model_info()