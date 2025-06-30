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
    if (user.role !== 'doctor') {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    await connectDB();

    // Get total patients with active access
    const totalPatients = await MedicalRecord.aggregate([
      {
        $match: {
          'accessPermissions.doctorId': user._id,
          'accessPermissions.granted': true,
        }
      },
      {
        $group: {
          _id: '$patientId'
        }
      },
      {
        $count: 'total'
      }
    ]);

    // Get pending access requests
    const pendingRequests = await AccessRequest.countDocuments({
      doctorId: user._id,
      status: 'pending',
    });

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentActivity = await AccessLog.countDocuments({
      accessorId: user._id,
      timestamp: { $gte: sevenDaysAgo },
    });

    // Get total records accessed this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const recordsAccessedThisMonth = await AccessLog.countDocuments({
      accessorId: user._id,
      accessType: 'view',
      timestamp: { $gte: startOfMonth },
    });

    // Get recent patients with their last access
    const recentPatients = await AccessLog.aggregate([
      {
        $match: {
          accessorId: user._id,
          accessType: 'view',
        }
      },
      {
        $sort: { timestamp: -1 }
      },
      {
        $group: {
          _id: '$patientId',
          lastAccess: { $first: '$timestamp' },
          accessCount: { $sum: 1 }
        }
      },
      {
        $sort: { lastAccess: -1 }
      },
      {
        $limit: 5
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'patient'
        }
      },
      {
        $unwind: '$patient'
      },
      {
        $lookup: {
          from: 'medicalrecords',
          let: { patientId: '$_id', doctorId: user._id },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$patientId', '$$patientId'] },
                    {
                      $in: [
                        '$$doctorId',
                        {
                          $map: {
                            input: {
                              $filter: {
                                input: '$accessPermissions',
                                cond: { $eq: ['$$this.granted', true] }
                              }
                            },
                            as: 'perm',
                            in: '$$perm.doctorId'
                          }
                        }
                      ]
                    }
                  ]
                }
              }
            }
          ],
          as: 'records'
        }
      },
      {
        $project: {
          patientId: '$_id',
          patientName: {
            $concat: ['$patient.profile.firstName', ' ', '$patient.profile.lastName']
          },
          patientEmail: '$patient.email',
          lastAccess: 1,
          accessCount: 1,
          recordCount: { $size: '$records' }
        }
      }
    ]);

    // Get activity trends for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activityTrends = await AccessLog.aggregate([
      {
        $match: {
          accessorId: user._id,
          timestamp: { $gte: thirtyDaysAgo },
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$timestamp'
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);

    const stats = {
      totalPatients: totalPatients[0]?.total || 0,
      pendingRequests,
      recentActivity,
      recordsAccessedThisMonth,
      recentPatients,
      activityTrends,
    };

    return Response.json(stats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}