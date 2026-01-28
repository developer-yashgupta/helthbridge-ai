const express = require('express');
const router = express.Router();
const { verifyToken } = require('./auth');

// Mock teleconsultation data
const mockConsultations = new Map();
const mockDoctors = [
  {
    id: 'doc_001',
    name: 'Dr. Rajesh Kumar',
    specialization: 'General Medicine',
    experience: '15 years',
    rating: 4.8,
    languages: ['Hindi', 'English'],
    availability: 'available',
    consultationFee: 200
  },
  {
    id: 'doc_002',
    name: 'Dr. Priya Sharma',
    specialization: 'Pediatrics',
    experience: '12 years',
    rating: 4.9,
    languages: ['Hindi', 'English'],
    availability: 'busy',
    consultationFee: 250
  }
];

// Get available doctors
router.get('/doctors', verifyToken, async (req, res) => {
  try {
    const { specialization, language } = req.query;
    
    let doctors = [...mockDoctors];
    
    if (specialization) {
      doctors = doctors.filter(d => 
        d.specialization.toLowerCase().includes(specialization.toLowerCase())
      );
    }
    
    if (language) {
      doctors = doctors.filter(d => 
        d.languages.some(lang => lang.toLowerCase() === language.toLowerCase())
      );
    }

    res.json({ success: true, doctors });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Book teleconsultation
router.post('/book', verifyToken, async (req, res) => {
  try {
    const {
      doctorId,
      patientInfo,
      symptoms,
      preferredTime,
      urgency = 'normal',
      language = 'hi'
    } = req.body;

    const doctor = mockDoctors.find(d => d.id === doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: 'Doctor not found'
      });
    }

    const consultation = {
      id: `consult_${Date.now()}`,
      doctorId,
      patientId: req.user.userId,
      patientInfo,
      symptoms,
      preferredTime,
      urgency,
      language,
      status: 'scheduled',
      scheduledTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min from now
      meetingLink: `https://meet.esanjeevani.in/room/${Date.now()}`,
      consultationFee: doctor.consultationFee,
      createdAt: new Date().toISOString()
    };

    mockConsultations.set(consultation.id, consultation);

    // Mock SMS notification
    console.log(`Teleconsultation booked: ${consultation.id}`);

    res.json({
      success: true,
      consultation: {
        id: consultation.id,
        doctorName: doctor.name,
        scheduledTime: consultation.scheduledTime,
        meetingLink: consultation.meetingLink,
        consultationFee: consultation.consultationFee,
        instructions: 'कृपया निर्धारित समय पर मीटिंग लिंक पर क्लिक करें'
      }
    });

  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to book consultation'
    });
  }
});

// Get consultation details
router.get('/consultations/:consultationId', verifyToken, async (req, res) => {
  try {
    const { consultationId } = req.params;
    const consultation = mockConsultations.get(consultationId);
    
    if (!consultation) {
      return res.status(404).json({
        success: false,
        error: 'Consultation not found'
      });
    }

    const doctor = mockDoctors.find(d => d.id === consultation.doctorId);

    res.json({
      success: true,
      consultation: {
        ...consultation,
        doctorInfo: doctor
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user's consultations
router.get('/my-consultations', verifyToken, async (req, res) => {
  try {
    const userConsultations = Array.from(mockConsultations.values())
      .filter(c => c.patientId === req.user.userId)
      .map(c => {
        const doctor = mockDoctors.find(d => d.id === c.doctorId);
        return {
          id: c.id,
          doctorName: doctor?.name,
          specialization: doctor?.specialization,
          scheduledTime: c.scheduledTime,
          status: c.status,
          meetingLink: c.meetingLink
        };
      });

    res.json({ success: true, consultations: userConsultations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Complete consultation with prescription
router.post('/consultations/:consultationId/complete', verifyToken, async (req, res) => {
  try {
    const { consultationId } = req.params;
    const {
      diagnosis,
      prescription,
      followUpInstructions,
      nextAppointment
    } = req.body;

    const consultation = mockConsultations.get(consultationId);
    if (!consultation) {
      return res.status(404).json({
        success: false,
        error: 'Consultation not found'
      });
    }

    // Update consultation
    consultation.status = 'completed';
    consultation.diagnosis = diagnosis;
    consultation.prescription = prescription;
    consultation.followUpInstructions = followUpInstructions;
    consultation.nextAppointment = nextAppointment;
    consultation.completedAt = new Date().toISOString();

    mockConsultations.set(consultationId, consultation);

    // Generate digital prescription
    const digitalPrescription = {
      id: `rx_${Date.now()}`,
      consultationId,
      patientName: consultation.patientInfo.name,
      doctorName: mockDoctors.find(d => d.id === consultation.doctorId)?.name,
      diagnosis,
      medications: prescription,
      instructions: followUpInstructions,
      issuedAt: new Date().toISOString(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
    };

    res.json({
      success: true,
      consultation,
      prescription: digitalPrescription,
      message: 'Consultation completed successfully'
    });

  } catch (error) {
    console.error('Consultation completion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete consultation'
    });
  }
});

// Get teleconsultation statistics
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const stats = {
      totalConsultations: 450,
      completedToday: 12,
      avgWaitTime: '8 minutes',
      patientSatisfaction: '4.6/5',
      doctorsOnline: 15,
      specializations: [
        'General Medicine',
        'Pediatrics',
        'Gynecology',
        'Dermatology'
      ]
    };

    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;