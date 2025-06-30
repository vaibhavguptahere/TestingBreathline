import { authenticateToken } from '@/middleware/auth';
import User from '@/models/User';
import { verifyPassword, hashPassword } from '@/lib/auth';
import connectDB from '@/lib/mongodb';

export async function POST(request) {
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
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return Response.json({ error: 'Current and new passwords are required' }, { status: 400 });
    }

    await connectDB();

    // Verify current password
    const isValidPassword = await verifyPassword(currentPassword, user.password);
    if (!isValidPassword) {
      return Response.json({ error: 'Current password is incorrect' }, { status: 400 });
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Update password
    await User.findByIdAndUpdate(user._id, {
      password: hashedNewPassword,
    });

    return Response.json({
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Change password error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}