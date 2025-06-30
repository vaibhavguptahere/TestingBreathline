import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { hashPassword, generateToken } from '@/lib/auth';

export async function POST(request) {
  try {
    await connectDB();
    
    const body = await request.json();
    const {
      email,
      password,
      role,
      firstName,
      lastName,
      phone,
      licenseNumber,
      specialization,
      hospital,
      badgeNumber,
      department,
    } = body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return Response.json(
        { error: 'User already exists with this email' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user profile based on role
    const profile = {
      firstName,
      lastName,
      phone,
    };

    if (role === 'doctor') {
      profile.licenseNumber = licenseNumber;
      profile.specialization = specialization;
      profile.hospital = hospital;
      profile.verified = false; // Doctors need verification
    } else if (role === 'emergency') {
      profile.badgeNumber = badgeNumber;
      profile.department = department;
      profile.verified = false; // Emergency responders need verification
    }

    // Create new user
    const user = new User({
      email,
      password: hashedPassword,
      role,
      profile,
    });

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
    };

    return Response.json(
      {
        message: 'User created successfully',
        token,
        user: userData,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
export const dynamic = "force-dynamic";
