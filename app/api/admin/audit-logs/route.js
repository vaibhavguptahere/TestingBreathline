import { authenticateToken } from '@/middleware/auth';
import AuditLog from '@/models/AuditLog';
import User from '@/models/User';
import connectDB from '@/lib/mongodb';

async function checkAdminAccess(auth) {
  if (auth.error) {
    return { error: auth.error, status: auth.status };
  }

  const { user } = auth;
  if (user.role !== 'admin') {
    return { error: 'Access denied: Admin role required', status: 403 };
  }

  return { success: true };
}

export async function GET(request) {
  try {
    const auth = await authenticateToken(request);
    const adminCheck = await checkAdminAccess(auth);
    if (adminCheck.error) {
      return Response.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const actorRole = searchParams.get('actorRole');
    const targetType = searchParams.get('targetType');
    const severity = searchParams.get('severity');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 50;

    await connectDB();

    const query = {};
    if (action) query.action = action;
    if (actorRole) query.actorRole = actorRole;
    if (targetType) query.targetType = targetType;
    if (severity) query.severity = severity;

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.timestamp.$lte = end;
      }
    }

    const logs = await AuditLog.find(query)
      .populate('actorId', 'email profile.firstName profile.lastName profile.specialization')
      .populate('targetId')
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await AuditLog.countDocuments(query);

    return Response.json({
      logs: logs.map(log => ({
        _id: log._id,
        action: log.action,
        actor: {
          _id: log.actorId?._id,
          email: log.actorId?.email,
          name: log.actorId
            ? `${log.actorId.profile?.firstName} ${log.actorId.profile?.lastName}`
            : 'System',
        },
        actorRole: log.actorRole,
        targetType: log.targetType,
        targetId: log.targetId?._id,
        description: log.description,
        severity: log.severity,
        status: log.status,
        ipAddress: log.ipAddress,
        timestamp: log.timestamp,
        details: log.details,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await authenticateToken(request);
    const adminCheck = await checkAdminAccess(auth);
    if (adminCheck.error) {
      return Response.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    const body = await request.json();
    const {
      action,
      actorRole,
      targetType,
      targetId,
      description,
      details,
      severity,
    } = body;

    if (!action || !actorRole) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await connectDB();

    const log = new AuditLog({
      action,
      actorId: auth.user._id,
      actorRole,
      targetType,
      targetId,
      description,
      details,
      severity: severity || 'low',
      ipAddress: request.headers.get('x-forwarded-for') || request.ip,
      userAgent: request.headers.get('user-agent'),
    });

    await log.save();

    return Response.json({ log }, { status: 201 });
  } catch (error) {
    console.error('Create audit log error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
