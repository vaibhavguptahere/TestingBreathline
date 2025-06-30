import { authenticateToken } from '@/middleware/auth';
import AccessLog from '@/models/AccessLog';
import User from '@/models/User';
import connectDB from '@/lib/mongodb';

export async function GET(request) {
  try {
    const auth = await authenticateToken(request);
    if (auth.error) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const { user } = auth;
    if (user.role !== 'emergency') {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    await connectDB();

    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    // Get this week's date range
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // Get this month's date range
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Total emergency access today
    const todayAccess = await AccessLog.countDocuments({
      accessorId: user._id,
      accessType: { $in: ['emergency-access', 'qr-access'] },
      timestamp: { $gte: startOfDay, $lt: endOfDay }
    });

    // Active emergencies (access within last 2 hours)
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const activeEmergencies = await AccessLog.countDocuments({
      accessorId: user._id,
      accessType: { $in: ['emergency-access', 'qr-access'] },
      timestamp: { $gte: twoHoursAgo }
    });

    // Total access this week
    const weeklyAccess = await AccessLog.countDocuments({
      accessorId: user._id,
      accessType: { $in: ['emergency-access', 'qr-access'] },
      timestamp: { $gte: startOfWeek }
    });

    // All time emergency access
    const totalAccess = await AccessLog.countDocuments({
      accessorId: user._id,
      accessType: { $in: ['emergency-access', 'qr-access'] }
    });

    // Recent emergency access with patient details
    const recentAccess = await AccessLog.find({
      accessorId: user._id,
      accessType: { $in: ['emergency-access', 'qr-access'] },
    })
    .populate('patientId', 'profile.firstName profile.lastName profile.phone profile.emergencyContact')
    .sort({ timestamp: -1 })
    .limit(10);

    // Emergency access by hour (last 24 hours)
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const hourlyAccess = await AccessLog.aggregate([
      {
        $match: {
          accessorId: user._id,
          accessType: { $in: ['emergency-access', 'qr-access'] },
          timestamp: { $gte: last24Hours }
        }
      },
      {
        $group: {
          _id: { $hour: '$timestamp' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Emergency access by day (last 7 days)
    const dailyAccess = await AccessLog.aggregate([
      {
        $match: {
          accessorId: user._id,
          accessType: { $in: ['emergency-access', 'qr-access'] },
          timestamp: { $gte: startOfWeek }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$timestamp' },
            month: { $month: '$timestamp' },
            day: { $dayOfMonth: '$timestamp' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Response time analysis (time between emergency access events)
    const responseTimes = await AccessLog.aggregate([
      {
        $match: {
          accessorId: user._id,
          accessType: { $in: ['emergency-access', 'qr-access'] },
          timestamp: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: '$patientId',
          accessTimes: { $push: '$timestamp' }
        }
      },
      {
        $project: {
          avgResponseTime: {
            $avg: {
              $map: {
                input: { $range: [1, { $size: '$accessTimes' }] },
                as: 'idx',
                in: {
                  $divide: [
                    { $subtract: [
                      { $arrayElemAt: ['$accessTimes', '$$idx'] },
                      { $arrayElemAt: ['$accessTimes', { $subtract: ['$$idx', 1] }] }
                    ]},
                    60000 // Convert to minutes
                  ]
                }
              }
            }
          }
        }
      }
    ]);

    const avgResponseTime = responseTimes.length > 0 
      ? Math.round(responseTimes.reduce((sum, rt) => sum + (rt.avgResponseTime || 0), 0) / responseTimes.length)
      : 0;

    // Emergency access by location/reason
    const accessByReason = await AccessLog.aggregate([
      {
        $match: {
          accessorId: user._id,
          accessType: { $in: ['emergency-access', 'qr-access'] },
          timestamp: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: '$accessReason',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Unique patients accessed this month
    const uniquePatients = await AccessLog.aggregate([
      {
        $match: {
          accessorId: user._id,
          accessType: { $in: ['emergency-access', 'qr-access'] },
          timestamp: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: '$patientId'
        }
      },
      { $count: 'total' }
    ]);

    const stats = {
      todayAccess,
      activeEmergencies,
      weeklyAccess,
      totalAccess,
      avgResponseTime,
      uniquePatients: uniquePatients[0]?.total || 0,
      recentAccess: recentAccess.map(access => ({
        id: access._id,
        patientName: access.patientId 
          ? `${access.patientId.profile.firstName} ${access.patientId.profile.lastName}`
          : 'Unknown Patient',
        patientPhone: access.patientId?.profile.phone,
        emergencyContact: access.patientId?.profile.emergencyContact,
        accessTime: access.timestamp,
        accessType: access.accessType,
        accessReason: access.accessReason,
        location: access.ipAddress,
        duration: access.metadata?.duration || 'Unknown'
      })),
      hourlyAccess,
      dailyAccess,
      accessByReason,
    };

    return Response.json(stats);
  } catch (error) {
    console.error('Emergency dashboard stats error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}