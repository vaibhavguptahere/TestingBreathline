import { verifyToken } from '@/lib/auth';
import User from '@/models/User';
import connectDB from '@/lib/mongodb';

export async function authenticateToken(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return { error: 'Access token required', status: 401 };
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return { error: 'Invalid or expired token', status: 401 };
    }

    await connectDB();
    const user = await User.findById(decoded.userId);
    if (!user) {
      return { error: 'User not found', status: 404 };
    }

    return { user };
  } catch (error) {
    console.error('Authentication error:', error);
    return { error: 'Authentication failed', status: 500 };
  }
}