import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['patient', 'doctor', 'emergency', 'admin'],
    required: true,
  },
  profile: {
    firstName: String,
    lastName: String,
    dateOfBirth: Date,
    phone: String,
    address: String,
    emergencyContact: {
      name: String,
      phone: String,
      relationship: String,
    },
    // Doctor specific fields
    licenseNumber: String,
    specialization: String,
    hospital: String,
    verified: {
      type: Boolean,
      default: false,
    },
    // Emergency responder fields
    badgeNumber: String,
    department: String,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastLogin: Date,
});

export default mongoose.models.User || mongoose.model('User', userSchema);