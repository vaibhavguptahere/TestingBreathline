import mongoose from 'mongoose';

const hospitalSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  address: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
  },
  phone: String,
  email: String,
  website: String,
  registrationNumber: String,
  verificationStatus: {
    type: String,
    enum: ['verified', 'unverified', 'pending'],
    default: 'pending',
  },
  departments: [String],
  totalBeds: Number,
  emergencyServices: { type: Boolean, default: false },
  description: String,
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

export default mongoose.models.Hospital || mongoose.model('Hospital', hospitalSchema);
