import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { hashPassword } from '@/lib/auth';

// Hardcoded admin credentials
const ADMIN_EMAIL = 'admin@breathline.com';
const ADMIN_PASSWORD = 'Admin@123456';
const ADMIN_NAME = 'Admin';

export async function POST(request) {
  try {
    await connectDB();

    // Check if admin already exists
    const existingAdmin = await User.findOne({
      email: ADMIN_EMAIL,
      role: 'admin',
    });

    if (existingAdmin) {
      return Response.json(
        {
          message: 'Admin account already exists',
          email: ADMIN_EMAIL,
          status: 'already_created',
        },
        { status: 200 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(ADMIN_PASSWORD);

    // Create admin user
    const adminUser = new User({
      email: ADMIN_EMAIL,
      password: hashedPassword,
      role: 'admin',
      profile: {
        firstName: ADMIN_NAME,
        lastName: 'User',
        isAdmin: true,
      },
      isActive: true,
    });

    await adminUser.save();

    return Response.json(
      {
        message: 'Admin account created successfully',
        credentials: {
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
        },
        loginUrl: '/login',
        dashboardUrl: '/dashboard/admin',
        warning: 'SAVE THESE CREDENTIALS. Store them securely.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Admin setup error:', error);
    return Response.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    await connectDB();

    // Check admin status
    const adminExists = await User.findOne({
      email: ADMIN_EMAIL,
      role: 'admin',
    });

    return Response.json({
      adminExists: !!adminExists,
      email: adminExists ? ADMIN_EMAIL : null,
      message: adminExists
        ? 'Admin account already set up. Login with the configured credentials.'
        : 'Admin account not set up. Run POST to create it.',
    });
  } catch (error) {
    console.error('Admin check error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
