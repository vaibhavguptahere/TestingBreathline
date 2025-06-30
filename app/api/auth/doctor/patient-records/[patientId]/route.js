import { authenticateToken } from '@/middleware/auth';
import MedicalRecord from '@/models/MedicalRecord';
import AccessLog from '@/models/AccessLog';
import User from '@/models/User';
import connectDB from '@/lib/mongodb';

export async function GET(request, context) {
  try {
    const auth = await authenticateToken(request);
    if (auth.error) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const { user } = auth;
    if (user.role !== 'doctor') {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    const { patientId } = await context.params; // ✅ Await the params
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit')) || 20;
    const page = parseInt(searchParams.get('page')) || 1;

    await connectDB();

    const query = {
      patientId,
      'accessPermissions.doctorId': user._id,
      'accessPermissions.granted': true,
    };

    if (category && category !== 'all') {
      query.category = category;
    }

    const accessCheck = await MedicalRecord.findOne(query);
    if (!accessCheck) {
      return Response.json({ error: 'No access to patient records' }, { status: 403 });
    }

    const doctorPermission = accessCheck.accessPermissions.find(
      perm => perm.doctorId.toString() === user._id.toString() && perm.granted
    );

    if (doctorPermission?.expiresAt && new Date(doctorPermission.expiresAt) < new Date()) {
      return Response.json({ error: 'Access has expired' }, { status: 403 });
    }

    const patient = await User.findById(patientId).select('profile email');
    if (!patient) {
      return Response.json({ error: 'Patient not found' }, { status: 404 });
    }

    const records = await MedicalRecord.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .populate('metadata.doctorId', 'profile.firstName profile.lastName profile.specialization');

    const total = await MedicalRecord.countDocuments(query);

    const clientIp = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const accessLog = new AccessLog({
      patientId,
      accessorId: user._id,
      accessType: 'view',
      accessReason: 'Doctor accessing patient records',
      ipAddress: clientIp,
      userAgent: userAgent,
    });

    await accessLog.save();

    return Response.json({
      patient: {
        id: patient._id,
        profile: patient.profile,
        email: patient.email,
        accessLevel: doctorPermission?.accessLevel || 'read',
        accessGrantedAt: doctorPermission?.grantedAt,
        accessExpiresAt: doctorPermission?.expiresAt,
      },
      records,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get patient records error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
