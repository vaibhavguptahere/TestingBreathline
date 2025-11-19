import connectDB from '@/lib/mongodb';
import Hospital from '@/models/Hospital';

const SAMPLE_HOSPITALS = [
  {
    name: 'City General Hospital',
    address: {
      street: '123 Main Street',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'USA',
    },
    phone: '+1-555-0123',
    email: 'info@citygeneralhospital.com',
    website: 'https://citygeneralhospital.com',
    registrationNumber: 'CGH-2024-001',
    departments: ['Cardiology', 'Emergency', 'Surgery', 'Orthopedics'],
    totalBeds: 500,
    emergencyServices: true,
    description: 'A leading multi-specialty hospital providing comprehensive healthcare services.',
  },
  {
    name: 'St. Mary\'s Medical Center',
    address: {
      street: '456 Oak Avenue',
      city: 'Los Angeles',
      state: 'CA',
      postalCode: '90001',
      country: 'USA',
    },
    phone: '+1-555-0456',
    email: 'contact@stmarysmedical.com',
    website: 'https://stmarysmedical.com',
    registrationNumber: 'SMC-2024-002',
    departments: ['Pediatrics', 'Neurology', 'Oncology', 'Radiology'],
    totalBeds: 350,
    emergencyServices: true,
    description: 'Advanced medical center specializing in complex medical conditions.',
  },
  {
    name: 'Riverside Hospital',
    address: {
      street: '789 River Road',
      city: 'Chicago',
      state: 'IL',
      postalCode: '60601',
      country: 'USA',
    },
    phone: '+1-555-0789',
    email: 'admin@riversidehospital.com',
    website: 'https://riversidehospital.com',
    registrationNumber: 'RH-2024-003',
    departments: ['Cardiology', 'Internal Medicine', 'Orthopedics'],
    totalBeds: 250,
    emergencyServices: true,
    description: 'Community-focused hospital with state-of-the-art facilities.',
  },
  {
    name: 'Medical Plaza Hospital',
    address: {
      street: '321 Medical Drive',
      city: 'Houston',
      state: 'TX',
      postalCode: '77001',
      country: 'USA',
    },
    phone: '+1-555-0321',
    email: 'info@medicalplaza.com',
    website: 'https://medicalplaza.com',
    registrationNumber: 'MPH-2024-004',
    departments: ['Surgery', 'Trauma', 'Emergency', 'Critical Care'],
    totalBeds: 400,
    emergencyServices: true,
    description: 'Trauma and emergency specialty hospital.',
  },
];

export async function POST(request) {
  try {
    const auth = request.headers.get('authorization');
    if (!auth || !auth.startsWith('Bearer ')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const existingHospitals = await Hospital.countDocuments();
    if (existingHospitals > 0) {
      return Response.json({
        message: 'Hospitals already exist',
        count: existingHospitals,
      });
    }

    const insertedHospitals = await Hospital.insertMany(SAMPLE_HOSPITALS);

    return Response.json({
      message: 'Hospitals seeded successfully',
      count: insertedHospitals.length,
      hospitals: insertedHospitals,
    });
  } catch (error) {
    console.error('Seed hospitals error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    await connectDB();

    const count = await Hospital.countDocuments();
    const hospitals = await Hospital.find().select('name address').sort({ name: 1 });

    return Response.json({
      count,
      hospitals,
    });
  } catch (error) {
    console.error('Get hospitals count error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
