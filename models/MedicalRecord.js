import mongoose from 'mongoose';

const medicalRecordSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: String,
  category: {
    type: String,
    enum: ['general', 'lab-results', 'prescription', 'imaging', 'emergency', 'consultation'],
    default: 'general',
  },
  files: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    path: String,
    encrypted: { type: Boolean, default: true },
  }],
  metadata: {
    recordDate: { type: Date, default: Date.now },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    isEmergencyVisible: { type: Boolean, default: false },
  },
  accessPermissions: [{
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    granted: { type: Boolean, default: false },
    grantedAt: Date,
    expiresAt: Date,
    accessLevel: {
      type: String,
      enum: ['read', 'write'],
      default: 'read',
    },
  }],
}, {
  timestamps: true,
});

export default mongoose.models.MedicalRecord || mongoose.model('MedicalRecord', medicalRecordSchema);