import logging
from typing import Dict, List, Any
from datetime import datetime, timedelta
import random

logger = logging.getLogger(__name__)

class TriageEngine:
    """Intelligent triage decision engine for healthcare routing"""
    
    def __init__(self):
        # Triage decision rules
        self.triage_rules = {
            'red': {
                'urgency': 'emergency',
                'max_wait_time_minutes': 0,
                'recommended_facility': 'hospital',
                'transport': 'ambulance',
                'priority': 1
            },
            'amber': {
                'urgency': 'urgent',
                'max_wait_time_minutes': 60,
                'recommended_facility': 'phc',
                'transport': 'self',
                'priority': 2
            },
            'green': {
                'urgency': 'routine',
                'max_wait_time_minutes': 240,
                'recommended_facility': 'home_care',
                'transport': 'self',
                'priority': 3
            }
        }
        
        # Facility capacity simulation
        self.facility_status = {
            'hospital': {'capacity': 0.7, 'wait_time': 30},
            'phc': {'capacity': 0.5, 'wait_time': 15},
            'chc': {'capacity': 0.6, 'wait_time': 20},
            'clinic': {'capacity': 0.3, 'wait_time': 10}
        }
        
        logger.info("Triage engine initialized")
    
    def make_decision(self, analysis_result: Dict, patient_age: int = 30) -> Dict:
        """Make triage decision based on analysis result"""
        try:
            risk_level = analysis_result.get('riskLevel', 'green')
            risk_score = analysis_result.get('riskScore', 30)
            symptoms = analysis_result.get('symptoms', [])
            
            # Get base triage decision
            base_decision = self.triage_rules[risk_level].copy()
            
            # Apply age-based adjustments
            age_adjusted_decision = self._apply_age_adjustments(base_decision, patient_age, risk_level)
            
            # Apply symptom-specific adjustments
            symptom_adjusted_decision = self._apply_symptom_adjustments(
                age_adjusted_decision, symptoms, risk_score
            )
            
            # Determine best facility and estimated wait time
            facility_recommendation = self._recommend_facility(
                symptom_adjusted_decision, risk_level, patient_age
            )
            
            # Generate specific recommendations
            recommendations = self._generate_triage_recommendations(
                symptom_adjusted_decision, symptoms, risk_level
            )
            
            # Generate next steps
            next_steps = self._generate_next_steps(
                symptom_adjusted_decision, risk_level, facility_recommendation
            )
            
            # Calculate estimated wait time
            estimated_wait = self._calculate_wait_time(
                facility_recommendation, risk_level, patient_age
            )
            
            return {
                'riskLevel': risk_level,
                'riskScore': risk_score,
                'urgency': symptom_adjusted_decision['urgency'],
                'priority': symptom_adjusted_decision['priority'],
                'recommendedFacility': facility_recommendation['facility_type'],
                'facilityName': facility_recommendation['facility_name'],
                'transportMode': symptom_adjusted_decision['transport'],
                'estimatedWaitTime': estimated_wait,
                'maxWaitTime': symptom_adjusted_decision['max_wait_time_minutes'],
                'recommendations': recommendations,
                'nextSteps': next_steps,
                'explanation': self._generate_explanation(risk_level, risk_score, symptoms),
                'confidence': analysis_result.get('confidence', 0.8),
                'triage_timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Triage decision error: {str(e)}")
            return self._default_triage_decision()
    
    def _apply_age_adjustments(self, decision: Dict, age: int, risk_level: str) -> Dict:
        """Apply age-based adjustments to triage decision"""
        adjusted_decision = decision.copy()
        
        # Infants and elderly get higher priority
        if age < 2:
            # Infants - always urgent
            if risk_level == 'green':
                adjusted_decision['urgency'] = 'urgent'
                adjusted_decision['priority'] = 2
                adjusted_decision['max_wait_time_minutes'] = 30
        elif age < 5:
            # Young children - elevated priority
            if risk_level == 'green':
                adjusted_decision['max_wait_time_minutes'] = 120
        elif age > 75:
            # Elderly - elevated priority
            if risk_level == 'green':
                adjusted_decision['urgency'] = 'urgent'
                adjusted_decision['priority'] = 2
                adjusted_decision['max_wait_time_minutes'] = 90
        elif age > 65:
            # Senior citizens - slightly elevated
            if risk_level == 'green':
                adjusted_decision['max_wait_time_minutes'] = 180
        
        return adjusted_decision
    
    def _apply_symptom_adjustments(self, decision: Dict, symptoms: List[str], risk_score: int) -> Dict:
        """Apply symptom-specific adjustments"""
        adjusted_decision = decision.copy()
        
        # Critical symptoms override risk level
        critical_symptoms = [
            'chest_pain', 'difficulty_breathing', 'severe_bleeding',
            'unconsciousness', 'stroke_symptoms'
        ]
        
        if any(symptom in critical_symptoms for symptom in symptoms):
            adjusted_decision['urgency'] = 'emergency'
            adjusted_decision['priority'] = 1
            adjusted_decision['transport'] = 'ambulance'
            adjusted_decision['recommended_facility'] = 'hospital'
            adjusted_decision['max_wait_time_minutes'] = 0
        
        # High fever in combination with other symptoms
        if 'high_fever' in symptoms and len(symptoms) > 1:
            if adjusted_decision['urgency'] == 'routine':
                adjusted_decision['urgency'] = 'urgent'
                adjusted_decision['priority'] = 2
        
        # Multiple symptoms increase urgency
        if len(symptoms) >= 3 and risk_score > 50:
            if adjusted_decision['urgency'] == 'routine':
                adjusted_decision['urgency'] = 'urgent'
                adjusted_decision['max_wait_time_minutes'] = min(
                    adjusted_decision['max_wait_time_minutes'], 120
                )
        
        return adjusted_decision
    
    def _recommend_facility(self, decision: Dict, risk_level: str, age: int) -> Dict:
        """Recommend the best healthcare facility"""
        facility_type = decision['recommended_facility']
        
        # Facility selection logic
        if facility_type == 'hospital' or decision['urgency'] == 'emergency':
            return {
                'facility_type': 'hospital',
                'facility_name': 'District Hospital',
                'distance_km': random.uniform(5, 15),
                'specialties': ['emergency', 'surgery', 'icu']
            }
        elif facility_type == 'phc' or decision['urgency'] == 'urgent':
            return {
                'facility_type': 'phc',
                'facility_name': 'Primary Health Centre',
                'distance_km': random.uniform(2, 8),
                'specialties': ['general_medicine', 'maternal_care', 'vaccination']
            }
        else:
            # Home care or ASHA visit
            return {
                'facility_type': 'home_care',
                'facility_name': 'ASHA Worker Visit',
                'distance_km': 0,
                'specialties': ['basic_care', 'health_education', 'referral']
            }
    
    def _generate_triage_recommendations(self, decision: Dict, symptoms: List[str], risk_level: str) -> List[str]:
        """Generate specific triage recommendations"""
        recommendations = []
        
        if decision['urgency'] == 'emergency':
            recommendations.extend([
                'Call emergency services (108) immediately',
                'Do not delay seeking medical attention',
                'Prepare patient for immediate transport',
                'Keep patient calm and monitor vital signs'
            ])
        elif decision['urgency'] == 'urgent':
            recommendations.extend([
                'Seek medical attention within 1 hour',
                'Contact nearest healthcare facility',
                'Monitor symptoms closely',
                'Prepare medical history and current medications'
            ])
        else:
            recommendations.extend([
                'Schedule appointment with healthcare provider',
                'Continue home care measures',
                'Monitor symptoms for any changes',
                'Contact ASHA worker for guidance'
            ])
        
        # Symptom-specific recommendations
        if 'fever' in symptoms:
            recommendations.append('Keep patient hydrated and cool')
        
        if 'vomiting' in symptoms or 'diarrhea' in symptoms:
            recommendations.append('Maintain fluid balance and electrolytes')
        
        if 'chest_pain' in symptoms:
            recommendations.append('Keep patient at rest, avoid physical exertion')
        
        return recommendations
    
    def _generate_next_steps(self, decision: Dict, risk_level: str, facility: Dict) -> List[str]:
        """Generate next steps for patient care"""
        next_steps = []
        
        if decision['urgency'] == 'emergency':
            next_steps.extend([
                'Immediate ambulance transport to hospital',
                'Emergency department evaluation',
                'Possible admission for treatment',
                'Family notification and support'
            ])
        elif decision['urgency'] == 'urgent':
            next_steps.extend([
                f"Visit {facility['facility_name']} within 1 hour",
                'Clinical examination by healthcare provider',
                'Possible diagnostic tests',
                'Treatment plan development'
            ])
        else:
            next_steps.extend([
                'ASHA worker consultation',
                'Home-based care instructions',
                'Follow-up in 24-48 hours',
                'Return if symptoms worsen'
            ])
        
        return next_steps
    
    def _calculate_wait_time(self, facility: Dict, risk_level: str, age: int) -> int:
        """Calculate estimated wait time at facility"""
        base_wait_time = self.facility_status.get(
            facility['facility_type'], {'wait_time': 20}
        )['wait_time']
        
        # Adjust for risk level
        if risk_level == 'red':
            return 0  # Immediate attention
        elif risk_level == 'amber':
            return max(5, base_wait_time // 2)  # Priority queue
        else:
            # Adjust for age
            if age < 5 or age > 65:
                return int(base_wait_time * 0.8)
            else:
                return base_wait_time
    
    def _generate_explanation(self, risk_level: str, risk_score: int, symptoms: List[str]) -> str:
        """Generate explanation for triage decision"""
        explanations = {
            'red': f"High risk condition (score: {risk_score}) requires immediate medical attention. Symptoms indicate potential emergency.",
            'amber': f"Moderate risk condition (score: {risk_score}) needs prompt medical evaluation. Symptoms require professional assessment.",
            'green': f"Low risk condition (score: {risk_score}) can be managed with basic care. Symptoms are generally mild."
        }
        
        base_explanation = explanations.get(risk_level, "Risk assessment completed.")
        
        if len(symptoms) > 2:
            base_explanation += f" Multiple symptoms ({len(symptoms)}) present require careful monitoring."
        
        return base_explanation
    
    def _default_triage_decision(self) -> Dict:
        """Default triage decision for error cases"""
        return {
            'riskLevel': 'amber',
            'riskScore': 50,
            'urgency': 'urgent',
            'priority': 2,
            'recommendedFacility': 'phc',
            'facilityName': 'Primary Health Centre',
            'transportMode': 'self',
            'estimatedWaitTime': 30,
            'maxWaitTime': 60,
            'recommendations': ['Seek medical evaluation', 'Monitor symptoms'],
            'nextSteps': ['Visit healthcare facility', 'Follow medical advice'],
            'explanation': 'Unable to complete full risk assessment. Recommend medical evaluation.',
            'confidence': 0.5,
            'triage_timestamp': datetime.now().isoformat()
        }
    
    def update_facility_status(self, facility_type: str, capacity: float, wait_time: int):
        """Update facility status for dynamic triage decisions"""
        if facility_type in self.facility_status:
            self.facility_status[facility_type] = {
                'capacity': capacity,
                'wait_time': wait_time
            }
            logger.info(f"Updated {facility_type} status: capacity={capacity}, wait_time={wait_time}")
    
    def get_facility_status(self) -> Dict:
        """Get current facility status"""
        return self.facility_status.copy()
    
    def get_triage_statistics(self) -> Dict:
        """Get triage engine statistics"""
        return {
            'total_rules': len(self.triage_rules),
            'facility_types': list(self.facility_status.keys()),
            'urgency_levels': ['emergency', 'urgent', 'routine'],
            'priority_levels': [1, 2, 3],
            'features': [
                'age_based_adjustment',
                'symptom_specific_routing',
                'facility_recommendation',
                'wait_time_estimation',
                'dynamic_prioritization'
            ]
        }