import { authenticateToken } from '@/middleware/auth';
import User from '@/models/User';
import AccessRequest from '@/models/AccessRequest';
import connectDB from '@/lib/mongodb';

export async function POST(request) {
  try {
    const auth = await authenticateToken(request);
    if (auth.error) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const { user } = auth;
    if (user.role !== 'doctor') {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { patientEmail, reason, accessLevel, recordCategories, urgency } = body;

    if (!patientEmail || !reason) {
      return Response.json({ error: 'Patient email and reason are required' }, { status: 400 });
    }

    await connectDB();

    // Find patient by email
    const patient = await User.findOne({ email: patientEmail, role: 'patient' });
    if (!patient) {
      return Response.json({ error: 'Patient not found' }, { status: 404 });
    }

    // Check if request already exists
    const existingRequest = await AccessRequest.findOne({
      doctorId: user._id,
      patientId: patient._id,
      status: 'pending',
    });

    if (existingRequest) {
      return Response.json({ error: 'Access request already pending for this patient' }, { status: 400 });
    }

    // Create access request
    const accessRequest = new AccessRequest({
      doctorId: user._id,
      patientId: patient._id,
      reason,
      accessLevel: accessLevel || 'read',
      recordCategories: recordCategories || ['all'],
      urgency: urgency || 'routine',
      status: 'pending',
    });

    await accessRequest.save();

    return Response.json({
      message: 'Access request sent successfully',
      requestId: accessRequest._id,
    }, { status: 201 });
  } catch (error) {
    console.error('Request access error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}