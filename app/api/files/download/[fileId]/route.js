import { authenticateToken } from '@/middleware/auth';
import MedicalRecord from '@/models/MedicalRecord';
import AccessLog from '@/models/AccessLog';
import connectDB from '@/lib/mongodb';

export async function GET(request, { params }) {
  try {
    const { fileId } = params;
    const { searchParams } = new URL(request.url);
    const recordId = searchParams.get('recordId');
    const fileIndex = parseInt(searchParams.get('fileIndex')) || 0;

    // Check if it's an emergency access (no auth required for QR code access)
    const emergencyToken = searchParams.get('emergency');
    let user = null;
    let isEmergencyAccess = false;

    if (emergencyToken) {
      // Verify emergency token
      const { verifyToken } = await import('@/lib/auth');
      const decoded = verifyToken(emergencyToken);
      if (decoded && decoded.type === 'emergency') {
        isEmergencyAccess = true;
      } else {
        return Response.json({ error: 'Invalid emergency token' }, { status: 401 });
      }
    } else {
      // Regular authentication
      const auth = await authenticateToken(request);
      if (auth.error) {
        return Response.json({ error: auth.error }, { status: auth.status });
      }
      user = auth.user;
    }

    await connectDB();

    // Find the medical record
    let record;
    if (recordId) {
      record = await MedicalRecord.findById(recordId);
    } else {
      // Find record by file ID
      record = await MedicalRecord.findOne({
        'files.filename': fileId
      });
    }

    if (!record) {
      return Response.json({ error: 'Record not found' }, { status: 404 });
    }

    // Find the specific file
    const file = record.files.find(f => f.filename === fileId) || record.files[fileIndex];
    if (!file) {
      return Response.json({ error: 'File not found' }, { status: 404 });
    }

    // Check access permissions
    if (!isEmergencyAccess) {
      let hasAccess = false;

      if (user.role === 'patient') {
        // Patient can access their own files
        hasAccess = record.patientId.toString() === user._id.toString();
      } else if (user.role === 'doctor') {
        // Doctor needs permission
        const permission = record.accessPermissions.find(
          perm => perm.doctorId.toString() === user._id.toString() && perm.granted
        );
        hasAccess = permission && (!permission.expiresAt || new Date(permission.expiresAt) > new Date());
      } else if (user.role === 'emergency') {
        // Emergency responder can access emergency-visible records
        hasAccess = record.metadata.isEmergencyVisible;
      }

      if (!hasAccess) {
        return Response.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Log the download access
    const clientIp = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const accessLog = new AccessLog({
      patientId: record.patientId,
      accessorId: user?._id || null,
      recordId: record._id,
      accessType: 'download',
      accessReason: isEmergencyAccess ? 'Emergency QR access download' : `${user?.role} downloading file: ${file.originalName}`,
      ipAddress: clientIp,
      userAgent: userAgent,
      emergencyToken: isEmergencyAccess ? emergencyToken : undefined,
    });

    await accessLog.save();

    // In a real implementation, you would:
    // 1. Decrypt the file if it's encrypted
    // 2. Stream the file from your storage service (AWS S3, GridFS, etc.)
    // 3. Return the actual file content with appropriate headers

    // For demo purposes, return file information and simulated download
    return Response.json({
      message: 'File download initiated',
      file: {
        id: file.filename,
        name: file.originalName,
        size: file.size,
        type: file.mimetype,
        downloadUrl: `/api/files/stream/${file.filename}?recordId=${record._id}`,
        encrypted: file.encrypted || false,
      },
      record: {
        id: record._id,
        title: record.title,
        category: record.category,
      },
      accessLogged: true,
    });
  } catch (error) {
    console.error('Download file error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}