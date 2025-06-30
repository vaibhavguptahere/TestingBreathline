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
    const { symptoms, patientHistory, vitalSigns, labResults, patientInfo, patientId } = body;

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

    // Get patient information and medical records
    const patient = await User.findById(targetPatientId).select('profile email');
    if (!patient) {
      return Response.json({ error: 'Patient not found' }, { status: 404 });
    }

    const records = await MedicalRecord.find({ patientId: targetPatientId })
      .populate('metadata.doctorId', 'profile.firstName profile.lastName profile.specialization')
      .sort({ createdAt: -1 });

    // Generate smart diagnosis using real patient data
    const diagnosis = await generateSmartDiagnosis(
      symptoms, 
      patientHistory, 
      vitalSigns, 
      labResults, 
      patientInfo || patient.profile,
      records
    );

    // Log the diagnosis access
    const accessLog = new AccessLog({
      patientId: targetPatientId,
      accessorId: user._id,
      accessType: 'view',
      accessReason: 'AI smart diagnosis analysis',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    });
    await accessLog.save();

    return Response.json({
      diagnosis,
      confidence: diagnosis.confidence,
      recommendations: diagnosis.recommendations,
      timestamp: new Date().toISOString(),
      analyzedBy: user.role,
      patientRecordsAnalyzed: records.length,
    });
  } catch (error) {
    console.error('Smart diagnosis error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function generateSmartDiagnosis(symptoms, patientHistory, vitalSigns, labResults, patientInfo, records) {
  // Analyze patient's medical history from records
  const medicalHistory = analyzePatientRecords(records);
  
  // Enhanced symptom analysis with patient context
  const symptomAnalysis = analyzeSymptoms(symptoms, medicalHistory);
  const riskFactors = assessRiskFactors(patientHistory, patientInfo, medicalHistory);
  const vitalAnalysis = analyzeVitals(vitalSigns);
  const labAnalysis = analyzeLabResults(labResults);

  let possibleConditions = [];

  // Generate conditions based on symptoms and patient history
  if (symptoms && symptoms.length > 0) {
    possibleConditions = generateConditionsFromSymptoms(symptoms, medicalHistory, vitalSigns, labResults);
  } else {
    // If no symptoms provided, analyze based on recent records
    possibleConditions = generateConditionsFromRecords(records, vitalSigns, labResults);
  }

  // Sort by probability and clinical relevance
  possibleConditions.sort((a, b) => b.probability - a.probability);

  const recommendations = generateRecommendations(possibleConditions[0], symptoms, vitalSigns, labResults, medicalHistory);
  const differentialConsiderations = generateDifferentialConsiderations(possibleConditions);
  const suggestedTests = generateSuggestedTests(possibleConditions[0], symptoms, medicalHistory);

  return {
    primaryDiagnosis: possibleConditions[0] || getDefaultDiagnosis(),
    differentialDiagnoses: possibleConditions,
    recommendations,
    differentialConsiderations,
    riskStratification: {
      overall: assessOverallRisk(possibleConditions[0], medicalHistory),
      cardiac: assessCardiacRisk(symptoms, vitalSigns, medicalHistory),
      immediate: assessImmediateRisk(possibleConditions[0]),
    },
    suggestedTests,
    confidence: calculateOverallConfidence(possibleConditions, symptoms, vitalSigns, labResults, records),
    analysisMetadata: {
      symptomsAnalyzed: symptoms?.length || 0,
      historyFactors: medicalHistory.conditions.length,
      vitalSigns: vitalSigns ? Object.keys(vitalSigns).filter(k => vitalSigns[k]).length : 0,
      labValues: labResults ? Object.keys(labResults).filter(k => labResults[k]).length : 0,
      medicalRecords: records.length,
    },
    patientContext: {
      age: calculateAge(patientInfo.dateOfBirth),
      chronicConditions: medicalHistory.conditions,
      recentRecords: records.slice(0, 3).map(r => ({
        title: r.title,
        category: r.category,
        date: r.createdAt
      }))
    }
  };
}

function analyzePatientRecords(records) {
  const conditions = new Set();
  const medications = new Set();
  const allergies = new Set();
  const recentSymptoms = new Set();

  records.forEach(record => {
    const text = (record.title + ' ' + record.description).toLowerCase();
    
    // Extract conditions
    const conditionKeywords = [
      'diabetes', 'hypertension', 'asthma', 'depression', 'anxiety',
      'arthritis', 'migraine', 'heart disease', 'cancer', 'pneumonia',
      'bronchitis', 'infection', 'fracture', 'injury', 'stroke'
    ];
    
    conditionKeywords.forEach(condition => {
      if (text.includes(condition)) {
        conditions.add(condition);
      }
    });

    // Extract medications
    const medicationPatterns = [
      /(\w+)\s*(\d+\s*mg)/gi,
      /(\w+)\s*tablet/gi,
      /(\w+)\s*capsule/gi,
    ];
    
    medicationPatterns.forEach(pattern => {
      const matches = [...text.matchAll(pattern)];
      matches.forEach(match => {
        if (match[1] && match[1].length > 3) {
          medications.add(match[1]);
        }
      });
    });

    // Extract allergies
    if (text.includes('allerg')) {
      const allergenPatterns = [
        /allergic to (\w+)/gi,
        /allergy to (\w+)/gi,
        /(\w+) allergy/gi,
      ];
      
      allergenPatterns.forEach(pattern => {
        const matches = [...text.matchAll(pattern)];
        matches.forEach(match => {
          if (match[1] && match[1].length > 2) {
            allergies.add(match[1]);
          }
        });
      });
    }

    // Extract recent symptoms from recent records
    if (new Date() - new Date(record.createdAt) < 30 * 24 * 60 * 60 * 1000) {
      const symptomKeywords = [
        'pain', 'fever', 'cough', 'headache', 'nausea', 'fatigue',
        'dizziness', 'shortness of breath', 'chest pain'
      ];
      
      symptomKeywords.forEach(symptom => {
        if (text.includes(symptom)) {
          recentSymptoms.add(symptom);
        }
      });
    }
  });

  return {
    conditions: Array.from(conditions),
    medications: Array.from(medications),
    allergies: Array.from(allergies),
    recentSymptoms: Array.from(recentSymptoms),
    recordCount: records.length
  };
}

function generateConditionsFromSymptoms(symptoms, medicalHistory, vitalSigns, labResults) {
  const conditions = [];
  const symptomText = symptoms.join(' ').toLowerCase();

  // Cardiovascular conditions
  if (symptomText.includes('chest pain') || symptomText.includes('chest')) {
    conditions.push({
      condition: 'Acute Coronary Syndrome',
      probability: calculateProbability(['chest pain'], vitalSigns, labResults, 0.75, medicalHistory),
      severity: 'high',
      reasoning: 'Chest pain with potential cardiac risk factors',
      urgency: 'immediate',
      supportingEvidence: getSupportingEvidence('cardiac', medicalHistory, vitalSigns, labResults)
    });
    
    conditions.push({
      condition: 'Gastroesophageal Reflux Disease (GERD)',
      probability: calculateProbability(['chest pain'], vitalSigns, labResults, 0.45, medicalHistory),
      severity: 'low',
      reasoning: 'Chest discomfort could be related to acid reflux',
      urgency: 'routine',
      supportingEvidence: getSupportingEvidence('gerd', medicalHistory, vitalSigns, labResults)
    });
  }

  // Respiratory conditions
  if (symptomText.includes('shortness of breath') || symptomText.includes('cough')) {
    conditions.push({
      condition: 'Pneumonia',
      probability: calculateProbability(['shortness of breath', 'cough'], vitalSigns, labResults, 0.65, medicalHistory),
      severity: 'moderate',
      reasoning: 'Respiratory symptoms with potential infectious etiology',
      urgency: 'urgent',
      supportingEvidence: getSupportingEvidence('respiratory', medicalHistory, vitalSigns, labResults)
    });

    if (medicalHistory.conditions.includes('asthma')) {
      conditions.push({
        condition: 'Asthma Exacerbation',
        probability: calculateProbability(['shortness of breath'], vitalSigns, labResults, 0.75, medicalHistory),
        severity: 'moderate',
        reasoning: 'Respiratory symptoms in patient with known asthma',
        urgency: 'urgent',
        supportingEvidence: ['Known asthma history', ...getSupportingEvidence('respiratory', medicalHistory, vitalSigns, labResults)]
      });
    }
  }

  // Neurological conditions
  if (symptomText.includes('headache') || symptomText.includes('dizziness')) {
    conditions.push({
      condition: 'Migraine',
      probability: calculateProbability(['headache'], vitalSigns, labResults, 0.60, medicalHistory),
      severity: 'moderate',
      reasoning: 'Headache pattern consistent with migraine',
      urgency: 'routine',
      supportingEvidence: getSupportingEvidence('neurological', medicalHistory, vitalSigns, labResults)
    });

    if (medicalHistory.conditions.includes('hypertension')) {
      conditions.push({
        condition: 'Hypertensive Crisis',
        probability: calculateProbability(['headache', 'dizziness'], vitalSigns, labResults, 0.80, medicalHistory),
        severity: 'high',
        reasoning: 'Neurological symptoms in patient with hypertension',
        urgency: 'immediate',
        supportingEvidence: ['Known hypertension', ...getSupportingEvidence('hypertensive', medicalHistory, vitalSigns, labResults)]
      });
    }
  }

  // Infectious conditions
  if (symptomText.includes('fever')) {
    conditions.push({
      condition: 'Viral Upper Respiratory Infection',
      probability: calculateProbability(['fever'], vitalSigns, labResults, 0.50, medicalHistory),
      severity: 'low',
      reasoning: 'Fever with respiratory symptoms',
      urgency: 'routine',
      supportingEvidence: getSupportingEvidence('viral', medicalHistory, vitalSigns, labResults)
    });

    conditions.push({
      condition: 'Bacterial Infection',
      probability: calculateProbability(['fever'], vitalSigns, labResults, 0.40, medicalHistory),
      severity: 'moderate',
      reasoning: 'Fever pattern suggesting bacterial etiology',
      urgency: 'urgent',
      supportingEvidence: getSupportingEvidence('bacterial', medicalHistory, vitalSigns, labResults)
    });
  }

  return conditions.length > 0 ? conditions : [getDefaultDiagnosis()];
}

function generateConditionsFromRecords(records, vitalSigns, labResults) {
  const conditions = [];
  
  // Analyze recent records for patterns
  const recentRecords = records.filter(record => 
    new Date() - new Date(record.createdAt) < 90 * 24 * 60 * 60 * 1000
  );

  if (recentRecords.length === 0) {
    return [getDefaultDiagnosis()];
  }

  // Look for patterns in recent records
  const categories = recentRecords.map(r => r.category);
  
  if (categories.includes('emergency')) {
    conditions.push({
      condition: 'Follow-up Care Required',
      probability: 0.85,
      severity: 'moderate',
      reasoning: 'Recent emergency visit requires follow-up',
      urgency: 'urgent',
      supportingEvidence: ['Recent emergency record']
    });
  }

  if (categories.includes('lab-results')) {
    conditions.push({
      condition: 'Lab Results Review',
      probability: 0.70,
      severity: 'low',
      reasoning: 'Recent lab results need clinical correlation',
      urgency: 'routine',
      supportingEvidence: ['Recent lab results available']
    });
  }

  return conditions.length > 0 ? conditions : [getDefaultDiagnosis()];
}

function getSupportingEvidence(conditionType, medicalHistory, vitalSigns, labResults) {
  const evidence = [];
  
  switch (conditionType) {
    case 'cardiac':
      if (medicalHistory.conditions.includes('hypertension')) evidence.push('History of hypertension');
      if (medicalHistory.conditions.includes('diabetes')) evidence.push('History of diabetes');
      if (vitalSigns?.bloodPressure) {
        const [systolic] = vitalSigns.bloodPressure.split('/').map(Number);
        if (systolic > 140) evidence.push('Elevated blood pressure');
      }
      if (labResults?.troponin && parseFloat(labResults.troponin) > 0.04) {
        evidence.push('Elevated troponin levels');
      }
      break;
      
    case 'respiratory':
      if (medicalHistory.conditions.includes('asthma')) evidence.push('History of asthma');
      if (vitalSigns?.temperature) {
        const temp = parseFloat(vitalSigns.temperature);
        if (temp > 100.4) evidence.push('Fever present');
      }
      if (labResults?.whiteBloodCells) {
        const wbc = parseFloat(labResults.whiteBloodCells);
        if (wbc > 11000) evidence.push('Elevated white blood cell count');
      }
      break;
      
    case 'hypertensive':
      if (medicalHistory.conditions.includes('hypertension')) evidence.push('Known hypertension');
      if (vitalSigns?.bloodPressure) {
        const [systolic] = vitalSigns.bloodPressure.split('/').map(Number);
        if (systolic > 180) evidence.push('Severely elevated blood pressure');
      }
      break;
  }
  
  return evidence;
}

function calculateProbability(matchingSymptoms, vitalSigns, labResults, baseProbability, medicalHistory) {
  let probability = baseProbability;
  
  // Adjust based on medical history
  if (medicalHistory.conditions.length > 0) {
    probability += 0.1;
  }
  
  // Adjust based on vital signs
  if (vitalSigns?.bloodPressure && vitalSigns.bloodPressure.includes('/')) {
    const [systolic] = vitalSigns.bloodPressure.split('/').map(Number);
    if (systolic > 140) probability += 0.1;
  }
  
  if (vitalSigns?.temperature) {
    const temp = parseFloat(vitalSigns.temperature);
    if (temp > 100.4 || temp > 38) probability += 0.15;
  }
  
  if (vitalSigns?.heartRate) {
    const hr = parseInt(vitalSigns.heartRate);
    if (hr > 100 || hr < 60) probability += 0.05;
  }
  
  // Adjust based on lab results
  if (labResults?.troponin && parseFloat(labResults.troponin) > 0.04) {
    probability += 0.2;
  }
  
  if (labResults?.whiteBloodCells) {
    const wbc = parseFloat(labResults.whiteBloodCells);
    if (wbc > 11000) probability += 0.1;
  }
  
  return Math.min(probability, 0.95);
}

function generateRecommendations(primaryDiagnosis, symptoms, vitalSigns, labResults, medicalHistory) {
  const recommendations = [];
  
  if (!primaryDiagnosis) {
    return ['Comprehensive medical evaluation recommended'];
  }
  
  switch (primaryDiagnosis.urgency) {
    case 'immediate':
      recommendations.push('Immediate medical evaluation and stabilization');
      recommendations.push('Continuous monitoring of vital signs');
      recommendations.push('Prepare for emergency interventions if needed');
      break;
    case 'urgent':
      recommendations.push('Prompt medical evaluation within 2-4 hours');
      recommendations.push('Monitor patient closely for symptom progression');
      break;
    case 'routine':
      recommendations.push('Schedule follow-up appointment within 1-2 weeks');
      recommendations.push('Symptomatic treatment as appropriate');
      break;
  }
  
  // Add condition-specific recommendations
  if (primaryDiagnosis.condition.toLowerCase().includes('cardiac') || 
      primaryDiagnosis.condition.toLowerCase().includes('coronary')) {
    recommendations.push('12-lead ECG immediately');
    recommendations.push('Serial cardiac enzymes');
    recommendations.push('Chest X-ray');
    recommendations.push('Consider cardiology consultation');
  }
  
  // Add recommendations based on medical history
  if (medicalHistory.conditions.includes('diabetes')) {
    recommendations.push('Monitor blood glucose levels');
  }
  
  if (medicalHistory.conditions.includes('hypertension')) {
    recommendations.push('Blood pressure monitoring');
  }
  
  return recommendations;
}

function generateDifferentialConsiderations(conditions) {
  return conditions.slice(0, 5).map(condition => 
    `${condition.condition} (${Math.round(condition.probability * 100)}% probability) - ${condition.reasoning}`
  );
}

function generateSuggestedTests(primaryDiagnosis, symptoms, medicalHistory) {
  const tests = ['Complete Blood Count (CBC)', 'Basic Metabolic Panel'];
  
  if (!primaryDiagnosis) {
    return tests;
  }
  
  if (primaryDiagnosis.condition.toLowerCase().includes('cardiac') || 
      symptoms?.some(s => s.toLowerCase().includes('chest'))) {
    tests.push('12-lead ECG', 'Troponin levels', 'Chest X-ray', 'Echocardiogram');
  }
  
  if (symptoms?.some(s => s.toLowerCase().includes('shortness of breath') || 
                        s.toLowerCase().includes('cough'))) {
    tests.push('Chest X-ray', 'Arterial Blood Gas', 'D-dimer', 'BNP/NT-proBNP');
  }
  
  if (medicalHistory.conditions.includes('diabetes')) {
    tests.push('HbA1c', 'Fasting glucose');
  }
  
  if (medicalHistory.conditions.includes('hypertension')) {
    tests.push('Renal function panel', 'Urinalysis');
  }
  
  return tests;
}

function assessOverallRisk(primaryDiagnosis, medicalHistory) {
  if (!primaryDiagnosis) return 'low';
  
  let riskLevel = primaryDiagnosis.urgency === 'immediate' ? 'high' : 
                  primaryDiagnosis.urgency === 'urgent' ? 'moderate' : 'low';
  
  // Increase risk based on medical history
  if (medicalHistory.conditions.length > 2) {
    riskLevel = riskLevel === 'low' ? 'moderate' : 'high';
  }
  
  return riskLevel;
}

function assessCardiacRisk(symptoms, vitalSigns, medicalHistory) {
  let risk = 'low';
  
  if (symptoms?.some(s => s.toLowerCase().includes('chest'))) risk = 'moderate';
  
  if (medicalHistory.conditions.includes('heart disease') || 
      medicalHistory.conditions.includes('hypertension')) {
    risk = 'moderate';
  }
  
  if (vitalSigns?.bloodPressure) {
    const [systolic] = vitalSigns.bloodPressure.split('/').map(Number);
    if (systolic > 160) risk = 'high';
  }
  
  return risk;
}

function assessImmediateRisk(primaryDiagnosis) {
  return primaryDiagnosis?.urgency === 'immediate' ? 'high' : 'low';
}

function calculateOverallConfidence(conditions, symptoms, vitalSigns, labResults, records) {
  let confidence = 0.6; // Base confidence
  
  // Increase confidence with more data
  if (symptoms?.length > 3) confidence += 0.05;
  if (Object.keys(vitalSigns || {}).filter(k => vitalSigns[k]).length > 3) confidence += 0.05;
  if (Object.keys(labResults || {}).filter(k => labResults[k]).length > 3) confidence += 0.1;
  if (records.length > 5) confidence += 0.1;
  
  // Increase confidence if primary diagnosis has high probability
  if (conditions[0]?.probability > 0.8) confidence += 0.1;
  
  return Math.min(confidence, 0.95);
}

function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return 'Unknown';
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

function getDefaultDiagnosis() {
  return {
    condition: 'Clinical Assessment Required',
    probability: 0.50,
    severity: 'low',
    reasoning: 'Insufficient data for specific diagnosis - comprehensive evaluation needed',
    urgency: 'routine',
    supportingEvidence: ['Limited clinical data available']
  };
}

function analyzeSymptoms(symptoms, medicalHistory) {
  return {
    primary: symptoms?.slice(0, 3) || [],
    secondary: symptoms?.slice(3) || [],
    severity: symptoms?.length > 5 ? 'high' : symptoms?.length > 2 ? 'moderate' : 'low',
    contextualFactors: medicalHistory.recentSymptoms
  };
}

function assessRiskFactors(history, patientInfo, medicalHistory) {
  const riskFactors = {
    cardiovascular: [],
    lifestyle: [],
    familial: [],
    demographic: [],
  };
  
  // Add known conditions as risk factors
  medicalHistory.conditions.forEach(condition => {
    if (['hypertension', 'diabetes', 'heart disease'].includes(condition)) {
      riskFactors.cardiovascular.push(condition);
    }
  });
  
  // Age-based risk
  const age = calculateAge(patientInfo.dateOfBirth);
  if (age > 65) {
    riskFactors.demographic.push('advanced age');
  }
  
  return riskFactors;
}

function analyzeVitals(vitals) {
  const abnormal = [];
  
  if (vitals?.bloodPressure) {
    const [systolic, diastolic] = vitals.bloodPressure.split('/').map(Number);
    if (systolic > 140 || diastolic > 90) abnormal.push('hypertension');
    if (systolic < 90) abnormal.push('hypotension');
  }
  
  if (vitals?.heartRate) {
    const hr = parseInt(vitals.heartRate);
    if (hr > 100) abnormal.push('tachycardia');
    if (hr < 60) abnormal.push('bradycardia');
  }
  
  if (vitals?.temperature) {
    const temp = parseFloat(vitals.temperature);
    if (temp > 100.4 || temp > 38) abnormal.push('fever');
    if (temp < 96 || temp < 35.5) abnormal.push('hypothermia');
  }
  
  return {
    abnormal,
    trending: 'stable',
  };
}

function analyzeLabResults(labs) {
  const abnormal = [];
  
  if (labs?.glucose && parseFloat(labs.glucose) > 126) {
    abnormal.push('hyperglycemia');
  }
  if (labs?.troponin && parseFloat(labs.troponin) > 0.04) {
    abnormal.push('elevated troponin');
  }
  if (labs?.creatinine && parseFloat(labs.creatinine) > 1.2) {
    abnormal.push('elevated creatinine');
  }
  if (labs?.whiteBloodCells && parseFloat(labs.whiteBloodCells) > 11000) {
    abnormal.push('leukocytosis');
  }
  
  return {
    abnormal,
    significant: abnormal.length > 0,
  };
}