import { authenticateToken } from '@/middleware/auth';

export async function POST(request) {
  try {
    const auth = await authenticateToken(request);
    if (auth.error) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const { user } = auth;
    const body = await request.json();
    const { symptoms, patientHistory, vitalSigns, labResults, patientInfo } = body;

    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Generate smart diagnosis suggestions
    const diagnosis = await generateSmartDiagnosis(symptoms, patientHistory, vitalSigns, labResults, patientInfo);

    return Response.json({
      diagnosis,
      confidence: diagnosis.confidence,
      recommendations: diagnosis.recommendations,
      timestamp: new Date().toISOString(),
      analyzedBy: user.role,
    });
  } catch (error) {
    console.error('Smart diagnosis error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function generateSmartDiagnosis(symptoms, patientHistory, vitalSigns, labResults, patientInfo) {
  // Simulate advanced AI diagnosis processing
  const symptomAnalysis = analyzeSymptoms(symptoms);
  const riskFactors = assessRiskFactors(patientHistory, patientInfo);
  const vitalAnalysis = analyzeVitals(vitalSigns);
  const labAnalysis = analyzeLabResults(labResults);

  // Enhanced diagnosis logic based on symptoms
  let possibleConditions = [];

  // Cardiovascular conditions
  if (symptoms.some(s => s.toLowerCase().includes('chest pain') || s.toLowerCase().includes('chest'))) {
    possibleConditions.push({
      condition: 'Acute Coronary Syndrome',
      probability: calculateProbability(['chest pain'], vitalSigns, labResults, 0.75),
      severity: 'high',
      reasoning: 'Chest pain with potential cardiac risk factors',
      urgency: 'immediate',
    });
    
    possibleConditions.push({
      condition: 'Gastroesophageal Reflux Disease (GERD)',
      probability: calculateProbability(['chest pain'], vitalSigns, labResults, 0.45),
      severity: 'low',
      reasoning: 'Chest discomfort could be related to acid reflux',
      urgency: 'routine',
    });
  }

  // Respiratory conditions
  if (symptoms.some(s => s.toLowerCase().includes('shortness of breath') || s.toLowerCase().includes('cough'))) {
    possibleConditions.push({
      condition: 'Pneumonia',
      probability: calculateProbability(['shortness of breath', 'cough'], vitalSigns, labResults, 0.65),
      severity: 'moderate',
      reasoning: 'Respiratory symptoms with potential infectious etiology',
      urgency: 'urgent',
    });

    possibleConditions.push({
      condition: 'Asthma Exacerbation',
      probability: calculateProbability(['shortness of breath'], vitalSigns, labResults, 0.55),
      severity: 'moderate',
      reasoning: 'Respiratory symptoms consistent with airway obstruction',
      urgency: 'urgent',
    });
  }

  // Neurological conditions
  if (symptoms.some(s => s.toLowerCase().includes('headache') || s.toLowerCase().includes('dizziness'))) {
    possibleConditions.push({
      condition: 'Migraine',
      probability: calculateProbability(['headache'], vitalSigns, labResults, 0.60),
      severity: 'moderate',
      reasoning: 'Headache pattern consistent with migraine',
      urgency: 'routine',
    });

    possibleConditions.push({
      condition: 'Hypertensive Crisis',
      probability: calculateProbability(['headache', 'dizziness'], vitalSigns, labResults, 0.70),
      severity: 'high',
      reasoning: 'Neurological symptoms with elevated blood pressure',
      urgency: 'immediate',
    });
  }

  // Gastrointestinal conditions
  if (symptoms.some(s => s.toLowerCase().includes('nausea') || s.toLowerCase().includes('vomiting') || s.toLowerCase().includes('abdominal'))) {
    possibleConditions.push({
      condition: 'Gastroenteritis',
      probability: calculateProbability(['nausea', 'vomiting'], vitalSigns, labResults, 0.55),
      severity: 'low',
      reasoning: 'GI symptoms consistent with viral or bacterial gastroenteritis',
      urgency: 'routine',
    });

    possibleConditions.push({
      condition: 'Appendicitis',
      probability: calculateProbability(['abdominal pain', 'nausea'], vitalSigns, labResults, 0.45),
      severity: 'high',
      reasoning: 'Abdominal pain with associated symptoms',
      urgency: 'urgent',
    });
  }

  // Infectious conditions
  if (symptoms.some(s => s.toLowerCase().includes('fever'))) {
    possibleConditions.push({
      condition: 'Viral Upper Respiratory Infection',
      probability: calculateProbability(['fever'], vitalSigns, labResults, 0.50),
      severity: 'low',
      reasoning: 'Fever with respiratory symptoms',
      urgency: 'routine',
    });

    possibleConditions.push({
      condition: 'Bacterial Infection',
      probability: calculateProbability(['fever'], vitalSigns, labResults, 0.40),
      severity: 'moderate',
      reasoning: 'Fever pattern suggesting bacterial etiology',
      urgency: 'urgent',
    });
  }

  // Default condition if no specific patterns match
  if (possibleConditions.length === 0) {
    possibleConditions.push({
      condition: 'Viral Syndrome',
      probability: 0.40,
      severity: 'low',
      reasoning: 'Non-specific symptoms consistent with viral illness',
      urgency: 'routine',
    });
  }

  // Sort by probability
  possibleConditions.sort((a, b) => b.probability - a.probability);

  const recommendations = generateRecommendations(possibleConditions[0], symptoms, vitalSigns, labResults);
  const differentialConsiderations = generateDifferentialConsiderations(possibleConditions);
  const suggestedTests = generateSuggestedTests(possibleConditions[0], symptoms);

  return {
    primaryDiagnosis: possibleConditions[0],
    differentialDiagnoses: possibleConditions,
    recommendations,
    differentialConsiderations,
    riskStratification: {
      overall: assessOverallRisk(possibleConditions[0]),
      cardiac: assessCardiacRisk(symptoms, vitalSigns),
      immediate: assessImmediateRisk(possibleConditions[0]),
    },
    suggestedTests,
    confidence: calculateOverallConfidence(possibleConditions, symptoms, vitalSigns, labResults),
    analysisMetadata: {
      symptomsAnalyzed: symptoms?.length || 0,
      historyFactors: patientHistory ? 1 : 0,
      vitalSigns: vitalSigns ? Object.keys(vitalSigns).filter(k => vitalSigns[k]).length : 0,
      labValues: labResults ? Object.keys(labResults).filter(k => labResults[k]).length : 0,
    },
  };
}

function calculateProbability(matchingSymptoms, vitalSigns, labResults, baseProbability) {
  let probability = baseProbability;
  
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

function generateRecommendations(primaryDiagnosis, symptoms, vitalSigns, labResults) {
  const recommendations = [];
  
  switch (primaryDiagnosis?.urgency) {
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
  
  // Specific recommendations based on condition
  if (primaryDiagnosis?.condition.toLowerCase().includes('cardiac') || 
      primaryDiagnosis?.condition.toLowerCase().includes('coronary')) {
    recommendations.push('12-lead ECG immediately');
    recommendations.push('Serial cardiac enzymes');
    recommendations.push('Chest X-ray');
    recommendations.push('Consider cardiology consultation');
  }
  
  if (primaryDiagnosis?.condition.toLowerCase().includes('pneumonia')) {
    recommendations.push('Chest X-ray or CT scan');
    recommendations.push('Blood cultures if febrile');
    recommendations.push('Consider antibiotic therapy');
    recommendations.push('Oxygen saturation monitoring');
  }
  
  if (primaryDiagnosis?.condition.toLowerCase().includes('hypertensive')) {
    recommendations.push('Blood pressure management protocol');
    recommendations.push('Neurological assessment');
    recommendations.push('Fundoscopic examination');
    recommendations.push('Renal function evaluation');
  }
  
  return recommendations;
}

function generateDifferentialConsiderations(conditions) {
  return conditions.slice(0, 5).map(condition => 
    `${condition.condition} (${Math.round(condition.probability * 100)}% probability)`
  );
}

function generateSuggestedTests(primaryDiagnosis, symptoms) {
  const tests = ['Complete Blood Count (CBC)', 'Basic Metabolic Panel'];
  
  if (primaryDiagnosis?.condition.toLowerCase().includes('cardiac') || 
      symptoms.some(s => s.toLowerCase().includes('chest'))) {
    tests.push('12-lead ECG', 'Troponin levels', 'Chest X-ray', 'Echocardiogram');
  }
  
  if (symptoms.some(s => s.toLowerCase().includes('shortness of breath') || 
                        s.toLowerCase().includes('cough'))) {
    tests.push('Chest X-ray', 'Arterial Blood Gas', 'D-dimer', 'BNP/NT-proBNP');
  }
  
  if (symptoms.some(s => s.toLowerCase().includes('headache') || 
                        s.toLowerCase().includes('neurological'))) {
    tests.push('CT Head', 'Lumbar Puncture (if indicated)', 'MRI Brain');
  }
  
  if (symptoms.some(s => s.toLowerCase().includes('abdominal'))) {
    tests.push('Abdominal CT', 'Lipase/Amylase', 'Liver Function Tests', 'Urinalysis');
  }
  
  if (symptoms.some(s => s.toLowerCase().includes('fever'))) {
    tests.push('Blood Cultures', 'Urinalysis', 'Inflammatory markers (ESR, CRP)');
  }
  
  return tests;
}

function assessOverallRisk(primaryDiagnosis) {
  if (primaryDiagnosis?.urgency === 'immediate') return 'high';
  if (primaryDiagnosis?.urgency === 'urgent') return 'moderate';
  return 'low';
}

function assessCardiacRisk(symptoms, vitalSigns) {
  let risk = 'low';
  
  if (symptoms.some(s => s.toLowerCase().includes('chest'))) risk = 'moderate';
  
  if (vitalSigns?.bloodPressure) {
    const [systolic] = vitalSigns.bloodPressure.split('/').map(Number);
    if (systolic > 160) risk = 'high';
  }
  
  return risk;
}

function assessImmediateRisk(primaryDiagnosis) {
  return primaryDiagnosis?.urgency === 'immediate' ? 'high' : 'low';
}

function calculateOverallConfidence(conditions, symptoms, vitalSigns, labResults) {
  let confidence = 0.7; // Base confidence
  
  // Increase confidence with more data
  if (symptoms.length > 3) confidence += 0.05;
  if (Object.keys(vitalSigns).filter(k => vitalSigns[k]).length > 3) confidence += 0.05;
  if (Object.keys(labResults).filter(k => labResults[k]).length > 3) confidence += 0.1;
  
  // Increase confidence if primary diagnosis has high probability
  if (conditions[0]?.probability > 0.8) confidence += 0.1;
  
  return Math.min(confidence, 0.95);
}

function analyzeSymptoms(symptoms) {
  return {
    primary: symptoms?.slice(0, 3) || [],
    secondary: symptoms?.slice(3) || [],
    severity: symptoms?.length > 5 ? 'high' : symptoms?.length > 2 ? 'moderate' : 'low',
  };
}

function assessRiskFactors(history, patientInfo) {
  const riskFactors = {
    cardiovascular: [],
    lifestyle: [],
    familial: [],
    demographic: [],
  };
  
  if (history?.toLowerCase().includes('hypertension')) {
    riskFactors.cardiovascular.push('hypertension');
  }
  if (history?.toLowerCase().includes('diabetes')) {
    riskFactors.cardiovascular.push('diabetes');
  }
  if (history?.toLowerCase().includes('smoking')) {
    riskFactors.lifestyle.push('smoking');
  }
  
  if (patientInfo?.age && parseInt(patientInfo.age) > 65) {
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