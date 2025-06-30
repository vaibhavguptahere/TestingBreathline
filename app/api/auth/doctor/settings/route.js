import { authenticateToken } from '@/middleware/auth';
import User from '@/models/User';
import connectDB from '@/lib/mongodb';

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
    
    await connectDB();

    // Update user settings
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
    console.error('Update settings error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}