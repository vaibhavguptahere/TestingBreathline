import mongoose from 'mongoose';

const accessLogSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  accessorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  recordId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MedicalRecord',
  },
  accessType: {
    type: String,
    enum: ['view', 'download', 'emergency-access', 'qr-access'],
    required: true,
  },
  accessReason: String,
  ipAddress: String,
  userAgent: String,
  timestamp: {
    type: Date,
    default: Date.now,
  },
  emergencyToken: String,
});

export default mongoose.models.AccessLog || mongoose.model('AccessLog', accessLogSchema);