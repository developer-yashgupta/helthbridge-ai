const express = require('express');
const router = express.Router();

// Mock healthcare facility data
const mockFacilities = [
  {
    id: 'phc_001',
    name: 'Primary Health Centre Rampur',
    type: 'PHC',
    location: { lat: 28.6139, lng: 77.2090 },
    address: 'Village Rampur, Block Sohna, Gurugram',
    phone: '+91-9876543210',
    availability: 'open',
    services: ['general_medicine', 'maternal_care', 'vaccination'],
    distance: 2.5,
    estimatedTime: '15 minutes'
  },
  {
    id: 'chc_001',
    name: 'Community Health Centre Sohna',
    type: 'CHC',
    location: { lat: 28.2500, lng: 77.0667 },
    address: 'Sohna Road, Gurugram',
    phone: '+91-9876543211',
    availability: 'open',
    services: ['emergency', 'surgery', 'specialist_consultation'],
    distance: 8.2,
    estimatedTime: '25 minutes'
  }
];

const mockAshaWorkers = [
  {
    id: 'asha_001',
    name: 'Sunita Devi',
    phone: '+91-9876543212',
    location: { lat: 28.6100, lng: 77.2100 },
    coverage_area: 'Rampur Village',
    availability: 'available',
    experience: '5 years',
    languages: ['Hindi', 'Haryanvi'],
    distance: 0.8,
    estimatedTime: '10 minutes'
  }
];

// Find nearest healthcare resources
router.post('/find', async (req, res) => {
  try {
    const { 
      userLocation, 
      resourceType = 'all', // 'phc', 'chc', 'asha', 'all'
      urgency = 'normal',
      maxDistance = 50 // km
    } = req.body;

    let resources = [];

    if (resourceType === 'all' || resourceType === 'phc') {
      resources.push(...mockFacilities.filter(f => f.type === 'PHC'));
    }
    
    if (resourceType === 'all' || resourceType === 'chc') {
      resources.push(...mockFacilities.filter(f => f.type === 'CHC'));
    }
    
    if (resourceType === 'all' || resourceType === 'asha') {
      resources.push(...mockAshaWorkers.map(a => ({ ...a, type: 'ASHA' })));
    }

    // Sort by distance and availability
    resources.sort((a, b) => {
      if (urgency === 'emergency') {
        // Prioritize availability for emergencies
        if (a.availability === 'available' && b.availability !== 'available') return -1;
        if (b.availability === 'available' && a.availability !== 'available') return 1;
      }
      return a.distance - b.distance;
    });

    res.json({
      success: true,
      resources: resources.slice(0, 10), // Limit to 10 results
      userLocation,
      searchRadius: maxDistance
    });

  } catch (error) {
    console.error('Resource finder error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to find resources'
    });
  }
});

// Get resource availability
router.get('/availability/:resourceId', async (req, res) => {
  try {
    const { resourceId } = req.params;
    
    // Mock availability data
    const availability = {
      resourceId,
      status: 'available',
      nextAvailable: null,
      currentLoad: 'medium',
      estimatedWaitTime: '30 minutes',
      services: {
        consultation: 'available',
        emergency: 'available',
        pharmacy: 'limited'
      },
      lastUpdated: new Date().toISOString()
    };

    res.json({ success: true, availability });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Emergency ambulance request
router.post('/emergency/ambulance', async (req, res) => {
  try {
    const { 
      userLocation, 
      patientInfo, 
      emergencyType,
      contactNumber 
    } = req.body;

    // Mock ambulance dispatch
    const ambulanceRequest = {
      requestId: `AMB_${Date.now()}`,
      status: 'dispatched',
      estimatedArrival: '12 minutes',
      ambulanceNumber: 'HR-01-AB-1234',
      driverContact: '+91-9876543213',
      nearestHospital: 'CHC Sohna',
      trackingUrl: `https://track.healthbridge.ai/AMB_${Date.now()}`
    };

    // In real implementation, integrate with 108 service
    console.log(`Emergency ambulance requested for ${contactNumber}`);

    res.json({
      success: true,
      ambulance: ambulanceRequest,
      message: 'एम्बुलेंस भेजी जा रही है। कृपया शांत रहें।'
    });

  } catch (error) {
    console.error('Ambulance request error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to request ambulance'
    });
  }
});

// Get resource statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = {
      totalPHCs: 45,
      totalCHCs: 12,
      totalAshaWorkers: 180,
      averageDistance: '3.2 km',
      responseTime: '18 minutes',
      availability: {
        phc: '78%',
        chc: '92%',
        asha: '85%'
      }
    };

    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;