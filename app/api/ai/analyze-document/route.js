import { authenticateToken } from '@/middleware/auth';
import MedicalRecord from '@/models/MedicalRecord';
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
    const { documentText, documentType, symptoms, recordId } = body;

    await connectDB();

    // If recordId is provided, get the actual record
    let actualRecord = null;
    if (recordId) {
      if (user.role === 'patient') {
        actualRecord = await MedicalRecord.findOne({
          _id: recordId,
          patientId: user._id,
        });
      } else if (user.role === 'doctor') {
        actualRecord = await MedicalRecord.findOne({
          _id: recordId,
          'accessPermissions.doctorId': user._id,
          'accessPermissions.granted': true,
        });
      }
    }

    // Use actual record data if available
    const textToAnalyze = actualRecord 
      ? `${actualRecord.title}\n\n${actualRecord.description}`
      : documentText;
    
    const typeToAnalyze = actualRecord ? actualRecord.category : documentType;

    // Perform real document analysis
    const analysis = await performRealDocumentAnalysis(
      textToAnalyze, 
      typeToAnalyze, 
      symptoms,
      actualRecord
    );

    // Log the analysis
    if (actualRecord) {
      const accessLog = new AccessLog({
        patientId: actualRecord.patientId,
        accessorId: user._id,
        recordId: actualRecord._id,
        accessType: 'view',
        accessReason: 'AI document analysis',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      });
      await accessLog.save();
    }

    return Response.json({
      analysis,
      confidence: analysis.confidence,
      recommendations: analysis.recommendations,
      timestamp: new Date().toISOString(),
      recordAnalyzed: !!actualRecord,
    });
  } catch (error) {
    console.error('AI document analysis error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function performRealDocumentAnalysis(documentText, documentType, symptoms, record) {
  const text = documentText.toLowerCase();
  const analysis = {
    documentType,
    findings: [],
    recommendations: [],
    severity: 'low',
    confidence: 0.7,
    summary: '',
    keyTerms: [],
    riskFactors: [],
  };

  // Extract key medical terms
  analysis.keyTerms = extractMedicalTerms(text);
  
  // Analyze based on document type
  switch (documentType) {
    case 'lab-results':
      analysis = await analyzeLabResults(text, analysis);
      break;
    case 'prescription':
      analysis = await analyzePrescription(text, analysis);
      break;
    case 'imaging':
      analysis = await analyzeImaging(text, analysis);
      break;
    case 'consultation':
      analysis = await analyzeConsultation(text, analysis);
      break;
    case 'emergency':
      analysis = await analyzeEmergency(text, analysis);
      break;
    default:
      analysis = await analyzeGeneral(text, analysis);
  }

  // Analyze symptoms if provided
  if (symptoms) {
    analysis.findings.push(`Reported symptoms: ${symptoms}`);
    analysis = await analyzeSymptoms(symptoms, analysis);
  }

  // Add record-specific insights
  if (record) {
    analysis.findings.push(`Record created: ${new Date(record.createdAt).toLocaleDateString()}`);
    if (record.metadata?.isEmergencyVisible) {
      analysis.findings.push('Marked as emergency-visible record');
      analysis.severity = 'moderate';
    }
  }

  // Generate summary
  analysis.summary = generateAnalysisSummary(analysis, documentType);
  
  // Adjust confidence based on content quality
  analysis.confidence = calculateAnalysisConfidence(text, analysis);

  return analysis;
}

function extractMedicalTerms(text) {
  const medicalTerms = [
    'blood pressure', 'heart rate', 'temperature', 'glucose', 'cholesterol',
    'hemoglobin', 'white blood cells', 'platelets', 'creatinine', 'bilirubin',
    'infection', 'inflammation', 'normal', 'abnormal', 'elevated', 'decreased',
    'positive', 'negative', 'acute', 'chronic', 'severe', 'mild', 'moderate'
  ];
  
  return medicalTerms.filter(term => text.includes(term));
}

async function analyzeLabResults(text, analysis) {
  analysis.findings = [];
  analysis.recommendations = [];

  // Blood glucose analysis
  if (text.includes('glucose') || text.includes('blood sugar')) {
    const glucoseMatch = text.match(/glucose[:\s]*(\d+)/i);
    if (glucoseMatch) {
      const glucose = parseInt(glucoseMatch[1]);
      if (glucose > 126) {
        analysis.findings.push(`Elevated glucose level: ${glucose} mg/dL`);
        analysis.severity = 'moderate';
        analysis.recommendations.push('Consult with healthcare provider about diabetes management');
      } else if (glucose < 70) {
        analysis.findings.push(`Low glucose level: ${glucose} mg/dL`);
        analysis.severity = 'moderate';
        analysis.recommendations.push('Monitor for hypoglycemia symptoms');
      } else {
        analysis.findings.push(`Normal glucose level: ${glucose} mg/dL`);
      }
    }
  }

  // Cholesterol analysis
  if (text.includes('cholesterol')) {
    const cholMatch = text.match(/cholesterol[:\s]*(\d+)/i);
    if (cholMatch) {
      const cholesterol = parseInt(cholMatch[1]);
      if (cholesterol > 240) {
        analysis.findings.push(`High cholesterol: ${cholesterol} mg/dL`);
        analysis.severity = 'moderate';
        analysis.recommendations.push('Consider dietary changes and exercise');
      } else {
        analysis.findings.push(`Cholesterol level: ${cholesterol} mg/dL`);
      }
    }
  }

  // General lab value analysis
  if (text.includes('normal')) {
    analysis.findings.push('Most lab values within normal range');
  }
  if (text.includes('abnormal') || text.includes('elevated')) {
    analysis.findings.push('Some abnormal values detected');
    analysis.severity = 'moderate';
  }

  // Default recommendations
  if (analysis.recommendations.length === 0) {
    analysis.recommendations.push('Review results with your healthcare provider');
    analysis.recommendations.push('Follow up as recommended');
  }

  return analysis;
}

async function analyzePrescription(text, analysis) {
  analysis.findings = [];
  analysis.recommendations = [];

  // Extract medication information
  const medications = [];
  const medicationPatterns = [
    /(\w+)\s*(\d+\s*mg)/gi,
    /(\w+)\s*tablet/gi,
    /(\w+)\s*capsule/gi,
  ];

  medicationPatterns.forEach(pattern => {
    const matches = [...text.matchAll(pattern)];
    matches.forEach(match => {
      if (match[1] && match[1].length > 2) {
        medications.push(match[1]);
      }
    });
  });

  if (medications.length > 0) {
    analysis.findings.push(`Medications identified: ${medications.join(', ')}`);
  }

  // Check for drug interactions warning
  if (text.includes('interaction') || text.includes('warning')) {
    analysis.findings.push('Drug interaction warnings present');
    analysis.severity = 'moderate';
  }

  // Dosage analysis
  if (text.includes('dosage') || text.includes('dose')) {
    analysis.findings.push('Dosage instructions provided');
  }

  analysis.recommendations = [
    'Take medications as prescribed',
    'Monitor for side effects',
    'Do not stop medications without consulting your doctor',
    'Keep an updated medication list',
  ];

  return analysis;
}

async function analyzeImaging(text, analysis) {
  analysis.findings = [];
  analysis.recommendations = [];

  // Common imaging findings
  if (text.includes('normal') || text.includes('no abnormalities')) {
    analysis.findings.push('No significant abnormalities detected');
    analysis.severity = 'low';
  }

  if (text.includes('fracture')) {
    analysis.findings.push('Fracture identified');
    analysis.severity = 'moderate';
    analysis.recommendations.push('Follow orthopedic care instructions');
  }

  if (text.includes('inflammation') || text.includes('swelling')) {
    analysis.findings.push('Signs of inflammation detected');
    analysis.severity = 'moderate';
  }

  if (text.includes('mass') || text.includes('lesion')) {
    analysis.findings.push('Mass or lesion identified');
    analysis.severity = 'high';
    analysis.recommendations.push('Follow up with specialist immediately');
  }

  // Default recommendations
  if (analysis.recommendations.length === 0) {
    analysis.recommendations = [
      'Discuss results with your healthcare provider',
      'Follow recommended treatment plan',
      'Schedule follow-up imaging if advised',
    ];
  }

  return analysis;
}

async function analyzeConsultation(text, analysis) {
  analysis.findings = [];
  analysis.recommendations = [];

  // Extract consultation insights
  if (text.includes('diagnosis')) {
    analysis.findings.push('Diagnosis provided in consultation');
  }

  if (text.includes('treatment plan') || text.includes('treatment')) {
    analysis.findings.push('Treatment plan discussed');
  }

  if (text.includes('follow-up') || text.includes('follow up')) {
    analysis.findings.push('Follow-up care recommended');
    analysis.recommendations.push('Schedule recommended follow-up appointments');
  }

  if (text.includes('referral')) {
    analysis.findings.push('Specialist referral provided');
    analysis.recommendations.push('Contact referred specialist promptly');
  }

  // Default recommendations
  analysis.recommendations.push('Follow healthcare provider instructions');
  analysis.recommendations.push('Ask questions if anything is unclear');

  return analysis;
}

async function analyzeEmergency(text, analysis) {
  analysis.findings = [];
  analysis.recommendations = [];
  analysis.severity = 'high';

  analysis.findings.push('Emergency medical record');
  
  if (text.includes('stable') || text.includes('discharged')) {
    analysis.findings.push('Patient condition stabilized');
    analysis.severity = 'moderate';
  }

  if (text.includes('critical') || text.includes('severe')) {
    analysis.findings.push('Critical condition documented');
    analysis.severity = 'high';
  }

  analysis.recommendations = [
    'Follow all discharge instructions carefully',
    'Monitor for any worsening symptoms',
    'Seek immediate care if symptoms return',
    'Complete all prescribed medications',
  ];

  return analysis;
}

async function analyzeGeneral(text, analysis) {
  analysis.findings = [];
  analysis.recommendations = [];

  // General medical document analysis
  if (text.includes('normal')) {
    analysis.findings.push('Normal findings documented');
  }

  if (text.includes('abnormal') || text.includes('concerning')) {
    analysis.findings.push('Some abnormal findings noted');
    analysis.severity = 'moderate';
  }

  analysis.recommendations = [
    'Review document with healthcare provider',
    'Keep for medical records',
    'Follow any specific instructions provided',
  ];

  return analysis;
}

async function analyzeSymptoms(symptoms, analysis) {
  const symptomText = symptoms.toLowerCase();
  
  // Severity indicators
  if (symptomText.includes('severe') || symptomText.includes('intense')) {
    analysis.severity = 'high';
    analysis.recommendations.unshift('Seek immediate medical attention for severe symptoms');
  }

  if (symptomText.includes('chest pain')) {
    analysis.riskFactors.push('Chest pain requires immediate evaluation');
    analysis.severity = 'high';
  }

  if (symptomText.includes('shortness of breath')) {
    analysis.riskFactors.push('Breathing difficulties noted');
    analysis.severity = 'moderate';
  }

  return analysis;
}

function generateAnalysisSummary(analysis, documentType) {
  const typeLabels = {
    'lab-results': 'laboratory results',
    'prescription': 'prescription',
    'imaging': 'imaging study',
    'consultation': 'consultation notes',
    'emergency': 'emergency record',
    'general': 'medical document'
  };

  const typeLabel = typeLabels[documentType] || 'medical document';
  const findingsCount = analysis.findings.length;
  const severity = analysis.severity;

  return `Analysis of ${typeLabel} completed. ${findingsCount} key findings identified with ${severity} severity level. ${analysis.recommendations.length} recommendations provided for follow-up care.`;
}

function calculateAnalysisConfidence(text, analysis) {
  let confidence = 0.6; // Base confidence

  // Increase confidence with longer, more detailed text
  if (text.length > 500) confidence += 0.1;
  if (text.length > 1000) confidence += 0.1;

  // Increase confidence with medical terms
  confidence += Math.min(analysis.keyTerms.length * 0.02, 0.1);

  // Increase confidence with specific findings
  confidence += Math.min(analysis.findings.length * 0.03, 0.15);

  return Math.min(confidence, 0.95);
}