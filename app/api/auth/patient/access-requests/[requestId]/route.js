import { authenticateToken } from '@/middleware/auth';
import AccessRequest from '@/models/AccessRequest';
import MedicalRecord from '@/models/MedicalRecord';
import connectDB from '@/lib/mongodb';

export async function PATCH(request, { params }) {
  try {
    const auth = await authenticateToken(request);
    if (auth.error) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const { user } = auth;
    if (user.role !== 'patient') {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    const { requestId } = params;
    const body = await request.json();
    const { action, responseMessage } = body;

    if (!['approve', 'deny'].includes(action)) {
      return Response.json({ error: 'Invalid action' }, { status: 400 });
    }

    await connectDB();

    // Find the access request
    const accessRequest = await AccessRequest.findById(requestId)
      .populate('doctorId', 'profile.firstName profile.lastName profile.specialization email');

    if (!accessRequest) {
      return Response.json({ error: 'Access request not found' }, { status: 404 });
    }

    // Verify the request belongs to this patient
    if (accessRequest.patientId.toString() !== user._id.toString()) {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    // Update the request status
    const status = action === 'approve' ? 'approved' : 'denied';
    accessRequest.status = status;
    accessRequest.responseMessage = responseMessage || '';
    accessRequest.respondedAt = new Date();

    if (action === 'approve') {
      // Set expiration date (default 30 days)
      accessRequest.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      // Grant access to medical records
      const recordCategories = accessRequest.recordCategories.includes('all')
        ? ['general', 'lab-results', 'prescription', 'imaging', 'emergency', 'consultation']
        : accessRequest.recordCategories;

      await MedicalRecord.updateMany(
        {
          patientId: user._id,
          category: { $in: recordCategories }
        },
        {
          $push: {
            accessPermissions: {
              doctorId: accessRequest.doctorId._id,
              granted: true,
              grantedAt: new Date(),
              expiresAt: accessRequest.expiresAt,
              accessLevel: accessRequest.accessLevel
            }
          }
        }
      );
    }

    await accessRequest.save();

    return Response.json({
      message: `Access request ${action}ed successfully`,
      request: accessRequest
    });
  } catch (error) {
    console.error('Update access request error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}