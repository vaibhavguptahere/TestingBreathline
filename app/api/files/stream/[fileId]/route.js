import { authenticateToken } from '@/middleware/auth';
import MedicalRecord from '@/models/MedicalRecord';
import connectDB from '@/lib/mongodb';

export async function GET(request, { params }) {
  try {
    const { fileId } = params;
    const { searchParams } = new URL(request.url);
    const recordId = searchParams.get('recordId');

    // Check if it's an emergency access
    const emergencyToken = searchParams.get('emergency');
    let user = null;
    let isEmergencyAccess = false;

    if (emergencyToken) {
      const { verifyToken } = await import('@/lib/auth');
      const decoded = verifyToken(emergencyToken);
      if (decoded && decoded.type === 'emergency') {
        isEmergencyAccess = true;
      } else {
        return new Response('Invalid emergency token', { status: 401 });
      }
    } else {
      const auth = await authenticateToken(request);
      if (auth.error) {
        return new Response(auth.error, { status: auth.status });
      }
      user = auth.user;
    }

    await connectDB();

    // Find the medical record
    const record = await MedicalRecord.findById(recordId);
    if (!record) {
      return new Response('Record not found', { status: 404 });
    }

    // Find the specific file
    const file = record.files.find(f => f.filename === fileId);
    if (!file) {
      return new Response('File not found', { status: 404 });
    }

    // Check access permissions
    if (!isEmergencyAccess) {
      let hasAccess = false;

      if (user.role === 'patient') {
        hasAccess = record.patientId.toString() === user._id.toString();
      } else if (user.role === 'doctor') {
        const permission = record.accessPermissions.find(
          perm => perm.doctorId.toString() === user._id.toString() && perm.granted
        );
        hasAccess = permission && (!permission.expiresAt || new Date(permission.expiresAt) > new Date());
      } else if (user.role === 'emergency') {
        hasAccess = record.metadata.isEmergencyVisible;
      }

      if (!hasAccess) {
        return new Response('Access denied', { status: 403 });
      }
    }

    // In a real implementation, you would:
    // 1. Retrieve the actual file from your storage system (AWS S3, GridFS, etc.)
    // 2. Decrypt the file if it's encrypted
    // 3. Stream the file content with appropriate headers

    // For demo purposes, return a simulated file response
    let content;
    let contentType = file.mimetype || 'application/octet-stream';

    if (file.mimetype?.startsWith('text/')) {
      content = `Sample medical document content for ${file.originalName}\n\nThis is a simulated file content. In a real implementation, the actual file would be retrieved from storage.`;
      contentType = 'text/plain';
    } else if (file.mimetype?.startsWith('image/')) {
      // For images, you would return the actual image data
      content = 'Simulated image data - in real implementation, actual image bytes would be returned';
      contentType = file.mimetype;
    } else {
      content = `Simulated file content for ${file.originalName}`;
    }

    const headers = new Headers({
      'Content-Type': contentType,
      'Content-Disposition': `inline; filename="${file.originalName}"`,
      'Content-Length': content.length.toString(),
      'Cache-Control': 'private, no-cache',
    });

    return new Response(content, { headers });
  } catch (error) {
    console.error('Stream file error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}