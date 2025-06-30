import { authenticateToken } from '@/middleware/auth';
import MedicalRecord from '@/models/MedicalRecord';
import AccessLog from '@/models/AccessLog';
import connectDB from '@/lib/mongodb';

export async function GET(request, { params }) {
  try {
    const auth = await authenticateToken(request);
    if (auth.error) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const { user } = auth;
    if (user.role !== 'doctor') {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    const { patientId, recordId } = await params;

    await connectDB();

    // Get the specific record and verify access
    const record = await MedicalRecord.findOne({
      _id: recordId,
      patientId,
      'accessPermissions.doctorId': user._id,
      'accessPermissions.granted': true,
    }).populate('metadata.doctorId', 'profile.firstName profile.lastName profile.specialization');

    if (!record) {
      return Response.json({ error: 'Record not found or access denied' }, { status: 404 });
    }

    // Verify access hasn't expired
    const doctorPermission = record.accessPermissions.find(
      perm => perm.doctorId.toString() === user._id.toString() && perm.granted
    );

    if (doctorPermission?.expiresAt && new Date(doctorPermission.expiresAt) < new Date()) {
      return Response.json({ error: 'Access has expired' }, { status: 403 });
    }

    // Log the detailed record access
    const clientIp = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const accessLog = new AccessLog({
      patientId,
      accessorId: user._id,
      recordId,
      accessType: 'view',
      accessReason: `Doctor viewing record: ${record.title}`,
      ipAddress: clientIp,
      userAgent: userAgent,
    });

    await accessLog.save();

    return Response.json({ record });
  } catch (error) {
    console.error('Get record error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}