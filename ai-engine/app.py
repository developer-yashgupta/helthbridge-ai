from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import logging
from datetime import datetime
import numpy as np

# Import AI modules
from symptom_analyzer import SymptomAnalyzer
from multilingual_processor import MultilingualProcessor
from triage_engine import TriageEngine
from offline_models import OfflineModels

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize AI components
symptom_analyzer = SymptomAnalyzer()
multilingual_processor = MultilingualProcessor()
triage_engine = TriageEngine()
offline_models = OfflineModels()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'HealthBridge AI Engine',
        'timestamp': datetime.now().isoformat(),
        'models_loaded': offline_models.is_ready()
    })

@app.route('/analyze', methods=['POST'])
def analyze_symptoms():
    """Main symptom analysis endpoint"""
    try:
        data = request.get_json()
        
        symptoms = data.get('symptoms', [])
        input_type = data.get('inputType', 'text')
        language = data.get('language', 'en')
        patient_age = data.get('patientAge', 30)
        patient_gender = data.get('patientGender', 'unknown')
        
        logger.info(f"Analyzing symptoms: {symptoms}, language: {language}")
        
        # Process based on input type
        if input_type == 'voice':
            # Convert voice to text (mock implementation)
            processed_symptoms = multilingual_processor.process_voice(symptoms, language)
        elif input_type == 'image':
            # Analyze image for skin conditions
            processed_symptoms = symptom_analyzer.analyze_image(symptoms)
        else:
            # Process text symptoms
            processed_symptoms = multilingual_processor.process_text(symptoms, language)
        
        # Analyze symptoms
        analysis = symptom_analyzer.analyze(
            processed_symptoms, 
            patient_age, 
            patient_gender
        )
        
        # Generate triage decision
        triage_result = triage_engine.make_decision(analysis, patient_age)
        
        # Translate response to user's language
        response = multilingual_processor.translate_response(triage_result, language)
        
        return jsonify({
            'success': True,
            'riskLevel': response['riskLevel'],
            'riskScore': response['riskScore'],
            'explanation': response['explanation'],
            'recommendations': response['recommendations'],
            'nextSteps': response['nextSteps'],
            'urgency': response['urgency'],
            'estimatedWaitTime': response['estimatedWaitTime'],
            'confidence': response.get('confidence', 0.85)
        })
        
    except Exception as e:
        logger.error(f"Analysis error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Analysis failed',
            'fallback': True
        }), 500

@app.route('/voice-to-text', methods=['POST'])
def voice_to_text():
    """Convert voice input to text"""
    try:
        # Mock voice processing
        audio_data = request.files.get('audio')
        language = request.form.get('language', 'hi')
        
        # In real implementation, use speech recognition
        mock_text = "मुझे बुखार और सिरदर्द है"
        
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
        
        # Mock image analysis
        analysis = {
            'condition': 'skin_rash',
            'confidence': 0.78,
            'severity': 'mild',
            'recommendations': [
                'Keep the area clean and dry',
                'Apply prescribed ointment',
                'Consult doctor if worsens'
            ]
        }
        
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
            'symptom_analyzer': True,
            'multilingual_processor': True,
            'triage_engine': True,
            'offline_models': offline_models.is_ready(),
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
    
    logger.info(f"Starting HealthBridge AI Engine on port {port}")
    app.run(host='0.0.0.0', port=port, debug=debug)