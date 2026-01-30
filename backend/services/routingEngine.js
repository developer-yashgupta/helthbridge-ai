const { query } = require('../config/database');

/**
 * Routing Engine Service
 * Handles healthcare facility routing decisions based on symptom severity
 */
class RoutingEngine {
  constructor() {
    // Severity to facility mapping based on requirements
    this.severityMapping = {
      low: { range: [0, 40], facility: 'ASHA' },
      medium: { range: [41, 60], facility: 'PHC' },
      high: { range: [61, 80], facility: 'CHC' },
      critical: { range: [81, 100], facility: 'EMERGENCY' }
    };

    // Emergency keywords that trigger immediate routing
    this.emergencyKeywords = [
      'chest pain', 'difficulty breathing', 'unconscious', 'severe bleeding',
      'heart attack', 'stroke', 'seizure', 'severe injury', 'poisoning',
      'सीने में दर्द', 'सांस लेने में तकलीफ', 'बेहोशी', 'दिल का दौरा'
    ];

    // Risk factors that increase severity
    this.riskFactors = {
      diabetes: 5,
      hypertension: 5,
      heart_disease: 10,
      respiratory_disease: 8,
      kidney_disease: 7,
      cancer: 15,
      pregnancy: 10,
      elderly: 5 // age > 65
    };
  }

  /**
   * Main routing decision function
   * @param {Object} params - Routing parameters
   * @param {Array} params.symptoms - Array of symptom objects
   * @param {number} params.severityScore - Base severity score (0-100)
   * @param {Object} params.patientInfo - Patient demographics and medical history
   * @param {Object} params.location - Patient location {lat, lng}
   * @returns {Object} Routing decision with facility recommendation
   */
  async determineRouting(params) {
    try {
      const { symptoms, severityScore, patientInfo, location } = params;

      // Validate input parameters
      this._validateRoutingParams(params);

      // Adjust severity score based on risk factors
      const adjustedSeverity = this._adjustSeverityForRiskFactors(severityScore, patientInfo);

      // Check for emergency keywords
      const hasEmergencyKeywords = this._checkEmergencyKeywords(symptoms);
      
      // Determine facility type based on adjusted severity
      const facilityType = this._determineFacilityType(adjustedSeverity, hasEmergencyKeywords);

      // Generate reasoning text
      const reasoning = this._generateReasoningText(
        symptoms, 
        adjustedSeverity, 
        facilityType, 
        patientInfo,
        hasEmergencyKeywords
      );

      // Find nearest facility of the recommended type
      const facility = await this.findNearestFacility(facilityType, location);

      // Determine priority and timeframe
      const { priority, timeframe } = this._getPriorityAndTimeframe(adjustedSeverity, hasEmergencyKeywords);

      return {
        severityScore: adjustedSeverity,
        severityLevel: this._getSeverityLevel(adjustedSeverity),
        recommendedFacilityType: facilityType,
        facility: facility,
        reasoning: reasoning,
        hasEmergencyKeywords: hasEmergencyKeywords,
        riskFactorsApplied: this._getAppliedRiskFactors(patientInfo),
        priority: priority,
        timeframe: timeframe
      };

    } catch (error) {
      console.error('Error in routing decision:', error);
      throw new Error(`Routing decision failed: ${error.message}`);
    }
  }

  /**
   * Determine facility type based on severity score
   * @param {number} severityScore - Adjusted severity score
   * @param {boolean} hasEmergencyKeywords - Whether emergency keywords detected
   * @returns {string} Facility type (ASHA, PHC, CHC, EMERGENCY)
   */
  _determineFacilityType(severityScore, hasEmergencyKeywords) {
    // Emergency keywords override severity score
    if (hasEmergencyKeywords) {
      return 'EMERGENCY';
    }

    // Map severity score to facility type
    for (const [level, config] of Object.entries(this.severityMapping)) {
      const [min, max] = config.range;
      if (severityScore >= min && severityScore <= max) {
        return config.facility;
      }
    }

    // Default fallback
    return severityScore >= 81 ? 'EMERGENCY' : 'ASHA';
  }

  /**
   * Adjust severity score based on patient risk factors
   * @param {number} baseSeverity - Base severity score
   * @param {Object} patientInfo - Patient information
   * @returns {number} Adjusted severity score
   */
  _adjustSeverityForRiskFactors(baseSeverity, patientInfo) {
    let adjustedSeverity = baseSeverity;
    const { age, medicalHistory = [] } = patientInfo;

    // Age-based adjustment
    if (age && age > 65) {
      adjustedSeverity += this.riskFactors.elderly;
    }

    // Medical history adjustments
    medicalHistory.forEach(condition => {
      const riskAdjustment = this.riskFactors[condition.toLowerCase()];
      if (riskAdjustment) {
        adjustedSeverity += riskAdjustment;
      }
    });

    // Cap at 100
    return Math.min(adjustedSeverity, 100);
  }

  /**
   * Check if symptoms contain emergency keywords
   * @param {Array} symptoms - Array of symptom objects or strings
   * @returns {boolean} True if emergency keywords found
   */
  _checkEmergencyKeywords(symptoms) {
    const symptomText = symptoms
      .map(s => typeof s === 'string' ? s : s.description || s.name || '')
      .join(' ')
      .toLowerCase();

    return this.emergencyKeywords.some(keyword => 
      symptomText.includes(keyword.toLowerCase())
    );
  }

  /**
   * Generate human-readable reasoning for routing decision
   * @param {Array} symptoms - Patient symptoms
   * @param {number} severityScore - Adjusted severity score
   * @param {string} facilityType - Recommended facility type
   * @param {Object} patientInfo - Patient information
   * @param {boolean} hasEmergencyKeywords - Emergency keywords detected
   * @returns {string} Reasoning text
   */
  _generateReasoningText(symptoms, severityScore, facilityType, patientInfo, hasEmergencyKeywords) {
    const { age, medicalHistory = [] } = patientInfo;
    const severityLevel = this._getSeverityLevel(severityScore);
    
    let reasoning = `Based on your symptoms, the severity level is assessed as ${severityLevel} (score: ${severityScore}/100). `;

    // Emergency case
    if (hasEmergencyKeywords) {
      reasoning += "Emergency keywords detected in your symptoms, requiring immediate medical attention. ";
    }

    // Risk factors
    const appliedRiskFactors = this._getAppliedRiskFactors(patientInfo);
    if (appliedRiskFactors.length > 0) {
      reasoning += `Risk factors considered: ${appliedRiskFactors.join(', ')}. `;
    }

    // Facility recommendation
    switch (facilityType) {
      case 'ASHA':
        reasoning += "Your symptoms can be initially managed by an ASHA worker who can provide basic care and guidance.";
        break;
      case 'PHC':
        reasoning += "Your symptoms require attention from a Primary Health Centre where you can receive proper medical evaluation and treatment.";
        break;
      case 'CHC':
        reasoning += "Your symptoms indicate a need for specialized care at a Community Health Centre with advanced medical facilities.";
        break;
      case 'EMERGENCY':
        reasoning += "Your symptoms require immediate emergency medical attention. Please seek urgent care or call emergency services.";
        break;
    }

    return reasoning;
  }

  /**
   * Get severity level from score
   * @param {number} score - Severity score
   * @returns {string} Severity level
   */
  _getSeverityLevel(score) {
    if (score >= 81) return 'critical';
    if (score >= 61) return 'high';
    if (score >= 41) return 'medium';
    return 'low';
  }

  /**
   * Get applied risk factors for patient
   * @param {Object} patientInfo - Patient information
   * @returns {Array} Array of applied risk factor names
   */
  _getAppliedRiskFactors(patientInfo) {
    const { age, medicalHistory = [] } = patientInfo;
    const applied = [];

    if (age && age > 65) {
      applied.push('elderly (age > 65)');
    }

    medicalHistory.forEach(condition => {
      if (this.riskFactors[condition.toLowerCase()]) {
        applied.push(condition);
      }
    });

    return applied;
  }

  /**
   * Get priority and timeframe based on severity
   * @param {number} severityScore - Severity score
   * @param {boolean} hasEmergencyKeywords - Emergency keywords detected
   * @returns {Object} Priority and timeframe
   */
  _getPriorityAndTimeframe(severityScore, hasEmergencyKeywords) {
    if (hasEmergencyKeywords || severityScore >= 81) {
      return { priority: 'critical', timeframe: 'immediate' };
    } else if (severityScore >= 61) {
      return { priority: 'high', timeframe: '4-24 hours' };
    } else if (severityScore >= 41) {
      return { priority: 'medium', timeframe: '24-48 hours' };
    } else {
      return { priority: 'low', timeframe: '48 hours or as needed' };
    }
  }

  /**
   * Validate routing parameters
   * @param {Object} params - Routing parameters
   * @throws {Error} If validation fails
   */
  _validateRoutingParams(params) {
    const { symptoms, severityScore, patientInfo } = params;

    if (!Array.isArray(symptoms) || symptoms.length === 0) {
      throw new Error('Symptoms array is required and cannot be empty');
    }

    if (typeof severityScore !== 'number' || severityScore < 0 || severityScore > 100) {
      throw new Error('Severity score must be a number between 0 and 100');
    }

    if (!patientInfo || typeof patientInfo !== 'object') {
      throw new Error('Patient info is required');
    }

    // Location is optional - if not provided, we won't find specific facilities
  }

  /**
   * Find nearest healthcare facility by type and location
   * @param {string} facilityType - Type of facility (ASHA, PHC, CHC, EMERGENCY)
   * @param {Object} location - Location coordinates {lat, lng} (optional)
   * @returns {Object|null} Nearest facility information
   */
  async findNearestFacility(facilityType, location) {
    try {
      // If no location provided, return null (no specific facility)
      if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
        console.log('No valid location provided, skipping facility lookup');
        return null;
      }

      // Map facility types to resource types in database
      const resourceTypeMapping = {
        'ASHA': 'asha_worker',
        'PHC': 'primary_health_center',
        'CHC': 'community_health_center',
        'EMERGENCY': 'emergency_service'
      };

      const resourceType = resourceTypeMapping[facilityType];
      if (!resourceType) {
        throw new Error(`Invalid facility type: ${facilityType}`);
      }

      // Query for nearest facility using PostGIS distance calculation
      const queryText = `
        SELECT 
          id,
          name,
          resource_type,
          contact_info,
          location,
          availability_status,
          ST_Distance(
            ST_Point($1, $2)::geography,
            ST_Point((location->>'lng')::float, (location->>'lat')::float)::geography
          ) as distance_meters
        FROM healthcare_resources 
        WHERE resource_type = $3 
          AND availability_status = 'available'
          AND location IS NOT NULL
        ORDER BY distance_meters ASC
        LIMIT 1
      `;

      const result = await query(queryText, [location.lng, location.lat, resourceType]);

      if (result.rows.length === 0) {
        console.warn(`No available ${facilityType} facilities found near location:`, location);
        return null;
      }

      const facility = result.rows[0];
      
      return {
        id: facility.id,
        name: facility.name,
        type: facilityType,
        contactInfo: facility.contact_info,
        location: facility.location,
        availabilityStatus: facility.availability_status,
        distanceMeters: Math.round(facility.distance_meters),
        distanceKm: Math.round(facility.distance_meters / 1000 * 100) / 100
      };

    } catch (error) {
      console.error('Error finding nearest facility:', error);
      // Return null instead of throwing to allow graceful fallback
      return null;
    }
  }

  /**
   * Check facility availability status
   * @param {string} facilityId - Facility ID
   * @returns {Object} Availability information
   */
  async checkFacilityAvailability(facilityId) {
    try {
      const queryText = `
        SELECT 
          id,
          name,
          availability_status,
          capacity_info,
          operating_hours,
          last_updated
        FROM healthcare_resources 
        WHERE id = $1
      `;

      const result = await query(queryText, [facilityId]);

      if (result.rows.length === 0) {
        return { available: false, reason: 'Facility not found' };
      }

      const facility = result.rows[0];
      
      return {
        available: facility.availability_status === 'available',
        status: facility.availability_status,
        capacityInfo: facility.capacity_info,
        operatingHours: facility.operating_hours,
        lastUpdated: facility.last_updated
      };

    } catch (error) {
      console.error('Error checking facility availability:', error);
      return { available: false, reason: 'Error checking availability' };
    }
  }

  /**
   * Implement fallback logic when no facilities are available
   * @param {string} facilityType - Original facility type requested
   * @param {Object} location - Patient location
   * @returns {Object} Fallback facility or guidance
   */
  async getFallbackOptions(facilityType, location) {
    try {
      // Define fallback hierarchy
      const fallbackHierarchy = {
        'ASHA': ['PHC', 'CHC'],
        'PHC': ['CHC', 'ASHA'],
        'CHC': ['PHC', 'EMERGENCY'],
        'EMERGENCY': ['CHC', 'PHC']
      };

      const fallbackTypes = fallbackHierarchy[facilityType] || [];

      // Try each fallback option
      for (const fallbackType of fallbackTypes) {
        const facility = await this.findNearestFacility(fallbackType, location);
        if (facility) {
          return {
            facility,
            isFallback: true,
            originalType: facilityType,
            fallbackReason: `No ${facilityType} facilities available, recommending ${fallbackType}`
          };
        }
      }

      // If no facilities found, return general guidance
      return {
        facility: null,
        isFallback: true,
        originalType: facilityType,
        fallbackReason: 'No healthcare facilities available in your area',
        guidance: this._getGeneralGuidance(facilityType)
      };

    } catch (error) {
      console.error('Error getting fallback options:', error);
      return {
        facility: null,
        isFallback: true,
        originalType: facilityType,
        fallbackReason: 'Error finding alternative facilities',
        guidance: 'Please contact your local health authorities for assistance'
      };
    }
  }

  /**
   * Get general guidance when no facilities are available
   * @param {string} facilityType - Original facility type
   * @returns {string} General guidance text
   */
  _getGeneralGuidance(facilityType) {
    const guidance = {
      'ASHA': 'Contact your local ASHA worker directly or visit the nearest health center.',
      'PHC': 'Visit the nearest government health center or contact local health authorities.',
      'CHC': 'Seek care at the nearest hospital or specialized medical facility.',
      'EMERGENCY': 'Call emergency services immediately (108) or go to the nearest hospital emergency department.'
    };

    return guidance[facilityType] || 'Contact local health authorities for guidance.';
  }

  /**
   * Calculate priority score based on symptoms, age, and medical history
   * @param {Array} symptoms - Patient symptoms
   * @param {Object} patientInfo - Patient demographics and medical history
   * @param {number} severityScore - Base severity score
   * @returns {Object} Priority calculation result
   */
  calculatePriority(symptoms, patientInfo, severityScore) {
    try {
      const { age, gender, medicalHistory = [] } = patientInfo;
      
      let priorityScore = severityScore;
      const priorityFactors = [];

      // Age-based priority adjustments
      if (age) {
        if (age < 2) {
          priorityScore += 15;
          priorityFactors.push('infant (high priority)');
        } else if (age > 65) {
          priorityScore += 10;
          priorityFactors.push('elderly (age > 65)');
        } else if (age > 50) {
          priorityScore += 5;
          priorityFactors.push('middle-aged (age > 50)');
        }
      }

      // Gender-specific adjustments
      if (gender === 'female' && age >= 15 && age <= 45) {
        priorityScore += 3;
        priorityFactors.push('reproductive age female');
      }

      // Medical history risk adjustments
      const highRiskConditions = {
        'diabetes': 8,
        'hypertension': 6,
        'heart_disease': 12,
        'respiratory_disease': 10,
        'kidney_disease': 9,
        'cancer': 15,
        'pregnancy': 12,
        'immunocompromised': 10
      };

      medicalHistory.forEach(condition => {
        const riskScore = highRiskConditions[condition.toLowerCase()];
        if (riskScore) {
          priorityScore += riskScore;
          priorityFactors.push(`${condition} (high risk)`);
        }
      });

      // Symptom-specific priority adjustments
      const highPrioritySymptoms = {
        'chest pain': 15,
        'difficulty breathing': 12,
        'severe pain': 10,
        'bleeding': 8,
        'fever': 5,
        'vomiting': 4,
        'dizziness': 6,
        'unconsciousness': 20,
        'seizure': 18
      };

      symptoms.forEach(symptom => {
        const symptomText = (typeof symptom === 'string' ? symptom : symptom.description || symptom.name || '').toLowerCase();
        
        Object.entries(highPrioritySymptoms).forEach(([key, score]) => {
          if (symptomText.includes(key)) {
            priorityScore += score;
            priorityFactors.push(`${key} symptom`);
          }
        });
      });

      // Cap priority score at 100
      priorityScore = Math.min(priorityScore, 100);

      // Determine priority level
      const priorityLevel = this._getPriorityLevel(priorityScore);
      
      // Calculate timeframe recommendation
      const timeframe = this._calculateTimeframe(priorityScore, priorityFactors);

      return {
        priorityScore,
        priorityLevel,
        timeframe,
        priorityFactors,
        originalSeverity: severityScore,
        adjustment: priorityScore - severityScore
      };

    } catch (error) {
      console.error('Error calculating priority:', error);
      // Return safe defaults
      return {
        priorityScore: severityScore,
        priorityLevel: this._getPriorityLevel(severityScore),
        timeframe: 'within_24_hours',
        priorityFactors: [],
        originalSeverity: severityScore,
        adjustment: 0,
        error: error.message
      };
    }
  }

  /**
   * Get priority level from score
   * @param {number} score - Priority score
   * @returns {string} Priority level
   */
  _getPriorityLevel(score) {
    if (score >= 85) return 'critical';
    if (score >= 70) return 'high';
    if (score >= 50) return 'medium';
    return 'low';
  }

  /**
   * Calculate recommended timeframe for seeking care
   * @param {number} priorityScore - Calculated priority score
   * @param {Array} priorityFactors - Factors that influenced priority
   * @returns {string} Timeframe recommendation
   */
  _calculateTimeframe(priorityScore, priorityFactors) {
    // Check for immediate care indicators
    const immediateIndicators = [
      'unconsciousness',
      'seizure',
      'chest pain',
      'difficulty breathing',
      'severe bleeding'
    ];

    const hasImmediateIndicator = priorityFactors.some(factor => 
      immediateIndicators.some(indicator => factor.includes(indicator))
    );

    if (hasImmediateIndicator || priorityScore >= 90) {
      return 'immediate';
    }

    // Timeframe based on priority score
    if (priorityScore >= 80) {
      return 'within_2_hours';
    } else if (priorityScore >= 65) {
      return 'within_4_hours';
    } else if (priorityScore >= 45) {
      return 'within_24_hours';
    } else {
      return 'within_48_hours';
    }
  }

  /**
   * Get human-readable timeframe description
   * @param {string} timeframe - Timeframe code
   * @returns {string} Human-readable description
   */
  getTimeframeDescription(timeframe) {
    const descriptions = {
      'immediate': 'Seek immediate medical attention',
      'within_2_hours': 'Seek medical care within 2 hours',
      'within_4_hours': 'Seek medical care within 4 hours',
      'within_24_hours': 'Seek medical care within 24 hours',
      'within_48_hours': 'Seek medical care within 48 hours'
    };

    return descriptions[timeframe] || 'Seek medical care as appropriate';
  }

  /**
   * Enhanced routing decision with priority calculation
   * @param {Object} params - Routing parameters
   * @returns {Object} Enhanced routing decision with priority
   */
  async determineRoutingWithPriority(params) {
    try {
      // Get basic routing decision
      const routingDecision = await this.determineRouting(params);
      
      // Calculate priority
      const priorityCalculation = this.calculatePriority(
        params.symptoms,
        params.patientInfo,
        routingDecision.severityScore
      );

      // Combine results
      return {
        ...routingDecision,
        priority: priorityCalculation.priorityLevel,
        priorityScore: priorityCalculation.priorityScore,
        timeframe: priorityCalculation.timeframe,
        timeframeDescription: this.getTimeframeDescription(priorityCalculation.timeframe),
        priorityFactors: priorityCalculation.priorityFactors,
        priorityAdjustment: priorityCalculation.adjustment
      };

    } catch (error) {
      console.error('Error in enhanced routing decision:', error);
      throw new Error(`Enhanced routing decision failed: ${error.message}`);
    }
  }
}

module.exports = RoutingEngine;