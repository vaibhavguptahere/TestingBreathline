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
    encrypted: Boolean,
  }],
  metadata: {
    recordDate: Date,
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    hospital: String,
    isEmergencyVisible: {
      type: Boolean,
      default: false,
    },
  },
  accessPermissions: [{
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    granted: Date,
    expiresAt: Date,
    granted: {
      type: Boolean,
      default: false,
    },
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.MedicalRecord || mongoose.model('MedicalRecord', medicalRecordSchema);