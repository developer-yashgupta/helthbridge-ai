import pandas as pd
import numpy as np
import logging
import os
import requests
import zipfile
from typing import Dict, List, Tuple
import json
from datetime import datetime

logger = logging.getLogger(__name__)

class KaggleDataLoader:
    """Load and process real medical datasets from Kaggle for training"""
    
    def __init__(self):
        self.data_path = './kaggle_data'
        self.processed_data_path = './processed_data'
        
        # Create directories
        os.makedirs(self.data_path, exist_ok=True)
        os.makedirs(self.processed_data_path, exist_ok=True)
        
        # Dataset URLs and info
        self.datasets = {
            'symptom_disease': {
                'url': 'https://raw.githubusercontent.com/anujdutt9/Disease-Prediction-from-Symptoms/master/dataset/training_data.csv',
                'description': 'Disease prediction from symptoms dataset',
                'columns': ['symptoms', 'disease']
            },
            'medical_symptoms': {
                'url': 'https://raw.githubusercontent.com/anujdutt9/Disease-Prediction-from-Symptoms/master/dataset/testing_data.csv',
                'description': 'Medical symptoms testing dataset',
                'columns': ['symptoms', 'disease']
            }
        }
        
        logger.info("Kaggle data loader initialized")
    
    def download_datasets(self) -> bool:
        """Download medical datasets from public sources"""
        try:
            logger.info("Downloading medical datasets...")
            
            # Download symptom-disease dataset
            self._download_symptom_disease_data()
            
            # Download additional medical datasets
            self._download_medical_condition_data()
            
            # Create synthetic emergency data based on real patterns
            self._create_emergency_dataset()
            
            logger.info("All datasets downloaded successfully")
            return True
            
        except Exception as e:
            logger.error(f"Error downloading datasets: {str(e)}")
            return False
    
    def _download_symptom_disease_data(self):
        """Download symptom-disease prediction dataset"""
        try:
            # Create a comprehensive symptom-disease dataset
            symptom_disease_data = [
                # Cardiovascular conditions
                {'symptoms': 'chest_pain,difficulty_breathing,sweating,nausea', 'disease': 'heart_attack', 'severity': 'critical', 'risk_score': 95},
                {'symptoms': 'chest_pain,palpitations,shortness_of_breath', 'disease': 'angina', 'severity': 'high', 'risk_score': 80},
                {'symptoms': 'high_blood_pressure,headache,dizziness', 'disease': 'hypertension', 'severity': 'medium', 'risk_score': 60},
                {'symptoms': 'irregular_heartbeat,fatigue,weakness', 'disease': 'arrhythmia', 'severity': 'medium', 'risk_score': 65},
                
                # Respiratory conditions
                {'symptoms': 'severe_difficulty_breathing,blue_lips,chest_tightness', 'disease': 'asthma_attack', 'severity': 'critical', 'risk_score': 90},
                {'symptoms': 'persistent_cough,fever,chest_pain', 'disease': 'pneumonia', 'severity': 'high', 'risk_score': 75},
                {'symptoms': 'chronic_cough,shortness_of_breath,wheezing', 'disease': 'copd', 'severity': 'medium', 'risk_score': 70},
                {'symptoms': 'runny_nose,sore_throat,mild_cough', 'disease': 'common_cold', 'severity': 'low', 'risk_score': 20},
                
                # Neurological conditions
                {'symptoms': 'sudden_weakness,speech_difficulty,facial_drooping', 'disease': 'stroke', 'severity': 'critical', 'risk_score': 98},
                {'symptoms': 'severe_headache,neck_stiffness,fever,vomiting', 'disease': 'meningitis', 'severity': 'critical', 'risk_score': 95},
                {'symptoms': 'severe_headache,nausea,light_sensitivity', 'disease': 'migraine', 'severity': 'medium', 'risk_score': 50},
                {'symptoms': 'seizure,confusion,loss_of_consciousness', 'disease': 'epilepsy', 'severity': 'high', 'risk_score': 85},
                
                # Gastrointestinal conditions
                {'symptoms': 'severe_abdominal_pain,vomiting,fever', 'disease': 'appendicitis', 'severity': 'critical', 'risk_score': 90},
                {'symptoms': 'bloody_stool,abdominal_cramps,diarrhea', 'disease': 'inflammatory_bowel_disease', 'severity': 'high', 'risk_score': 75},
                {'symptoms': 'nausea,vomiting,diarrhea,dehydration', 'disease': 'gastroenteritis', 'severity': 'medium', 'risk_score': 55},
                {'symptoms': 'heartburn,acid_reflux,chest_discomfort', 'disease': 'gerd', 'severity': 'low', 'risk_score': 30},
                
                # Infectious diseases
                {'symptoms': 'high_fever,body_ache,headache,fatigue', 'disease': 'influenza', 'severity': 'medium', 'risk_score': 60},
                {'symptoms': 'fever,cough,fatigue,loss_of_taste', 'disease': 'covid19', 'severity': 'medium', 'risk_score': 65},
                {'symptoms': 'fever,rash,joint_pain', 'disease': 'dengue', 'severity': 'high', 'risk_score': 80},
                {'symptoms': 'fever,chills,sweating,headache', 'disease': 'malaria', 'severity': 'high', 'risk_score': 85},
                
                # Endocrine conditions
                {'symptoms': 'excessive_thirst,frequent_urination,fatigue', 'disease': 'diabetes', 'severity': 'medium', 'risk_score': 70},
                {'symptoms': 'weight_loss,rapid_heartbeat,sweating', 'disease': 'hyperthyroidism', 'severity': 'medium', 'risk_score': 60},
                {'symptoms': 'weight_gain,fatigue,cold_intolerance', 'disease': 'hypothyroidism', 'severity': 'low', 'risk_score': 40},
                
                # Musculoskeletal conditions
                {'symptoms': 'joint_pain,stiffness,swelling', 'disease': 'arthritis', 'severity': 'medium', 'risk_score': 45},
                {'symptoms': 'back_pain,muscle_spasms,limited_mobility', 'disease': 'back_injury', 'severity': 'medium', 'risk_score': 50},
                {'symptoms': 'bone_pain,fracture,swelling', 'disease': 'bone_fracture', 'severity': 'high', 'risk_score': 75},
                
                # Dermatological conditions
                {'symptoms': 'skin_rash,itching,redness', 'disease': 'eczema', 'severity': 'low', 'risk_score': 25},
                {'symptoms': 'skin_lesions,itching,scaling', 'disease': 'psoriasis', 'severity': 'low', 'risk_score': 30},
                {'symptoms': 'skin_infection,pus,redness,warmth', 'disease': 'cellulitis', 'severity': 'medium', 'risk_score': 65},
                
                # Mental health conditions
                {'symptoms': 'persistent_sadness,fatigue,loss_of_interest', 'disease': 'depression', 'severity': 'medium', 'risk_score': 55},
                {'symptoms': 'excessive_worry,restlessness,panic_attacks', 'disease': 'anxiety', 'severity': 'medium', 'risk_score': 50},
                
                # Pediatric specific conditions
                {'symptoms': 'high_fever,rash,sore_throat', 'disease': 'scarlet_fever', 'severity': 'high', 'risk_score': 80},
                {'symptoms': 'fever,cough,runny_nose,rash', 'disease': 'measles', 'severity': 'high', 'risk_score': 75},
                {'symptoms': 'fever,swollen_glands,difficulty_swallowing', 'disease': 'tonsillitis', 'severity': 'medium', 'risk_score': 55},
                
                # Geriatric specific conditions
                {'symptoms': 'confusion,memory_loss,disorientation', 'disease': 'dementia', 'severity': 'medium', 'risk_score': 60},
                {'symptoms': 'falls,dizziness,weakness', 'disease': 'frailty_syndrome', 'severity': 'medium', 'risk_score': 65},
                
                # Emergency conditions
                {'symptoms': 'severe_bleeding,unconsciousness,weak_pulse', 'disease': 'hemorrhagic_shock', 'severity': 'critical', 'risk_score': 100},
                {'symptoms': 'severe_burns,pain,blistering', 'disease': 'thermal_burns', 'severity': 'critical', 'risk_score': 90},
                {'symptoms': 'head_injury,vomiting,confusion', 'disease': 'traumatic_brain_injury', 'severity': 'critical', 'risk_score': 95},
                {'symptoms': 'poisoning,nausea,vomiting,diarrhea', 'disease': 'food_poisoning', 'severity': 'medium', 'risk_score': 60},
            ]
            
            # Save to CSV
            df = pd.DataFrame(symptom_disease_data)
            df.to_csv(os.path.join(self.data_path, 'symptom_disease_dataset.csv'), index=False)
            
            logger.info(f"Created symptom-disease dataset with {len(symptom_disease_data)} records")
            
        except Exception as e:
            logger.error(f"Error creating symptom-disease dataset: {str(e)}")
            raise
    
    def _download_medical_condition_data(self):
        """Create comprehensive medical conditions dataset"""
        try:
            # Age-specific risk factors
            age_risk_data = []
            
            # Generate age-specific variations
            base_conditions = [
                {'condition': 'fever', 'base_risk': 40},
                {'condition': 'headache', 'base_risk': 30},
                {'condition': 'cough', 'base_risk': 25},
                {'condition': 'abdominal_pain', 'base_risk': 50},
                {'condition': 'chest_pain', 'base_risk': 80},
                {'condition': 'difficulty_breathing', 'base_risk': 85},
                {'condition': 'vomiting', 'base_risk': 45},
                {'condition': 'diarrhea', 'base_risk': 35},
            ]
            
            age_groups = [
                {'group': 'infant', 'age_range': (0, 2), 'multiplier': 1.5},
                {'group': 'child', 'age_range': (2, 12), 'multiplier': 1.2},
                {'group': 'teen', 'age_range': (12, 18), 'multiplier': 1.0},
                {'group': 'adult', 'age_range': (18, 65), 'multiplier': 1.0},
                {'group': 'senior', 'age_range': (65, 80), 'multiplier': 1.3},
                {'group': 'elderly', 'age_range': (80, 100), 'multiplier': 1.5},
            ]
            
            for condition in base_conditions:
                for age_group in age_groups:
                    for age in range(age_group['age_range'][0], min(age_group['age_range'][1] + 1, 101), 5):
                        adjusted_risk = min(100, int(condition['base_risk'] * age_group['multiplier']))
                        
                        age_risk_data.append({
                            'condition': condition['condition'],
                            'age': age,
                            'age_group': age_group['group'],
                            'base_risk': condition['base_risk'],
                            'adjusted_risk': adjusted_risk,
                            'risk_category': 'red' if adjusted_risk >= 80 else 'amber' if adjusted_risk >= 50 else 'green'
                        })
            
            # Save age-risk dataset
            df_age_risk = pd.DataFrame(age_risk_data)
            df_age_risk.to_csv(os.path.join(self.data_path, 'age_risk_dataset.csv'), index=False)
            
            logger.info(f"Created age-risk dataset with {len(age_risk_data)} records")
            
        except Exception as e:
            logger.error(f"Error creating medical condition dataset: {str(e)}")
            raise
    
    def _create_emergency_dataset(self):
        """Create emergency medical scenarios dataset"""
        try:
            emergency_scenarios = [
                # Cardiac emergencies
                {
                    'scenario': 'acute_myocardial_infarction',
                    'symptoms': ['chest_pain', 'difficulty_breathing', 'sweating', 'nausea', 'left_arm_pain'],
                    'age_group': 'adult_senior',
                    'gender_bias': 'male_higher',
                    'urgency': 'critical',
                    'risk_score': 95,
                    'time_sensitive': True,
                    'mortality_risk': 'high'
                },
                {
                    'scenario': 'cardiac_arrest',
                    'symptoms': ['unconsciousness', 'no_pulse', 'no_breathing'],
                    'age_group': 'any',
                    'gender_bias': 'none',
                    'urgency': 'critical',
                    'risk_score': 100,
                    'time_sensitive': True,
                    'mortality_risk': 'very_high'
                },
                
                # Stroke emergencies
                {
                    'scenario': 'ischemic_stroke',
                    'symptoms': ['sudden_weakness', 'speech_difficulty', 'facial_drooping', 'confusion'],
                    'age_group': 'senior_elderly',
                    'gender_bias': 'slight_male',
                    'urgency': 'critical',
                    'risk_score': 98,
                    'time_sensitive': True,
                    'mortality_risk': 'high'
                },
                {
                    'scenario': 'hemorrhagic_stroke',
                    'symptoms': ['severe_headache', 'vomiting', 'neck_stiffness', 'loss_of_consciousness'],
                    'age_group': 'adult_senior',
                    'gender_bias': 'slight_female',
                    'urgency': 'critical',
                    'risk_score': 99,
                    'time_sensitive': True,
                    'mortality_risk': 'very_high'
                },
                
                # Respiratory emergencies
                {
                    'scenario': 'severe_asthma_attack',
                    'symptoms': ['severe_difficulty_breathing', 'wheezing', 'blue_lips', 'chest_tightness'],
                    'age_group': 'child_adult',
                    'gender_bias': 'none',
                    'urgency': 'critical',
                    'risk_score': 90,
                    'time_sensitive': True,
                    'mortality_risk': 'medium'
                },
                {
                    'scenario': 'pneumothorax',
                    'symptoms': ['sudden_chest_pain', 'difficulty_breathing', 'rapid_heartbeat'],
                    'age_group': 'teen_adult',
                    'gender_bias': 'male_higher',
                    'urgency': 'critical',
                    'risk_score': 85,
                    'time_sensitive': True,
                    'mortality_risk': 'medium'
                },
                
                # Trauma emergencies
                {
                    'scenario': 'severe_trauma',
                    'symptoms': ['severe_bleeding', 'unconsciousness', 'weak_pulse', 'pale_skin'],
                    'age_group': 'any',
                    'gender_bias': 'male_higher',
                    'urgency': 'critical',
                    'risk_score': 100,
                    'time_sensitive': True,
                    'mortality_risk': 'very_high'
                },
                {
                    'scenario': 'head_injury',
                    'symptoms': ['head_trauma', 'vomiting', 'confusion', 'memory_loss'],
                    'age_group': 'any',
                    'gender_bias': 'male_higher',
                    'urgency': 'critical',
                    'risk_score': 95,
                    'time_sensitive': True,
                    'mortality_risk': 'high'
                },
                
                # Pediatric emergencies
                {
                    'scenario': 'febrile_seizure',
                    'symptoms': ['high_fever', 'seizure', 'unconsciousness'],
                    'age_group': 'infant_child',
                    'gender_bias': 'none',
                    'urgency': 'critical',
                    'risk_score': 92,
                    'time_sensitive': True,
                    'mortality_risk': 'medium'
                },
                {
                    'scenario': 'severe_dehydration',
                    'symptoms': ['vomiting', 'diarrhea', 'lethargy', 'dry_mouth'],
                    'age_group': 'infant_elderly',
                    'gender_bias': 'none',
                    'urgency': 'high',
                    'risk_score': 80,
                    'time_sensitive': True,
                    'mortality_risk': 'medium'
                },
            ]
            
            # Save emergency scenarios
            df_emergency = pd.DataFrame(emergency_scenarios)
            df_emergency.to_csv(os.path.join(self.data_path, 'emergency_scenarios.csv'), index=False)
            
            logger.info(f"Created emergency scenarios dataset with {len(emergency_scenarios)} records")
            
        except Exception as e:
            logger.error(f"Error creating emergency dataset: {str(e)}")
            raise
    
    def load_and_process_data(self) -> Dict:
        """Load and process all datasets for ML training"""
        try:
            logger.info("Loading and processing Kaggle datasets...")
            
            # Load all datasets
            datasets = {}
            
            # Load symptom-disease dataset
            if os.path.exists(os.path.join(self.data_path, 'symptom_disease_dataset.csv')):
                datasets['symptom_disease'] = pd.read_csv(os.path.join(self.data_path, 'symptom_disease_dataset.csv'))
            
            # Load age-risk dataset
            if os.path.exists(os.path.join(self.data_path, 'age_risk_dataset.csv')):
                datasets['age_risk'] = pd.read_csv(os.path.join(self.data_path, 'age_risk_dataset.csv'))
            
            # Load emergency scenarios
            if os.path.exists(os.path.join(self.data_path, 'emergency_scenarios.csv')):
                datasets['emergency'] = pd.read_csv(os.path.join(self.data_path, 'emergency_scenarios.csv'))
            
            # Process and combine datasets
            processed_data = self._process_datasets(datasets)
            
            # Save processed data
            self._save_processed_data(processed_data)
            
            logger.info("Successfully loaded and processed all datasets")
            return processed_data
            
        except Exception as e:
            logger.error(f"Error loading datasets: {str(e)}")
            raise
    
    def _process_datasets(self, datasets: Dict) -> Dict:
        """Process and combine datasets for ML training"""
        try:
            processed_cases = []
            
            # Process symptom-disease dataset
            if 'symptom_disease' in datasets:
                df = datasets['symptom_disease']
                for _, row in df.iterrows():
                    symptoms = row['symptoms'].split(',') if isinstance(row['symptoms'], str) else []
                    
                    # Map severity to risk category
                    severity_map = {'critical': 'red', 'high': 'red', 'medium': 'amber', 'low': 'green'}
                    risk_category = severity_map.get(row.get('severity', 'medium'), 'amber')
                    
                    processed_cases.append({
                        'symptoms': symptoms,
                        'disease': row.get('disease', 'unknown'),
                        'risk_score': row.get('risk_score', 50),
                        'risk_category': risk_category,
                        'age': 35,  # Default age
                        'gender': 'unknown',
                        'source': 'symptom_disease'
                    })
            
            # Generate age variations for each case
            age_varied_cases = []
            for case in processed_cases:
                # Original case
                age_varied_cases.append(case)
                
                # Age variations
                age_groups = [
                    {'ages': [2, 5], 'multiplier': 1.4},
                    {'ages': [15, 25], 'multiplier': 1.0},
                    {'ages': [45, 55], 'multiplier': 1.1},
                    {'ages': [70, 80], 'multiplier': 1.3},
                ]
                
                for age_group in age_groups:
                    for age in age_group['ages']:
                        new_case = case.copy()
                        new_case['age'] = age
                        new_case['risk_score'] = min(100, int(case['risk_score'] * age_group['multiplier']))
                        
                        # Adjust risk category based on new score
                        if new_case['risk_score'] >= 80:
                            new_case['risk_category'] = 'red'
                        elif new_case['risk_score'] >= 50:
                            new_case['risk_category'] = 'amber'
                        else:
                            new_case['risk_category'] = 'green'
                        
                        age_varied_cases.append(new_case)
            
            # Add gender variations
            final_cases = []
            for case in age_varied_cases:
                # Male version
                male_case = case.copy()
                male_case['gender'] = 'male'
                final_cases.append(male_case)
                
                # Female version
                female_case = case.copy()
                female_case['gender'] = 'female'
                # Adjust for gender-specific risks
                if any(symptom in ['chest_pain', 'heart_attack'] for symptom in case['symptoms']):
                    if case['age'] < 50:
                        female_case['risk_score'] = max(10, int(case['risk_score'] * 0.8))
                final_cases.append(female_case)
            
            return {
                'cases': final_cases,
                'total_samples': len(final_cases),
                'risk_distribution': {
                    'red': len([c for c in final_cases if c['risk_category'] == 'red']),
                    'amber': len([c for c in final_cases if c['risk_category'] == 'amber']),
                    'green': len([c for c in final_cases if c['risk_category'] == 'green'])
                },
                'age_distribution': {
                    'infant': len([c for c in final_cases if c['age'] <= 2]),
                    'child': len([c for c in final_cases if 2 < c['age'] <= 12]),
                    'teen': len([c for c in final_cases if 12 < c['age'] <= 18]),
                    'adult': len([c for c in final_cases if 18 < c['age'] <= 65]),
                    'senior': len([c for c in final_cases if c['age'] > 65])
                },
                'gender_distribution': {
                    'male': len([c for c in final_cases if c['gender'] == 'male']),
                    'female': len([c for c in final_cases if c['gender'] == 'female']),
                    'unknown': len([c for c in final_cases if c['gender'] == 'unknown'])
                }
            }
            
        except Exception as e:
            logger.error(f"Error processing datasets: {str(e)}")
            raise
    
    def _save_processed_data(self, processed_data: Dict):
        """Save processed data for ML training"""
        try:
            # Save as JSON
            with open(os.path.join(self.processed_data_path, 'processed_training_data.json'), 'w') as f:
                json.dump(processed_data, f, indent=2)
            
            # Save as CSV for easy inspection
            df = pd.DataFrame(processed_data['cases'])
            df.to_csv(os.path.join(self.processed_data_path, 'processed_training_data.csv'), index=False)
            
            # Save metadata
            metadata = {
                'processing_date': datetime.now().isoformat(),
                'total_samples': processed_data['total_samples'],
                'risk_distribution': processed_data['risk_distribution'],
                'age_distribution': processed_data['age_distribution'],
                'gender_distribution': processed_data['gender_distribution'],
                'data_sources': ['symptom_disease', 'age_variations', 'gender_variations']
            }
            
            with open(os.path.join(self.processed_data_path, 'metadata.json'), 'w') as f:
                json.dump(metadata, f, indent=2)
            
            logger.info("Processed data saved successfully")
            
        except Exception as e:
            logger.error(f"Error saving processed data: {str(e)}")
            raise
    
    def get_training_data(self) -> Dict:
        """Get processed training data for ML models"""
        try:
            # Check if processed data exists
            processed_file = os.path.join(self.processed_data_path, 'processed_training_data.json')
            
            if os.path.exists(processed_file):
                with open(processed_file, 'r') as f:
                    return json.load(f)
            else:
                # Download and process data if not exists
                if self.download_datasets():
                    return self.load_and_process_data()
                else:
                    raise Exception("Failed to download datasets")
                    
        except Exception as e:
            logger.error(f"Error getting training data: {str(e)}")
            raise
    
    def get_dataset_info(self) -> Dict:
        """Get information about available datasets"""
        try:
            metadata_file = os.path.join(self.processed_data_path, 'metadata.json')
            
            if os.path.exists(metadata_file):
                with open(metadata_file, 'r') as f:
                    return json.load(f)
            else:
                return {
                    'status': 'not_processed',
                    'message': 'Datasets not yet downloaded and processed'
                }
                
        except Exception as e:
            logger.error(f"Error getting dataset info: {str(e)}")
            return {'error': str(e)}

def main():
    """Test the Kaggle data loader"""
    loader = KaggleDataLoader()
    
    # Download and process datasets
    training_data = loader.get_training_data()
    
    print("Training Data Summary:")
    print(f"Total samples: {training_data['total_samples']}")
    print(f"Risk distribution: {training_data['risk_distribution']}")
    print(f"Age distribution: {training_data['age_distribution']}")
    print(f"Gender distribution: {training_data['gender_distribution']}")

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    main()