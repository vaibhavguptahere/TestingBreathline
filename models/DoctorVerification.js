import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['MRN', 'GOVERNMENT_ID', 'HOSPITAL_ID', 'MEDICAL_CERTIFICATE'],
    required: true,
  },
  fileName: String,
  fileSize: Number,
  fileUrl: String,
  uploadedAt: { type: Date, default: Date.now },
  verifiedAt: Date,
  rejectionReason: String,
});

const doctorVerificationSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  status: {
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
  documents: [documentSchema],
  submissionHistory: [
    {
      submittedAt: Date,
      documents: [documentSchema],
      status: String,
    },
  ],
  verificationNotes: {
    adminId: mongoose.Schema.Types.ObjectId,
    notes: String,
    createdAt: Date,
  },
  rejectionReason: String,
  suspensionReason: String,
  verifiedAt: Date,
  verifiedBy: mongoose.Schema.Types.ObjectId,
  rejectedAt: Date,
  rejectedBy: mongoose.Schema.Types.ObjectId,
  lastReviewedAt: Date,
  lastReviewedBy: mongoose.Schema.Types.ObjectId,
}, {
  timestamps: true,
});

export default mongoose.models.DoctorVerification || mongoose.model('DoctorVerification', doctorVerificationSchema);
