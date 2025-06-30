import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import MedicalRecord from '@/models/MedicalRecord';
import AccessLog from '@/models/AccessLog';
import { verifyToken } from '@/lib/auth';
import { authenticateToken } from '@/middleware/auth';

export async function POST(request) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { qrToken } = body;

    if (!qrToken) {
      return Response.json({ error: 'QR token is required' }, { status: 400 });
    }

    // Try to authenticate the emergency responder first
    const auth = await authenticateToken(request);
    let emergencyUserId = null;
    
    if (!auth.error && auth.user && auth.user.role === 'emergency') {
      emergencyUserId = auth.user._id;
    }

    // Verify the QR token
    const decoded = verifyToken(qrToken);
    if (!decoded || decoded.type !== 'emergency') {
      return Response.json({ error: 'Invalid or expired emergency token' }, { status: 401 });
    }

    // Find the patient
    const patient = await User.findById(decoded.userId);
    if (!patient || patient.role !== 'patient') {
      return Response.json({ error: 'Patient not found' }, { status: 404 });
    }

    // Get emergency-visible medical records
    const emergencyRecords = await MedicalRecord.find({
      patientId: patient._id,
      'metadata.isEmergencyVisible': true
    }).select('title description category metadata.recordDate');

    // Log the emergency access
    const clientIp = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const accessLog = new AccessLog({
      patientId: patient._id,
      accessorId: emergencyUserId, // Will be null for anonymous access
      accessType: emergencyUserId ? 'emergency-access' : 'qr-access',
      accessReason: 'Emergency QR code access',
      ipAddress: clientIp,
      userAgent: userAgent,
      emergencyToken: qrToken,
    });

    await accessLog.save();

    // Return patient data (limited for emergency use)
    const patientData = {
      profile: {
        firstName: patient.profile.firstName,
        lastName: patient.profile.lastName,
        dateOfBirth: patient.profile.dateOfBirth,
        phone: patient.profile.phone,
        address: patient.profile.address,
        emergencyContact: patient.profile.emergencyContact,
      },
      emergencyRecords: emergencyRecords.map(record => ({
        title: record.title,
        description: record.description,
        category: record.category,
        recordDate: record.metadata.recordDate,
      })),
    };

    return Response.json({
      message: 'Emergency access granted',
      patient: patientData,
      accessId: accessLog._id,
    });
  } catch (error) {
    console.error('Emergency access error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}