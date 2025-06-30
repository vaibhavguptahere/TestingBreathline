import { authenticateToken } from '@/middleware/auth';

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
    const body = await request.json();

    // In production, this would update the actual user profile
    console.log('Updating profile:', body);

    return Response.json({
      message: 'Profile updated successfully',
      profile: { ...user.profile, ...body },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}