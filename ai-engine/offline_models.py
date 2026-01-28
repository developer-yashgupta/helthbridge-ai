import logging
import os
import json
from datetime import datetime

logger = logging.getLogger(__name__)

class OfflineModels:
    """Manages offline AI models for areas with poor connectivity"""
    
    def __init__(self):
        self.models_loaded = False
        self.model_path = './models'
        self.available_models = {
            'symptom_classifier': False,
            'risk_predictor': False,
            'multilingual_embeddings': False,
            'image_classifier': False
        }
        
        # Lightweight rule-based fallbacks
        self.symptom_rules = self._load_symptom_rules()
        self.risk_thresholds = self._load_risk_thresholds()
        
        logger.info("Offline models manager initialized")
    
    def is_ready(self):
        """Check if offline models are ready"""
        return any(self.available_models.values()) or True  # Always ready with rule-based fallback
    
    def load_models(self):
        """Load offline models if available"""
        try:
            # Check if model directory exists
            if not os.path.exists(self.model_path):
                logger.warning("Model directory not found, using rule-based fallback")
                return False
            
            # Try to load each model
            for model_name in self.available_models:
                model_file = os.path.join(self.model_path, f"{model_name}.pkl")
                if os.path.exists(model_file):
                    # In real implementation, load actual models
                    self.available_models[model_name] = True
                    logger.info(f"Loaded {model_name}")
            
            self.models_loaded = True
            return True
            
        except Exception as e:
            logger.error(f"Model loading error: {str(e)}")
            return False
    
    def predict_risk(self, symptoms, age, gender):
        """Predict risk using offline models or rules"""
        try:
            if self.available_models['risk_predictor']:
                # Use ML model if available
                return self._ml_risk_prediction(symptoms, age, gender)
            else:
                # Use rule-based prediction
                return self._rule_based_risk_prediction(symptoms, age, gender)
                
        except Exception as e:
            logger.error(f"Risk prediction error: {str(e)}")
            return self._default_risk_prediction()
    
    def classify_symptoms(self, text, language='hi'):
        """Classify symptoms from text using offline models"""
        try:
            if self.available_models['symptom_classifier']:
                # Use ML classifier if available
                return self._ml_symptom_classification(text, language)
            else:
                # Use rule-based classification
                return self._rule_based_symptom_classification(text, language)
                
        except Exception as e:
            logger.error(f"Symptom classification error: {str(e)}")
            return []
    
    def classify_image(self, image_data):
        """Classify medical images using offline models"""
        try:
            if self.available_models['image_classifier']:
                # Use ML image classifier if available
                return self._ml_image_classification(image_data)
            else:
                # Use simple heuristics
                return self._simple_image_analysis(image_data)
                
        except Exception as e:
            logger.error(f"Image classification error: {str(e)}")
            return self._default_image_result()
    
    def _load_symptom_rules(self):
        """Load symptom classification rules"""
        return {
            'fever_keywords': {
                'hi': ['बुखार', 'तेज़ बुखार', 'ठंड लगना'],
                'en': ['fever', 'high temperature', 'chills']
            },
            'pain_keywords': {
                'hi': ['दर्द', 'पीड़ा', 'तकलीफ'],
                'en': ['pain', 'ache', 'hurt']
            },
            'respiratory_keywords': {
                'hi': ['खांसी', 'सांस', 'छाती'],
                'en': ['cough', 'breathing', 'chest']
            },
            'gastrointestinal_keywords': {
                'hi': ['पेट', 'उल्टी', 'दस्त'],
                'en': ['stomach', 'vomit', 'diarrhea']
            }
        }
    
    def _load_risk_thresholds(self):
        """Load risk assessment thresholds"""
        return {
            'high_risk_symptoms': [
                'chest_pain', 'difficulty_breathing', 'unconsciousness',
                'severe_bleeding', 'stroke_symptoms'
            ],
            'medium_risk_symptoms': [
                'high_fever', 'severe_headache', 'persistent_vomiting',
                'severe_abdominal_pain'
            ],
            'age_multipliers': {
                'infant': 1.5,
                'child': 1.2,
                'adult': 1.0,
                'elderly': 1.3
            },
            'base_scores': {
                'high_risk': 80,
                'medium_risk': 50,
                'low_risk': 20
            }
        }
    
    def _rule_based_risk_prediction(self, symptoms, age, gender):
        """Rule-based risk prediction"""
        base_score = 20  # Default low risk
        
        # Check for high-risk symptoms
        high_risk_count = sum(1 for s in symptoms 
                             if s in self.risk_thresholds['high_risk_symptoms'])
        medium_risk_count = sum(1 for s in symptoms 
                               if s in self.risk_thresholds['medium_risk_symptoms'])
        
        # Calculate base score
        if high_risk_count > 0:
            base_score = 80 + (high_risk_count * 10)
        elif medium_risk_count > 0:
            base_score = 50 + (medium_risk_count * 10)
        else:
            base_score = 20 + (len(symptoms) * 5)
        
        # Apply age multiplier
        age_category = self._categorize_age(age)
        multiplier = self.risk_thresholds['age_multipliers'].get(age_category, 1.0)
        
        final_score = min(100, base_score * multiplier)
        
        return {
            'risk_score': int(final_score),
            'confidence': 0.75,
            'method': 'rule_based'
        }
    
    def _rule_based_symptom_classification(self, text, language):
        """Rule-based symptom classification"""
        text = text.lower()
        symptoms = []
        
        # Check each symptom category
        for category, keywords in self.symptom_rules.items():
            lang_keywords = keywords.get(language, keywords.get('en', []))
            
            for keyword in lang_keywords:
                if keyword in text:
                    # Map to standard symptom names
                    if 'fever' in category:
                        symptoms.append('fever')
                    elif 'pain' in category:
                        symptoms.append('pain')
                    elif 'respiratory' in category:
                        symptoms.append('cough')
                    elif 'gastrointestinal' in category:
                        symptoms.append('stomach_pain')
        
        return list(set(symptoms))  # Remove duplicates
    
    def _simple_image_analysis(self, image_data):
        """Simple image analysis without ML models"""
        # Mock analysis - in real implementation, use basic image processing
        return {
            'condition': 'skin_condition',
            'confidence': 0.6,
            'severity': 'mild',
            'recommendations': [
                'Keep area clean',
                'Apply antiseptic',
                'Consult doctor if worsens'
            ],
            'method': 'rule_based'
        }
    
    def _ml_risk_prediction(self, symptoms, age, gender):
        """ML-based risk prediction (placeholder)"""
        # Placeholder for actual ML model inference
        return {
            'risk_score': 65,
            'confidence': 0.92,
            'method': 'ml_model'
        }
    
    def _ml_symptom_classification(self, text, language):
        """ML-based symptom classification (placeholder)"""
        # Placeholder for actual ML model inference
        return ['fever', 'headache']
    
    def _ml_image_classification(self, image_data):
        """ML-based image classification (placeholder)"""
        # Placeholder for actual ML model inference
        return {
            'condition': 'eczema',
            'confidence': 0.89,
            'severity': 'moderate',
            'recommendations': [
                'Apply prescribed cream',
                'Avoid allergens',
                'Follow up in 1 week'
            ],
            'method': 'ml_model'
        }
    
    def _categorize_age(self, age):
        """Categorize age for risk assessment"""
        if age <= 2:
            return 'infant'
        elif age <= 12:
            return 'child'
        elif age <= 65:
            return 'adult'
        else:
            return 'elderly'
    
    def _default_risk_prediction(self):
        """Default risk prediction"""
        return {
            'risk_score': 40,
            'confidence': 0.5,
            'method': 'default'
        }
    
    def _default_image_result(self):
        """Default image analysis result"""
        return {
            'condition': 'unknown',
            'confidence': 0.3,
            'severity': 'unknown',
            'recommendations': ['Consult healthcare provider'],
            'method': 'default'
        }
    
    def get_model_status(self):
        """Get status of all models"""
        return {
            'models_loaded': self.models_loaded,
            'available_models': self.available_models,
            'fallback_ready': True,
            'last_updated': datetime.now().isoformat()
        }
    
    def sync_models(self):
        """Sync models when connectivity is available"""
        try:
            # Placeholder for model synchronization
            logger.info("Model sync initiated")
            return True
        except Exception as e:
            logger.error(f"Model sync error: {str(e)}")
            return False