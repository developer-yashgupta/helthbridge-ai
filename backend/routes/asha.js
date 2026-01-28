const express = require('express');
const router = express.Router();
const { verifyToken } = require('./auth');

// Mock patient data for ASHA workers
const mockPatients = [
  {
    id: 'patient_001',
    name: 'राम कुमार',
    age: 45,
    gender: 'male',
    phone: '+91-9876543220',
    address: 'House No. 123, Rampur Village',
    riskLevel: 'amber',
    lastVisit: '2024-01-18',
    conditions: ['diabetes', 'hypertension'],
    nextFollowUp: '2024-01-25'
  },
  {
    id: 'patient_002',
    name: 'सुनीता देवी',
    age: 32,
    gender: 'female',
    phone: '+91-9876543221',
    address: 'House No. 456, Rampur Village',
    riskLevel: 'green',
    lastVisit: '2024-01-20',
    conditions: ['pregnancy_care'],
    nextFollowUp: '2024-02-01'
  }
];

// Get ASHA dashboard data
router.get('/dashboard', verifyToken, async (req, res) => {
  try {
    const dashboard = {
      totalPatients: mockPatients.length,
      highRiskPatients: mockPatients.filter(p => p.riskLevel === 'red').length,
      mediumRiskPatients: mockPatients.filter(p => p.riskLevel === 'amber').length,
      lowRiskPatients: mockPatients.filter(p => p.riskLevel === 'green').length,
      todayVisits: 3,
      pendingFollowUps: 5,
      recentAlerts: [
        {
          id: 'alert_001',
          patientName: 'राम कुमार',
          message: 'Blood sugar levels high - immediate attention needed',
          priority: 'high',
          timestamp: new Date().toISOString()
        }
      ],
      weeklyStats: {
        visitsCompleted: 18,
        referralsMade: 4,
        emergenciesHandled: 1
      }
    };

    res.json({ success: true, dashboard });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get patient list
router.get('/patients', verifyToken, async (req, res) => {
  try {
    const { riskLevel, sortBy = 'nextFollowUp' } = req.query;
    
    let patients = [...mockPatients];
    
    if (riskLevel) {
      patients = patients.filter(p => p.riskLevel === riskLevel);
    }

    // Sort patients
    patients.sort((a, b) => {
      if (sortBy === 'riskLevel') {
        const riskOrder = { red: 3, amber: 2, green: 1 };
        return riskOrder[b.riskLevel] - riskOrder[a.riskLevel];
      }
      return new Date(a.nextFollowUp) - new Date(b.nextFollowUp);
    });

    res.json({ success: true, patients });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get patient details
router.get('/patients/:patientId', verifyToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    const patient = mockPatients.find(p => p.id === patientId);
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient not found'
      });
    }

    // Mock detailed patient data
    const patientDetails = {
      ...patient,
      medicalHistory: [
        {
          date: '2024-01-18',
          symptoms: ['fever', 'headache'],
          diagnosis: 'Viral fever',
          treatment: 'Rest and paracetamol',
          followUp: 'Recovered'
        }
      ],
      vitals: {
        bloodPressure: '140/90',
        temperature: '98.6°F',
        weight: '70 kg',
        lastUpdated: '2024-01-20'
      },
      medications: [
        {
          name: 'Metformin',
          dosage: '500mg twice daily',
          duration: 'Ongoing'
        }
      ]
    };

    res.json({ success: true, patient: patientDetails });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Record patient visit
router.post('/visits', verifyToken, async (req, res) => {
  try {
    const {
      patientId,
      visitType, // 'routine', 'follow_up', 'emergency'
      symptoms,
      vitals,
      treatment,
      notes,
      nextFollowUp
    } = req.body;

    const visit = {
      id: `visit_${Date.now()}`,
      patientId,
      ashaId: req.user.userId,
      visitType,
      symptoms,
      vitals,
      treatment,
      notes,
      nextFollowUp,
      timestamp: new Date().toISOString()
    };

    // In real implementation, save to database
    console.log('Visit recorded:', visit);

    res.json({
      success: true,
      visit,
      message: 'Visit recorded successfully'
    });

  } catch (error) {
    console.error('Visit recording error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record visit'
    });
  }
});

// Create referral
router.post('/referrals', verifyToken, async (req, res) => {
  try {
    const {
      patientId,
      facilityId,
      urgency, // 'low', 'medium', 'high', 'emergency'
      reason,
      symptoms,
      notes
    } = req.body;

    const referral = {
      id: `ref_${Date.now()}`,
      patientId,
      ashaId: req.user.userId,
      facilityId,
      urgency,
      reason,
      symptoms,
      notes,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    // In real implementation, notify facility
    console.log('Referral created:', referral);

    res.json({
      success: true,
      referral,
      message: 'Referral created successfully'
    });

  } catch (error) {
    console.error('Referral creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create referral'
    });
  }
});

// Get ASHA performance metrics
router.get('/metrics', verifyToken, async (req, res) => {
  try {
    const metrics = {
      monthlyVisits: 45,
      patientsSaved: 12,
      referralAccuracy: '92%',
      responseTime: '15 minutes',
      patientSatisfaction: '4.7/5',
      badges: [
        { name: 'Life Saver', description: 'Prevented 10+ emergencies' },
        { name: 'Community Hero', description: '100+ successful visits' }
      ],
      points: 1250,
      rank: 3
    };

    res.json({ success: true, metrics });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;