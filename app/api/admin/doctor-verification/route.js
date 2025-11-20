import { authenticateToken } from '@/middleware/auth';
import DoctorVerification from '@/models/DoctorVerification';
import AuditLog from '@/models/AuditLog';
import User from '@/models/User';
import connectDB from '@/lib/mongodb';

async function checkAdminAccess(auth) {
  if (auth.error) {
    return { error: auth.error, status: auth.status };
  }

  const { user } = auth;
  if (user.role !== 'admin' && user.role !== 'doctor') {
    return { error: 'Access denied', status: 403 };
  }

  // Admins need explicit admin role or super user status
  await connectDB();
  const adminUser = await User.findById(user._id);
  if (!adminUser || (adminUser.role !== 'admin' && !adminUser.profile?.isAdmin)) {
    return { error: 'Insufficient permissions', status: 403 };
  }

  return { success: true };
}

export async function GET(request) {
  try {
    const auth = await authenticateToken(request);
    const adminCheck = await checkAdminAccess(auth);
    if (adminCheck.error) {
      return Response.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;

    await connectDB();

    const query = {};
    if (status) {
      query.status = status;
    }

    const verifications = await DoctorVerification.find(query)
      .populate('doctorId', 'email profile.firstName profile.lastName profile.specialization profile.hospital')
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await DoctorVerification.countDocuments(query);

    return Response.json({
      verifications: verifications.map(v => ({
        _id: v._id,
        doctor: {
          _id: v.doctorId._id,
          email: v.doctorId.email,
          name: `${v.doctorId.profile.firstName} ${v.doctorId.profile.lastName}`,
          specialization: v.doctorId.profile.specialization,
          hospital: v.doctorId.profile.hospital,
        },
        status: v.status,
        documentCount: v.documents.length,
        documents: v.documents.map(d => ({
          type: d.type,
          fileName: d.fileName,
          fileUrl: d.fileUrl,
          uploadedAt: d.uploadedAt,
        })),
        submittedAt: v.createdAt,
        lastReviewedAt: v.lastReviewedAt,
        verificationNotes: v.verificationNotes,
        rejectionReason: v.rejectionReason,
        suspensionReason: v.suspensionReason,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get verifications error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const auth = await authenticateToken(request);
    const adminCheck = await checkAdminAccess(auth);
    if (adminCheck.error) {
      return Response.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    const { verificationId, action, notes, reason } = await request.json();

    if (!verificationId || !action) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['approve', 'reject', 'request_resubmission', 'suspend'].includes(action)) {
      return Response.json({ error: 'Invalid action' }, { status: 400 });
    }

    await connectDB();

    const verification = await DoctorVerification.findById(verificationId);
    if (!verification) {
      return Response.json({ error: 'Verification not found' }, { status: 404 });
    }

    const doctorId = verification.doctorId;
    let newStatus = verification.status;

    switch (action) {
      case 'approve':
        newStatus = 'verified';
        verification.verifiedAt = new Date();
        verification.verifiedBy = auth.user._id;
        break;
      case 'reject':
        newStatus = 'rejected';
        verification.rejectedAt = new Date();
        verification.rejectedBy = auth.user._id;
        verification.rejectionReason = reason || 'Document verification failed';
        break;
      case 'request_resubmission':
        newStatus = 'need_resubmission';
        verification.verificationNotes = {
          adminId: auth.user._id,
          notes: reason || 'Please resubmit documents',
          createdAt: new Date(),
        };
        break;
      case 'suspend':
        newStatus = 'suspended';
        verification.suspensionReason = reason || 'Account suspended';
        break;
    }

    verification.status = newStatus;
    verification.lastReviewedAt = new Date();
    verification.lastReviewedBy = auth.user._id;
    await verification.save();

    // Update user profile verification status
    await User.findByIdAndUpdate(doctorId, {
      'profile.verificationStatus': newStatus,
      'profile.verified': newStatus === 'verified',
    });

    // Create audit log
    const actionMap = {
      approve: 'DOCTOR_VERIFICATION_APPROVED',
      reject: 'DOCTOR_VERIFICATION_REJECTED',
      request_resubmission: 'DOCTOR_VERIFICATION_RESUBMISSION_REQUESTED',
      suspend: 'DOCTOR_VERIFICATION_SUSPENDED',
    };

    await AuditLog.create({
      action: actionMap[action],
      actorId: auth.user._id,
      actorRole: 'admin',
      targetType: 'verification',
      targetId: verificationId,
      description: `Admin ${action}ed doctor verification for ${doctorId}`,
      details: {
        action,
        notes,
        reason,
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.ip,
      userAgent: request.headers.get('user-agent'),
      severity: 'high',
    });

    return Response.json({
      message: `Verification ${action}ed successfully`,
      verification: {
        _id: verification._id,
        status: newStatus,
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Update verification error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
