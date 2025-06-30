import { authenticateToken } from '@/middleware/auth';
import MedicalRecord from '@/models/MedicalRecord';
import connectDB from '@/lib/mongodb';

export async function DELETE(request, { params }) {
  try {
    const auth = await authenticateToken(request);
    if (auth.error) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const { user } = auth;
    if (user.role !== 'patient') {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    const { accessId } = params;

    await connectDB();

    // Remove access permissions for the specified doctor
    const updateResult = await MedicalRecord.updateMany(
      { 
        patientId: user._id,
        'accessPermissions.doctorId': accessId,
      },
      {
        $pull: {
          accessPermissions: {
            doctorId: accessId
          }
        }
      }
    );

    if (updateResult.modifiedCount === 0) {
      return Response.json({ error: 'Access permission not found' }, { status: 404 });
    }

    return Response.json({
      message: 'Access revoked successfully',
      recordsUpdated: updateResult.modifiedCount,
    });
  } catch (error) {
    console.error('Revoke access error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}