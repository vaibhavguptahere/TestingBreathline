import mongoose from 'mongoose';

const patientAccessRequestSchema = new mongoose.Schema({
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
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'expired', 'access_revoked'],
    default: 'pending',
  },
  reason: String,
  accessLevel: {
    type: String,
    enum: ['read', 'write'],
    default: 'read',
  },
  recordCategories: [
    {
      type: String,
      enum: ['all', 'general', 'lab-results', 'prescription', 'imaging', 'emergency', 'consultation'],
    },
  ],
  expiresAt: Date,
  approvedAt: Date,
  rejectedAt: Date,
  rejectionReason: String,
  requestedAt: { type: Date, default: Date.now },
  uniqueId: String,
  ipAddress: String,
  userAgent: String,
  isAutoApproved: Boolean,
  accessStartTime: Date,
  accessEndTime: Date,
}, {
  timestamps: true,
});

export default mongoose.models.PatientAccessRequest || mongoose.model('PatientAccessRequest', patientAccessRequestSchema);
