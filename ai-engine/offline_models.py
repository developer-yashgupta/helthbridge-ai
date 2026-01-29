import logging
import json
import os
from datetime import datetime
from typing import Dict, List, Any
import pickle

logger = logging.getLogger(__name__)

class OfflineModels:
    """Offline model management for areas with poor connectivity"""
    
    def __init__(self):
        self.models_path = './offline_models'
        self.models = {}
        self.model_metadata = {}
        self.is_initialized = False
        
        # Create offline models directory
        os.makedirs(self.models_path, exist_ok=True)
        
        # Initialize offline models
        self._initialize_offline_models()
        
        logger.info("Offline models initialized")
    
    def _initialize_offline_models(self):
        """Initialize offline models for disconnected operation"""
        try:
            # Load pre-trained models if available
            self._load_saved_models()
            
            # Initialize rule-based fallbacks
            self._initialize_rule_based_models()
            
            # Create lightweight symptom classifier
            self._create_symptom_classifier()
            
            # Create risk assessment model
            self._create_risk_assessment_model()
            
            self.is_initialized = True
            logger.info("Offline models ready for disconnected operation")
            
        except Exception as e:
            logger.error(f"Failed to initialize offline models: {str(e)}")
            self.is_initialized = False
    
    def _load_saved_models(self):
        """Load previously saved models"""
        metadata_file = os.path.join(self.models_path, 'model_metadata.json')
        
        if os.path.exists(metadata_file):
            try:
                with open(metadata_file, 'r') as f:
                    self.model_metadata = json.load(f)
                
                # Load each model
                for model_name, metadata in self.model_metadata.items():
                    model_file = os.path.join(self.models_path, f"{model_name}.pkl")
                    
                    if os.path.exists(model_file):
                        with open(model_file, 'rb') as f:
                            self.models[model_name] = pickle.load(f)
                        
                        logger.info(f"Loaded offline model: {model_name}")
                
            except Exception as e:
                logger.error(f"Error loading saved models: {str(e)}")
    
    def _initialize_rule_based_models(self):
        """Initialize rule-based models as fallbacks"""
        # Symptom severity rules
        self.models['symptom_severity'] = {
            'critical': [
                'chest_pain', 'difficulty_breathing', 'unconsciousness',
                'severe_bleeding', 'stroke_symptoms', 'heart_attack'
            ],
            'high': [
                'high_fever', 'severe_headache', 'persistent_vomiting',
                'severe_abdominal_pain', 'dehydration', 'seizure'
            ],
            'medium': [
                'fever', 'headache', 'cough', 'vomiting', 'diarrhea',
                'body_ache', 'sore_throat'
            ],
            'low': [
                'runny_nose', 'mild_cough', 'fatigue', 'mild_headache',
                'sneezing', 'minor_ache'
            ]
        }
        
        # Age-based risk factors
        self.models['age_risk_factors'] = {
            'infant': {'age_range': (0, 2), 'risk_multiplier': 1.5},
            'child': {'age_range': (2, 12), 'risk_multiplier': 1.2},
            'teen': {'age_range': (12, 18), 'risk_multiplier': 1.0},
            'adult': {'age_range': (18, 65), 'risk_multiplier': 1.0},
            'senior': {'age_range': (65, 80), 'risk_multiplier': 1.3},
            'elderly': {'age_range': (80, 120), 'risk_multiplier': 1.5}
        }
        
        # Symptom combinations that increase risk
        self.models['symptom_combinations'] = {
            'respiratory_distress': {
                'symptoms': ['difficulty_breathing', 'chest_pain'],
                'risk_increase': 0.8
            },
            'neurological_emergency': {
                'symptoms': ['severe_headache', 'vomiting', 'dizziness'],
                'risk_increase': 0.7
            },
            'gastrointestinal_severe': {
                'symptoms': ['vomiting', 'diarrhea', 'severe_abdominal_pain'],
                'risk_increase': 0.6
            },
            'infectious_disease': {
                'symptoms': ['high_fever', 'body_ache', 'headache'],
                'risk_increase': 0.5
            }
        }
    
    def _create_symptom_classifier(self):
        """Create lightweight symptom classifier"""
        # Simple keyword-based classifier
        symptom_keywords = {
            'fever': ['fever', 'temperature', 'hot', 'chills', 'बुखार'],
            'headache': ['headache', 'head pain', 'migraine', 'सिरदर्द'],
            'cough': ['cough', 'coughing', 'खांसी'],
            'chest_pain': ['chest pain', 'chest hurt', 'छाती में दर्द'],
            'difficulty_breathing': ['breathing', 'breath', 'shortness', 'सांस'],
            'stomach_pain': ['stomach', 'abdominal', 'belly', 'पेट दर्द'],
            'vomiting': ['vomit', 'throw up', 'nausea', 'उल्टी'],
            'diarrhea': ['diarrhea', 'loose stool', 'दस्त'],
            'fatigue': ['tired', 'fatigue', 'weakness', 'कमजोरी'],
            'sore_throat': ['throat', 'swallow', 'गले में खराश']
        }
        
        self.models['symptom_classifier'] = {
            'keywords': symptom_keywords,
            'confidence_threshold': 0.6,
            'method': 'keyword_matching'
        }
    
    def _create_risk_assessment_model(self):
        """Create risk assessment model"""
        # Risk scoring weights
        risk_weights = {
            'symptom_severity': 0.4,
            'age_factor': 0.2,
            'symptom_count': 0.2,
            'symptom_combinations': 0.2
        }
        
        # Risk thresholds
        risk_thresholds = {
            'green': (0, 40),
            'amber': (40, 70),
            'red': (70, 100)
        }
        
        self.models['risk_assessment'] = {
            'weights': risk_weights,
            'thresholds': risk_thresholds,
            'method': 'weighted_scoring'
        }
    
    def predict_symptoms(self, text: str, language: str = 'en') -> List[Dict]:
        """Predict symptoms from text using offline model"""
        if not self.is_ready():
            return []
        
        try:
            classifier = self.models.get('symptom_classifier', {})
            keywords = classifier.get('keywords', {})
            
            text = text.lower()
            identified_symptoms = []
            
            for symptom, symptom_keywords in keywords.items():
                confidence = 0
                matches = 0
                
                for keyword in symptom_keywords:
                    if keyword in text:
                        matches += 1
                        confidence += 0.3
                
                if matches > 0:
                    # Normalize confidence
                    confidence = min(1.0, confidence)
                    
                    identified_symptoms.append({
                        'symptom': symptom,
                        'confidence': round(confidence, 2),
                        'matches': matches
                    })
            
            # Sort by confidence
            identified_symptoms.sort(key=lambda x: x['confidence'], reverse=True)
            
            return identified_symptoms
            
        except Exception as e:
            logger.error(f"Offline symptom prediction error: {str(e)}")
            return []
    
    def assess_risk_offline(self, symptoms: List[str], age: int = 30, gender: str = 'unknown') -> Dict:
        """Assess risk using offline models"""
        if not self.is_ready():
            return self._default_risk_assessment()
        
        try:
            # Get severity scores for symptoms
            severity_score = self._calculate_severity_score(symptoms)
            
            # Get age factor
            age_factor = self._get_age_factor_offline(age)
            
            # Calculate symptom count factor
            count_factor = min(1.0, len(symptoms) / 5.0)  # Normalize to max 5 symptoms
            
            # Check for dangerous combinations
            combination_factor = self._check_symptom_combinations(symptoms)
            
            # Calculate weighted risk score
            risk_model = self.models['risk_assessment']
            weights = risk_model['weights']
            
            risk_score = (
                severity_score * weights['symptom_severity'] +
                age_factor * weights['age_factor'] +
                count_factor * weights['symptom_count'] +
                combination_factor * weights['symptom_combinations']
            ) * 100
            
            # Determine risk level
            risk_level = self._determine_risk_level_offline(risk_score)
            
            return {
                'risk_score': int(min(100, risk_score)),
                'risk_level': risk_level,
                'confidence': 0.75,
                'method': 'offline_model',
                'factors': {
                    'severity_score': severity_score,
                    'age_factor': age_factor,
                    'count_factor': count_factor,
                    'combination_factor': combination_factor
                }
            }
            
        except Exception as e:
            logger.error(f"Offline risk assessment error: {str(e)}")
            return self._default_risk_assessment()
    
    def _calculate_severity_score(self, symptoms: List[str]) -> float:
        """Calculate severity score based on symptoms"""
        severity_model = self.models.get('symptom_severity', {})
        
        total_score = 0
        symptom_count = len(symptoms)
        
        if symptom_count == 0:
            return 0.2
        
        for symptom in symptoms:
            if symptom in severity_model.get('critical', []):
                total_score += 1.0
            elif symptom in severity_model.get('high', []):
                total_score += 0.8
            elif symptom in severity_model.get('medium', []):
                total_score += 0.5
            elif symptom in severity_model.get('low', []):
                total_score += 0.2
            else:
                total_score += 0.3  # Unknown symptom
        
        return min(1.0, total_score / symptom_count)
    
    def _get_age_factor_offline(self, age: int) -> float:
        """Get age risk factor using offline model"""
        age_model = self.models.get('age_risk_factors', {})
        
        for category, data in age_model.items():
            age_range = data['age_range']
            if age_range[0] <= age < age_range[1]:
                return min(1.0, data['risk_multiplier'] / 1.5)  # Normalize to 0-1
        
        return 1.0  # Default for unknown age
    
    def _check_symptom_combinations(self, symptoms: List[str]) -> float:
        """Check for dangerous symptom combinations"""
        combinations = self.models.get('symptom_combinations', {})
        
        max_increase = 0
        
        for combo_name, combo_data in combinations.items():
            combo_symptoms = combo_data['symptoms']
            risk_increase = combo_data['risk_increase']
            
            # Check if all symptoms in combination are present
            if all(symptom in symptoms for symptom in combo_symptoms):
                max_increase = max(max_increase, risk_increase)
        
        return min(1.0, max_increase)
    
    def _determine_risk_level_offline(self, risk_score: float) -> str:
        """Determine risk level using offline thresholds"""
        thresholds = self.models['risk_assessment']['thresholds']
        
        for level, (min_score, max_score) in thresholds.items():
            if min_score <= risk_score < max_score:
                return level
        
        return 'red' if risk_score >= 70 else 'green'
    
    def _default_risk_assessment(self) -> Dict:
        """Default risk assessment when offline models fail"""
        return {
            'risk_score': 40,
            'risk_level': 'amber',
            'confidence': 0.5,
            'method': 'default',
            'factors': {}
        }
    
    def save_models(self):
        """Save models to disk for offline use"""
        try:
            # Save model metadata
            metadata = {
                model_name: {
                    'type': type(model).__name__,
                    'size': len(str(model)),
                    'created': datetime.now().isoformat()
                }
                for model_name, model in self.models.items()
            }
            
            metadata_file = os.path.join(self.models_path, 'model_metadata.json')
            with open(metadata_file, 'w') as f:
                json.dump(metadata, f, indent=2)
            
            # Save each model
            for model_name, model in self.models.items():
                model_file = os.path.join(self.models_path, f"{model_name}.pkl")
                with open(model_file, 'wb') as f:
                    pickle.dump(model, f)
            
            logger.info(f"Saved {len(self.models)} offline models")
            return True
            
        except Exception as e:
            logger.error(f"Error saving offline models: {str(e)}")
            return False
    
    def is_ready(self) -> bool:
        """Check if offline models are ready"""
        return self.is_initialized and len(self.models) > 0
    
    def get_model_info(self) -> Dict:
        """Get information about offline models"""
        return {
            'is_ready': self.is_ready(),
            'models_loaded': list(self.models.keys()),
            'model_count': len(self.models),
            'storage_path': self.models_path,
            'capabilities': [
                'offline_symptom_classification',
                'offline_risk_assessment',
                'rule_based_fallbacks',
                'multilingual_keywords'
            ],
            'last_updated': datetime.now().isoformat()
        }
    
    def sync_with_online_models(self, online_model_data: Dict):
        """Sync offline models with online versions when connectivity is available"""
        try:
            # Update models with online data
            for model_name, model_data in online_model_data.items():
                if model_name in self.models:
                    # Merge or update model
                    self.models[model_name].update(model_data)
                    logger.info(f"Updated offline model: {model_name}")
            
            # Save updated models
            self.save_models()
            
            return True
            
        except Exception as e:
            logger.error(f"Error syncing offline models: {str(e)}")
            return False
    
    def get_storage_usage(self) -> Dict:
        """Get storage usage information"""
        try:
            total_size = 0
            file_count = 0
            
            for root, dirs, files in os.walk(self.models_path):
                for file in files:
                    file_path = os.path.join(root, file)
                    total_size += os.path.getsize(file_path)
                    file_count += 1
            
            return {
                'total_size_mb': round(total_size / (1024 * 1024), 2),
                'file_count': file_count,
                'storage_path': self.models_path,
                'models_count': len(self.models)
            }
            
        except Exception as e:
            logger.error(f"Error calculating storage usage: {str(e)}")
            return {'error': str(e)}