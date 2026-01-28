const express = require('express');
const router = express.Router();
const axios = require('axios');

// Mock symptom data for offline capability
const mockSymptoms = {
    fever: { severity: 'medium', category: 'general' },
    cough: { severity: 'low', category: 'respiratory' },
    headache: { severity: 'low', category: 'neurological' },
    chest_pain: { severity: 'high', category: 'cardiac' },
    difficulty_breathing: { severity: 'high', category: 'respiratory' },
    stomach_pain: { severity: 'medium', category: 'gastrointestinal' }
};

// Process symptom input (voice/text/image)
router.post('/analyze', async (req, res) => {
    try {
        const {
            symptoms,
            inputType, // 'voice', 'text', 'image'
            language = 'en',
            patientAge,
            patientGender,
            location
        } = req.body;

        // Call AI engine for analysis
        let aiResponse;
        try {
            aiResponse = await axios.post(`${process.env.AI_ENGINE_URL}/analyze`, {
                symptoms,
                inputType,
                language,
                patientAge,
                patientGender
            });
        } catch (aiError) {
            // Fallback to rule-based analysis if AI engine is down
            console.log('AI engine unavailable, using fallback logic');
            aiResponse = { data: fallbackAnalysis(symptoms) };
        }

        const analysis = aiResponse.data;

        // Log for analytics (anonymized)
        console.log(`Symptom analysis: ${analysis.riskLevel} risk detected`);

        res.json({
            success: true,
            analysis: {
                riskLevel: analysis.riskLevel, // 'green', 'amber', 'red'
                riskScore: analysis.riskScore, // 0-100
                explanation: analysis.explanation,
                recommendations: analysis.recommendations,
                nextSteps: analysis.nextSteps,
                urgency: analysis.urgency,
                estimatedWaitTime: analysis.estimatedWaitTime
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Symptom analysis error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to analyze symptoms',
            fallback: true
        });
    }
});

// Fallback rule-based analysis
function fallbackAnalysis(symptoms) {
    const highRiskSymptoms = ['chest_pain', 'difficulty_breathing', 'severe_bleeding'];
    const mediumRiskSymptoms = ['fever', 'persistent_cough', 'severe_headache'];

    const hasHighRisk = symptoms.some(s => highRiskSymptoms.includes(s.toLowerCase()));
    const hasMediumRisk = symptoms.some(s => mediumRiskSymptoms.includes(s.toLowerCase()));

    if (hasHighRisk) {
        return {
            riskLevel: 'red',
            riskScore: 85,
            explanation: 'आपके लक्षण गंभीर हो सकते हैं। तुरंत चिकित्सा सहायता लें।',
            recommendations: ['तुरंत नजदीकी PHC जाएं', 'एम्बुलेंस बुलाएं'],
            nextSteps: ['emergency_care'],
            urgency: 'immediate',
            estimatedWaitTime: '0 minutes'
        };
    } else if (hasMediumRisk) {
        return {
            riskLevel: 'amber',
            riskScore: 60,
            explanation: 'आपके लक्षणों पर ध्यान देने की जरूरत है। ASHA कार्यकर्ता से मिलें।',
            recommendations: ['ASHA कार्यकर्ता से संपर्क करें', 'आराम करें और पानी पिएं'],
            nextSteps: ['asha_visit', 'monitor'],
            urgency: 'moderate',
            estimatedWaitTime: '2-4 hours'
        };
    } else {
        return {
            riskLevel: 'green',
            riskScore: 25,
            explanation: 'आपके लक्षण सामान्य लगते हैं। घरेलू उपचार करें।',
            recommendations: ['आराम करें', 'पर्याप्त पानी पिएं', 'स्वस्थ भोजन लें'],
            nextSteps: ['home_care', 'monitor'],
            urgency: 'low',
            estimatedWaitTime: 'self-care'
        };
    }
}

// Get symptom history
router.get('/history/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // Mock history data
        const history = [
            {
                id: 1,
                date: '2024-01-20',
                symptoms: ['fever', 'cough'],
                riskLevel: 'amber',
                outcome: 'asha_visit'
            }
        ];

        res.json({ success: true, history });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;