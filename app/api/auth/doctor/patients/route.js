import { authenticateToken } from '@/middleware/auth';
import MedicalRecord from '@/models/MedicalRecord';
import User from '@/models/User';
import AccessLog from '@/models/AccessLog';
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

    // Get all medical records where this doctor has access
    const accessibleRecords = await MedicalRecord.find({
      'accessPermissions.doctorId': user._id,
      'accessPermissions.granted': true,
    }).populate('patientId', 'profile.firstName profile.lastName profile.phone profile.dateOfBirth profile.address profile.emergencyContact email');

    // Group records by patient and calculate statistics
    const patientsMap = new Map();

    accessibleRecords.forEach(record => {
      if (record.patientId) {
        const patientId = record.patientId._id.toString();
        
        if (!patientsMap.has(patientId)) {
          // Check if access is still valid
          const doctorPermission = record.accessPermissions.find(
            perm => perm.doctorId.toString() === user._id.toString() && perm.granted
          );
          
          const isAccessValid = !doctorPermission?.expiresAt || new Date(doctorPermission.expiresAt) > new Date();
          
          if (isAccessValid) {
            patientsMap.set(patientId, {
              id: record.patientId._id,
              profile: record.patientId.profile,
              email: record.patientId.email,
              records: [],
              recordCount: 0,
              lastAccess: null,
              accessLevel: doctorPermission?.accessLevel || 'read',
              grantedAt: doctorPermission?.grantedAt,
              expiresAt: doctorPermission?.expiresAt,
            });
          }
        }
        
        if (patientsMap.has(patientId)) {
          const patient = patientsMap.get(patientId);
          patient.records.push(record);
          patient.recordCount++;
        }
      }
    });

    // Get last access times for each patient
    for (const [patientId, patient] of patientsMap) {
      const lastAccessLog = await AccessLog.findOne({
        patientId: patientId,
        accessorId: user._id,
      }).sort({ timestamp: -1 });
      
      if (lastAccessLog) {
        patient.lastAccess = lastAccessLog.timestamp;
      }
    }

    const patients = Array.from(patientsMap.values());

    return Response.json({ patients });
  } catch (error) {
    console.error('Error fetching patients:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}