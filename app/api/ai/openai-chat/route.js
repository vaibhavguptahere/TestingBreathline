import { authenticateToken } from '@/middleware/auth';
import MedicalRecord from '@/models/MedicalRecord';
import User from '@/models/User';
import AccessLog from '@/models/AccessLog';
import connectDB from '@/lib/mongodb';

// Rate limiting storage (in production, use Redis or database)
const rateLimitStore = new Map();
const DAILY_LIMIT = 50; // 50 requests per day per user
const RESET_HOUR = 0; // Reset at midnight

export async function POST(request) {
  try {
    const auth = await authenticateToken(request);
    if (auth.error) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const { user } = auth;
    const body = await request.json();
    const { message, context, patientId } = body;

    // Check rate limit
    const rateLimitCheck = checkRateLimit(user._id);
    if (!rateLimitCheck.allowed) {
      return Response.json({ 
        error: `Daily limit exceeded. ${rateLimitCheck.remaining} requests remaining. Resets at midnight.`,
        rateLimitExceeded: true,
        remaining: rateLimitCheck.remaining,
        resetTime: rateLimitCheck.resetTime
      }, { status: 429 });
    }

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

    // Get patient context if available
    let patientContext = null;
    if (targetPatientId) {
      const patient = await User.findById(targetPatientId).select('profile email');
      const records = await MedicalRecord.find({ patientId: targetPatientId })
        .sort({ createdAt: -1 })
        .limit(10);
      
      patientContext = {
        patient: patient,
        recentRecords: records,
        recordCount: records.length
      };
    }

    // Generate AI response using OpenAI-style analysis
    const aiResponse = await generateAIResponse(message, context, patientContext, user);

    // Increment rate limit counter
    incrementRateLimit(user._id);

    // Log the AI chat interaction
    if (targetPatientId) {
      const accessLog = new AccessLog({
        patientId: targetPatientId,
        accessorId: user._id,
        accessType: 'view',
        accessReason: 'AI chat consultation',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      });
      await accessLog.save();
    }

    return Response.json({
      response: aiResponse,
      timestamp: new Date().toISOString(),
      rateLimitInfo: {
        remaining: rateLimitCheck.remaining - 1,
        resetTime: rateLimitCheck.resetTime
      }
    });
  } catch (error) {
    console.error('AI chat error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function checkRateLimit(userId) {
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
    allowed: userLimit.count < DAILY_LIMIT,
    remaining: Math.max(0, remaining),
    resetTime: resetTime.toISOString()
  };
}

function incrementRateLimit(userId) {
  const today = new Date().toDateString();
  const userKey = `${userId}_${today}`;
  
  const userLimit = rateLimitStore.get(userKey) || { count: 0, date: today };
  userLimit.count += 1;
  userLimit.date = today;
  
  rateLimitStore.set(userKey, userLimit);
}

async function generateAIResponse(message, context, patientContext, user) {
  const messageText = message.toLowerCase();
  
  // Analyze the message intent
  const intent = analyzeMessageIntent(messageText);
  
  // Generate contextual response based on patient data
  let response = '';
  
  switch (intent) {
    case 'symptom_inquiry':
      response = generateSymptomResponse(messageText, patientContext);
      break;
    case 'medication_question':
      response = generateMedicationResponse(messageText, patientContext);
      break;
    case 'test_results':
      response = generateTestResultsResponse(messageText, patientContext);
      break;
    case 'general_health':
      response = generateGeneralHealthResponse(messageText, patientContext);
      break;
    case 'emergency_concern':
      response = generateEmergencyResponse(messageText, patientContext);
      break;
    default:
      response = generateDefaultResponse(messageText, patientContext, user);
  }
  
  // Add disclaimer for medical advice
  response += '\n\n⚠️ **Important**: This AI assistant provides general health information only. Always consult with healthcare professionals for medical advice, diagnosis, or treatment decisions.';
  
  return response;
}

function analyzeMessageIntent(message) {
  if (message.includes('symptom') || message.includes('pain') || message.includes('feel') || 
      message.includes('hurt') || message.includes('ache')) {
    return 'symptom_inquiry';
  }
  
  if (message.includes('medication') || message.includes('medicine') || message.includes('drug') ||
      message.includes('pill') || message.includes('dose')) {
    return 'medication_question';
  }
  
  if (message.includes('test') || message.includes('result') || message.includes('lab') ||
      message.includes('blood') || message.includes('scan')) {
    return 'test_results';
  }
  
  if (message.includes('emergency') || message.includes('urgent') || message.includes('severe') ||
      message.includes('chest pain') || message.includes('can\'t breathe')) {
    return 'emergency_concern';
  }
  
  if (message.includes('health') || message.includes('wellness') || message.includes('prevention')) {
    return 'general_health';
  }
  
  return 'general_inquiry';
}

function generateSymptomResponse(message, patientContext) {
  let response = "I understand you're asking about symptoms. ";
  
  if (patientContext && patientContext.recentRecords.length > 0) {
    const recentSymptoms = extractSymptomsFromRecords(patientContext.recentRecords);
    if (recentSymptoms.length > 0) {
      response += `Based on your recent medical records, I see you've had: ${recentSymptoms.join(', ')}. `;
    }
  }
  
  if (message.includes('pain')) {
    response += "For pain management, it's important to identify the location, intensity (1-10 scale), and any triggers. ";
    response += "Over-the-counter pain relievers like acetaminophen or ibuprofen may help for mild pain, but ";
  } else if (message.includes('fever')) {
    response += "For fever, stay hydrated, rest, and monitor your temperature. Fever reducers can help with comfort. ";
  } else if (message.includes('headache')) {
    response += "Headaches can have various causes. Try resting in a quiet, dark room and staying hydrated. ";
  }
  
  response += "However, if symptoms are severe, persistent, or concerning, please contact your healthcare provider or seek medical attention.";
  
  return response;
}

function generateMedicationResponse(message, patientContext) {
  let response = "Regarding medications, ";
  
  if (patientContext && patientContext.recentRecords.length > 0) {
    const medications = extractMedicationsFromRecords(patientContext.recentRecords);
    if (medications.length > 0) {
      response += `I see from your records that you may be taking: ${medications.join(', ')}. `;
    }
  }
  
  if (message.includes('side effect')) {
    response += "Side effects can vary by medication and individual. Common side effects are usually listed with your prescription. ";
  } else if (message.includes('interaction')) {
    response += "Drug interactions are important to consider. Always inform your healthcare providers about all medications you're taking. ";
  } else if (message.includes('dose') || message.includes('dosage')) {
    response += "Dosage should always follow your healthcare provider's instructions. Never adjust doses without consulting them first. ";
  }
  
  response += "For specific medication questions, please consult your pharmacist or healthcare provider who can review your complete medication profile.";
  
  return response;
}

function generateTestResultsResponse(message, patientContext) {
  let response = "Regarding test results, ";
  
  if (patientContext && patientContext.recentRecords.length > 0) {
    const labRecords = patientContext.recentRecords.filter(r => r.category === 'lab-results');
    if (labRecords.length > 0) {
      response += `I see you have recent lab results from ${new Date(labRecords[0].createdAt).toLocaleDateString()}. `;
    }
  }
  
  if (message.includes('normal') || message.includes('abnormal')) {
    response += "Test results should always be interpreted by your healthcare provider who can consider your complete medical picture. ";
  } else if (message.includes('blood')) {
    response += "Blood tests can provide valuable information about your health status. ";
  }
  
  response += "Your healthcare provider is the best person to explain what your test results mean for your specific situation and health goals.";
  
  return response;
}

function generateGeneralHealthResponse(message, patientContext) {
  let response = "For general health and wellness, ";
  
  if (message.includes('prevention')) {
    response += "Prevention is key to maintaining good health. This includes regular exercise, a balanced diet, adequate sleep, stress management, and routine medical check-ups. ";
  } else if (message.includes('diet') || message.includes('nutrition')) {
    response += "A balanced diet rich in fruits, vegetables, whole grains, and lean proteins supports overall health. ";
  } else if (message.includes('exercise')) {
    response += "Regular physical activity is important for cardiovascular health, muscle strength, and mental well-being. Aim for at least 150 minutes of moderate exercise per week. ";
  } else if (message.includes('sleep')) {
    response += "Quality sleep is essential for health. Most adults need 7-9 hours per night. Good sleep hygiene includes a consistent schedule and a comfortable environment. ";
  }
  
  if (patientContext && patientContext.recordCount > 0) {
    response += `Based on your ${patientContext.recordCount} medical records, maintaining regular communication with your healthcare team is important. `;
  }
  
  response += "Consider discussing your health goals and concerns with your healthcare provider for personalized advice.";
  
  return response;
}

function generateEmergencyResponse(message, patientContext) {
  let response = "🚨 **EMERGENCY CONCERN DETECTED** 🚨\n\n";
  
  if (message.includes('chest pain') || message.includes('heart')) {
    response += "Chest pain can be serious and may indicate a heart attack or other cardiac emergency. ";
  } else if (message.includes('breathe') || message.includes('breathing')) {
    response += "Difficulty breathing can be a medical emergency. ";
  } else if (message.includes('severe') && message.includes('pain')) {
    response += "Severe pain may require immediate medical attention. ";
  }
  
  response += "**SEEK IMMEDIATE MEDICAL ATTENTION:**\n";
  response += "• Call 911 or go to the nearest emergency room\n";
  response += "• Call your doctor immediately\n";
  response += "• If you have emergency contacts, consider notifying them\n\n";
  
  if (patientContext && patientContext.patient && patientContext.patient.profile.emergencyContact) {
    const contact = patientContext.patient.profile.emergencyContact;
    response += `Your emergency contact: ${contact.name} (${contact.relationship}) - ${contact.phone}\n\n`;
  }
  
  response += "Do not delay seeking professional medical help for emergency symptoms.";
  
  return response;
}

function generateDefaultResponse(message, patientContext, user) {
  let response = `Hello! I'm your AI health assistant. `;
  
  if (user.role === 'patient') {
    response += "I can help answer general health questions, provide information about symptoms, medications, and wellness tips. ";
    
    if (patientContext && patientContext.recordCount > 0) {
      response += `I have access to your ${patientContext.recordCount} medical records to provide more personalized guidance. `;
    }
  } else if (user.role === 'doctor') {
    response += "I can assist with clinical decision support, patient education materials, and general medical information. ";
    
    if (patientContext) {
      response += `I can help analyze patient data and provide clinical insights based on available medical records. `;
    }
  }
  
  response += "\n\nI can help with:\n";
  response += "• Symptom information and guidance\n";
  response += "• Medication questions and interactions\n";
  response += "• Test result interpretation\n";
  response += "• General health and wellness advice\n";
  response += "• Emergency guidance when needed\n\n";
  
  response += "What would you like to know about today?";
  
  return response;
}

function extractSymptomsFromRecords(records) {
  const symptoms = new Set();
  const symptomKeywords = [
    'pain', 'fever', 'cough', 'headache', 'nausea', 'fatigue',
    'dizziness', 'shortness of breath', 'chest pain', 'back pain'
  ];
  
  records.forEach(record => {
    const text = (record.title + ' ' + record.description).toLowerCase();
    symptomKeywords.forEach(symptom => {
      if (text.includes(symptom)) {
        symptoms.add(symptom);
      }
    });
  });
  
  return Array.from(symptoms).slice(0, 5);
}

function extractMedicationsFromRecords(records) {
  const medications = new Set();
  
  records.forEach(record => {
    if (record.category === 'prescription') {
      const text = (record.title + ' ' + record.description).toLowerCase();
      const medicationPatterns = [
        /(\w+)\s*(\d+\s*mg)/gi,
        /(\w+)\s*tablet/gi,
        /(\w+)\s*capsule/gi,
      ];
      
      medicationPatterns.forEach(pattern => {
        const matches = [...text.matchAll(pattern)];
        matches.forEach(match => {
          if (match[1] && match[1].length > 3) {
            medications.add(match[1].charAt(0).toUpperCase() + match[1].slice(1));
          }
        });
      });
    }
  });
  
  return Array.from(medications).slice(0, 5);
}