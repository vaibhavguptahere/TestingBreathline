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

    const { patientId, recordId } = params;
    const { searchParams } = new URL(request.url);
    const fileIndex = parseInt(searchParams.get('fileIndex')) || 0;

    await connectDB();

    // Get the specific record and verify access
    const record = await MedicalRecord.findOne({
      _id: recordId,
      patientId,
      'accessPermissions.doctorId': user._id,
      'accessPermissions.granted': true,
    });

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

    // Check if doctor has download permissions
    if (doctorPermission?.accessLevel === 'read') {
      return Response.json({ error: 'Download not permitted with read-only access' }, { status: 403 });
    }

    // Get the file to download
    if (!record.files || !record.files[fileIndex]) {
      return Response.json({ error: 'File not found' }, { status: 404 });
    }

    const file = record.files[fileIndex];

    // Log the download access
    const clientIp = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const accessLog = new AccessLog({
      patientId,
      accessorId: user._id,
      recordId,
      accessType: 'download',
      accessReason: `Doctor downloading file: ${file.originalName}`,
      ipAddress: clientIp,
      userAgent: userAgent,
    });

    await accessLog.save();

    // In a real implementation, you would:
    // 1. Decrypt the file if it's encrypted
    // 2. Stream the file from your storage service (AWS S3, etc.)
    // 3. Return the file with appropriate headers

    // For demo purposes, return file information
    return Response.json({
      message: 'File download initiated',
      file: {
        name: file.originalName,
        size: file.size,
        type: file.mimetype,
        downloadUrl: `/api/files/download/${file.filename}`, // This would be your actual file URL
      },
    });
  } catch (error) {
    console.error('Download file error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}