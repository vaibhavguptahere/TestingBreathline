import { authenticateToken } from '@/middleware/auth';
import PatientAccessRequest from '@/models/PatientAccessRequest';
import AuditLog from '@/models/AuditLog';
import User from '@/models/User';
import DoctorVerification from '@/models/DoctorVerification';
import connectDB from '@/lib/mongodb';

export async function POST(request) {
  try {
    const auth = await authenticateToken(request);
    if (auth.error) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const { user } = auth;
    if (user.role !== 'doctor') {
      return Response.json({ error: 'Only doctors can request access' }, { status: 403 });
    }

    await connectDB();

    // Check if doctor is verified
    const doctorVerification = await DoctorVerification.findOne({ doctorId: user._id });
    if (!doctorVerification || doctorVerification.status !== 'verified') {
      return Response.json({
        error: 'Doctor verification required',
        status: 'not_verified',
      }, { status: 403 });
    }

    const { patientId, reason, accessLevel, recordCategories, patientUniqueId } = await request.json();

    if (!patientId && !patientUniqueId) {
      return Response.json({ error: 'Patient ID or unique ID is required' }, { status: 400 });
    }

    let patient;
    if (patientId) {
      patient = await User.findById(patientId);
    } else if (patientUniqueId) {
      // Search by custom unique ID (email suffix or custom field)
      patient = await User.findOne({
        $or: [
          { _id: patientUniqueId },
          { email: { $regex: patientUniqueId } },
        ],
        role: 'patient',
      });
    }

    if (!patient || patient.role !== 'patient') {
      return Response.json({ error: 'Patient not found' }, { status: 404 });
    }

    // Check for existing pending request
    const existingRequest = await PatientAccessRequest.findOne({
      doctorId: user._id,
      patientId: patient._id,
      status: 'pending',
    });

    if (existingRequest && new Date() - existingRequest.requestedAt < 3600000) {
      // Within 1 hour
      return Response.json(
        { error: 'Access request already pending for this patient' },
        { status: 409 }
      );
    }

    // Check if doctor is in patient's trusted list
    const isTrustedDoctor = patient.profile?.trustPatientsList?.includes(user._id);

    const accessRequest = new PatientAccessRequest({
      doctorId: user._id,
      patientId: patient._id,
      status: isTrustedDoctor ? 'approved' : 'pending',
      reason: reason || 'Patient data access required',
      accessLevel: accessLevel || 'read',
      recordCategories: recordCategories || ['all'],
      requestedAt: new Date(),
      ipAddress: request.headers.get('x-forwarded-for') || request.ip,
      userAgent: request.headers.get('user-agent'),
      isAutoApproved: isTrustedDoctor,
    });

    if (isTrustedDoctor) {
      accessRequest.approvedAt = new Date();
      // Calculate expiration (default 30 days)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
      accessRequest.expiresAt = expiresAt;
      accessRequest.accessStartTime = new Date();
    }

    await accessRequest.save();

    // Create audit log
    await AuditLog.create({
      action: 'PATIENT_ACCESS_REQUEST_CREATED',
      actorId: user._id,
      actorRole: 'doctor',
      targetType: 'access_request',
      targetId: accessRequest._id,
      description: `Doctor ${user.email} requested access to patient ${patient.email}`,
      details: {
        patientId: patient._id,
        reason,
        accessLevel,
        isTrustedDoctor,
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.ip,
      userAgent: request.headers.get('user-agent'),
      severity: 'medium',
    });

    return Response.json({
      accessRequest: {
        _id: accessRequest._id,
        status: accessRequest.status,
        patient: {
          _id: patient._id,
          name: `${patient.profile.firstName} ${patient.profile.lastName}`,
          email: patient.email,
        },
        isAutoApproved: isTrustedDoctor,
        expiresAt: accessRequest.expiresAt,
      },
      message: isTrustedDoctor
        ? 'Access auto-approved (trusted doctor)'
        : 'Access request sent to patient. Awaiting approval.',
    }, { status: 201 });
  } catch (error) {
    console.error('Create access request error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const auth = await authenticateToken(request);
    if (auth.error) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const { user } = auth;
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('requestId');

    await connectDB();

    if (requestId) {
      const accessRequest = await PatientAccessRequest.findById(requestId)
        .populate('doctorId', 'email profile.firstName profile.lastName profile.specialization')
        .populate('patientId', 'email profile.firstName profile.lastName');

      if (!accessRequest) {
        return Response.json({ error: 'Request not found' }, { status: 404 });
      }

      if (user.role === 'doctor' && !accessRequest.doctorId._id.equals(user._id)) {
        return Response.json({ error: 'Access denied' }, { status: 403 });
      }

      if (user.role === 'patient' && !accessRequest.patientId._id.equals(user._id)) {
        return Response.json({ error: 'Access denied' }, { status: 403 });
      }

      return Response.json({ accessRequest });
    }

    const requests = await PatientAccessRequest.find(
      user.role === 'doctor'
        ? { doctorId: user._id }
        : { patientId: user._id }
    )
      .populate('doctorId', 'email profile.firstName profile.lastName profile.specialization')
      .populate('patientId', 'email profile.firstName profile.lastName')
      .sort({ requestedAt: -1 });

    return Response.json({ accessRequests: requests });
  } catch (error) {
    console.error('Get access request error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
