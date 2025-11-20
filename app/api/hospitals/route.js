import connectDB from '@/lib/mongodb';
import Hospital from '@/models/Hospital';

export async function GET(request) {
  try {
    await connectDB();

    const hospitals = await Hospital.find({ isActive: true })
      .select('_id name address phone email')
      .sort({ name: 1 });

    return Response.json({ hospitals });
  } catch (error) {
    console.error('Get hospitals error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = request.headers.get('authorization');
    if (!auth || !auth.startsWith('Bearer ')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();
    const { name, address, phone, email, website, registrationNumber, departments } = body;

    if (!name) {
      return Response.json({ error: 'Hospital name is required' }, { status: 400 });
    }

    const hospital = new Hospital({
      name,
      address,
      phone,
      email,
      website,
      registrationNumber,
      departments,
    });

    await hospital.save();
    return Response.json(hospital, { status: 201 });
  } catch (error) {
    console.error('Create hospital error:', error);
    if (error.code === 11000) {
      return Response.json({ error: 'Hospital with this name already exists' }, { status: 409 });
    }
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
