import { authenticateToken } from '@/middleware/auth';
import PatientAccessRequest from '@/models/PatientAccessRequest';
import AuditLog from '@/models/AuditLog';
import User from '@/models/User';
import connectDB from '@/lib/mongodb';

export async function PATCH(request, { params }) {
  try {
    const auth = await authenticateToken(request);
    if (auth.error) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const { user } = auth;
    if (user.role !== 'patient') {
      return Response.json({ error: 'Only patients can respond to access requests' }, { status: 403 });
    }

    const { requestId } = params;
    const { action, durationDays, reason, addToTrusted } = await request.json();

    if (!['approve', 'reject'].includes(action)) {
      return Response.json({ error: 'Invalid action' }, { status: 400 });
    }

    await connectDB();

    const accessRequest = await PatientAccessRequest.findById(requestId)
      .populate('doctorId', '_id email');

    if (!accessRequest) {
      return Response.json({ error: 'Request not found' }, { status: 404 });
    }

    if (!accessRequest.patientId.equals(user._id)) {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    if (accessRequest.status !== 'pending') {
      return Response.json(
        { error: `Request already ${accessRequest.status}` },
        { status: 409 }
      );
    }

    if (action === 'approve') {
      accessRequest.status = 'approved';
      accessRequest.approvedAt = new Date();

      // Set access duration (default 30 days)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (durationDays || 30));
      accessRequest.expiresAt = expiresAt;
      accessRequest.accessStartTime = new Date();

      // Add to trusted doctors if requested
      if (addToTrusted) {
        await User.findByIdAndUpdate(
          user._id,
          { $addToSet: { 'profile.trustPatientsList': accessRequest.doctorId._id } },
          { new: true }
        );
      }

      // Create audit log
      await AuditLog.create({
        action: 'PATIENT_ACCESS_REQUEST_APPROVED',
        actorId: user._id,
        actorRole: 'patient',
        targetType: 'access_request',
        targetId: accessRequest._id,
        description: `Patient ${user.email} approved access for doctor ${accessRequest.doctorId.email}`,
        details: {
          durationDays: durationDays || 30,
          addedToTrusted: !!addToTrusted,
          expiresAt: accessRequest.expiresAt,
        },
        ipAddress: request.headers.get('x-forwarded-for') || request.ip,
        userAgent: request.headers.get('user-agent'),
        severity: 'medium',
      });
    } else {
      accessRequest.status = 'rejected';
      accessRequest.rejectedAt = new Date();
      accessRequest.rejectionReason = reason || 'Patient declined access';

      // Create audit log
      await AuditLog.create({
        action: 'PATIENT_ACCESS_REQUEST_REJECTED',
        actorId: user._id,
        actorRole: 'patient',
        targetType: 'access_request',
        targetId: accessRequest._id,
        description: `Patient ${user.email} rejected access for doctor ${accessRequest.doctorId.email}`,
        details: {
          reason: reason || 'No reason provided',
        },
        ipAddress: request.headers.get('x-forwarded-for') || request.ip,
        userAgent: request.headers.get('user-agent'),
        severity: 'low',
      });
    }

    await accessRequest.save();

    return Response.json({
      message: `Access request ${action}ed successfully`,
      accessRequest: {
        _id: accessRequest._id,
        status: accessRequest.status,
        expiresAt: accessRequest.expiresAt,
        approvedAt: accessRequest.approvedAt,
        rejectedAt: accessRequest.rejectedAt,
      },
    });
  } catch (error) {
    console.error('Update access request error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request, { params }) {
  try {
    const auth = await authenticateToken(request);
    if (auth.error) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const { requestId } = params;
    const { user } = auth;

    await connectDB();

    const accessRequest = await PatientAccessRequest.findById(requestId)
      .populate('doctorId', 'email profile.firstName profile.lastName profile.specialization')
      .populate('patientId', 'email profile.firstName profile.lastName');

    if (!accessRequest) {
      return Response.json({ error: 'Request not found' }, { status: 404 });
    }

    // Check authorization
    if (
      (user.role === 'patient' && !accessRequest.patientId._id.equals(user._id)) ||
      (user.role === 'doctor' && !accessRequest.doctorId._id.equals(user._id))
    ) {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    return Response.json({ accessRequest });
  } catch (error) {
    console.error('Get access request error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
