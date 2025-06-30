import { authenticateToken } from '@/middleware/auth';
import AccessRequest from '@/models/AccessRequest';
import connectDB from '@/lib/mongodb';

export async function PUT(request, { params }) {
  try {
    const auth = await authenticateToken(request);
    if (auth.error) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const { user } = auth;
    if (user.role !== 'doctor') {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    const { requestId } = params;
    const body = await request.json();
    const { reason, accessLevel, recordCategories, urgency } = body;

    await connectDB();

    // Find the access request
    const accessRequest = await AccessRequest.findById(requestId);
    if (!accessRequest) {
      return Response.json({ error: 'Access request not found' }, { status: 404 });
    }

    // Verify the request belongs to this doctor
    if (accessRequest.doctorId.toString() !== user._id.toString()) {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    // Only allow editing pending requests
    if (accessRequest.status !== 'pending') {
      return Response.json({ error: 'Cannot edit non-pending requests' }, { status: 400 });
    }

    // Update the request
    accessRequest.reason = reason;
    accessRequest.accessLevel = accessLevel;
    accessRequest.recordCategories = recordCategories;
    accessRequest.urgency = urgency;

    await accessRequest.save();

    return Response.json({
      message: 'Access request updated successfully',
      request: accessRequest
    });
  } catch (error) {
    console.error('Update access request error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const auth = await authenticateToken(request);
    if (auth.error) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const { user } = auth;
    if (user.role !== 'doctor') {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    const { requestId } = params;

    await connectDB();

    // Find and delete the access request
    const accessRequest = await AccessRequest.findById(requestId);
    if (!accessRequest) {
      return Response.json({ error: 'Access request not found' }, { status: 404 });
    }

    // Verify the request belongs to this doctor
    if (accessRequest.doctorId.toString() !== user._id.toString()) {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    // Only allow deleting pending requests
    if (accessRequest.status !== 'pending') {
      return Response.json({ error: 'Cannot delete non-pending requests' }, { status: 400 });
    }

    await AccessRequest.findByIdAndDelete(requestId);

    return Response.json({
      message: 'Access request deleted successfully'
    });
  } catch (error) {
    console.error('Delete access request error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}