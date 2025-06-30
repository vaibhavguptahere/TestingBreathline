import { authenticateToken } from '@/middleware/auth';

// Simple in-memory rate limiting (in production, use Redis or database)
const rateLimits = new Map();

const DAILY_LIMIT = 50; // 50 requests per day
const RESET_HOUR = 0; // Reset at midnight

export async function GET(request) {
  try {
    const auth = await authenticateToken(request);
    if (auth.error) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const { user } = auth;
    const userId = user._id.toString();
    const today = new Date().toDateString();
    const key = `${userId}:${today}`;

    // Get current usage
    const currentUsage = rateLimits.get(key) || { used: 0, date: today };
    
    // Check if we need to reset (new day)
    if (currentUsage.date !== today) {
      currentUsage.used = 0;
      currentUsage.date = today;
    }

    const remaining = Math.max(0, DAILY_LIMIT - currentUsage.used);
    const percentage = Math.min((currentUsage.used / DAILY_LIMIT) * 100, 100);

    // Calculate reset time (next midnight)
    const resetTime = new Date();
    resetTime.setDate(resetTime.getDate() + 1);
    resetTime.setHours(RESET_HOUR, 0, 0, 0);

    return Response.json({
      dailyLimit: DAILY_LIMIT,
      used: currentUsage.used,
      remaining,
      percentage: Math.round(percentage),
      resetTime: resetTime.toISOString(),
    });
  } catch (error) {
    console.error('Rate limit check error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export function incrementUsage(userId) {
  const today = new Date().toDateString();
  const key = `${userId}:${today}`;
  
  const currentUsage = rateLimits.get(key) || { used: 0, date: today };
  currentUsage.used += 1;
  currentUsage.date = today;
  
  rateLimits.set(key, currentUsage);
  
  return {
    used: currentUsage.used,
    remaining: Math.max(0, DAILY_LIMIT - currentUsage.used),
    limitExceeded: currentUsage.used > DAILY_LIMIT,
  };
}

export function checkRateLimit(userId) {
  const today = new Date().toDateString();
  const key = `${userId}:${today}`;
  
  const currentUsage = rateLimits.get(key) || { used: 0, date: today };
  
  return {
    used: currentUsage.used,
    remaining: Math.max(0, DAILY_LIMIT - currentUsage.used),
    limitExceeded: currentUsage.used >= DAILY_LIMIT,
  };
}