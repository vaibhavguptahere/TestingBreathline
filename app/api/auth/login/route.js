import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { verifyPassword, generateToken } from '@/lib/auth';

export async function POST(request) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { email, password } = body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return Response.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return Response.json(
        { error: 'Account is deactivated' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      return Response.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = generateToken({ userId: user._id, role: user.role });

    // Return user data (excluding password)
    const userData = {
      id: user._id,
      email: user.email,
      role: user.role,
      profile: user.profile,
      isActive: user.isActive,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
    };

    return Response.json({
      message: 'Login successful',
      token,
      user: userData,
    });
  } catch (error) {
    console.error('Login error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}