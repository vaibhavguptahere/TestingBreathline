import { authenticateToken } from '@/middleware/auth';
import MedicalRecord from '@/models/MedicalRecord';
import connectDB from '@/lib/mongodb';

export async function GET(request) {
  try {
    const auth = await authenticateToken(request);
    if (auth.error) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const { user } = auth;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 10;
    const page = parseInt(searchParams.get('page')) || 1;
    const category = searchParams.get('category');

    if (user.role !== 'patient') {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    await connectDB();

    const query = { patientId: user._id };
    if (category && category !== 'all') {
      query.category = category;
    }

    const records = await MedicalRecord.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .populate('metadata.doctorId', 'profile.firstName profile.lastName profile.specialization');

    const total = await MedicalRecord.countDocuments(query);

    return Response.json({
      records,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get records error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
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
    const { title, description, category, recordDate, isEmergencyVisible } = body;

    await connectDB();

    const record = new MedicalRecord({
      patientId: user._id,
      title,
      description,
      category,
      metadata: {
        recordDate: recordDate ? new Date(recordDate) : new Date(),
        isEmergencyVisible: isEmergencyVisible || false,
      },
    });

    await record.save();

    return Response.json({
      message: 'Medical record created successfully',
      record,
    }, { status: 201 });
  } catch (error) {
    console.error('Create record error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}