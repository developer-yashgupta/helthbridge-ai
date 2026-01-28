const express = require('express');
const router = express.Router();

// Triage decision engine
router.post('/decide', async (req, res) => {
  try {
    const {
      symptoms,
      riskScore,
      patientAge,
      patientGender,
      medicalHistory = [],
      location,
      vitalSigns = {}
    } = req.body;

    const decision = calculateTriageDecision({
      symptoms,
      riskScore,
      patientAge,
      patientGender,
      medicalHistory,
      vitalSigns
    });

    res.json({
      success: true,
      decision: {
        action: decision.action, // 'home_care', 'asha_visit', 'phc_referral', 'emergency'
        priority: decision.priority, // 'low', 'medium', 'high', 'critical'
        reasoning: decision.reasoning,
        timeframe: decision.timeframe,
        resources: decision.resources,
        followUp: decision.followUp
      }
    });

  } catch (error) {
    console.error('Triage decision error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to make triage decision'
    });
  }
});

function calculateTriageDecision(data) {
  const { symptoms, riskScore, patientAge, medicalHistory, vitalSigns } = data;

  // Age-based risk adjustment
  let adjustedRisk = riskScore;
  if (patientAge > 65 || patientAge < 5) {
    adjustedRisk += 15;
  }

  // Medical history risk factors
  const highRiskConditions = ['diabetes', 'hypertension', 'heart_disease', 'asthma'];
  if (medicalHistory.some(condition => highRiskConditions.includes(condition))) {
    adjustedRisk += 20;
  }

  // Vital signs assessment
  if (vitalSigns.temperature > 102 || vitalSigns.heartRate > 120) {
    adjustedRisk += 10;
  }

  // Decision logic
  if (adjustedRisk >= 80) {
    return {
      action: 'emergency',
      priority: 'critical',
      reasoning: 'गंभीर स्थिति - तुरंत अस्पताल जाना आवश्यक है',
      timeframe: 'immediate',
      resources: ['ambulance', 'emergency_contact'],
      followUp: 'hospital_admission'
    };
  } else if (adjustedRisk >= 60) {
    return {
      action: 'phc_referral',
      priority: 'high',
      reasoning: 'डॉक्टर की जांच आवश्यक है - PHC जाएं',
      timeframe: 'within_4_hours',
      resources: ['phc_appointment', 'transport'],
      followUp: 'doctor_consultation'
    };
  } else if (adjustedRisk >= 40) {
    return {
      action: 'asha_visit',
      priority: 'medium',
      reasoning: 'ASHA कार्यकर्ता से मिलकर सलाह लें',
      timeframe: 'within_24_hours',
      resources: ['asha_contact', 'basic_medicines'],
      followUp: 'asha_monitoring'
    };
  } else {
    return {
      action: 'home_care',
      priority: 'low',
      reasoning: 'घरेलू उपचार करें और स्थिति पर नजर रखें',
      timeframe: 'monitor_48_hours',
      resources: ['home_remedies', 'health_tips'],
      followUp: 'self_monitoring'
    };
  }
}

// Get triage statistics
router.get('/stats', async (req, res) => {
  try {
    // Mock statistics
    const stats = {
      totalCases: 1250,
      homeCare: 650,
      ashaVisits: 400,
      phcReferrals: 150,
      emergencies: 50,
      avgResponseTime: '3.2 minutes',
      accuracyRate: '94%'
    };

    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;