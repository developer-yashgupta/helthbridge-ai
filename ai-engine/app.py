from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import logging
from datetime import datetime
import random

# Import enhanced AI modules
from enhanced_symptom_analyzer import EnhancedSymptomAnalyzer
from healthcare_routing_system import HealthcareRoutingSystem
from multilingual_processor import MultilingualProcessor
from triage_engine import TriageEngine
from offline_models import OfflineModels

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize enhanced AI components
enhanced_analyzer = EnhancedSymptomAnalyzer()
routing_system = HealthcareRoutingSystem()
multilingual_processor = MultilingualProcessor()
triage_engine = TriageEngine()
offline_models = OfflineModels()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'HealthBridge Enhanced AI Engine',
        'timestamp': datetime.now().isoformat(),
        'models_loaded': offline_models.is_ready(),
        'features': [
            'user_history_analysis',
            'disease_detection',
            'healthcare_routing',
            'medication_suggestions',
            'level_by_level_notifications'
        ]
    })

@app.route('/analyze', methods=['POST'])
def analyze_symptoms():
    """Enhanced symptom analysis with user history and routing"""
    try:
        data = request.get_json()
        
        # Extract request data
        user_id = data.get('userId', f"user_{datetime.now().timestamp()}")
        symptoms_input = data.get('symptoms', [])
        input_type = data.get('inputType', 'text')
        language = data.get('language', 'en')
        
        # User information
        user_info = {
            'age': data.get('patientAge', 30),
            'gender': data.get('patientGender', 'unknown'),
            'chronic_conditions': data.get('chronicConditions', []),
            'allergies': data.get('allergies', []),
            'current_medications': data.get('currentMedications', []),
            'location': data.get('location', {}),
            'family_history': data.get('familyHistory', [])
        }
        
        logger.info(f"Enhanced analysis for user {user_id}: {symptoms_input}")
        
        # Convert symptoms to text if it's a list
        if isinstance(symptoms_input, list):
            symptoms_text = ' '.join(symptoms_input)
        else:
            symptoms_text = str(symptoms_input)
        
        # Process based on input type
        if input_type == 'voice':
            # Convert voice to text (mock implementation)
            processed_text = multilingual_processor.process_voice(symptoms_text, language)
        elif input_type == 'image':
            # Analyze image for skin conditions
            image_analysis = enhanced_analyzer.ml_models.analyze_image(symptoms_text)
            symptoms_text = f"skin condition: {image_analysis.get('condition', 'unknown')}"
        else:
            # Process text symptoms with multilingual support
            if language != 'en':
                symptoms_text = multilingual_processor.translate(symptoms_text, language, 'en')
        
        # Comprehensive analysis with user history
        analysis_result = enhanced_analyzer.comprehensive_analysis(
            user_id=user_id,
            symptoms_input=symptoms_text,
            user_info=user_info
        )
        
        # Translate response back to user's language
        if language != 'en':
            analysis_result = multilingual_processor.translate_response(analysis_result, language)
        
        # Format response for API
        response = {
            'success': True,
            'userId': user_id,
            'riskLevel': analysis_result['ml_analysis']['risk_level'],
            'riskScore': analysis_result['ml_analysis']['risk_score'],
            'confidence': analysis_result['ml_analysis'].get('confidence', 0.8),
            
            # Disease predictions
            'diseasePredictions': analysis_result['disease_predictions'],
            
            # Healthcare routing
            'healthcareRouting': analysis_result['healthcare_routing'],
            
            # Medication suggestions
            'medicationSuggestions': analysis_result['medication_suggestions'],
            
            # Recommendations
            'recommendations': analysis_result['recommendations'],
            
            # Follow-up plan
            'followUpPlan': analysis_result['follow_up_plan'],
            
            # User history factors
            'historyFactors': analysis_result['history_factors'],
            
            # Analysis details
            'extractedSymptoms': analysis_result['extracted_symptoms'],
            'analysisMethod': 'enhanced_ml_with_history',
            'timestamp': analysis_result['timestamp']
        }
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Enhanced analysis error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Enhanced analysis failed',
            'fallback': True,
            'recommendations': ['Consult healthcare provider immediately']
        }), 500

@app.route('/user-history/<user_id>', methods=['GET'])
def get_user_history(user_id):
    """Get user's medical history"""
    try:
        history = routing_system.user_histories.get(user_id)
        
        if not history:
            return jsonify({
                'success': False,
                'error': 'User history not found'
            }), 404
        
        return jsonify({
            'success': True,
            'userId': user_id,
            'history': {
                'chronicConditions': history.chronic_conditions,
                'allergies': history.allergies,
                'currentMedications': history.current_medications,
                'previousSymptoms': history.previous_symptoms[-5:],  # Last 5 episodes
                'familyHistory': history.family_history,
                'age': history.age,
                'gender': history.gender,
                'lastConsultation': history.last_consultation.isoformat() if history.last_consultation else None
            }
        })
        
    except Exception as e:
        logger.error(f"User history error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to retrieve user history'
        }), 500

@app.route('/healthcare-facilities', methods=['GET'])
def get_healthcare_facilities():
    """Get available healthcare facilities"""
    try:
        location = request.args.get('location', '')
        facility_type = request.args.get('type', 'all')
        
        facilities = []
        for facility in routing_system.facilities_db.values():
            if facility_type == 'all' or facility.level.value == facility_type:
                facilities.append({
                    'facilityId': facility.facility_id,
                    'name': facility.name,
                    'level': facility.level.value,
                    'location': facility.location,
                    'services': facility.services,
                    'capacity': facility.capacity,
                    'currentLoad': facility.current_load,
                    'contactInfo': facility.contact_info,
                    'availableMedicines': facility.available_medicines,
                    'specialistDoctors': facility.specialist_doctors
                })
        
        return jsonify({
            'success': True,
            'facilities': facilities,
            'total': len(facilities)
        })
        
    except Exception as e:
        logger.error(f"Facilities error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to retrieve facilities'
        }), 500

@app.route('/medication-suggestions', methods=['POST'])
def get_medication_suggestions():
    """Get medication suggestions for specific symptoms"""
    try:
        data = request.get_json()
        symptoms = data.get('symptoms', [])
        user_id = data.get('userId')
        
        # Get user history for contraindication checking
        user_history = routing_system.user_histories.get(user_id)
        
        if not user_history:
            # Create temporary history
            user_history = routing_system._create_default_history(user_id, data.get('userInfo', {}))
        
        # Get medication suggestions
        suggestions = routing_system._get_medication_suggestions(symptoms, user_history)
        
        return jsonify({
            'success': True,
            'userId': user_id,
            'symptoms': symptoms,
            'medicationSuggestions': suggestions
        })
        
    except Exception as e:
        logger.error(f"Medication suggestions error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to get medication suggestions'
        }), 500

@app.route('/disease-detection', methods=['POST'])
def detect_diseases():
    """Detect potential diseases from symptoms"""
    try:
        data = request.get_json()
        symptoms = data.get('symptoms', [])
        user_info = data.get('userInfo', {})
        
        # Use enhanced analyzer for disease detection
        disease_predictions = enhanced_analyzer._detect_diseases(symptoms, user_info)
        
        return jsonify({
            'success': True,
            'symptoms': symptoms,
            'diseasePredictions': disease_predictions,
            'totalPredictions': len(disease_predictions)
        })
        
    except Exception as e:
        logger.error(f"Disease detection error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Disease detection failed'
        }), 500

@app.route('/emergency-alert', methods=['POST'])
def emergency_alert():
    """Trigger emergency alert and notifications"""
    try:
        data = request.get_json()
        user_id = data.get('userId')
        symptoms = data.get('symptoms', [])
        location = data.get('location', {})
        
        # Create emergency notification data
        notification_data = {
            'user_id': user_id,
            'symptoms': symptoms,
            'risk_level': 'red',
            'risk_score': 95,
            'routing_level': 'EMERGENCY',
            'urgency': 'critical',
            'location': location,
            'timestamp': datetime.now().isoformat()
        }
        
        # Send emergency notifications
        routing_system.notification_system.send_notifications(notification_data)
        
        return jsonify({
            'success': True,
            'message': 'Emergency alert sent',
            'userId': user_id,
            'alertLevel': 'CRITICAL',
            'timestamp': notification_data['timestamp']
        })
        
    except Exception as e:
        logger.error(f"Emergency alert error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to send emergency alert'
        }), 500

@app.route('/voice-to-text', methods=['POST'])
def voice_to_text():
    """Convert voice input to text"""
    try:
        # Mock voice processing
        audio_data = request.files.get('audio')
        language = request.form.get('language', 'hi')
        
        # In real implementation, use speech recognition
        mock_text = "मुझे बुखार और सिरदर्द है" if language == 'hi' else "I have fever and headache"
        
        return jsonify({
            'success': True,
            'text': mock_text,
            'language': language,
            'confidence': 0.92
        })
        
    except Exception as e:
        logger.error(f"Voice processing error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Voice processing failed'
        }), 500

@app.route('/image-analysis', methods=['POST'])
def analyze_image():
    """Analyze medical images (skin conditions, etc.)"""
    try:
        image_file = request.files.get('image')
        
        if not image_file:
            return jsonify({
                'success': False,
                'error': 'No image provided'
            }), 400
        
        # Use ML models for image analysis
        analysis = enhanced_analyzer.ml_models.analyze_image(image_file)
        
        return jsonify({
            'success': True,
            'analysis': analysis
        })
        
    except Exception as e:
        logger.error(f"Image analysis error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Image analysis failed'
        }), 500

@app.route('/translate', methods=['POST'])
def translate_text():
    """Translate text between languages"""
    try:
        data = request.get_json()
        text = data.get('text', '')
        source_lang = data.get('source', 'en')
        target_lang = data.get('target', 'hi')
        
        translated = multilingual_processor.translate(text, source_lang, target_lang)
        
        return jsonify({
            'success': True,
            'translated_text': translated,
            'source_language': source_lang,
            'target_language': target_lang
        })
        
    except Exception as e:
        logger.error(f"Translation error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Translation failed'
        }), 500

@app.route('/models/status', methods=['GET'])
def model_status():
    """Get status of AI models"""
    try:
        status = {
            'enhanced_symptom_analyzer': True,
            'healthcare_routing_system': True,
            'multilingual_processor': True,
            'triage_engine': True,
            'offline_models': offline_models.is_ready(),
            'disease_detection': True,
            'medication_suggestions': True,
            'user_history_tracking': True,
            'last_updated': datetime.now().isoformat()
        }
        
        return jsonify({
            'success': True,
            'models': status
        })
        
    except Exception as e:
        logger.error(f"Model status error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to get model status'
        }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('DEBUG', 'False').lower() == 'true'
    
    logger.info(f"Starting HealthBridge Enhanced AI Engine on port {port}")
    logger.info("Features: User History, Disease Detection, Healthcare Routing, Medication Suggestions")
    app.run(host='0.0.0.0', port=port, debug=debug)