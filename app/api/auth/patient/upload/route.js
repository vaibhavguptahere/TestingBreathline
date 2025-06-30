import { authenticateToken } from '@/middleware/auth';
import MedicalRecord from '@/models/MedicalRecord';
import connectDB from '@/lib/mongodb';

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

    const formData = await request.formData();
    const files = formData.getAll('files');
    const title = formData.get('title');
    const description = formData.get('description');
    const category = formData.get('category');
    const recordDate = formData.get('recordDate');
    const isEmergencyVisible = formData.get('isEmergencyVisible') === 'true';

    if (!files || files.length === 0) {
      return Response.json({ error: 'No files uploaded' }, { status: 400 });
    }

    await connectDB();

    // In a real implementation, you would save files to a storage service
    // For demo purposes, we'll simulate file storage
    const fileData = files.map(file => ({
      filename: `${Date.now()}_${file.name}`,
      originalName: file.name,
      mimetype: file.type,
      size: file.size,
      path: `/uploads/${Date.now()}_${file.name}`,
      encrypted: true,
    }));

    const record = new MedicalRecord({
      patientId: user._id,
      title: title || 'Uploaded Document',
      description: description || '',
      category: category || 'general',
      files: fileData,
      metadata: {
        recordDate: recordDate ? new Date(recordDate) : new Date(),
        isEmergencyVisible,
      },
    });

    await record.save();

    return Response.json({
      message: 'Files uploaded successfully',
      record,
    }, { status: 201 });
  } catch (error) {
    console.error('Upload error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}