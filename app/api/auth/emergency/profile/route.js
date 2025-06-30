import { authenticateToken } from '@/middleware/auth';
import User from '@/models/User';
import connectDB from '@/lib/mongodb';

export async function GET(request) {
  try {
    const auth = await authenticateToken(request);
    if (auth.error) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const { user } = auth;
    if (user.role !== 'emergency') {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    return Response.json({
      profile: user.profile,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error('Get emergency profile error:', error);
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
    if (user.role !== 'emergency') {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      phone,
      badgeNumber,
      department,
      station,
      address,
      certifications,
    } = body;

    await connectDB();

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        $set: {
          'profile.firstName': firstName,
          'profile.lastName': lastName,
          'profile.phone': phone,
          'profile.badgeNumber': badgeNumber,
          'profile.department': department,
          'profile.station': station,
          'profile.address': address,
          'profile.certifications': certifications,
        },
      },
      { new: true }
    );

    return Response.json({
      message: 'Profile updated successfully',
      profile: updatedUser.profile,
    });
  } catch (error) {
    console.error('Update emergency profile error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}