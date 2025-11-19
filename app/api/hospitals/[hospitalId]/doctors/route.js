import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Hospital from '@/models/Hospital';

export async function GET(request, { params }) {
  try {
    const { hospitalId } = params;

    if (!hospitalId || hospitalId === 'undefined') {
      return Response.json({ error: 'Hospital ID is required' }, { status: 400 });
    }

    await connectDB();

    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) {
      return Response.json({ error: 'Hospital not found' }, { status: 404 });
    }

    const doctors = await User.find({
      role: 'doctor',
      'profile.hospitalId': hospitalId,
      isActive: true,
    }).select('_id email profile.firstName profile.lastName profile.specialization profile.hospital profile.licenseNumber');

    const formattedDoctors = doctors.map(doc => ({
      _id: doc._id,
      email: doc.email,
      firstName: doc.profile.firstName,
      lastName: doc.profile.lastName,
      specialization: doc.profile.specialization,
      hospital: doc.profile.hospital,
      licenseNumber: doc.profile.licenseNumber,
    }));

    return Response.json({
      hospital: {
        _id: hospital._id,
        name: hospital.name,
        address: hospital.address,
        phone: hospital.phone,
        email: hospital.email,
      },
      doctors: formattedDoctors,
    });
  } catch (error) {
    console.error('Get hospital doctors error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
