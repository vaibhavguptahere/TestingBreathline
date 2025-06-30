import { authenticateToken } from '@/middleware/auth';

// Rate limiting storage (in production, use Redis or database)
const rateLimitStore = new Map();
const DAILY_LIMIT = 50; // 50 requests per day per user

export async function GET(request) {
  try {
    const auth = await authenticateToken(request);
    if (auth.error) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const { user } = auth;
    const rateLimitInfo = getRateLimitInfo(user._id);

    return Response.json({
      dailyLimit: DAILY_LIMIT,
      used: rateLimitInfo.used,
      remaining: rateLimitInfo.remaining,
      resetTime: rateLimitInfo.resetTime,
      percentage: Math.round((rateLimitInfo.used / DAILY_LIMIT) * 100)
    });
  } catch (error) {
    console.error('Rate limit check error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function getRateLimitInfo(userId) {
  const today = new Date().toDateString();
  const userKey = `${userId}_${today}`;
  
  const userLimit = rateLimitStore.get(userKey) || { count: 0, date: today };
  
  // Reset if it's a new day
  if (userLimit.date !== today) {
    userLimit.count = 0;
    userLimit.date = today;
  }
  
  const remaining = DAILY_LIMIT - userLimit.count;
  const resetTime = new Date();
  resetTime.setHours(24, 0, 0, 0); // Next midnight
  
  return {
    used: userLimit.count,
    remaining: Math.max(0, remaining),
    resetTime: resetTime.toISOString()
  };
}