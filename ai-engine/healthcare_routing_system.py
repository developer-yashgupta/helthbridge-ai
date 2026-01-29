import logging
import json
import os
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
import numpy as np
from dataclasses import dataclass
from enum import Enum

logger = logging.getLogger(__name__)

class HealthcareLevel(Enum):
    """Healthcare system levels in rural India"""
    ASHA = "asha_worker"
    PHC = "primary_health_centre" 
    CHC = "community_health_centre"
    DISTRICT_HOSPITAL = "district_hospital"
    MEDICAL_COLLEGE = "medical_college"

class UrgencyLevel(Enum):
    """Medical urgency levels"""
    ROUTINE = "routine"
    URGENT = "urgent"
    EMERGENCY = "emergency"
    CRITICAL = "critical"

@dataclass
class UserMedicalHistory:
    """User's medical history structure"""
    user_id: str
    chronic_conditions: List[str]
    allergies: List[str]
    current_medications: List[str]
    previous_symptoms: List[Dict]
    family_history: List[str]
    age: int
    gender: str
    location: Dict
    last_consultation: Optional[datetime] = None

@dataclass
class HealthcareFacility:
    """Healthcare facility information"""
    facility_id: str
    name: str
    level: HealthcareLevel
    location: Dict
    services: List[str]
    capacity: int
    current_load: int
    contact_info: Dict
    available_medicines: List[str]
    specialist_doctors: List[str]

class HealthcareRoutingSystem:
    """Advanced healthcare routing system with user history and medication suggestions"""
    
    def __init__(self):
        self.facilities_db = {}
        self.user_histories = {}
        self.medication_database = self._load_medication_database()
        self.routing_rules = self._initialize_routing_rules()
        self.notification_system = NotificationSystem()
        
        # Load healthcare facilities
        self._initialize_healthcare_facilities()
        
        logger.info("Healthcare routing system initialized")
    
    def _load_medication_database(self) -> Dict:
        """Load safe medication database for basic conditions"""
        return {
            # Common cold and flu
            "common_cold": {
                "safe_medicines": [
                    {"name": "Paracetamol", "dosage": "500mg", "frequency": "3 times daily", "duration": "3-5 days"},
                    {"name": "Cetirizine", "dosage": "10mg", "frequency": "Once daily", "duration": "3-5 days"},
                    {"name": "Honey", "dosage": "1 tsp", "frequency": "3 times daily", "duration": "As needed"}
                ],
                "home_remedies": [
                    "Warm salt water gargling",
                    "Steam inhalation",
                    "Ginger tea with honey",
                    "Adequate rest and hydration"
                ]
            },
            
            # Fever
            "fever": {
                "safe_medicines": [
                    {"name": "Paracetamol", "dosage": "500mg", "frequency": "Every 6 hours", "duration": "Until fever subsides"},
                    {"name": "ORS", "dosage": "1 packet in 1L water", "frequency": "As needed", "duration": "During fever"}
                ],
                "home_remedies": [
                    "Cold compress on forehead",
                    "Plenty of fluids",
                    "Light clothing",
                    "Rest in cool environment"
                ]
            },
            
            # Headache
            "headache": {
                "safe_medicines": [
                    {"name": "Paracetamol", "dosage": "500mg", "frequency": "Every 6 hours", "duration": "As needed"},
                    {"name": "Aspirin", "dosage": "300mg", "frequency": "Every 6 hours", "duration": "As needed"}
                ],
                "home_remedies": [
                    "Rest in dark, quiet room",
                    "Cold or warm compress",
                    "Adequate hydration",
                    "Gentle head massage"
                ]
            },
            
            # Stomach problems
            "stomach_pain": {
                "safe_medicines": [
                    {"name": "ORS", "dosage": "1 packet in 1L water", "frequency": "Small sips", "duration": "Until better"},
                    {"name": "Antacid", "dosage": "1 tablet", "frequency": "After meals", "duration": "2-3 days"}
                ],
                "home_remedies": [
                    "BRAT diet (Banana, Rice, Apple, Toast)",
                    "Ginger tea",
                    "Avoid spicy foods",
                    "Small frequent meals"
                ]
            },
            
            # Cough
            "cough": {
                "safe_medicines": [
                    {"name": "Honey", "dosage": "1 tsp", "frequency": "3 times daily", "duration": "As needed"},
                    {"name": "Cough syrup (Dextromethorphan)", "dosage": "10ml", "frequency": "3 times daily", "duration": "5-7 days"}
                ],
                "home_remedies": [
                    "Warm water with honey and lemon",
                    "Steam inhalation",
                    "Avoid cold drinks",
                    "Throat lozenges"
                ]
            },
            
            # Skin conditions
            "skin_rash": {
                "safe_medicines": [
                    {"name": "Calamine lotion", "dosage": "Apply thin layer", "frequency": "2-3 times daily", "duration": "Until healed"},
                    {"name": "Antihistamine (Cetirizine)", "dosage": "10mg", "frequency": "Once daily", "duration": "5-7 days"}
                ],
                "home_remedies": [
                    "Keep area clean and dry",
                    "Avoid scratching",
                    "Cool compress",
                    "Loose cotton clothing"
                ]
            }
        }
    
    def _initialize_routing_rules(self) -> Dict:
        """Initialize healthcare routing rules based on symptoms and severity"""
        return {
            "emergency_conditions": [
                "chest_pain", "difficulty_breathing", "unconsciousness", 
                "severe_bleeding", "stroke_symptoms", "heart_attack",
                "severe_burns", "poisoning", "severe_trauma"
            ],
            
            "phc_conditions": [
                "high_fever", "persistent_vomiting", "severe_headache",
                "abdominal_pain", "breathing_difficulty", "seizure",
                "severe_diarrhea", "wound_infection"
            ],
            
            "asha_conditions": [
                "mild_fever", "common_cold", "minor_cuts", "headache",
                "body_ache", "mild_cough", "skin_rash", "minor_stomach_upset"
            ],
            
            "age_escalation": {
                "infant": {"age_range": (0, 2), "escalation_factor": 2},
                "elderly": {"age_range": (65, 120), "escalation_factor": 1.5},
                "pregnant": {"condition": "pregnancy", "escalation_factor": 1.8}
            },
            
            "chronic_condition_escalation": {
                "diabetes": 1.3,
                "hypertension": 1.2,
                "heart_disease": 1.5,
                "asthma": 1.4,
                "kidney_disease": 1.3
            }
        }
    
    def _initialize_healthcare_facilities(self):
        """Initialize healthcare facilities database"""
        # Sample facilities - in production, load from database
        facilities = [
            {
                "facility_id": "asha_001",
                "name": "ASHA Worker - Sunita Devi",
                "level": HealthcareLevel.ASHA,
                "location": {"village": "Rampur", "block": "Sohna", "district": "Gurugram"},
                "services": ["basic_care", "health_education", "immunization", "anc_care"],
                "capacity": 50,
                "current_load": 15,
                "contact_info": {"phone": "+91-9876543210", "whatsapp": "+91-9876543210"},
                "available_medicines": ["paracetamol", "ors", "iron_tablets", "folic_acid"],
                "specialist_doctors": []
            },
            {
                "facility_id": "phc_001", 
                "name": "Primary Health Centre - Rampur",
                "level": HealthcareLevel.PHC,
                "location": {"village": "Rampur", "block": "Sohna", "district": "Gurugram"},
                "services": ["general_medicine", "maternal_care", "child_care", "emergency_care"],
                "capacity": 100,
                "current_load": 45,
                "contact_info": {"phone": "+91-9876543211", "emergency": "108"},
                "available_medicines": ["antibiotics", "antacids", "cough_syrup", "antiseptics"],
                "specialist_doctors": ["general_physician", "anm"]
            },
            {
                "facility_id": "chc_001",
                "name": "Community Health Centre - Sohna", 
                "level": HealthcareLevel.CHC,
                "location": {"town": "Sohna", "district": "Gurugram"},
                "services": ["specialist_care", "surgery", "laboratory", "radiology", "emergency"],
                "capacity": 200,
                "current_load": 120,
                "contact_info": {"phone": "+91-9876543212", "emergency": "108"},
                "available_medicines": ["advanced_antibiotics", "cardiac_medicines", "insulin"],
                "specialist_doctors": ["physician", "surgeon", "gynecologist", "pediatrician"]
            }
        ]
        
        for facility in facilities:
            self.facilities_db[facility["facility_id"]] = HealthcareFacility(**facility)
    
    def analyze_with_history(self, user_id: str, current_symptoms: List[str], 
                           additional_info: Dict = None) -> Dict:
        """Analyze symptoms considering user's medical history"""
        try:
            # Get user's medical history
            user_history = self.user_histories.get(user_id)
            if not user_history:
                user_history = self._create_default_history(user_id, additional_info or {})
            
            # Analyze current symptoms with ML models
            from ml_models import MLModels
            ml_models = MLModels()
            
            base_analysis = ml_models.predict_risk(
                current_symptoms, 
                user_history.age, 
                user_history.gender,
                user_history.chronic_conditions
            )
            
            # Apply history-based adjustments
            adjusted_analysis = self._apply_history_adjustments(base_analysis, user_history, current_symptoms)
            
            # Determine healthcare routing
            routing_decision = self._determine_healthcare_routing(adjusted_analysis, user_history)
            
            # Get medication suggestions
            medication_suggestions = self._get_medication_suggestions(current_symptoms, user_history)
            
            # Update user history
            self._update_user_history(user_id, current_symptoms, adjusted_analysis)
            
            # Prepare comprehensive response
            response = {
                "user_id": user_id,
                "analysis": adjusted_analysis,
                "routing": routing_decision,
                "medications": medication_suggestions,
                "history_factors": self._get_history_factors(user_history),
                "follow_up": self._generate_follow_up_plan(adjusted_analysis, user_history),
                "timestamp": datetime.now().isoformat()
            }
            
            # Trigger notifications
            self._trigger_notifications(response)
            
            return response
            
        except Exception as e:
            logger.error(f"Error in history-based analysis: {str(e)}")
            return self._get_fallback_response(user_id, current_symptoms)
    
    def _create_default_history(self, user_id: str, info: Dict) -> UserMedicalHistory:
        """Create default medical history for new user"""
        history = UserMedicalHistory(
            user_id=user_id,
            chronic_conditions=info.get('chronic_conditions', []),
            allergies=info.get('allergies', []),
            current_medications=info.get('current_medications', []),
            previous_symptoms=[],
            family_history=info.get('family_history', []),
            age=info.get('age', 30),
            gender=info.get('gender', 'unknown'),
            location=info.get('location', {})
        )
        
        self.user_histories[user_id] = history
        return history
    
    def _apply_history_adjustments(self, base_analysis: Dict, history: UserMedicalHistory, 
                                 current_symptoms: List[str]) -> Dict:
        """Apply medical history adjustments to base analysis"""
        adjusted_analysis = base_analysis.copy()
        
        # Chronic condition adjustments
        for condition in history.chronic_conditions:
            if condition in self.routing_rules["chronic_condition_escalation"]:
                multiplier = self.routing_rules["chronic_condition_escalation"][condition]
                adjusted_analysis["risk_score"] = min(100, int(adjusted_analysis["risk_score"] * multiplier))
        
        # Age-based adjustments
        for age_group, config in self.routing_rules["age_escalation"].items():
            if age_group in ["infant", "elderly"]:
                age_range = config["age_range"]
                if age_range[0] <= history.age <= age_range[1]:
                    multiplier = config["escalation_factor"]
                    adjusted_analysis["risk_score"] = min(100, int(adjusted_analysis["risk_score"] * multiplier))
        
        # Previous symptom pattern analysis
        if self._has_recurring_pattern(history.previous_symptoms, current_symptoms):
            adjusted_analysis["risk_score"] = min(100, adjusted_analysis["risk_score"] + 10)
            adjusted_analysis["recurring_pattern"] = True
        
        # Medication interaction check
        if history.current_medications:
            interaction_risk = self._check_medication_interactions(current_symptoms, history.current_medications)
            if interaction_risk:
                adjusted_analysis["risk_score"] = min(100, adjusted_analysis["risk_score"] + 15)
                adjusted_analysis["medication_interaction_risk"] = interaction_risk
        
        # Update risk level based on adjusted score
        if adjusted_analysis["risk_score"] >= 80:
            adjusted_analysis["risk_level"] = "red"
        elif adjusted_analysis["risk_score"] >= 50:
            adjusted_analysis["risk_level"] = "amber"
        else:
            adjusted_analysis["risk_level"] = "green"
        
        return adjusted_analysis
    
    def _determine_healthcare_routing(self, analysis: Dict, history: UserMedicalHistory) -> Dict:
        """Determine appropriate healthcare facility routing"""
        symptoms = analysis.get("symptoms", [])
        risk_level = analysis.get("risk_level", "green")
        risk_score = analysis.get("risk_score", 30)
        
        # Emergency conditions - Direct to CHC/Hospital
        if any(symptom in self.routing_rules["emergency_conditions"] for symptom in symptoms):
            return self._route_to_emergency(analysis, history)
        
        # High risk or critical conditions
        if risk_level == "red" or risk_score >= 80:
            return self._route_to_chc(analysis, history)
        
        # Medium risk conditions - PHC
        if (risk_level == "amber" or risk_score >= 50 or 
            any(symptom in self.routing_rules["phc_conditions"] for symptom in symptoms)):
            return self._route_to_phc(analysis, history)
        
        # Low risk conditions - ASHA Worker
        return self._route_to_asha(analysis, history)
    
    def _route_to_emergency(self, analysis: Dict, history: UserMedicalHistory) -> Dict:
        """Route to emergency care (CHC/District Hospital)"""
        chc_facility = self._find_nearest_facility(HealthcareLevel.CHC, history.location)
        
        return {
            "level": "EMERGENCY",
            "facility": chc_facility,
            "urgency": UrgencyLevel.CRITICAL,
            "transport": "ambulance",
            "estimated_time": "IMMEDIATE",
            "instructions": [
                "Call 108 for ambulance immediately",
                "Do not delay - go to hospital now",
                "Bring all current medications",
                "Inform family members"
            ],
            "contact_numbers": ["108", chc_facility.contact_info.get("emergency", "108")]
        }
    
    def _route_to_chc(self, analysis: Dict, history: UserMedicalHistory) -> Dict:
        """Route to Community Health Centre"""
        chc_facility = self._find_nearest_facility(HealthcareLevel.CHC, history.location)
        
        return {
            "level": "CHC",
            "facility": chc_facility,
            "urgency": UrgencyLevel.URGENT,
            "transport": "private_vehicle",
            "estimated_time": "Within 2 hours",
            "instructions": [
                "Visit CHC within 2 hours",
                "Bring medical history and current medications",
                "May need specialist consultation",
                "Possible admission for observation"
            ],
            "contact_numbers": [chc_facility.contact_info.get("phone")]
        }
    
    def _route_to_phc(self, analysis: Dict, history: UserMedicalHistory) -> Dict:
        """Route to Primary Health Centre"""
        phc_facility = self._find_nearest_facility(HealthcareLevel.PHC, history.location)
        
        return {
            "level": "PHC", 
            "facility": phc_facility,
            "urgency": UrgencyLevel.URGENT,
            "transport": "any_available",
            "estimated_time": "Within 4 hours",
            "instructions": [
                "Visit PHC within 4 hours",
                "Bring previous medical records",
                "Doctor consultation recommended",
                "May need basic tests"
            ],
            "contact_numbers": [phc_facility.contact_info.get("phone")]
        }
    
    def _route_to_asha(self, analysis: Dict, history: UserMedicalHistory) -> Dict:
        """Route to ASHA Worker"""
        asha_facility = self._find_nearest_facility(HealthcareLevel.ASHA, history.location)
        
        return {
            "level": "ASHA",
            "facility": asha_facility,
            "urgency": UrgencyLevel.ROUTINE,
            "transport": "walking",
            "estimated_time": "Within 24 hours",
            "instructions": [
                "Contact ASHA worker for guidance",
                "Home care and monitoring",
                "Follow medication suggestions",
                "Return if symptoms worsen"
            ],
            "contact_numbers": [asha_facility.contact_info.get("phone"), asha_facility.contact_info.get("whatsapp")]
        }
    
    def _find_nearest_facility(self, level: HealthcareLevel, location: Dict) -> HealthcareFacility:
        """Find nearest facility of specified level"""
        # In production, implement actual distance calculation
        for facility in self.facilities_db.values():
            if facility.level == level:
                return facility
        
        # Fallback to any available facility
        return list(self.facilities_db.values())[0]
    
    def _get_medication_suggestions(self, symptoms: List[str], history: UserMedicalHistory) -> Dict:
        """Get safe medication suggestions based on symptoms and history"""
        suggestions = {
            "safe_medicines": [],
            "home_remedies": [],
            "warnings": [],
            "contraindications": []
        }
        
        # Check each symptom for medication suggestions
        for symptom in symptoms:
            symptom_lower = symptom.lower()
            
            # Find matching condition in medication database
            for condition, med_info in self.medication_database.items():
                if condition in symptom_lower or any(keyword in symptom_lower for keyword in condition.split('_')):
                    
                    # Check for allergies and contraindications
                    safe_meds = []
                    for med in med_info["safe_medicines"]:
                        if not self._has_contraindication(med["name"], history):
                            safe_meds.append(med)
                        else:
                            suggestions["contraindications"].append(f"Avoid {med['name']} due to allergy/interaction")
                    
                    suggestions["safe_medicines"].extend(safe_meds)
                    suggestions["home_remedies"].extend(med_info["home_remedies"])
        
        # Add general warnings
        suggestions["warnings"] = [
            "Consult healthcare provider before taking any medication",
            "Follow dosage instructions carefully", 
            "Stop medication if adverse reactions occur",
            "Keep medications away from children"
        ]
        
        # Age-specific warnings
        if history.age < 12:
            suggestions["warnings"].append("Pediatric dosing required - consult doctor")
        elif history.age > 65:
            suggestions["warnings"].append("Elderly patients may need dose adjustment")
        
        # Pregnancy warnings
        if "pregnancy" in history.chronic_conditions:
            suggestions["warnings"].append("Pregnancy - many medications not safe, consult doctor")
        
        return suggestions
    
    def _has_contraindication(self, medication: str, history: UserMedicalHistory) -> bool:
        """Check if medication has contraindications for user"""
        # Check allergies
        if medication.lower() in [allergy.lower() for allergy in history.allergies]:
            return True
        
        # Check drug interactions with current medications
        interactions = {
            "aspirin": ["warfarin", "heparin"],
            "paracetamol": ["warfarin"] if "liver_disease" in history.chronic_conditions else [],
        }
        
        if medication.lower() in interactions:
            for current_med in history.current_medications:
                if current_med.lower() in interactions[medication.lower()]:
                    return True
        
        return False
    
    def _has_recurring_pattern(self, previous_symptoms: List[Dict], current_symptoms: List[str]) -> bool:
        """Check if current symptoms match a recurring pattern"""
        if len(previous_symptoms) < 2:
            return False
        
        # Check last 3 episodes
        recent_episodes = previous_symptoms[-3:]
        
        for episode in recent_episodes:
            episode_symptoms = episode.get("symptoms", [])
            if len(set(current_symptoms) & set(episode_symptoms)) >= 2:
                return True
        
        return False
    
    def _check_medication_interactions(self, symptoms: List[str], current_medications: List[str]) -> List[str]:
        """Check for potential medication interactions"""
        interactions = []
        
        # Simple interaction checking
        if "chest_pain" in symptoms and any("blood_thinner" in med.lower() for med in current_medications):
            interactions.append("Blood thinners may increase bleeding risk")
        
        if "fever" in symptoms and any("steroid" in med.lower() for med in current_medications):
            interactions.append("Steroids may mask infection symptoms")
        
        return interactions
    
    def _get_history_factors(self, history: UserMedicalHistory) -> Dict:
        """Get factors from medical history that influenced the decision"""
        return {
            "age_factor": "high_risk" if history.age < 5 or history.age > 65 else "normal",
            "chronic_conditions": history.chronic_conditions,
            "current_medications": len(history.current_medications),
            "previous_episodes": len(history.previous_symptoms),
            "allergies": len(history.allergies)
        }
    
    def _generate_follow_up_plan(self, analysis: Dict, history: UserMedicalHistory) -> Dict:
        """Generate follow-up care plan"""
        risk_level = analysis.get("risk_level", "green")
        
        if risk_level == "red":
            return {
                "timeline": "Immediate follow-up required",
                "next_check": "Within 24 hours",
                "monitoring": "Continuous monitoring needed",
                "red_flags": ["Worsening symptoms", "New symptoms", "No improvement"]
            }
        elif risk_level == "amber":
            return {
                "timeline": "Follow-up in 2-3 days",
                "next_check": "Within 72 hours",
                "monitoring": "Daily symptom monitoring",
                "red_flags": ["High fever", "Difficulty breathing", "Severe pain"]
            }
        else:
            return {
                "timeline": "Follow-up in 1 week if no improvement",
                "next_check": "Within 7 days",
                "monitoring": "Self-monitoring at home",
                "red_flags": ["Symptoms worsen", "New symptoms appear", "No improvement in 3 days"]
            }
    
    def _update_user_history(self, user_id: str, symptoms: List[str], analysis: Dict):
        """Update user's medical history with current episode"""
        if user_id in self.user_histories:
            history = self.user_histories[user_id]
            
            episode = {
                "date": datetime.now().isoformat(),
                "symptoms": symptoms,
                "risk_score": analysis.get("risk_score", 0),
                "risk_level": analysis.get("risk_level", "green")
            }
            
            history.previous_symptoms.append(episode)
            history.last_consultation = datetime.now()
            
            # Keep only last 10 episodes
            if len(history.previous_symptoms) > 10:
                history.previous_symptoms = history.previous_symptoms[-10:]
    
    def _trigger_notifications(self, response: Dict):
        """Trigger level-by-level notifications"""
        routing = response.get("routing", {})
        level = routing.get("level", "ASHA")
        urgency = routing.get("urgency", UrgencyLevel.ROUTINE)
        
        # Prepare notification data
        notification_data = {
            "user_id": response["user_id"],
            "symptoms": response["analysis"].get("symptoms", []),
            "risk_level": response["analysis"].get("risk_level", "green"),
            "risk_score": response["analysis"].get("risk_score", 0),
            "routing_level": level,
            "urgency": urgency.value if isinstance(urgency, UrgencyLevel) else urgency,
            "facility": routing.get("facility"),
            "timestamp": response["timestamp"]
        }
        
        # Send notifications based on level and urgency
        self.notification_system.send_notifications(notification_data)
    
    def _get_fallback_response(self, user_id: str, symptoms: List[str]) -> Dict:
        """Fallback response when analysis fails"""
        return {
            "user_id": user_id,
            "analysis": {"risk_level": "amber", "risk_score": 50, "symptoms": symptoms},
            "routing": {
                "level": "PHC",
                "urgency": UrgencyLevel.URGENT,
                "instructions": ["Consult healthcare provider", "Monitor symptoms closely"]
            },
            "medications": {"warnings": ["Consult doctor before taking any medication"]},
            "error": "Analysis failed, using safe defaults"
        }

class NotificationSystem:
    """Level-by-level notification system"""
    
    def __init__(self):
        self.notification_channels = {
            "sms": True,
            "whatsapp": True, 
            "voice_call": True,
            "app_notification": True
        }
        
    def send_notifications(self, data: Dict):
        """Send notifications to appropriate levels"""
        level = data.get("routing_level", "ASHA")
        urgency = data.get("urgency", "routine")
        
        if urgency == "critical":
            self._send_emergency_notifications(data)
        elif urgency == "urgent":
            self._send_urgent_notifications(data)
        else:
            self._send_routine_notifications(data)
    
    def _send_emergency_notifications(self, data: Dict):
        """Send emergency notifications to all levels"""
        logger.info(f"🚨 EMERGENCY NOTIFICATION: User {data['user_id']} - Risk Score: {data['risk_score']}")
        
        # Notify all levels simultaneously
        notifications = [
            "📱 SMS to patient and family",
            "🚑 Ambulance service (108)",
            "🏥 CHC emergency department", 
            "👨‍⚕️ District medical officer",
            "📞 Voice call to emergency contacts"
        ]
        
        for notification in notifications:
            logger.info(f"   Sending: {notification}")
    
    def _send_urgent_notifications(self, data: Dict):
        """Send urgent notifications"""
        logger.info(f"⚠️ URGENT NOTIFICATION: User {data['user_id']} - Risk Score: {data['risk_score']}")
        
        notifications = [
            "📱 SMS to patient",
            "🏥 PHC/CHC notification",
            "👩‍⚕️ ASHA worker alert",
            "📞 WhatsApp message to family"
        ]
        
        for notification in notifications:
            logger.info(f"   Sending: {notification}")
    
    def _send_routine_notifications(self, data: Dict):
        """Send routine notifications"""
        logger.info(f"ℹ️ ROUTINE NOTIFICATION: User {data['user_id']} - Risk Score: {data['risk_score']}")
        
        notifications = [
            "📱 App notification to patient",
            "👩‍⚕️ ASHA worker notification",
            "📝 Health record update"
        ]
        
        for notification in notifications:
            logger.info(f"   Sending: {notification}")

def main():
    """Test the healthcare routing system"""
    routing_system = HealthcareRoutingSystem()
    
    # Test case 1: Emergency condition
    print("🚨 Testing Emergency Condition:")
    response1 = routing_system.analyze_with_history(
        user_id="user_001",
        current_symptoms=["chest_pain", "difficulty_breathing", "sweating"],
        additional_info={"age": 55, "gender": "male", "chronic_conditions": ["diabetes"]}
    )
    print(f"Routing Level: {response1['routing']['level']}")
    print(f"Urgency: {response1['routing']['urgency']}")
    print()
    
    # Test case 2: Routine condition
    print("ℹ️ Testing Routine Condition:")
    response2 = routing_system.analyze_with_history(
        user_id="user_002", 
        current_symptoms=["mild_fever", "headache"],
        additional_info={"age": 30, "gender": "female"}
    )
    print(f"Routing Level: {response2['routing']['level']}")
    print(f"Medications: {len(response2['medications']['safe_medicines'])} suggested")
    print()

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    main()