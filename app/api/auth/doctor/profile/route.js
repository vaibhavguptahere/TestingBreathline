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
    if (user.role !== 'doctor') {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    return Response.json({
      profile: user.profile,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error('Get doctor profile error:', error);
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
    if (user.role !== 'doctor') {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      phone,
      licenseNumber,
      specialization,
      hospital,
      address,
      bio,
    } = body;

    await connectDB();

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        $set: {
          'profile.firstName': firstName,
          'profile.lastName': lastName,
          'profile.phone': phone,
          'profile.licenseNumber': licenseNumber,
          'profile.specialization': specialization,
          'profile.hospital': hospital,
          'profile.address': address,
          'profile.bio': bio,
        },
      },
      { new: true }
    );

    return Response.json({
      message: 'Profile updated successfully',
      profile: updatedUser.profile,
    });
  } catch (error) {
    console.error('Update doctor profile error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}