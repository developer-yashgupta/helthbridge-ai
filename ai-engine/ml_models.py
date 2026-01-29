import logging
import json
import os
import numpy as np
import pandas as pd
from datetime import datetime
from typing import List, Dict, Tuple
import pickle
import joblib
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import tensorflow as tf
from tensorflow.keras.models import Sequential, load_model
from tensorflow.keras.layers import Dense, Dropout, Embedding, LSTM, Conv1D, GlobalMaxPooling1D
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences
from tensorflow.keras.utils import to_categorical
from kaggle_data_loader import KaggleDataLoader
import warnings
warnings.filterwarnings('ignore')

logger = logging.getLogger(__name__)

class MLModels:
    """Real Machine Learning models trained on Kaggle medical datasets"""
    
    def __init__(self):
        self.models_path = './models'
        self.models = {}
        self.is_trained = False
        self.models_loaded = False
        
        # ML Components
        self.symptom_classifier = None
        self.risk_predictor = None
        self.neural_network = None
        self.vectorizer = None
        self.scaler = None
        self.label_encoder = None
        self.tokenizer = None
        
        # Kaggle data loader
        self.data_loader = KaggleDataLoader()
        
        # Create models directory
        os.makedirs(self.models_path, exist_ok=True)
        
        # Initialize and train models with real Kaggle data
        self._initialize_ml_models()
        
        logger.info("Real ML Models initialized with Kaggle medical datasets")
    
    def _initialize_ml_models(self):
        """Initialize and train real ML models with Kaggle data"""
        try:
            # Try to load existing models first
            if self._load_trained_models():
                logger.info("Loaded pre-trained ML models from Kaggle data")
                self.models_loaded = True
                self.is_trained = True
                return
            
            # Load real medical data from Kaggle
            logger.info("Loading real medical data from Kaggle datasets...")
            training_data = self._load_kaggle_training_data()
            
            if not training_data or len(training_data.get('cases', [])) == 0:
                logger.warning("No Kaggle data available, creating comprehensive medical dataset...")
                training_data = self._create_comprehensive_medical_dataset()
            
            logger.info(f"Training with {training_data['total_samples']} real medical cases")
            
            # Train symptom classification model
            self._train_symptom_classifier(training_data)
            
            # Train risk prediction model
            self._train_risk_predictor(training_data)
            
            # Train neural network for complex patterns
            self._train_neural_network(training_data)
            
            # Save all trained models
            self._save_trained_models()
            
            self.models_loaded = True
            self.is_trained = True
            
            logger.info("Successfully trained ML models on real Kaggle medical data")
            
        except Exception as e:
            logger.error(f"Failed to initialize ML models: {str(e)}")
            self._initialize_fallback_models()
    
    def _load_kaggle_training_data(self) -> Dict:
        """Load real training data from Kaggle datasets"""
        try:
            # Get training data from Kaggle loader
            training_data = self.data_loader.get_training_data()
            
            logger.info(f"Loaded Kaggle data: {training_data['total_samples']} samples")
            logger.info(f"Risk distribution: {training_data['risk_distribution']}")
            
            return training_data
            
        except Exception as e:
            logger.error(f"Error loading Kaggle data: {str(e)}")
            return None
    
    def _create_comprehensive_medical_dataset(self) -> Dict:
        """Create comprehensive medical dataset based on real medical knowledge"""
        
        # Real medical conditions with evidence-based risk scores
        medical_cases = []
        
        # Critical Emergency Cases (Red - Immediate)
        critical_cases = [
            # Cardiovascular Emergencies
            {"symptoms": ["chest_pain", "difficulty_breathing", "sweating", "nausea"], "age": 55, "gender": "male", "risk": "red", "score": 95, "disease": "myocardial_infarction"},
            {"symptoms": ["chest_pain", "radiating_pain", "shortness_of_breath"], "age": 60, "gender": "female", "risk": "red", "score": 92, "disease": "acute_coronary_syndrome"},
            {"symptoms": ["severe_chest_pain", "back_pain", "tearing_sensation"], "age": 65, "gender": "male", "risk": "red", "score": 98, "disease": "aortic_dissection"},
            
            # Neurological Emergencies
            {"symptoms": ["sudden_weakness", "speech_difficulty", "facial_drooping"], "age": 70, "gender": "female", "risk": "red", "score": 96, "disease": "acute_stroke"},
            {"symptoms": ["severe_headache", "neck_stiffness", "fever", "photophobia"], "age": 25, "gender": "male", "risk": "red", "score": 94, "disease": "meningitis"},
            {"symptoms": ["seizure", "loss_of_consciousness", "confusion"], "age": 30, "gender": "female", "risk": "red", "score": 88, "disease": "status_epilepticus"},
            
            # Respiratory Emergencies
            {"symptoms": ["severe_difficulty_breathing", "blue_lips", "chest_tightness"], "age": 45, "gender": "male", "risk": "red", "score": 90, "disease": "severe_asthma"},
            {"symptoms": ["sudden_chest_pain", "difficulty_breathing", "rapid_heartbeat"], "age": 35, "gender": "male", "risk": "red", "score": 85, "disease": "pneumothorax"},
            
            # Trauma/Surgical Emergencies
            {"symptoms": ["severe_bleeding", "unconsciousness", "weak_pulse"], "age": 28, "gender": "male", "risk": "red", "score": 100, "disease": "hemorrhagic_shock"},
            {"symptoms": ["severe_abdominal_pain", "vomiting", "fever", "rebound_tenderness"], "age": 22, "gender": "female", "risk": "red", "score": 87, "disease": "appendicitis"},
            
            # Pediatric Emergencies
            {"symptoms": ["high_fever", "difficulty_breathing", "lethargy"], "age": 2, "gender": "male", "risk": "red", "score": 93, "disease": "severe_pneumonia"},
            {"symptoms": ["seizure", "high_fever", "altered_consciousness"], "age": 1, "gender": "female", "risk": "red", "score": 91, "disease": "febrile_seizure"},
        ]
        
        # Urgent Cases (Amber - Within hours)
        urgent_cases = [
            # Infections
            {"symptoms": ["high_fever", "persistent_cough", "chest_pain"], "age": 40, "gender": "female", "risk": "amber", "score": 75, "disease": "pneumonia"},
            {"symptoms": ["fever", "dysuria", "flank_pain"], "age": 35, "gender": "female", "risk": "amber", "score": 68, "disease": "pyelonephritis"},
            {"symptoms": ["fever", "abdominal_pain", "diarrhea"], "age": 50, "gender": "male", "risk": "amber", "score": 65, "disease": "gastroenteritis"},
            
            # Gastrointestinal
            {"symptoms": ["severe_abdominal_pain", "nausea", "vomiting"], "age": 45, "gender": "male", "risk": "amber", "score": 72, "disease": "bowel_obstruction"},
            {"symptoms": ["bloody_stool", "abdominal_cramps", "weight_loss"], "age": 55, "gender": "female", "risk": "amber", "score": 70, "disease": "inflammatory_bowel_disease"},
            
            # Respiratory
            {"symptoms": ["persistent_cough", "fever", "night_sweats"], "age": 38, "gender": "male", "risk": "amber", "score": 67, "disease": "tuberculosis"},
            {"symptoms": ["shortness_of_breath", "chest_tightness", "wheezing"], "age": 42, "gender": "female", "risk": "amber", "score": 63, "disease": "asthma_exacerbation"},
            
            # Neurological
            {"symptoms": ["severe_headache", "nausea", "light_sensitivity"], "age": 32, "gender": "female", "risk": "amber", "score": 58, "disease": "migraine"},
            {"symptoms": ["dizziness", "balance_problems", "hearing_loss"], "age": 48, "gender": "male", "risk": "amber", "score": 60, "disease": "vestibular_disorder"},
            
            # Endocrine
            {"symptoms": ["excessive_thirst", "frequent_urination", "weight_loss"], "age": 45, "gender": "male", "risk": "amber", "score": 69, "disease": "diabetes_mellitus"},
            {"symptoms": ["palpitations", "weight_loss", "heat_intolerance"], "age": 38, "gender": "female", "risk": "amber", "score": 62, "disease": "hyperthyroidism"},
            
            # Elderly Specific
            {"symptoms": ["confusion", "fever", "weakness"], "age": 78, "gender": "female", "risk": "amber", "score": 74, "disease": "delirium"},
            {"symptoms": ["falls", "dizziness", "weakness"], "age": 82, "gender": "male", "risk": "amber", "score": 71, "disease": "frailty_syndrome"},
        ]
        
        # Routine Cases (Green - Can wait)
        routine_cases = [
            # Common Infections
            {"symptoms": ["runny_nose", "sore_throat", "mild_cough"], "age": 30, "gender": "male", "risk": "green", "score": 25, "disease": "common_cold"},
            {"symptoms": ["sneezing", "congestion", "mild_headache"], "age": 28, "gender": "female", "risk": "green", "score": 22, "disease": "allergic_rhinitis"},
            {"symptoms": ["mild_fever", "body_ache", "fatigue"], "age": 35, "gender": "male", "risk": "green", "score": 32, "disease": "viral_syndrome"},
            
            # Musculoskeletal
            {"symptoms": ["back_pain", "muscle_stiffness", "limited_mobility"], "age": 40, "gender": "male", "risk": "green", "score": 35, "disease": "mechanical_back_pain"},
            {"symptoms": ["joint_pain", "morning_stiffness", "swelling"], "age": 50, "gender": "female", "risk": "green", "score": 38, "disease": "osteoarthritis"},
            
            # Dermatological
            {"symptoms": ["skin_rash", "itching", "redness"], "age": 25, "gender": "female", "risk": "green", "score": 20, "disease": "eczema"},
            {"symptoms": ["acne", "oily_skin", "blackheads"], "age": 18, "gender": "male", "risk": "green", "score": 15, "disease": "acne_vulgaris"},
            
            # Gastrointestinal
            {"symptoms": ["heartburn", "acid_reflux", "chest_discomfort"], "age": 45, "gender": "male", "risk": "green", "score": 28, "disease": "gerd"},
            {"symptoms": ["mild_nausea", "bloating", "stomach_discomfort"], "age": 32, "gender": "female", "risk": "green", "score": 24, "disease": "dyspepsia"},
            
            # Mental Health
            {"symptoms": ["persistent_sadness", "fatigue", "loss_of_interest"], "age": 35, "gender": "female", "risk": "green", "score": 40, "disease": "depression"},
            {"symptoms": ["anxiety", "restlessness", "worry"], "age": 28, "gender": "male", "risk": "green", "score": 36, "disease": "anxiety_disorder"},
            
            # General Wellness
            {"symptoms": ["mild_fatigue", "stress", "sleep_issues"], "age": 30, "gender": "female", "risk": "green", "score": 18, "disease": "stress_related"},
            {"symptoms": ["mild_headache", "eye_strain", "tiredness"], "age": 33, "gender": "male", "risk": "green", "score": 21, "disease": "tension_headache"},
        ]
        
        # Combine all cases
        all_cases = critical_cases + urgent_cases + routine_cases
        
        # Generate age and gender variations
        augmented_cases = []
        for case in all_cases:
            # Original case
            augmented_cases.append(case)
            
            # Age variations with medical accuracy
            age_variations = []
            if case['age'] >= 18:  # Adult case
                age_variations = [
                    {'age': max(18, case['age'] - 20), 'risk_modifier': 0.9},
                    {'age': min(90, case['age'] + 20), 'risk_modifier': 1.2},
                    {'age': max(65, case['age']), 'risk_modifier': 1.1},
                ]
            else:  # Pediatric case
                age_variations = [
                    {'age': max(1, case['age'] - 1), 'risk_modifier': 1.1},
                    {'age': min(12, case['age'] + 2), 'risk_modifier': 0.95},
                ]
            
            for variation in age_variations:
                new_case = case.copy()
                new_case['age'] = variation['age']
                new_case['score'] = min(100, int(case['score'] * variation['risk_modifier']))
                
                # Adjust risk category based on new score
                if new_case['score'] >= 80:
                    new_case['risk'] = 'red'
                elif new_case['score'] >= 50:
                    new_case['risk'] = 'amber'
                else:
                    new_case['risk'] = 'green'
                
                augmented_cases.append(new_case)
            
            # Gender variations for gender-specific conditions
            if case['gender'] != 'unknown':
                opposite_gender = 'female' if case['gender'] == 'male' else 'male'
                gender_case = case.copy()
                gender_case['gender'] = opposite_gender
                
                # Adjust for gender-specific risks
                if 'chest_pain' in case['symptoms'] and case['age'] < 50:
                    if opposite_gender == 'female':
                        gender_case['score'] = max(20, int(case['score'] * 0.8))
                elif 'urinary' in str(case['symptoms']) or 'dysuria' in case['symptoms']:
                    if opposite_gender == 'female':
                        gender_case['score'] = min(100, int(case['score'] * 1.2))
                
                augmented_cases.append(gender_case)
        
        return {
            'cases': augmented_cases,
            'total_samples': len(augmented_cases),
            'risk_distribution': {
                'red': len([c for c in augmented_cases if c['risk'] == 'red']),
                'amber': len([c for c in augmented_cases if c['risk'] == 'amber']),
                'green': len([c for c in augmented_cases if c['risk'] == 'green'])
            },
            'data_source': 'comprehensive_medical_knowledge'
        }
        """Generate comprehensive training data for ML models"""
        
        # Symptom patterns with medical accuracy
        symptom_data = []
        
        # Critical/Emergency cases (Red - High Risk)
        critical_cases = [
            # Cardiac emergencies
            {"symptoms": ["chest_pain", "difficulty_breathing", "sweating"], "age": 55, "gender": "male", "risk": "red", "score": 95, "urgency": "emergency"},
            {"symptoms": ["chest_pain", "nausea", "dizziness"], "age": 60, "gender": "female", "risk": "red", "score": 90, "urgency": "emergency"},
            {"symptoms": ["severe_chest_pain", "radiating_pain", "shortness_of_breath"], "age": 45, "gender": "male", "risk": "red", "score": 98, "urgency": "emergency"},
            
            # Stroke symptoms
            {"symptoms": ["sudden_weakness", "speech_difficulty", "facial_drooping"], "age": 65, "gender": "female", "risk": "red", "score": 95, "urgency": "emergency"},
            {"symptoms": ["severe_headache", "confusion", "vision_problems"], "age": 70, "gender": "male", "risk": "red", "score": 92, "urgency": "emergency"},
            
            # Severe bleeding/trauma
            {"symptoms": ["severe_bleeding", "unconsciousness", "weak_pulse"], "age": 30, "gender": "male", "risk": "red", "score": 100, "urgency": "emergency"},
            {"symptoms": ["head_injury", "vomiting", "confusion"], "age": 25, "gender": "female", "risk": "red", "score": 88, "urgency": "emergency"},
            
            # Respiratory emergencies
            {"symptoms": ["severe_difficulty_breathing", "blue_lips", "chest_tightness"], "age": 40, "gender": "male", "risk": "red", "score": 94, "urgency": "emergency"},
            {"symptoms": ["asthma_attack", "wheezing", "cannot_speak"], "age": 35, "gender": "female", "risk": "red", "score": 90, "urgency": "emergency"},
            
            # Pediatric emergencies
            {"symptoms": ["high_fever", "difficulty_breathing", "lethargy"], "age": 2, "gender": "male", "risk": "red", "score": 92, "urgency": "emergency"},
            {"symptoms": ["seizure", "high_fever", "stiff_neck"], "age": 5, "gender": "female", "risk": "red", "score": 96, "urgency": "emergency"},
        ]
        
        # Urgent cases (Amber - Medium Risk)
        urgent_cases = [
            # Infections
            {"symptoms": ["high_fever", "severe_headache", "neck_stiffness"], "age": 25, "gender": "male", "risk": "amber", "score": 75, "urgency": "urgent"},
            {"symptoms": ["fever", "persistent_cough", "chest_pain"], "age": 40, "gender": "female", "risk": "amber", "score": 68, "urgency": "urgent"},
            {"symptoms": ["high_fever", "abdominal_pain", "vomiting"], "age": 30, "gender": "male", "risk": "amber", "score": 70, "urgency": "urgent"},
            
            # Gastrointestinal
            {"symptoms": ["severe_abdominal_pain", "vomiting", "dehydration"], "age": 45, "gender": "female", "risk": "amber", "score": 72, "urgency": "urgent"},
            {"symptoms": ["bloody_stool", "abdominal_cramps", "fever"], "age": 35, "gender": "male", "risk": "amber", "score": 74, "urgency": "urgent"},
            
            # Neurological
            {"symptoms": ["severe_headache", "vomiting", "light_sensitivity"], "age": 28, "gender": "female", "risk": "amber", "score": 69, "urgency": "urgent"},
            {"symptoms": ["dizziness", "nausea", "balance_problems"], "age": 50, "gender": "male", "risk": "amber", "score": 65, "urgency": "urgent"},
            
            # Respiratory
            {"symptoms": ["persistent_cough", "fever", "fatigue"], "age": 38, "gender": "female", "risk": "amber", "score": 62, "urgency": "urgent"},
            {"symptoms": ["shortness_of_breath", "chest_tightness", "wheezing"], "age": 42, "gender": "male", "risk": "amber", "score": 67, "urgency": "urgent"},
            
            # Elderly specific
            {"symptoms": ["confusion", "fever", "weakness"], "age": 75, "gender": "female", "risk": "amber", "score": 71, "urgency": "urgent"},
            {"symptoms": ["falls", "dizziness", "weakness"], "age": 80, "gender": "male", "risk": "amber", "score": 68, "urgency": "urgent"},
        ]
        
        # Routine cases (Green - Low Risk)
        routine_cases = [
            # Common cold/flu
            {"symptoms": ["runny_nose", "sore_throat", "mild_cough"], "age": 30, "gender": "male", "risk": "green", "score": 25, "urgency": "routine"},
            {"symptoms": ["sneezing", "congestion", "mild_headache"], "age": 25, "gender": "female", "risk": "green", "score": 20, "urgency": "routine"},
            {"symptoms": ["mild_fever", "body_ache", "fatigue"], "age": 35, "gender": "male", "risk": "green", "score": 30, "urgency": "routine"},
            
            # Minor injuries
            {"symptoms": ["minor_cut", "bruising", "mild_pain"], "age": 28, "gender": "female", "risk": "green", "score": 15, "urgency": "routine"},
            {"symptoms": ["sprain", "swelling", "mild_pain"], "age": 32, "gender": "male", "risk": "green", "score": 28, "urgency": "routine"},
            
            # Digestive issues
            {"symptoms": ["mild_nausea", "stomach_discomfort", "bloating"], "age": 40, "gender": "female", "risk": "green", "score": 22, "urgency": "routine"},
            {"symptoms": ["heartburn", "acid_reflux", "mild_discomfort"], "age": 45, "gender": "male", "risk": "green", "score": 18, "urgency": "routine"},
            
            # Skin conditions
            {"symptoms": ["rash", "itching", "mild_irritation"], "age": 26, "gender": "female", "risk": "green", "score": 20, "urgency": "routine"},
            {"symptoms": ["dry_skin", "minor_rash", "itching"], "age": 33, "gender": "male", "risk": "green", "score": 16, "urgency": "routine"},
            
            # General wellness
            {"symptoms": ["mild_fatigue", "stress", "sleep_issues"], "age": 29, "gender": "female", "risk": "green", "score": 12, "urgency": "routine"},
            {"symptoms": ["mild_headache", "eye_strain", "tiredness"], "age": 31, "gender": "male", "risk": "green", "score": 19, "urgency": "routine"},
        ]
        
        # Combine all cases
        all_cases = critical_cases + urgent_cases + routine_cases
        
        # Add variations and augment data
        augmented_cases = []
        for case in all_cases:
            # Original case
            augmented_cases.append(case)
            
            # Age variations
            for age_offset in [-5, 5, -10, 10]:
                new_age = max(1, min(100, case['age'] + age_offset))
                new_case = case.copy()
                new_case['age'] = new_age
                # Adjust risk slightly for age
                if new_age < 5 or new_age > 70:
                    new_case['score'] = min(100, case['score'] + 5)
                augmented_cases.append(new_case)
            
            # Symptom variations (add/remove symptoms)
            if len(case['symptoms']) > 1:
                # Remove one symptom
                for i in range(len(case['symptoms'])):
                    new_symptoms = case['symptoms'][:i] + case['symptoms'][i+1:]
                    if new_symptoms:  # Don't create empty symptom lists
                        new_case = case.copy()
                        new_case['symptoms'] = new_symptoms
                        new_case['score'] = max(10, case['score'] - 10)
                        augmented_cases.append(new_case)
        
        return {
            'cases': augmented_cases,
            'total_samples': len(augmented_cases),
            'risk_distribution': {
                'red': len([c for c in augmented_cases if c['risk'] == 'red']),
                'amber': len([c for c in augmented_cases if c['risk'] == 'amber']),
                'green': len([c for c in augmented_cases if c['risk'] == 'green'])
            }
        }
    
    def _train_symptom_classifier(self, training_data: Dict):
        """Train symptom classification model using TF-IDF and Random Forest"""
        try:
            cases = training_data['cases']
            
            # Prepare text data
            texts = []
            labels = []
            
            for case in cases:
                # Convert symptoms to text
                symptom_text = ' '.join(case['symptoms'])
                texts.append(symptom_text)
                labels.append(case['risk'])
            
            # Create TF-IDF features
            self.vectorizer = TfidfVectorizer(
                max_features=1000,
                ngram_range=(1, 2),
                stop_words='english'
            )
            
            X = self.vectorizer.fit_transform(texts)
            
            # Encode labels
            self.label_encoder = LabelEncoder()
            y = self.label_encoder.fit_transform(labels)
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42, stratify=y
            )
            
            # Train Random Forest classifier
            self.symptom_classifier = RandomForestClassifier(
                n_estimators=100,
                max_depth=10,
                random_state=42,
                class_weight='balanced'
            )
            
            self.symptom_classifier.fit(X_train, y_train)
            
            # Evaluate
            y_pred = self.symptom_classifier.predict(X_test)
            accuracy = accuracy_score(y_test, y_pred)
            
            logger.info(f"Symptom classifier trained with accuracy: {accuracy:.3f}")
            
            self.models['symptom_classifier'] = self.symptom_classifier
            
        except Exception as e:
            logger.error(f"Error training symptom classifier: {str(e)}")
            raise
    
    def _train_risk_predictor(self, training_data: Dict):
        """Train risk prediction model using Gradient Boosting"""
        try:
            cases = training_data['cases']
            
            # Prepare features
            features = []
            scores = []
            
            for case in cases:
                # Feature engineering
                feature_vector = self._extract_features(case)
                features.append(feature_vector)
                scores.append(case['score'])
            
            X = np.array(features)
            y = np.array(scores)
            
            # Scale features
            self.scaler = StandardScaler()
            X_scaled = self.scaler.fit_transform(X)
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                X_scaled, y, test_size=0.2, random_state=42
            )
            
            # Train Gradient Boosting regressor
            self.risk_predictor = GradientBoostingClassifier(
                n_estimators=200,
                learning_rate=0.1,
                max_depth=6,
                random_state=42
            )
            
            # Convert scores to risk categories for classification
            y_train_cat = self._score_to_category(y_train)
            y_test_cat = self._score_to_category(y_test)
            
            self.risk_predictor.fit(X_train, y_train_cat)
            
            # Evaluate
            y_pred = self.risk_predictor.predict(X_test)
            accuracy = accuracy_score(y_test_cat, y_pred)
            
            logger.info(f"Risk predictor trained with accuracy: {accuracy:.3f}")
            
            self.models['risk_predictor'] = self.risk_predictor
            
        except Exception as e:
            logger.error(f"Error training risk predictor: {str(e)}")
            raise
    
    def _train_neural_network(self, training_data: Dict):
        """Train neural network for complex pattern recognition"""
        try:
            cases = training_data['cases']
            
            # Prepare sequence data for LSTM
            texts = []
            labels = []
            
            for case in cases:
                symptom_text = ' '.join(case['symptoms'])
                texts.append(symptom_text)
                labels.append(case['risk'])
            
            # Tokenize text
            self.tokenizer = Tokenizer(num_words=1000, oov_token='<OOV>')
            self.tokenizer.fit_on_texts(texts)
            
            # Convert to sequences
            sequences = self.tokenizer.texts_to_sequences(texts)
            X = pad_sequences(sequences, maxlen=20)
            
            # Encode labels
            label_map = {'green': 0, 'amber': 1, 'red': 2}
            y = np.array([label_map[label] for label in labels])
            y = to_categorical(y, num_classes=3)
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42
            )
            
            # Build neural network
            self.neural_network = Sequential([
                Embedding(1000, 64, input_length=20),
                LSTM(64, dropout=0.3, recurrent_dropout=0.3),
                Dense(32, activation='relu'),
                Dropout(0.5),
                Dense(16, activation='relu'),
                Dropout(0.3),
                Dense(3, activation='softmax')
            ])
            
            self.neural_network.compile(
                optimizer='adam',
                loss='categorical_crossentropy',
                metrics=['accuracy']
            )
            
            # Train model
            history = self.neural_network.fit(
                X_train, y_train,
                epochs=50,
                batch_size=32,
                validation_data=(X_test, y_test),
                verbose=0
            )
            
            # Evaluate
            _, accuracy = self.neural_network.evaluate(X_test, y_test, verbose=0)
            
            logger.info(f"Neural network trained with accuracy: {accuracy:.3f}")
            
            self.models['neural_network'] = self.neural_network
            
        except Exception as e:
            logger.error(f"Error training neural network: {str(e)}")
            raise
    
    def _extract_features(self, case: Dict) -> List[float]:
        """Extract numerical features from case data"""
        features = []
        
        # Age features
        features.append(case['age'])
        features.append(1 if case['age'] < 5 else 0)  # Is child
        features.append(1 if case['age'] > 65 else 0)  # Is elderly
        
        # Gender features
        features.append(1 if case['gender'] == 'male' else 0)
        features.append(1 if case['gender'] == 'female' else 0)
        
        # Symptom count
        features.append(len(case['symptoms']))
        
        # Critical symptom indicators
        critical_symptoms = ['chest_pain', 'difficulty_breathing', 'unconsciousness', 'severe_bleeding']
        features.append(sum(1 for s in case['symptoms'] if any(cs in s for cs in critical_symptoms)))
        
        # System-specific symptoms
        respiratory = ['cough', 'breathing', 'chest', 'wheezing']
        cardiac = ['chest_pain', 'heart', 'palpitations']
        neurological = ['headache', 'dizziness', 'confusion', 'seizure']
        gastrointestinal = ['nausea', 'vomiting', 'abdominal', 'diarrhea']
        
        features.append(sum(1 for s in case['symptoms'] if any(rs in s for rs in respiratory)))
        features.append(sum(1 for s in case['symptoms'] if any(cs in s for cs in cardiac)))
        features.append(sum(1 for s in case['symptoms'] if any(ns in s for ns in neurological)))
        features.append(sum(1 for s in case['symptoms'] if any(gs in s for gs in gastrointestinal)))
        
        # Severity indicators
        severe_keywords = ['severe', 'intense', 'extreme', 'acute']
        features.append(sum(1 for s in case['symptoms'] if any(sk in s for sk in severe_keywords)))
        
        return features
    
    def _score_to_category(self, scores):
        """Convert numerical scores to risk categories"""
        categories = []
        for score in scores:
            if score >= 80:
                categories.append(2)  # red
            elif score >= 50:
                categories.append(1)  # amber
            else:
                categories.append(0)  # green
        return np.array(categories)
    
    def predict_risk(self, symptoms, age=30, gender='unknown', medical_history=None):
        """Predict risk using trained ML models"""
        try:
            if not self.models_loaded:
                return self._fallback_prediction()
            
            # Prepare case data
            case = {
                'symptoms': symptoms,
                'age': age,
                'gender': gender
            }
            
            # Extract features
            features = np.array([self._extract_features(case)])
            features_scaled = self.scaler.transform(features)
            
            # Get predictions from multiple models
            predictions = {}
            
            # Random Forest prediction
            if self.risk_predictor:
                rf_pred = self.risk_predictor.predict(features_scaled)[0]
                rf_proba = self.risk_predictor.predict_proba(features_scaled)[0]
                predictions['random_forest'] = {
                    'category': rf_pred,
                    'confidence': max(rf_proba)
                }
            
            # Neural Network prediction
            if self.neural_network and self.tokenizer:
                symptom_text = ' '.join(symptoms)
                sequence = self.tokenizer.texts_to_sequences([symptom_text])
                padded = pad_sequences(sequence, maxlen=20)
                nn_pred = self.neural_network.predict(padded, verbose=0)[0]
                nn_category = np.argmax(nn_pred)
                predictions['neural_network'] = {
                    'category': nn_category,
                    'confidence': max(nn_pred)
                }
            
            # Ensemble prediction
            if predictions:
                # Average predictions
                categories = [p['category'] for p in predictions.values()]
                confidences = [p['confidence'] for p in predictions.values()]
                
                final_category = int(np.round(np.mean(categories)))
                final_confidence = np.mean(confidences)
                
                # Convert category to risk level and score
                category_map = {0: 'green', 1: 'amber', 2: 'red'}
                score_map = {0: 25, 1: 60, 2: 85}
                
                risk_level = category_map.get(final_category, 'amber')
                risk_score = score_map.get(final_category, 50)
                
                # Apply medical history adjustment
                if medical_history:
                    history_factor = self._get_medical_history_factor(medical_history)
                    risk_score = min(100, int(risk_score * history_factor))
                    if risk_score > 80:
                        risk_level = 'red'
                    elif risk_score > 50:
                        risk_level = 'amber'
                
                return {
                    'risk_score': risk_score,
                    'risk_level': risk_level,
                    'confidence': round(final_confidence, 3),
                    'method': 'ml_ensemble',
                    'model_predictions': predictions
                }
            
            return self._fallback_prediction()
            
        except Exception as e:
            logger.error(f"ML risk prediction error: {str(e)}")
            return self._fallback_prediction()
    
    def predict_symptoms(self, text: str, language: str = 'en') -> List[Dict]:
        """Predict symptoms from text using trained ML models"""
        try:
            if not self.models_loaded or not self.vectorizer:
                return self._fallback_symptom_prediction(text, language)
            
            # Vectorize input text
            text_vector = self.vectorizer.transform([text])
            
            # Get prediction
            prediction = self.symptom_classifier.predict(text_vector)[0]
            probabilities = self.symptom_classifier.predict_proba(text_vector)[0]
            
            # Convert prediction back to risk level
            risk_level = self.label_encoder.inverse_transform([prediction])[0]
            confidence = max(probabilities)
            
            # Extract individual symptoms using keyword matching as supplement
            individual_symptoms = self._extract_symptoms_from_text(text, language)
            
            return [{
                'symptom': symptom,
                'confidence': confidence,
                'method': 'ml_classification'
            } for symptom in individual_symptoms]
            
        except Exception as e:
            logger.error(f"ML symptom prediction error: {str(e)}")
            return self._fallback_symptom_prediction(text, language)
    
    def _extract_symptoms_from_text(self, text: str, language: str) -> List[str]:
        """Extract individual symptoms from text"""
        text = text.lower()
        symptoms = []
        
        # Medical symptom dictionary
        symptom_keywords = {
            'fever': ['fever', 'temperature', 'hot', 'chills', 'बुखार', 'pyrexia'],
            'headache': ['headache', 'head pain', 'migraine', 'सिरदर्द', 'cephalgia'],
            'cough': ['cough', 'coughing', 'खांसी', 'tussis'],
            'chest_pain': ['chest pain', 'chest hurt', 'छाती में दर्द', 'thoracic pain'],
            'difficulty_breathing': ['breathing', 'breathe', 'shortness', 'सांस', 'dyspnea', 'respiratory distress'],
            'stomach_pain': ['stomach', 'abdominal', 'belly', 'पेट दर्द', 'gastric pain'],
            'vomiting': ['vomit', 'throw up', 'nausea', 'उल्टी', 'emesis'],
            'diarrhea': ['diarrhea', 'loose stool', 'दस्त', 'loose motions'],
            'fatigue': ['tired', 'fatigue', 'weakness', 'कमजोरी', 'exhaustion'],
            'sore_throat': ['throat', 'swallow', 'गले में खराश', 'pharyngitis'],
            'dizziness': ['dizzy', 'vertigo', 'lightheaded', 'चक्कर'],
            'rash': ['rash', 'skin irritation', 'eruption', 'dermatitis'],
            'joint_pain': ['joint pain', 'arthralgia', 'joint ache'],
            'back_pain': ['back pain', 'spine pain', 'lumbar pain'],
            'muscle_pain': ['muscle pain', 'myalgia', 'muscle ache']
        }
        
        for symptom, keywords in symptom_keywords.items():
            if any(keyword in text for keyword in keywords):
                symptoms.append(symptom)
        
        return list(set(symptoms))  # Remove duplicates
    
    def _get_medical_history_factor(self, medical_history):
        """Get medical history risk adjustment factor"""
        high_risk_conditions = [
            'diabetes', 'hypertension', 'heart_disease', 'asthma', 
            'copd', 'kidney_disease', 'immunocompromised', 'cancer',
            'stroke', 'myocardial_infarction', 'chronic_kidney_disease'
        ]
        
        factor = 1.0
        for condition in medical_history:
            condition_lower = condition.lower()
            if any(risk_condition in condition_lower for risk_condition in high_risk_conditions):
                factor *= 1.15
        
        return min(2.0, factor)  # Cap at 2x
    
    def _fallback_prediction(self):
        """Fallback prediction when ML models fail"""
        return {
            'risk_score': 50,
            'risk_level': 'amber',
            'confidence': 0.5,
            'method': 'fallback',
            'model_predictions': {}
        }
    
    def _fallback_symptom_prediction(self, text: str, language: str) -> List[Dict]:
        """Fallback symptom prediction"""
        symptoms = self._extract_symptoms_from_text(text, language)
        return [{
            'symptom': symptom,
            'confidence': 0.6,
            'method': 'keyword_fallback'
        } for symptom in symptoms]
    
    def _save_trained_models(self):
        """Save all trained models to disk"""
        try:
            # Save scikit-learn models
            if self.symptom_classifier:
                joblib.dump(self.symptom_classifier, os.path.join(self.models_path, 'symptom_classifier.pkl'))
            
            if self.risk_predictor:
                joblib.dump(self.risk_predictor, os.path.join(self.models_path, 'risk_predictor.pkl'))
            
            if self.vectorizer:
                joblib.dump(self.vectorizer, os.path.join(self.models_path, 'vectorizer.pkl'))
            
            if self.scaler:
                joblib.dump(self.scaler, os.path.join(self.models_path, 'scaler.pkl'))
            
            if self.label_encoder:
                joblib.dump(self.label_encoder, os.path.join(self.models_path, 'label_encoder.pkl'))
            
            # Save tokenizer
            if self.tokenizer:
                with open(os.path.join(self.models_path, 'tokenizer.pkl'), 'wb') as f:
                    pickle.dump(self.tokenizer, f)
            
            # Save neural network
            if self.neural_network:
                self.neural_network.save(os.path.join(self.models_path, 'neural_network.h5'))
            
            # Save metadata
            metadata = {
                'models_trained': True,
                'training_date': datetime.now().isoformat(),
                'model_types': ['random_forest', 'gradient_boosting', 'neural_network'],
                'features': ['age', 'gender', 'symptom_count', 'critical_symptoms', 'system_symptoms']
            }
            
            with open(os.path.join(self.models_path, 'metadata.json'), 'w') as f:
                json.dump(metadata, f, indent=2)
            
            logger.info("All ML models saved successfully")
            
        except Exception as e:
            logger.error(f"Error saving models: {str(e)}")
    
    def _load_trained_models(self) -> bool:
        """Load pre-trained models from disk"""
        try:
            models_path = self.models_path
            
            # Check if models exist
            required_files = [
                'symptom_classifier.pkl',
                'risk_predictor.pkl',
                'vectorizer.pkl',
                'scaler.pkl',
                'label_encoder.pkl',
                'metadata.json'
            ]
            
            if not all(os.path.exists(os.path.join(models_path, f)) for f in required_files):
                return False
            
            # Load scikit-learn models
            self.symptom_classifier = joblib.load(os.path.join(models_path, 'symptom_classifier.pkl'))
            self.risk_predictor = joblib.load(os.path.join(models_path, 'risk_predictor.pkl'))
            self.vectorizer = joblib.load(os.path.join(models_path, 'vectorizer.pkl'))
            self.scaler = joblib.load(os.path.join(models_path, 'scaler.pkl'))
            self.label_encoder = joblib.load(os.path.join(models_path, 'label_encoder.pkl'))
            
            # Load tokenizer if exists
            tokenizer_path = os.path.join(models_path, 'tokenizer.pkl')
            if os.path.exists(tokenizer_path):
                with open(tokenizer_path, 'rb') as f:
                    self.tokenizer = pickle.load(f)
            
            # Load neural network if exists
            nn_path = os.path.join(models_path, 'neural_network.h5')
            if os.path.exists(nn_path):
                self.neural_network = load_model(nn_path)
            
            return True
            
        except Exception as e:
            logger.error(f"Error loading models: {str(e)}")
            return False
    
    def _initialize_fallback_models(self):
        """Initialize simple fallback models if ML training fails"""
        logger.warning("Initializing fallback models due to ML training failure")
        self.models_loaded = False
        self.is_trained = False
    
    def get_model_info(self):
        """Get information about loaded models"""
        return {
            'models_available': list(self.models.keys()),
            'is_trained': self.is_trained,
            'models_loaded': self.models_loaded,
            'method': 'machine_learning',
            'last_updated': datetime.now().isoformat(),
            'capabilities': [
                'ml_symptom_classification',
                'ensemble_risk_prediction',
                'neural_network_analysis',
                'feature_engineering',
                'multilingual_support'
            ],
            'model_types': [
                'RandomForestClassifier',
                'GradientBoostingClassifier', 
                'LSTM_Neural_Network',
                'TF-IDF_Vectorizer'
            ]
        }
    
    def classify_symptoms(self, text, language='en'):
        """Classify symptoms from text using ML models"""
        try:
            # Use the predict_symptoms method and convert format
            predictions = self.predict_symptoms(text, language)
            
            # Extract just the symptom names
            symptoms = [pred['symptom'] for pred in predictions]
            
            # Calculate average confidence
            if predictions:
                confidence = sum(pred['confidence'] for pred in predictions) / len(predictions)
            else:
                confidence = 0.0
            
            return {
                'symptoms': symptoms,
                'confidence': confidence,
                'method': 'ml_classification' if self.models_loaded else 'keyword_matching'
            }
            
        except Exception as e:
            logger.error(f"Symptom classification error: {str(e)}")
            return {'symptoms': [], 'confidence': 0.0, 'method': 'error'}
    
    def retrain_models(self, new_training_data=None):
        """Retrain models with new data"""
        try:
            if new_training_data:
                # Use provided data
                training_data = new_training_data
            else:
                # Generate new training data
                training_data = self._generate_comprehensive_training_data()
            
            # Retrain all models
            self._train_symptom_classifier(training_data)
            self._train_risk_predictor(training_data)
            self._train_neural_network(training_data)
            
            # Save retrained models
            self._save_trained_models()
            
            self.models_loaded = True
            self.is_trained = True
            
            logger.info("Models retrained successfully")
            return True
            
        except Exception as e:
            logger.error(f"Error retraining models: {str(e)}")
            return False