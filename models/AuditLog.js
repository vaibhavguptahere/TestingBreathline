import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    enum: [
      'DOCTOR_VERIFICATION_SUBMITTED',
      'DOCTOR_VERIFICATION_APPROVED',
      'DOCTOR_VERIFICATION_REJECTED',
      'DOCTOR_VERIFICATION_RESUBMISSION_REQUESTED',
      'DOCTOR_VERIFICATION_SUSPENDED',
      'DOCTOR_DOCUMENT_UPLOADED',
      'DOCTOR_VERIFICATION_STATUS_CHANGED',
      'PATIENT_ACCESS_REQUEST_CREATED',
      'PATIENT_ACCESS_REQUEST_APPROVED',
      'PATIENT_ACCESS_REQUEST_REJECTED',
      'PATIENT_ACCESS_REQUEST_EXPIRED',
      'PATIENT_DATA_ACCESSED',
      'PATIENT_DATA_EXPORTED',
      'PATIENT_REVOKED_ACCESS',
      'ADMIN_ACTION',
    ],
    required: true,
  },
  actorId: mongoose.Schema.Types.ObjectId,
  actorRole: {
    type: String,
    enum: ['patient', 'doctor', 'admin', 'system'],
  },
  targetType: {
    type: String,
    enum: ['doctor', 'patient', 'access_request', 'verification', 'admin'],
  },
  targetId: mongoose.Schema.Types.ObjectId,
  description: String,
  details: mongoose.Schema.Types.Mixed,
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low',
  },
  ipAddress: String,
  userAgent: String,
  status: {
    type: String,
    enum: ['success', 'failure', 'warning'],
    default: 'success',
  },
  timestamp: { type: Date, default: Date.now },
  metadata: mongoose.Schema.Types.Mixed,
}, {
  timestamps: true,
});

auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ actorId: 1, timestamp: -1 });
auditLogSchema.index({ targetId: 1, timestamp: -1 });
auditLogSchema.index({ timestamp: -1 });

export default mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);
