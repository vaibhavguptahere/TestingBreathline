import { authenticateToken } from '@/middleware/auth';
import { generateQRToken } from '@/lib/auth';

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

    const body = await request.json();
    const { expiresIn = '24h' } = body;

    // Generate emergency QR token
    const qrToken = generateQRToken(user._id, expiresIn);

    return Response.json({
      qrToken,
      expiresIn,
      generatedAt: new Date().toISOString(),
      patientName: `${user.profile.firstName} ${user.profile.lastName}`,
    });
  } catch (error) {
    console.error('QR generation error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}