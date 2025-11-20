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
    phone: String,
    dateOfBirth: Date,
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
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
    },
    bio: String,
    verified: { type: Boolean, default: false },
    verificationStatus: {
      type: String,
      enum: [
        'not_submitted',
        'submitted',
        'under_review',
        'need_resubmission',
        'verified',
        'rejected',
        'suspended',
      ],
      default: 'not_submitted',
    },
    trustPatientsList: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    // Emergency responder specific fields
    badgeNumber: String,
    department: String,
    station: String,
    certifications: String,
    // Settings
    settings: {
      emailNotifications: { type: Boolean, default: true },
      smsNotifications: { type: Boolean, default: false },
      emergencyAlerts: { type: Boolean, default: true },
    },
    // Admin flag
    isAdmin: { type: Boolean, default: false },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLogin: Date,
}, {
  timestamps: true,
});

export default mongoose.models.User || mongoose.model('User', userSchema);
