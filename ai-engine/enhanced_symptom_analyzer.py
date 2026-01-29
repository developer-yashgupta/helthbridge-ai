import logging
from datetime import datetime
from typing import Dict, List, Optional
from healthcare_routing_system import HealthcareRoutingSystem, UserMedicalHistory
from ml_models import MLModels

logger = logging.getLogger(__name__)

class EnhancedSymptomAnalyzer:
    """Enhanced symptom analyzer with user history and healthcare routing"""
    
    def __init__(self):
        # Initialize ML models and routing system
        self.ml_models = MLModels()
        self.routing_system = HealthcareRoutingSystem()
        
        # Disease detection patterns
        self.disease_patterns = self._load_disease_patterns()
        
        logger.info("✅ Enhanced symptom analyzer initialized with routing system")
    
    def _load_disease_patterns(self) -> Dict:
        """Load disease detection patterns based on symptom combinations"""
        return {
            # Cardiovascular diseases
            "myocardial_infarction": {
                "symptoms": ["chest_pain", "difficulty_breathing", "sweating", "nausea", "left_arm_pain"],
                "risk_factors": ["age>50", "male", "diabetes", "hypertension", "smoking"],
                "urgency": "critical",
                "confidence_threshold": 0.8
            },
            
            "angina": {
                "symptoms": ["chest_pain", "shortness_of_breath", "fatigue"],
                "risk_factors": ["age>40", "diabetes", "hypertension"],
                "urgency": "urgent",
                "confidence_threshold": 0.7
            },
            
            # Respiratory diseases
            "pneumonia": {
                "symptoms": ["fever", "cough", "chest_pain", "difficulty_breathing", "fatigue"],
                "risk_factors": ["age>65", "age<5", "chronic_lung_disease"],
                "urgency": "urgent",
                "confidence_threshold": 0.75
            },
            
            "asthma_attack": {
                "symptoms": ["difficulty_breathing", "wheezing", "chest_tightness", "cough"],
                "risk_factors": ["asthma_history", "allergies"],
                "urgency": "urgent",
                "confidence_threshold": 0.8
            },
            
            # Neurological diseases
            "stroke": {
                "symptoms": ["sudden_weakness", "speech_difficulty", "facial_drooping", "confusion"],
                "risk_factors": ["age>50", "hypertension", "diabetes", "heart_disease"],
                "urgency": "critical",
                "confidence_threshold": 0.85
            },
            
            "meningitis": {
                "symptoms": ["severe_headache", "neck_stiffness", "fever", "photophobia", "vomiting"],
                "risk_factors": ["age<5", "immunocompromised"],
                "urgency": "critical",
                "confidence_threshold": 0.8
            },
            
            # Gastrointestinal diseases
            "appendicitis": {
                "symptoms": ["abdominal_pain", "nausea", "vomiting", "fever"],
                "risk_factors": ["age_10_30"],
                "urgency": "urgent",
                "confidence_threshold": 0.75
            },
            
            "gastroenteritis": {
                "symptoms": ["diarrhea", "vomiting", "abdominal_cramps", "fever"],
                "risk_factors": ["recent_travel", "food_poisoning"],
                "urgency": "routine",
                "confidence_threshold": 0.6
            },
            
            # Infectious diseases
            "malaria": {
                "symptoms": ["fever", "chills", "headache", "muscle_aches", "fatigue"],
                "risk_factors": ["endemic_area", "recent_travel"],
                "urgency": "urgent",
                "confidence_threshold": 0.7
            },
            
            "dengue": {
                "symptoms": ["high_fever", "severe_headache", "eye_pain", "muscle_pain", "rash"],
                "risk_factors": ["monsoon_season", "endemic_area"],
                "urgency": "urgent",
                "confidence_threshold": 0.75
            },
            
            "covid19": {
                "symptoms": ["fever", "cough", "fatigue", "loss_of_taste", "difficulty_breathing"],
                "risk_factors": ["age>60", "diabetes", "hypertension", "exposure"],
                "urgency": "urgent",
                "confidence_threshold": 0.7
            },
            
            # Common conditions
            "common_cold": {
                "symptoms": ["runny_nose", "sore_throat", "mild_cough", "sneezing"],
                "risk_factors": [],
                "urgency": "routine",
                "confidence_threshold": 0.6
            },
            
            "migraine": {
                "symptoms": ["severe_headache", "nausea", "light_sensitivity", "sound_sensitivity"],
                "risk_factors": ["stress", "female", "family_history"],
                "urgency": "routine",
                "confidence_threshold": 0.7
            },
            
            "urinary_tract_infection": {
                "symptoms": ["dysuria", "frequent_urination", "pelvic_pain", "fever"],
                "risk_factors": ["female", "diabetes", "pregnancy"],
                "urgency": "urgent",
                "confidence_threshold": 0.7
            }
        }
    
    def comprehensive_analysis(self, user_id: str, symptoms_input: str, 
                             user_info: Dict = None) -> Dict:
        """Comprehensive symptom analysis with disease detection and routing"""
        try:
            # Extract symptoms from input
            symptoms = self._extract_symptoms(symptoms_input)
            
            # Get ML-based risk analysis
            ml_analysis = self.ml_models.predict_risk(
                symptoms,
                user_info.get('age', 30),
                user_info.get('gender', 'unknown'),
                user_info.get('chronic_conditions', [])
            )
            
            # Detect potential diseases
            disease_predictions = self._detect_diseases(symptoms, user_info or {})
            
            # Get healthcare routing with history
            routing_response = self.routing_system.analyze_with_history(
                user_id=user_id,
                current_symptoms=symptoms,
                additional_info=user_info
            )
            
            # Combine all analyses
            comprehensive_result = {
                "user_id": user_id,
                "input_symptoms": symptoms_input,
                "extracted_symptoms": symptoms,
                "ml_analysis": ml_analysis,
                "disease_predictions": disease_predictions,
                "healthcare_routing": routing_response["routing"],
                "medication_suggestions": routing_response["medications"],
                "follow_up_plan": routing_response["follow_up"],
                "history_factors": routing_response.get("history_factors", {}),
                "recommendations": self._generate_comprehensive_recommendations(
                    ml_analysis, disease_predictions, routing_response
                ),
                "timestamp": datetime.now().isoformat()
            }
            
            logger.info(f"Comprehensive analysis completed for user {user_id}")
            return comprehensive_result
            
        except Exception as e:
            logger.error(f"Error in comprehensive analysis: {str(e)}")
            return self._get_error_response(user_id, symptoms_input)
    
    def _extract_symptoms(self, symptoms_input: str) -> List[str]:
        """Extract symptoms from natural language input"""
        # Use ML models for symptom extraction
        predictions = self.ml_models.predict_symptoms(symptoms_input)
        
        if predictions:
            return [pred['symptom'] for pred in predictions]
        else:
            # Fallback to keyword extraction
            return self._keyword_extraction(symptoms_input)
    
    def _keyword_extraction(self, text: str) -> List[str]:
        """Fallback keyword-based symptom extraction"""
        text = text.lower()
        symptoms = []
        
        symptom_keywords = {
            'fever': ['fever', 'बुखार', 'temperature', 'hot', 'chills'],
            'headache': ['headache', 'सिरदर्द', 'head pain', 'migraine'],
            'cough': ['cough', 'खांसी', 'coughing'],
            'chest_pain': ['chest pain', 'छाती में दर्द', 'chest hurt', 'heart pain'],
            'difficulty_breathing': ['breathing', 'सांस', 'breath', 'shortness', 'dyspnea'],
            'stomach_pain': ['stomach', 'पेट', 'abdominal', 'belly', 'gastric'],
            'vomiting': ['vomit', 'उल्टी', 'nausea', 'sick', 'throw up'],
            'diarrhea': ['diarrhea', 'दस्त', 'loose motions', 'loose stool'],
            'fatigue': ['tired', 'कमजोरी', 'weakness', 'exhausted', 'fatigue'],
            'sore_throat': ['throat', 'गले', 'swallow', 'throat pain'],
            'dizziness': ['dizzy', 'चक्कर', 'vertigo', 'lightheaded'],
            'rash': ['rash', 'skin', 'itching', 'red spots'],
            'joint_pain': ['joint', 'arthritis', 'joint pain', 'stiffness'],
            'back_pain': ['back pain', 'spine', 'lower back'],
            'muscle_pain': ['muscle', 'body ache', 'muscle pain']
        }
        
        for symptom, keywords in symptom_keywords.items():
            if any(keyword in text for keyword in keywords):
                symptoms.append(symptom)
        
        return symptoms
    
    def _detect_diseases(self, symptoms: List[str], user_info: Dict) -> List[Dict]:
        """Detect potential diseases based on symptom patterns"""
        disease_predictions = []
        
        for disease_name, disease_info in self.disease_patterns.items():
            confidence = self._calculate_disease_confidence(
                symptoms, disease_info, user_info
            )
            
            if confidence >= disease_info["confidence_threshold"]:
                disease_predictions.append({
                    "disease": disease_name,
                    "confidence": round(confidence, 3),
                    "matching_symptoms": self._get_matching_symptoms(symptoms, disease_info["symptoms"]),
                    "risk_factors_present": self._get_matching_risk_factors(user_info, disease_info["risk_factors"]),
                    "urgency": disease_info["urgency"],
                    "description": self._get_disease_description(disease_name)
                })
        
        # Sort by confidence
        disease_predictions.sort(key=lambda x: x["confidence"], reverse=True)
        
        return disease_predictions[:5]  # Return top 5 predictions
    
    def _calculate_disease_confidence(self, symptoms: List[str], disease_info: Dict, user_info: Dict) -> float:
        """Calculate confidence score for disease prediction"""
        disease_symptoms = disease_info["symptoms"]
        risk_factors = disease_info["risk_factors"]
        
        # Symptom matching score
        matching_symptoms = len(set(symptoms) & set(disease_symptoms))
        symptom_score = matching_symptoms / len(disease_symptoms) if disease_symptoms else 0
        
        # Risk factor score
        risk_factor_score = 0
        if risk_factors:
            matching_factors = self._count_matching_risk_factors(user_info, risk_factors)
            risk_factor_score = matching_factors / len(risk_factors)
        
        # Combined confidence (weighted)
        confidence = (symptom_score * 0.7) + (risk_factor_score * 0.3)
        
        # Bonus for exact symptom matches
        if matching_symptoms >= len(disease_symptoms) * 0.8:
            confidence += 0.1
        
        return min(1.0, confidence)
    
    def _get_matching_symptoms(self, user_symptoms: List[str], disease_symptoms: List[str]) -> List[str]:
        """Get symptoms that match between user and disease"""
        return list(set(user_symptoms) & set(disease_symptoms))
    
    def _get_matching_risk_factors(self, user_info: Dict, risk_factors: List[str]) -> List[str]:
        """Get risk factors that match user profile"""
        matching = []
        
        age = user_info.get('age', 30)
        gender = user_info.get('gender', 'unknown')
        chronic_conditions = user_info.get('chronic_conditions', [])
        
        for factor in risk_factors:
            if factor.startswith('age>') and age > int(factor[4:]):
                matching.append(factor)
            elif factor.startswith('age<') and age < int(factor[4:]):
                matching.append(factor)
            elif factor == 'male' and gender == 'male':
                matching.append(factor)
            elif factor == 'female' and gender == 'female':
                matching.append(factor)
            elif factor in chronic_conditions:
                matching.append(factor)
        
        return matching
    
    def _count_matching_risk_factors(self, user_info: Dict, risk_factors: List[str]) -> int:
        """Count matching risk factors"""
        return len(self._get_matching_risk_factors(user_info, risk_factors))
    
    def _get_disease_description(self, disease_name: str) -> str:
        """Get human-readable disease description"""
        descriptions = {
            "myocardial_infarction": "Heart attack - blockage of blood flow to heart muscle",
            "angina": "Chest pain due to reduced blood flow to heart",
            "pneumonia": "Infection that inflames air sacs in lungs",
            "asthma_attack": "Severe narrowing of airways causing breathing difficulty",
            "stroke": "Interruption of blood supply to brain",
            "meningitis": "Inflammation of protective membranes covering brain and spinal cord",
            "appendicitis": "Inflammation of appendix requiring surgical removal",
            "gastroenteritis": "Inflammation of stomach and intestines",
            "malaria": "Mosquito-borne infectious disease",
            "dengue": "Mosquito-borne viral infection",
            "covid19": "Coronavirus disease causing respiratory symptoms",
            "common_cold": "Viral infection of upper respiratory tract",
            "migraine": "Severe headache with nausea and light sensitivity",
            "urinary_tract_infection": "Infection in urinary system"
        }
        
        return descriptions.get(disease_name, f"Medical condition: {disease_name}")
    
    def _generate_comprehensive_recommendations(self, ml_analysis: Dict, 
                                              disease_predictions: List[Dict], 
                                              routing_response: Dict) -> List[str]:
        """Generate comprehensive recommendations"""
        recommendations = []
        
        # Add ML-based recommendations
        risk_level = ml_analysis.get("risk_level", "green")
        
        if risk_level == "red":
            recommendations.extend([
                "🚨 URGENT: Seek immediate medical attention",
                "Call emergency services (108) if symptoms worsen",
                "Do not delay treatment"
            ])
        elif risk_level == "amber":
            recommendations.extend([
                "⚠️ Important: Consult healthcare provider soon",
                "Monitor symptoms closely",
                "Follow medication suggestions carefully"
            ])
        else:
            recommendations.extend([
                "ℹ️ Monitor symptoms and follow home care advice",
                "Contact ASHA worker if symptoms persist",
                "Maintain good hygiene and rest"
            ])
        
        # Add disease-specific recommendations
        if disease_predictions:
            top_disease = disease_predictions[0]
            disease_name = top_disease["disease"]
            
            disease_recommendations = {
                "myocardial_infarction": ["Chew aspirin if available", "Sit upright", "Stay calm"],
                "stroke": ["Note time of symptom onset", "Do not give food/water", "Keep patient calm"],
                "pneumonia": ["Rest and hydration", "Avoid cold exposure", "Complete antibiotic course"],
                "asthma_attack": ["Use inhaler if available", "Sit upright", "Stay calm"],
                "malaria": ["Prevent mosquito bites", "Complete antimalarial course", "Stay hydrated"],
                "dengue": ["Increase fluid intake", "Avoid aspirin", "Monitor for bleeding"],
                "common_cold": ["Rest and fluids", "Warm salt water gargling", "Avoid cold foods"]
            }
            
            if disease_name in disease_recommendations:
                recommendations.extend(disease_recommendations[disease_name])
        
        # Add routing-specific recommendations
        routing_level = routing_response["routing"]["level"]
        recommendations.append(f"📍 Recommended care level: {routing_level}")
        
        return recommendations
    
    def _get_error_response(self, user_id: str, symptoms_input: str) -> Dict:
        """Error response when analysis fails"""
        return {
            "user_id": user_id,
            "input_symptoms": symptoms_input,
            "error": "Analysis failed",
            "recommendations": [
                "Consult healthcare provider",
                "Monitor symptoms closely",
                "Seek medical attention if symptoms worsen"
            ],
            "healthcare_routing": {
                "level": "PHC",
                "urgency": "urgent",
                "instructions": ["Visit nearest healthcare facility"]
            }
        }

def main():
    """Test the enhanced symptom analyzer"""
    analyzer = EnhancedSymptomAnalyzer()
    
    # Test case 1: Emergency symptoms
    print("🚨 Testing Emergency Symptoms:")
    result1 = analyzer.comprehensive_analysis(
        user_id="test_user_001",
        symptoms_input="I have severe chest pain, difficulty breathing, and sweating",
        user_info={"age": 55, "gender": "male", "chronic_conditions": ["diabetes"]}
    )
    
    print(f"Disease Predictions: {len(result1['disease_predictions'])}")
    if result1['disease_predictions']:
        top_disease = result1['disease_predictions'][0]
        print(f"Top Disease: {top_disease['disease']} (Confidence: {top_disease['confidence']:.2f})")
    
    print(f"Healthcare Level: {result1['healthcare_routing']['level']}")
    print(f"Medications: {len(result1['medication_suggestions']['safe_medicines'])}")
    print()
    
    # Test case 2: Common condition
    print("ℹ️ Testing Common Condition:")
    result2 = analyzer.comprehensive_analysis(
        user_id="test_user_002",
        symptoms_input="मुझे बुखार और सिरदर्द है",  # Hindi: I have fever and headache
        user_info={"age": 25, "gender": "female"}
    )
    
    print(f"Extracted Symptoms: {result2['extracted_symptoms']}")
    print(f"Healthcare Level: {result2['healthcare_routing']['level']}")
    print(f"Recommendations: {len(result2['recommendations'])}")

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    main()