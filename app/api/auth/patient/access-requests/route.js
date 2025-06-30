import { authenticateToken } from '@/middleware/auth';
import AccessRequest from '@/models/AccessRequest';
import connectDB from '@/lib/mongodb';

export async function GET(request) {
  try {
    const auth = await authenticateToken(request);
    if (auth.error) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const { user } = auth;
    if (user.role !== 'patient') {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    await connectDB();

    const requests = await AccessRequest.find({
      patientId: user._id,
      status: 'pending',
    }).populate('doctorId', 'profile.firstName profile.lastName profile.specialization email');

    // Convert to frontend-friendly format
    const formatted = requests.map((r) => ({
      id: r._id.toString(),
      doctor: {
        name: `Dr. ${r.doctorId.profile.firstName} ${r.doctorId.profile.lastName}`,
        email: r.doctorId.email,
        specialization: r.doctorId.profile.specialization,
      },
      requestedAt: r.createdAt,
      reason: r.reason,
      accessLevel: r.accessLevel,
      recordCategories: r.recordCategories,
      status: r.status,
    }));

    return Response.json({ requests: formatted });
  } catch (error) {
    console.error('Get access requests error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
