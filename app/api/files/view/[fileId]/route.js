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
        return Response.json({ error: 'Invalid emergency token' }, { status: 401 });
      }
    } else {
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
        return Response.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Log the view access
    const clientIp = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const accessLog = new AccessLog({
      patientId: record.patientId,
      accessorId: user?._id || null,
      recordId: record._id,
      accessType: 'view',
      accessReason: isEmergencyAccess ? 'Emergency QR access view' : `${user?.role} viewing file: ${file.originalName}`,
      ipAddress: clientIp,
      userAgent: userAgent,
      emergencyToken: isEmergencyAccess ? emergencyToken : undefined,
    });

    await accessLog.save();

    // Generate file preview content based on file type
    let previewContent = null;
    
    if (file.mimetype?.startsWith('text/')) {
      // For text files, return simulated content
      previewContent = {
        type: 'text',
        content: `Sample medical document content for ${file.originalName}:\n\nPatient: ${record.title}\nDate: ${new Date(record.metadata.recordDate).toLocaleDateString()}\nCategory: ${record.category}\n\nThis is a simulated preview of the medical document. In a real implementation, the actual file content would be retrieved from storage and displayed here.`
      };
    } else if (file.mimetype === 'application/pdf') {
      previewContent = {
        type: 'pdf',
        content: 'PDF content would be displayed here using a PDF viewer component',
        url: `/api/files/stream/${file.filename}?recordId=${record._id}`
      };
    } else if (file.mimetype?.startsWith('image/')) {
      previewContent = {
        type: 'image',
        url: `/api/files/stream/${file.filename}?recordId=${record._id}`,
        alt: file.originalName
      };
    } else {
      previewContent = {
        type: 'unsupported',
        content: 'File preview not available for this file type. Please download to view.'
      };
    }

    return Response.json({
      file: {
        id: file.filename,
        name: file.originalName,
        size: file.size,
        type: file.mimetype,
        encrypted: file.encrypted || false,
      },
      record: {
        id: record._id,
        title: record.title,
        description: record.description,
        category: record.category,
        recordDate: record.metadata.recordDate,
      },
      preview: previewContent,
      accessLogged: true,
    });
  } catch (error) {
    console.error('View file error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}