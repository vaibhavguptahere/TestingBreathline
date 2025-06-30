import { authenticateToken } from '@/middleware/auth';
import MedicalRecord from '@/models/MedicalRecord';
import User from '@/models/User';
import AccessLog from '@/models/AccessLog';
import connectDB from '@/lib/mongodb';

export async function POST(request) {
  try {
    const auth = await authenticateToken(request);
    if (auth.error) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const { user } = auth;
    const body = await request.json();
    const { patientId, analysisType, customQuery } = body;

    await connectDB();

    let targetPatientId = patientId;
    
    // If user is a patient, use their own ID
    if (user.role === 'patient') {
      targetPatientId = user._id;
    }
    
    // If user is a doctor, verify they have access to the patient
    if (user.role === 'doctor' && patientId) {
      const hasAccess = await MedicalRecord.findOne({
        patientId: targetPatientId,
        'accessPermissions.doctorId': user._id,
        'accessPermissions.granted': true,
      });
      
      if (!hasAccess) {
        return Response.json({ error: 'Access denied to patient records' }, { status: 403 });
      }
    }

    // Get patient information
    const patient = await User.findById(targetPatientId).select('profile email');
    if (!patient) {
      return Response.json({ error: 'Patient not found' }, { status: 404 });
    }

    // Get patient's medical records
    const records = await MedicalRecord.find({ patientId: targetPatientId })
      .populate('metadata.doctorId', 'profile.firstName profile.lastName profile.specialization')
      .sort({ createdAt: -1 });

    // Get recent access logs for activity analysis
    const recentLogs = await AccessLog.find({ patientId: targetPatientId })
      .sort({ timestamp: -1 })
      .limit(10);

    // Generate AI analysis based on real data
    const summary = await generateRealPatientSummary(patient, records, analysisType, customQuery);

    // Log the AI analysis access
    const accessLog = new AccessLog({
      patientId: targetPatientId,
      accessorId: user._id,
      accessType: 'view',
      accessReason: `AI analysis: ${analysisType}`,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    });
    await accessLog.save();

    return Response.json({
      summary,
      generatedAt: new Date().toISOString(),
      requestedBy: user.role,
      analysisType,
    });
  } catch (error) {
    console.error('AI patient summary error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function generateRealPatientSummary(patient, records, analysisType, customQuery) {
  // Calculate patient age
  const age = patient.profile.dateOfBirth 
    ? Math.floor((new Date() - new Date(patient.profile.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000))
    : 'Unknown';

  // Analyze medical records by category
  const recordsByCategory = records.reduce((acc, record) => {
    acc[record.category] = acc[record.category] || [];
    acc[record.category].push(record);
    return acc;
  }, {});

  // Extract medications from prescription records
  const medications = extractMedications(recordsByCategory['prescription'] || []);
  
  // Extract conditions from medical records
  const conditions = extractConditions(records);
  
  // Extract allergies from records
  const allergies = extractAllergies(records);
  
  // Generate recommendations based on records
  const recommendations = generateRecommendations(records, recordsByCategory);
  
  // Assess risk factors
  const riskFactors = assessRiskFactors(records, patient.profile);
  
  // Generate insights based on analysis type
  const aiInsights = generateAIInsights(records, analysisType, customQuery);

  return {
    patientInfo: {
      name: `${patient.profile.firstName || ''} ${patient.profile.lastName || ''}`.trim() || 'Unknown',
      age: age,
      gender: patient.profile.gender || 'Not specified',
      email: patient.email,
      phone: patient.profile.phone || 'Not provided',
    },
    medicalHistory: {
      totalRecords: records.length,
      recordsByCategory: Object.keys(recordsByCategory).map(category => ({
        category,
        count: recordsByCategory[category].length,
        latest: recordsByCategory[category][0]?.createdAt,
      })),
      chronicConditions: conditions,
      allergies: allergies,
      recentRecords: records.slice(0, 5).map(record => ({
        title: record.title,
        category: record.category,
        date: record.createdAt,
        description: record.description?.substring(0, 100) + '...',
      })),
    },
    currentMedications: medications,
    riskFactors: riskFactors,
    recommendations: recommendations,
    emergencyInfo: {
      emergencyContact: patient.profile.emergencyContact || null,
      criticalAllergies: allergies.filter(allergy => 
        allergy.toLowerCase().includes('severe') || 
        allergy.toLowerCase().includes('anaphylaxis')
      ),
      emergencyRecords: records.filter(record => record.metadata?.isEmergencyVisible).length,
    },
    aiInsights: aiInsights,
    confidence: calculateConfidence(records),
    lastUpdated: new Date().toISOString(),
  };
}

function extractMedications(prescriptionRecords) {
  const medications = [];
  
  prescriptionRecords.forEach(record => {
    // Simple medication extraction from description
    const description = record.description?.toLowerCase() || '';
    const title = record.title?.toLowerCase() || '';
    
    // Common medication patterns
    const medicationPatterns = [
      /(\w+)\s*(\d+\s*mg)/gi,
      /(\w+)\s*tablet/gi,
      /(\w+)\s*capsule/gi,
    ];
    
    medicationPatterns.forEach(pattern => {
      const matches = [...(description + ' ' + title).matchAll(pattern)];
      matches.forEach(match => {
        if (match[1] && match[1].length > 2) {
          medications.push({
            name: match[1].charAt(0).toUpperCase() + match[1].slice(1),
            dosage: match[2] || 'As prescribed',
            purpose: record.title,
            recordDate: record.createdAt,
          });
        }
      });
    });
  });
  
  // Remove duplicates
  return medications.filter((med, index, self) => 
    index === self.findIndex(m => m.name === med.name)
  ).slice(0, 10);
}

function extractConditions(records) {
  const conditions = new Set();
  
  records.forEach(record => {
    const text = (record.title + ' ' + record.description).toLowerCase();
    
    // Common medical conditions
    const conditionKeywords = [
      'diabetes', 'hypertension', 'asthma', 'depression', 'anxiety',
      'arthritis', 'migraine', 'allergies', 'heart disease', 'cancer',
      'pneumonia', 'bronchitis', 'infection', 'fracture', 'injury'
    ];
    
    conditionKeywords.forEach(condition => {
      if (text.includes(condition)) {
        conditions.add(condition.charAt(0).toUpperCase() + condition.slice(1));
      }
    });
  });
  
  return Array.from(conditions).slice(0, 10);
}

function extractAllergies(records) {
  const allergies = new Set();
  
  records.forEach(record => {
    const text = (record.title + ' ' + record.description).toLowerCase();
    
    if (text.includes('allerg')) {
      // Extract potential allergens
      const allergenPatterns = [
        /allergic to (\w+)/gi,
        /allergy to (\w+)/gi,
        /(\w+) allergy/gi,
      ];
      
      allergenPatterns.forEach(pattern => {
        const matches = [...text.matchAll(pattern)];
        matches.forEach(match => {
          if (match[1] && match[1].length > 2) {
            allergies.add(match[1].charAt(0).toUpperCase() + match[1].slice(1));
          }
        });
      });
    }
  });
  
  return Array.from(allergies).slice(0, 5);
}

function generateRecommendations(records, recordsByCategory) {
  const recommendations = [];
  
  // Based on record frequency
  if (records.length === 0) {
    recommendations.push('Consider uploading your medical records for better health tracking');
  } else if (records.length < 5) {
    recommendations.push('Upload more medical records for comprehensive health analysis');
  }
  
  // Based on categories
  if (recordsByCategory['lab-results']?.length > 0) {
    recommendations.push('Review latest lab results with your healthcare provider');
  }
  
  if (recordsByCategory['prescription']?.length > 0) {
    recommendations.push('Ensure medication adherence and check for interactions');
  }
  
  if (!recordsByCategory['emergency'] || recordsByCategory['emergency'].length === 0) {
    recommendations.push('Consider marking critical records as emergency-visible');
  }
  
  // Recent activity recommendations
  const recentRecords = records.filter(record => 
    new Date() - new Date(record.createdAt) < 30 * 24 * 60 * 60 * 1000
  );
  
  if (recentRecords.length === 0) {
    recommendations.push('Schedule regular health check-ups and update your records');
  }
  
  return recommendations.slice(0, 5);
}

function assessRiskFactors(records, profile) {
  const riskFactors = {
    cardiovascular: [],
    lifestyle: [],
    familial: [],
    demographic: [],
  };
  
  // Age-based risk
  const age = profile.dateOfBirth 
    ? Math.floor((new Date() - new Date(profile.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000))
    : 0;
    
  if (age > 65) {
    riskFactors.demographic.push('Advanced age');
  }
  
  // Analyze records for risk factors
  records.forEach(record => {
    const text = (record.title + ' ' + record.description).toLowerCase();
    
    if (text.includes('hypertension') || text.includes('high blood pressure')) {
      riskFactors.cardiovascular.push('Hypertension');
    }
    if (text.includes('diabetes')) {
      riskFactors.cardiovascular.push('Diabetes');
    }
    if (text.includes('smoking') || text.includes('tobacco')) {
      riskFactors.lifestyle.push('Smoking history');
    }
    if (text.includes('family history')) {
      riskFactors.familial.push('Family history of disease');
    }
  });
  
  return riskFactors;
}

function generateAIInsights(records, analysisType, customQuery) {
  const insights = {
    overallHealth: 'Stable',
    riskLevel: 'Low',
    priorityAreas: [],
    nextSteps: [],
    trends: [],
  };
  
  // Analyze based on record count and recency
  if (records.length === 0) {
    insights.overallHealth = 'Insufficient data';
    insights.priorityAreas.push('Data collection needed');
    insights.nextSteps.push('Upload medical records for analysis');
  } else {
    // Analyze record patterns
    const recentRecords = records.filter(record => 
      new Date() - new Date(record.createdAt) < 90 * 24 * 60 * 60 * 1000
    );
    
    if (recentRecords.length > 5) {
      insights.riskLevel = 'Moderate';
      insights.priorityAreas.push('Frequent medical visits');
    }
    
    // Category-based insights
    const categories = [...new Set(records.map(r => r.category))];
    if (categories.includes('emergency')) {
      insights.riskLevel = 'High';
      insights.priorityAreas.push('Emergency medical history');
    }
    
    if (categories.includes('lab-results')) {
      insights.nextSteps.push('Review latest lab results');
    }
    
    // Custom query analysis
    if (customQuery) {
      insights.nextSteps.push(`Custom analysis: ${customQuery}`);
    }
  }
  
  return insights;
}

function calculateConfidence(records) {
  let confidence = 0.5; // Base confidence
  
  // Increase confidence with more records
  confidence += Math.min(records.length * 0.05, 0.3);
  
  // Increase confidence with recent records
  const recentRecords = records.filter(record => 
    new Date() - new Date(record.createdAt) < 30 * 24 * 60 * 60 * 1000
  );
  confidence += Math.min(recentRecords.length * 0.02, 0.1);
  
  // Increase confidence with diverse record types
  const categories = [...new Set(records.map(r => r.category))];
  confidence += Math.min(categories.length * 0.02, 0.1);
  
  return Math.min(confidence, 0.95);
}