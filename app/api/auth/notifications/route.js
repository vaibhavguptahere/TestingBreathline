import { authenticateToken } from '@/middleware/auth';
import AccessRequest from '@/models/AccessRequest';
import AccessLog from '@/models/AccessLog';
import connectDB from '@/lib/mongodb';

export async function GET(request) {
  try {
    const auth = await authenticateToken(request);
    if (auth.error) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const { user } = auth;
    await connectDB();

    let notifications = [];

    if (user.role === 'patient') {
      // Get pending access requests for this patient
      const accessRequests = await AccessRequest.find({
        patientId: user._id,
        status: 'pending'
      }).populate('doctorId', 'profile.firstName profile.lastName profile.specialization email');

      // Get recent access logs
      const recentAccess = await AccessLog.find({
        patientId: user._id,
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }).populate('accessorId', 'profile.firstName profile.lastName profile.specialization')
        .sort({ createdAt: -1 })
        .limit(10);

      // Convert access requests to notifications
      accessRequests.forEach(request => {
        notifications.push({
          id: request._id.toString(),
          type: 'access_request',
          title: 'New Access Request',
          message: `Dr. ${request.doctorId.profile.firstName} ${request.doctorId.profile.lastName} has requested access to your medical records`,
          timestamp: request.createdAt,
          read: false,
          data: {
            doctorName: `Dr. ${request.doctorId.profile.firstName} ${request.doctorId.profile.lastName}`,
            requestId: request._id.toString(),
            specialization: request.doctorId.profile.specialization,
            reason: request.reason,
            urgency: request.urgency
          },
        });
      });

      // Convert access logs to notifications
      recentAccess.forEach(log => {
        if (log.accessorId && log.accessType === 'view') {
          notifications.push({
            id: log._id.toString(),
            type: 'record_accessed',
            title: 'Record Accessed',
            message: `Dr. ${log.accessorId.profile.firstName} ${log.accessorId.profile.lastName} accessed your medical records`,
            timestamp: log.createdAt,
            read: true,
            data: {
              doctorName: `Dr. ${log.accessorId.profile.firstName} ${log.accessorId.profile.lastName}`,
              recordType: 'Medical Records',
              accessTime: log.createdAt
            },
          });
        }
      });

    } else if (user.role === 'doctor') {
      // Get approved access requests for this doctor
      const approvedRequests = await AccessRequest.find({
        doctorId: user._id,
        status: 'approved',
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }).populate('patientId', 'profile.firstName profile.lastName');

      // Get denied requests
      const deniedRequests = await AccessRequest.find({
        doctorId: user._id,
        status: 'denied',
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }).populate('patientId', 'profile.firstName profile.lastName');

      approvedRequests.forEach(request => {
        notifications.push({
          id: request._id.toString(),
          type: 'access_granted',
          title: 'Access Granted',
          message: `${request.patientId.profile.firstName} ${request.patientId.profile.lastName} has granted you access to their medical records`,
          timestamp: request.respondedAt || request.createdAt,
          read: false,
          data: {
            patientName: `${request.patientId.profile.firstName} ${request.patientId.profile.lastName}`,
            accessLevel: request.accessLevel,
            expiresAt: request.expiresAt
          },
        });
      });

      deniedRequests.forEach(request => {
        notifications.push({
          id: request._id.toString(),
          type: 'access_denied',
          title: 'Access Denied',
          message: `${request.patientId.profile.firstName} ${request.patientId.profile.lastName} has denied your access request`,
          timestamp: request.respondedAt || request.createdAt,
          read: false,
          data: {
            patientName: `${request.patientId.profile.firstName} ${request.patientId.profile.lastName}`,
            reason: request.responseMessage
          },
        });
      });

    } else if (user.role === 'emergency') {
      // Get recent emergency access logs
      const emergencyAccess = await AccessLog.find({
        accessorId: user._id,
        accessType: { $in: ['emergency-access', 'qr-access'] },
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }).populate('patientId', 'profile.firstName profile.lastName')
        .sort({ createdAt: -1 })
        .limit(5);

      emergencyAccess.forEach(log => {
        notifications.push({
          id: log._id.toString(),
          type: 'emergency_access',
          title: 'Emergency Access Logged',
          message: `Emergency access to ${log.patientId.profile.firstName} ${log.patientId.profile.lastName}'s records has been logged`,
          timestamp: log.createdAt,
          read: true,
          data: {
            patientName: `${log.patientId.profile.firstName} ${log.patientId.profile.lastName}`,
            accessType: log.accessType,
            location: log.accessReason
          },
        });
      });
    }

    // Sort notifications by timestamp (newest first)
    notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return Response.json({ notifications });
  } catch (error) {
    console.error('Get notifications error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const auth = await authenticateToken(request);
    if (auth.error) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { notificationId, action } = body;

    // In a production app, you would update the notification status in the database
    // For now, we'll just return success
    console.log(`Marking notification ${notificationId} as ${action}`);

    return Response.json({
      message: 'Notification updated successfully',
    });
  } catch (error) {
    console.error('Update notification error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}