import logging
from typing import List, Dict, Any
import re

logger = logging.getLogger(__name__)

class MultilingualProcessor:
    """Multilingual text processing for symptom analysis"""
    
    def __init__(self):
        # Translation dictionaries for common symptoms
        self.translations = {
            'hi_to_en': {
                'बुखार': 'fever',
                'सिरदर्द': 'headache',
                'खांसी': 'cough',
                'सांस लेने में तकलीफ': 'difficulty_breathing',
                'छाती में दर्द': 'chest_pain',
                'पेट दर्द': 'stomach_pain',
                'उल्टी': 'vomiting',
                'दस्त': 'diarrhea',
                'कमजोरी': 'fatigue',
                'गले में खराश': 'sore_throat',
                'बदन दर्द': 'body_ache',
                'चक्कर आना': 'dizziness',
                'नाक बहना': 'runny_nose',
                'तेज बुखार': 'high_fever',
                'सांस फूलना': 'shortness_of_breath'
            },
            'en_to_hi': {
                'fever': 'बुखार',
                'headache': 'सिरदर्द',
                'cough': 'खांसी',
                'difficulty_breathing': 'सांस लेने में तकलीफ',
                'chest_pain': 'छाती में दर्द',
                'stomach_pain': 'पेट दर्द',
                'vomiting': 'उल्टी',
                'diarrhea': 'दस्त',
                'fatigue': 'कमजोरी',
                'sore_throat': 'गले में खराश',
                'body_ache': 'बदन दर्द',
                'dizziness': 'चक्कर आना',
                'runny_nose': 'नाक बहना',
                'high_fever': 'तेज बुखार',
                'shortness_of_breath': 'सांस फूलना'
            }
        }
        
        # Language detection patterns
        self.language_patterns = {
            'hi': re.compile(r'[\u0900-\u097F]'),  # Devanagari script
            'en': re.compile(r'[a-zA-Z]'),
            'ta': re.compile(r'[\u0B80-\u0BFF]'),  # Tamil script
            'te': re.compile(r'[\u0C00-\u0C7F]'),  # Telugu script
        }
        
        logger.info("Multilingual processor initialized")
    
    def detect_language(self, text: str) -> str:
        """Detect the language of input text"""
        if not text:
            return 'en'
        
        # Count characters for each language
        language_scores = {}
        
        for lang, pattern in self.language_patterns.items():
            matches = pattern.findall(text)
            language_scores[lang] = len(matches)
        
        # Return language with highest score
        detected_lang = max(language_scores, key=language_scores.get)
        
        # Default to English if no clear winner
        if language_scores[detected_lang] == 0:
            return 'en'
        
        return detected_lang
    
    def process_text(self, symptoms: List[str], language: str = 'en') -> List[str]:
        """Process text symptoms and normalize to English"""
        processed_symptoms = []
        
        for symptom in symptoms:
            if isinstance(symptom, str):
                # Detect language if not specified
                if language == 'auto':
                    detected_lang = self.detect_language(symptom)
                else:
                    detected_lang = language
                
                # Translate to English if needed
                if detected_lang == 'hi':
                    translated = self.translate_symptom_hi_to_en(symptom)
                    processed_symptoms.append(translated)
                else:
                    # Normalize English symptoms
                    normalized = self.normalize_english_symptom(symptom)
                    processed_symptoms.append(normalized)
            else:
                processed_symptoms.append(str(symptom))
        
        return processed_symptoms
    
    def translate_symptom_hi_to_en(self, symptom: str) -> str:
        """Translate Hindi symptom to English"""
        symptom = symptom.strip().lower()
        
        # Direct translation lookup
        if symptom in self.translations['hi_to_en']:
            return self.translations['hi_to_en'][symptom]
        
        # Partial matching for compound symptoms
        for hindi_term, english_term in self.translations['hi_to_en'].items():
            if hindi_term in symptom:
                return english_term
        
        # If no translation found, return original
        logger.warning(f"No translation found for Hindi symptom: {symptom}")
        return symptom
    
    def normalize_english_symptom(self, symptom: str) -> str:
        """Normalize English symptom terms"""
        symptom = symptom.strip().lower()
        
        # Common variations mapping
        normalizations = {
            'temperature': 'fever',
            'hot': 'fever',
            'chills': 'fever',
            'head pain': 'headache',
            'migraine': 'headache',
            'coughing': 'cough',
            'chest hurt': 'chest_pain',
            'breathing problem': 'difficulty_breathing',
            'shortness of breath': 'difficulty_breathing',
            'stomach ache': 'stomach_pain',
            'belly pain': 'stomach_pain',
            'abdominal pain': 'stomach_pain',
            'throw up': 'vomiting',
            'nausea': 'vomiting',
            'loose motions': 'diarrhea',
            'tired': 'fatigue',
            'weakness': 'fatigue',
            'exhausted': 'fatigue',
            'throat pain': 'sore_throat',
            'swallowing pain': 'sore_throat'
        }
        
        # Apply normalizations
        for variation, normalized in normalizations.items():
            if variation in symptom:
                return normalized
        
        # Replace spaces with underscores for consistency
        return symptom.replace(' ', '_')
    
    def process_voice(self, audio_data: Any, language: str = 'hi') -> List[str]:
        """Process voice input (mock implementation)"""
        # Mock voice-to-text conversion
        mock_transcriptions = {
            'hi': ['मुझे बुखार और सिरदर्द है', 'पेट में दर्द हो रहा है', 'खांसी आ रही है'],
            'en': ['I have fever and headache', 'stomach pain', 'coughing']
        }
        
        # Return mock transcription
        transcription = mock_transcriptions.get(language, ['fever', 'headache'])[0]
        
        # Extract symptoms from transcription
        symptoms = self.extract_symptoms_from_text(transcription, language)
        
        return symptoms
    
    def extract_symptoms_from_text(self, text: str, language: str = 'en') -> List[str]:
        """Extract symptoms from free text"""
        symptoms = []
        text = text.lower()
        
        if language == 'hi':
            # Hindi symptom extraction
            for hindi_term, english_term in self.translations['hi_to_en'].items():
                if hindi_term in text:
                    symptoms.append(english_term)
        else:
            # English symptom extraction
            symptom_keywords = [
                'fever', 'headache', 'cough', 'chest_pain', 'difficulty_breathing',
                'stomach_pain', 'vomiting', 'diarrhea', 'fatigue', 'sore_throat',
                'body_ache', 'dizziness', 'runny_nose'
            ]
            
            for keyword in symptom_keywords:
                if keyword.replace('_', ' ') in text or keyword in text:
                    symptoms.append(keyword)
        
        return list(set(symptoms))  # Remove duplicates
    
    def translate(self, text: str, source_lang: str, target_lang: str) -> str:
        """Translate text between languages"""
        if source_lang == target_lang:
            return text
        
        # Simple word-by-word translation for symptoms
        if source_lang == 'hi' and target_lang == 'en':
            for hindi_word, english_word in self.translations['hi_to_en'].items():
                text = text.replace(hindi_word, english_word)
        elif source_lang == 'en' and target_lang == 'hi':
            for english_word, hindi_word in self.translations['en_to_hi'].items():
                text = text.replace(english_word, hindi_word)
        
        return text
    
    def translate_response(self, response: Dict, target_language: str) -> Dict:
        """Translate analysis response to target language"""
        if target_language == 'en':
            return response
        
        translated_response = response.copy()
        
        # Translate recommendations
        if 'recommendations' in response:
            translated_recommendations = []
            for rec in response['recommendations']:
                translated_rec = self.translate_recommendation(rec, target_language)
                translated_recommendations.append(translated_rec)
            translated_response['recommendations'] = translated_recommendations
        
        # Translate explanation
        if 'explanation' in response:
            translated_response['explanation'] = self.translate_explanation(
                response['explanation'], target_language
            )
        
        # Translate next steps
        if 'nextSteps' in response:
            translated_steps = []
            for step in response['nextSteps']:
                translated_step = self.translate_recommendation(step, target_language)
                translated_steps.append(translated_step)
            translated_response['nextSteps'] = translated_steps
        
        return translated_response
    
    def translate_recommendation(self, recommendation: str, target_language: str) -> str:
        """Translate a single recommendation"""
        if target_language == 'hi':
            # Simple translation mapping for common recommendations
            translations = {
                'Seek immediate medical attention': 'तुरंत चिकित्सा सहायता लें',
                'Call ambulance': 'एम्बुलेंस बुलाएं',
                'Go to nearest hospital': 'नजदीकी अस्पताल जाएं',
                'Contact ASHA worker': 'आशा कार्यकर्ता से संपर्क करें',
                'Visit PHC for checkup': 'जांच के लिए PHC जाएं',
                'Rest and stay hydrated': 'आराम करें और पानी पिएं',
                'Take prescribed medications': 'निर्धारित दवाएं लें',
                'Monitor symptoms closely': 'लक्षणों पर नजर रखें'
            }
            
            return translations.get(recommendation, recommendation)
        
        return recommendation
    
    def translate_explanation(self, explanation: str, target_language: str) -> str:
        """Translate explanation text"""
        if target_language == 'hi':
            # Basic explanation translations
            translations = {
                'high risk': 'उच्च जोखिम',
                'medium risk': 'मध्यम जोखिम',
                'low risk': 'कम जोखिम',
                'symptoms': 'लक्षण',
                'require immediate attention': 'तुरंत ध्यान देने की आवश्यकता है',
                'should be monitored': 'निगरानी की जानी चाहिए'
            }
            
            translated = explanation
            for english, hindi in translations.items():
                translated = translated.replace(english, hindi)
            
            return translated
        
        return explanation
    
    def get_supported_languages(self) -> List[str]:
        """Get list of supported languages"""
        return ['en', 'hi', 'ta', 'te']
    
    def get_language_info(self) -> Dict:
        """Get information about language support"""
        return {
            'supported_languages': self.get_supported_languages(),
            'primary_languages': ['en', 'hi'],
            'translation_pairs': len(self.translations['hi_to_en']),
            'features': [
                'symptom_translation',
                'language_detection',
                'response_translation',
                'voice_processing'
            ]
        }