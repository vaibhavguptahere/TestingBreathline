import { authenticateToken } from '@/middleware/auth';
import MedicalRecord from '@/models/MedicalRecord';
import User from '@/models/User';
import connectDB from '@/lib/mongodb';

export async function GET(request) {
  try {
    const auth = await authenticateToken(request);
    if (auth.error) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const { user } = auth;
    if (user.role !== 'patient') {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    await connectDB();

    // Get all medical records for this patient that have access permissions
    const recordsWithAccess = await MedicalRecord.find({
      patientId: user._id,
      'accessPermissions.granted': true,
    }).populate('accessPermissions.doctorId', 'profile.firstName profile.lastName profile.specialization profile.hospital email');

    // Extract unique shared access entries
    const sharedAccessMap = new Map();

    recordsWithAccess.forEach(record => {
      record.accessPermissions.forEach(permission => {
        if (permission.granted && permission.doctorId) {
          const doctorId = permission.doctorId._id.toString();
          
          if (!sharedAccessMap.has(doctorId)) {
            // Determine status based on expiration
            const now = new Date();
            let status = 'active';
            if (permission.expiresAt && permission.expiresAt < now) {
              status = 'expired';
            }

            sharedAccessMap.set(doctorId, {
              id: doctorId,
              doctor: {
                name: `${permission.doctorId.profile.firstName} ${permission.doctorId.profile.lastName}`,
                email: permission.doctorId.email,
                specialization: permission.doctorId.profile.specialization || 'General Practice',
                hospital: permission.doctorId.profile.hospital || 'Not specified',
              },
              accessLevel: permission.accessLevel || 'read',
              status: status,
              grantedAt: permission.grantedAt,
              expiresAt: permission.expiresAt,
              recordCategories: ['all'], // Simplified for now
              recordCount: 0,
            });
          }
          
          // Increment record count
          const access = sharedAccessMap.get(doctorId);
          access.recordCount++;
        }
      });
    });

    const sharedAccess = Array.from(sharedAccessMap.values());

    return Response.json({ sharedAccess });
  } catch (error) {
    console.error('Get shared access error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await authenticateToken(request);
    if (auth.error) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const { user } = auth;
    if (user.role !== 'patient') {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { doctorEmail, accessLevel, expiresIn, recordCategories } = body;

    if (!doctorEmail) {
      return Response.json({ error: 'Doctor email is required' }, { status: 400 });
    }

    await connectDB();

    // Find the doctor by email
    const doctor = await User.findOne({ email: doctorEmail, role: 'doctor' });
    if (!doctor) {
      return Response.json({ error: 'Doctor not found' }, { status: 404 });
    }

    // Calculate expiration date
    const expirationDate = new Date();
    switch (expiresIn) {
      case '7d':
        expirationDate.setDate(expirationDate.getDate() + 7);
        break;
      case '30d':
        expirationDate.setDate(expirationDate.getDate() + 30);
        break;
      case '90d':
        expirationDate.setDate(expirationDate.getDate() + 90);
        break;
      case '1y':
        expirationDate.setFullYear(expirationDate.getFullYear() + 1);
        break;
      default:
        expirationDate.setDate(expirationDate.getDate() + 30);
    }

    // Determine which records to grant access to
    const query = { patientId: user._id };
    if (recordCategories && !recordCategories.includes('all')) {
      query.category = { $in: recordCategories };
    }

    // Update medical records with new access permission
    const updateResult = await MedicalRecord.updateMany(
      query,
      {
        $push: {
          accessPermissions: {
            doctorId: doctor._id,
            granted: true,
            grantedAt: new Date(),
            expiresAt: expirationDate,
            accessLevel: accessLevel || 'read',
          }
        }
      }
    );

    return Response.json({
      message: 'Access shared successfully',
      accessId: `${doctor._id}_${Date.now()}`,
      recordsUpdated: updateResult.modifiedCount,
    }, { status: 201 });
  } catch (error) {
    console.error('Share access error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}