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
    enum: ['read', 'write'],
    default: 'read',
  },
  recordCategories: [{
    type: String,
    enum: ['all', 'general', 'lab-results', 'prescription', 'imaging', 'emergency', 'consultation'],
  }],
  urgency: {
    type: String,
    enum: ['routine', 'urgent', 'emergency'],
    default: 'routine',
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'denied'],
    default: 'pending',
  },
  responseMessage: String,
  respondedAt: Date,
  expiresAt: Date,
}, {
  timestamps: true,
});

export default mongoose.models.AccessRequest || mongoose.model('AccessRequest', accessRequestSchema);