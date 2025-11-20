import { authenticateToken } from '@/middleware/auth';
import DoctorVerification from '@/models/DoctorVerification';
import AuditLog from '@/models/AuditLog';
import User from '@/models/User';
import connectDB from '@/lib/mongodb';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

const UPLOAD_DIR = join(process.cwd(), 'public', 'doctor-verifications');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

async function ensureUploadDir() {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
  }
}

export async function POST(request) {
  try {
    const auth = await authenticateToken(request);
    if (auth.error) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const { user } = auth;
    if (user.role !== 'doctor') {
      return Response.json({ error: 'Only doctors can submit verification' }, { status: 403 });
    }

    const formData = await request.formData();
    const files = formData.getAll('documents');
    const documentTypes = formData.getAll('documentTypes');

    if (files.length === 0) {
      return Response.json({ error: 'No files provided' }, { status: 400 });
    }

    if (files.length !== documentTypes.length) {
      return Response.json({ error: 'Document count mismatch' }, { status: 400 });
    }

    await connectDB();

    // Validate files
    const uploadedDocs = [];
    const errors = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const docType = documentTypes[i];

      // Validate type
      if (!['MRN', 'GOVERNMENT_ID', 'HOSPITAL_ID', 'MEDICAL_CERTIFICATE'].includes(docType)) {
        errors.push(`Invalid document type: ${docType}`);
        continue;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name} exceeds 10MB limit`);
        continue;
      }

      // Validate MIME type
      if (!ALLOWED_TYPES.includes(file.type)) {
        errors.push(`${file.name} has unsupported format. Use JPG, PNG, or PDF`);
        continue;
      }

      try {
        // Read file buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Generate unique filename
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(7);
        const ext = file.name.split('.').pop();
        const fileName = `${user._id}_${docType}_${timestamp}_${randomStr}.${ext}`;
        const filePath = join(UPLOAD_DIR, fileName);

        await ensureUploadDir();
        await writeFile(filePath, buffer);

        uploadedDocs.push({
          type: docType,
          fileName,
          fileSize: file.size,
          fileUrl: `/doctor-verifications/${fileName}`,
          uploadedAt: new Date(),
        });
      } catch (error) {
        console.error(`Error saving file ${file.name}:`, error);
        errors.push(`Failed to save ${file.name}`);
      }
    }

    if (uploadedDocs.length === 0) {
      return Response.json(
        { error: 'No valid files uploaded', details: errors },
        { status: 400 }
      );
    }

    // Find or create verification record
    let verification = await DoctorVerification.findOne({ doctorId: user._id });

    if (!verification) {
      verification = new DoctorVerification({
        doctorId: user._id,
        status: 'submitted',
        documents: uploadedDocs,
      });
    } else {
      // Update status if previously rejected or needs resubmission
      if (['rejected', 'need_resubmission'].includes(verification.status)) {
        // Save previous submission to history
        verification.submissionHistory.push({
          submittedAt: verification.updatedAt,
          documents: verification.documents,
          status: verification.status,
        });
      }

      verification.status = 'submitted';
      verification.documents = uploadedDocs;
      verification.rejectionReason = null;
      verification.verificationNotes = null;
    }

    await verification.save();

    // Update user verification status
    await User.findByIdAndUpdate(user._id, {
      'profile.verificationStatus': 'submitted',
    });

    // Create audit log
    await AuditLog.create({
      action: 'DOCTOR_VERIFICATION_SUBMITTED',
      actorId: user._id,
      actorRole: 'doctor',
      targetType: 'verification',
      targetId: verification._id,
      description: `Doctor ${user.email} submitted ${uploadedDocs.length} verification documents`,
      details: {
        documentCount: uploadedDocs.length,
        documentTypes: uploadedDocs.map(d => d.type),
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.ip,
      userAgent: request.headers.get('user-agent'),
      severity: 'medium',
    });

    return Response.json({
      message: 'Documents uploaded successfully',
      verification: {
        status: verification.status,
        documentCount: uploadedDocs.length,
        uploadedAt: new Date(),
      },
      uploadedDocs,
      warnings: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Doctor verification upload error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const auth = await authenticateToken(request);
    if (auth.error) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const { user } = auth;
    if (user.role !== 'doctor') {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    await connectDB();

    const verification = await DoctorVerification.findOne({ doctorId: user._id });

    if (!verification) {
      return Response.json({
        status: 'not_submitted',
        documents: [],
        submissionHistory: [],
      });
    }

    return Response.json({
      status: verification.status,
      documents: verification.documents,
      submissionHistory: verification.submissionHistory,
      rejectionReason: verification.rejectionReason,
      verificationNotes: verification.verificationNotes,
      verifiedAt: verification.verifiedAt,
      rejectedAt: verification.rejectedAt,
    });
  } catch (error) {
    console.error('Get verification error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
