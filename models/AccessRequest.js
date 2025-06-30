import mongoose from 'mongoose';

const accessRequestSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reason: {
    type: String,
    required: true,
  },
  accessLevel: {
    type: String,
    enum: ['read', 'write', 'full'],
    default: 'read',
  },
  recordCategories: [{
    type: String,
    enum: ['all', 'general', 'lab-results', 'prescription', 'imaging', 'emergency', 'consultation'],
    default: 'all',
  }],
  urgency: {
    type: String,
    enum: ['routine', 'urgent', 'emergency'],
    default: 'routine',
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'denied', 'expired'],
    default: 'pending',
  },
  responseMessage: String,
  expiresAt: Date,
  respondedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.AccessRequest || mongoose.model('AccessRequest', accessRequestSchema);