import { authenticateToken } from '@/middleware/auth';
import PatientAccessRequest from '@/models/PatientAccessRequest';
import User from '@/models/User';
import connectDB from '@/lib/mongodb';

async function checkAdminAccess(auth) {
  if (auth.error) {
    return { error: auth.error, status: auth.status };
  }

  const { user } = auth;
  if (user.role !== 'admin') {
    return { error: 'Access denied: Admin role required', status: 403 };
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
    const limit = parseInt(searchParams.get('limit')) || 50;

    await connectDB();

    const query = {};
    if (status) {
      query.status = status;
    }

    const requests = await PatientAccessRequest.find(query)
      .populate('doctorId', 'email profile.firstName profile.lastName profile.specialization')
      .populate('patientId', 'email profile.firstName profile.lastName')
      .sort({ requestedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await PatientAccessRequest.countDocuments(query);

    return Response.json({
      requests: requests.map(r => ({
        _id: r._id,
        doctor: {
          _id: r.doctorId._id,
          email: r.doctorId.email,
          name: `${r.doctorId.profile.firstName} ${r.doctorId.profile.lastName}`,
          specialization: r.doctorId.profile.specialization,
        },
        patient: {
          _id: r.patientId._id,
          email: r.patientId.email,
          name: `${r.patientId.profile.firstName} ${r.patientId.profile.lastName}`,
        },
        status: r.status,
        reason: r.reason,
        accessLevel: r.accessLevel,
        requestedAt: r.requestedAt,
        approvedAt: r.approvedAt,
        rejectedAt: r.rejectedAt,
        rejectionReason: r.rejectionReason,
        expiresAt: r.expiresAt,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get access requests error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
