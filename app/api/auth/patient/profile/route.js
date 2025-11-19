import { authenticateToken } from '@/middleware/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(request) {
  try {
    const auth = await authenticateToken(request);
    if (auth.error) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const { user } = auth;

    return Response.json({
      profile: user.profile,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request) {
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
    const {
      firstName,
      lastName,
      phone,
      dateOfBirth,
      address,
      emergencyContact,
    } = body;

    await connectDB();

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        $set: {
          'profile.firstName': firstName,
          'profile.lastName': lastName,
          'profile.phone': phone,
          'profile.dateOfBirth': dateOfBirth,
          'profile.address': address,
          'profile.emergencyContact': emergencyContact,
        },
      },
      { new: true }
    );

    return Response.json({
      message: 'Profile updated successfully',
      profile: updatedUser.profile,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
