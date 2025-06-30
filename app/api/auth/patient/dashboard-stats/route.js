import { authenticateToken } from '@/middleware/auth';
import MedicalRecord from '@/models/MedicalRecord';
import AccessLog from '@/models/AccessLog';
import AccessRequest from '@/models/AccessRequest';
import connectDB from '@/lib/mongodb';

export async function GET(request) {
  try {
    const auth = await authenticateToken(request);
    if (auth.error) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const { user } = auth;
    if (user.role !== 'patient') {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    await connectDB();

    // Get total records count
    const totalRecords = await MedicalRecord.countDocuments({ patientId: user._id });

    // Get shared doctors count (unique doctors with active access)
    const sharedDoctors = await MedicalRecord.aggregate([
      { $match: { patientId: user._id } },
      { $unwind: '$accessPermissions' },
      { $match: { 'accessPermissions.granted': true } },
      { $group: { _id: '$accessPermissions.doctorId' } },
      { $count: 'count' }
    ]);

    // Get recent activity count (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentActivity = await AccessLog.countDocuments({
      patientId: user._id,
      timestamp: { $gte: sevenDaysAgo }
    });

    // Calculate storage used (simplified calculation)
    const records = await MedicalRecord.find({ patientId: user._id });
    let totalSize = 0;
    let totalFiles = 0;
    
    records.forEach(record => {
      if (record.files) {
        record.files.forEach(file => {
          totalSize += file.size || 0;
          totalFiles++;
        });
      }
    });

    // Convert to percentage (assuming 1GB limit)
    const storageUsed = Math.min(Math.round((totalSize / (1024 * 1024 * 1024)) * 100), 100);

    // Get recent records
    const recentRecords = await MedicalRecord.find({ patientId: user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('metadata.doctorId', 'profile.firstName profile.lastName profile.specialization');

    // Get pending access requests
    const pendingRequests = await AccessRequest.countDocuments({
      patientId: user._id,
      status: 'pending'
    });

    // Get category breakdown
    const categoryBreakdown = await MedicalRecord.aggregate([
      { $match: { patientId: user._id } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get monthly upload trends
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const uploadTrends = await MedicalRecord.aggregate([
      {
        $match: {
          patientId: user._id,
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const stats = {
      totalRecords,
      sharedDoctors: sharedDoctors[0]?.count || 0,
      recentActivity,
      storageUsed,
      totalFiles,
      totalSize,
      pendingRequests,
      recentRecords,
      categoryBreakdown,
      uploadTrends,
    };

    return Response.json(stats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}