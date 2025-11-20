import { authenticateToken } from '@/middleware/auth';
import DoctorVerification from '@/models/DoctorVerification';
import PatientAccessRequest from '@/models/PatientAccessRequest';
import AuditLog from '@/models/AuditLog';
import User from '@/models/User';
import connectDB from '@/lib/mongodb';

async function checkAdminAccess(auth) {
  if (auth.error) {
    return { error: auth.error, status: auth.status };
  }

  const { user } = auth;
  if (user.role !== 'admin') {
    return { error: 'Access denied', status: 403 };
  }

  await connectDB();
  const adminUser = await User.findById(user._id);
  if (!adminUser || !adminUser.profile?.isAdmin) {
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

    await connectDB();

    // Doctor verification stats
    const verificationStats = {
      total: await DoctorVerification.countDocuments(),
      notSubmitted: await DoctorVerification.countDocuments({ status: 'not_submitted' }),
      submitted: await DoctorVerification.countDocuments({ status: 'submitted' }),
      underReview: await DoctorVerification.countDocuments({ status: 'under_review' }),
      needResubmission: await DoctorVerification.countDocuments({ status: 'need_resubmission' }),
      verified: await DoctorVerification.countDocuments({ status: 'verified' }),
      rejected: await DoctorVerification.countDocuments({ status: 'rejected' }),
      suspended: await DoctorVerification.countDocuments({ status: 'suspended' }),
    };

    // Patient access request stats
    const accessRequestStats = {
      total: await PatientAccessRequest.countDocuments(),
      pending: await PatientAccessRequest.countDocuments({ status: 'pending' }),
      approved: await PatientAccessRequest.countDocuments({ status: 'approved' }),
      rejected: await PatientAccessRequest.countDocuments({ status: 'rejected' }),
      expired: await PatientAccessRequest.countDocuments({ status: 'expired' }),
    };

    // Recent verifications needing review
    const pendingVerifications = await DoctorVerification.find({
      status: { $in: ['submitted', 'under_review'] },
    })
      .populate('doctorId', 'email profile.firstName profile.lastName')
      .sort({ updatedAt: -1 })
      .limit(5);

    // Recent access requests
    const recentAccessRequests = await PatientAccessRequest.find({
      status: 'pending',
    })
      .populate('doctorId', 'email profile.firstName profile.lastName profile.specialization')
      .populate('patientId', 'email profile.firstName profile.lastName')
      .sort({ requestedAt: -1 })
      .limit(10);

    // Suspicious activity - multiple rejected requests from same doctor
    const suspiciousDoctors = await PatientAccessRequest.aggregate([
      { $match: { status: 'rejected' } },
      { $group: { _id: '$doctorId', count: { $sum: 1 } } },
      { $match: { count: { $gte: 3 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    const populatedSuspiciousDoctors = await User.find({
      _id: { $in: suspiciousDoctors.map(d => d._id) },
    }).select('email profile.firstName profile.lastName profile.specialization');

    // Recent critical audit logs
    const criticalLogs = await AuditLog.find({
      severity: { $in: ['high', 'critical'] },
    })
      .populate('actorId', 'email profile.firstName profile.lastName')
      .sort({ timestamp: -1 })
      .limit(10);

    // Active verifications this month
    const thisMonth = new Date();
    thisMonth.setDate(1);
    const nextMonth = new Date(thisMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const verificationsThisMonth = await DoctorVerification.countDocuments({
      createdAt: { $gte: thisMonth, $lt: nextMonth },
    });

    return Response.json({
      verificationStats,
      accessRequestStats,
      pendingVerifications: pendingVerifications.map(v => ({
        _id: v._id,
        doctor: {
          _id: v.doctorId._id,
          email: v.doctorId.email,
          name: `${v.doctorId.profile.firstName} ${v.doctorId.profile.lastName}`,
        },
        status: v.status,
        submittedAt: v.createdAt,
        documentCount: v.documents.length,
      })),
      recentAccessRequests: recentAccessRequests.map(r => ({
        _id: r._id,
        doctor: {
          _id: r.doctorId._id,
          email: r.doctorId.email,
          name: `${r.doctorId.profile.firstName} ${r.doctorId.profile.lastName}`,
        },
        patient: {
          _id: r.patientId._id,
          email: r.patientId.email,
          name: `${r.patientId.profile.firstName} ${r.patientId.profile.lastName}`,
        },
        reason: r.reason,
        requestedAt: r.requestedAt,
      })),
      suspiciousActivity: {
        doctorsWithMultipleRejections: populatedSuspiciousDoctors.map(d => ({
          _id: d._id,
          email: d.email,
          name: `${d.profile.firstName} ${d.profile.lastName}`,
          rejectionCount: suspiciousDoctors.find(sd => sd._id.equals(d._id))?.count || 0,
        })),
      },
      criticalLogs: criticalLogs.map(log => ({
        _id: log._id,
        action: log.action,
        actor: log.actorId
          ? `${log.actorId.profile?.firstName} ${log.actorId.profile?.lastName}`
          : 'System',
        description: log.description,
        timestamp: log.timestamp,
        severity: log.severity,
      })),
      verificationStats: {
        ...verificationStats,
        verifiedThisMonth: verificationsThisMonth,
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
