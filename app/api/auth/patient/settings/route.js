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
    if (user.role !== 'patient') {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    return Response.json({
      settings: user.profile.settings,
    });
  } catch (error) {
    console.error('Get patient settings error:', error);
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

    await connectDB();

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        $set: {
          'profile.settings': {
            ...user.profile.settings,
            ...body,
          },
        },
      },
      { new: true }
    );

    return Response.json({
      message: 'Settings updated successfully',
      settings: updatedUser.profile.settings,
    });
  } catch (error) {
    console.error('Update patient settings error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
