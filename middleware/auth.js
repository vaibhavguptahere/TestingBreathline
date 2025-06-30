import { verifyToken } from '../lib/auth';
import User from '../models/User';
import connectDB from '../lib/mongodb';

export async function authenticateToken(req) {
  const authHeader = req.headers.get('authorization'); // ✅ Web API way

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
  if (!user || !user.isActive) {
    return { error: 'User not found or inactive', status: 401 };
  }

  return { user, decoded };
}
