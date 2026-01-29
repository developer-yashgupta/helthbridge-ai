const { query, transaction } = require('../config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

class User {
  constructor(data) {
    this.id = data.id;
    this.phone = data.phone;
    this.name = data.name;
    this.userType = data.user_type || data.userType;
    this.language = data.language;
    this.location = data.location;
    this.abhaId = data.abha_id || data.abhaId;
    this.medicalHistory = data.medical_history || data.medicalHistory;
    this.emergencyContacts = data.emergency_contacts || data.emergencyContacts;
    this.isVerified = data.is_verified || data.isVerified;
    this.createdAt = data.created_at || data.createdAt;
    this.updatedAt = data.updated_at || data.updatedAt;
  }

  // Create new user
  static async create(userData) {
    const {
      phone,
      name,
      userType = 'citizen',
      language = 'hi',
      location = null,
      abhaId = null,
      medicalHistory = [],
      emergencyContacts = []
    } = userData;

    const id = uuidv4();
    
    const queryText = `
      INSERT INTO users (
        id, phone, name, user_type, language, location, 
        abha_id, medical_history, emergency_contacts, is_verified
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const values = [
      id, phone, name, userType, language, 
      JSON.stringify(location), abhaId, 
      JSON.stringify(medicalHistory), 
      JSON.stringify(emergencyContacts), 
      false
    ];

    try {
      const result = await query(queryText, values);
      return new User(result.rows[0]);
    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new Error('User with this phone number already exists');
      }
      throw error;
    }
  }

  // Find user by phone
  static async findByPhone(phone) {
    const queryText = 'SELECT * FROM users WHERE phone = $1';
    const result = await query(queryText, [phone]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new User(result.rows[0]);
  }

  // Find user by ID
  static async findById(id) {
    const queryText = 'SELECT * FROM users WHERE id = $1';
    const result = await query(queryText, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new User(result.rows[0]);
  }

  // Update user
  async update(updateData) {
    const allowedFields = [
      'name', 'language', 'location', 'abha_id', 
      'medical_history', 'emergency_contacts', 'is_verified'
    ];
    
    const updates = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updateData).forEach(key => {
      const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      if (allowedFields.includes(dbKey)) {
        updates.push(`${dbKey} = $${paramCount}`);
        
        // Handle JSON fields
        if (['location', 'medical_history', 'emergency_contacts'].includes(dbKey)) {
          values.push(JSON.stringify(updateData[key]));
        } else {
          values.push(updateData[key]);
        }
        paramCount++;
      }
    });

    if (updates.length === 0) {
      return this;
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(this.id);

    const queryText = `
      UPDATE users 
      SET ${updates.join(', ')} 
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await query(queryText, values);
    return new User(result.rows[0]);
  }

  // Verify user
  async verify() {
    return this.update({ isVerified: true });
  }

  // Get user's symptom analyses
  async getSymptomAnalyses(limit = 10) {
    const queryText = `
      SELECT * FROM symptom_analyses 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2
    `;
    
    const result = await query(queryText, [this.id, limit]);
    return result.rows;
  }

  // Get user's teleconsultations
  async getTeleconsultations(limit = 10) {
    const queryText = `
      SELECT t.*, u.name as doctor_name 
      FROM teleconsultations t
      LEFT JOIN users u ON t.doctor_id = u.id
      WHERE t.patient_id = $1 
      ORDER BY t.created_at DESC 
      LIMIT $2
    `;
    
    const result = await query(queryText, [this.id, limit]);
    return result.rows;
  }

  // Convert to JSON (remove sensitive data)
  toJSON() {
    return {
      id: this.id,
      phone: this.phone,
      name: this.name,
      userType: this.userType,
      language: this.language,
      location: this.location,
      abhaId: this.abhaId,
      isVerified: this.isVerified,
      createdAt: this.createdAt
    };
  }

  // Get user statistics
  static async getStats() {
    const queryText = `
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN user_type = 'citizen' THEN 1 END) as citizens,
        COUNT(CASE WHEN user_type = 'asha' THEN 1 END) as asha_workers,
        COUNT(CASE WHEN user_type = 'doctor' THEN 1 END) as doctors,
        COUNT(CASE WHEN is_verified = true THEN 1 END) as verified_users,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as new_users_30d
      FROM users
    `;
    
    const result = await query(queryText);
    return result.rows[0];
  }
}

module.exports = User;