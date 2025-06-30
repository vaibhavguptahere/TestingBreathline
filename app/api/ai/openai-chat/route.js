import { authenticateToken } from '@/middleware/auth';
import { checkRateLimit, incrementUsage } from '../rate-limit/route.js';

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
    const rateLimitCheck = checkRateLimit(user._id.toString());
    if (rateLimitCheck.limitExceeded) {
      return Response.json({ 
        error: 'Daily AI request limit exceeded. Please try again tomorrow.',
        rateLimitExceeded: true 
      }, { status: 429 });
    }

    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generate contextual AI response based on user role and message
    const aiResponse = generateContextualResponse(message, context, user.role);

    // Increment usage
    const updatedRateLimit = incrementUsage(user._id.toString());

    return Response.json({
      response: aiResponse,
      rateLimitInfo: updatedRateLimit,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('OpenAI chat error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function generateContextualResponse(message, context, userRole) {
  const lowerMessage = message.toLowerCase();
  
  // Medical condition responses
  if (lowerMessage.includes('headache')) {
    return `Headaches can have various causes including tension, stress, dehydration, lack of sleep, or underlying medical conditions. For tension headaches, try:

• Rest in a quiet, dark room
• Apply a cold or warm compress to your head or neck
• Stay hydrated
• Practice relaxation techniques
• Consider over-the-counter pain relievers if appropriate

Seek immediate medical attention if you experience:
• Sudden, severe headache unlike any you've had before
• Headache with fever, stiff neck, confusion, or vision changes
• Headache after a head injury
• Progressively worsening headaches

${userRole === 'patient' ? 'Always consult with your healthcare provider for persistent or concerning symptoms.' : 'Consider patient history and current medications when making treatment recommendations.'}`;
  }

  if (lowerMessage.includes('chest pain')) {
    return `Chest pain requires careful evaluation as it can range from minor issues to life-threatening conditions.

**Immediate medical attention needed if:**
• Crushing, squeezing, or pressure-like chest pain
• Pain radiating to arm, jaw, neck, or back
• Shortness of breath
• Sweating, nausea, or dizziness
• Pain lasting more than a few minutes

**Possible causes include:**
• Heart-related: Angina, heart attack, pericarditis
• Lung-related: Pneumonia, pulmonary embolism, pneumothorax
• Digestive: GERD, esophageal spasm
• Musculoskeletal: Muscle strain, rib injury
• Anxiety or panic attacks

${userRole === 'doctor' ? 'Consider ECG, chest X-ray, and cardiac enzymes for evaluation. Risk stratification based on patient age, risk factors, and presentation is crucial.' : 'Do not delay seeking emergency care for chest pain - call 911 if symptoms are severe or concerning.'}`;
  }

  if (lowerMessage.includes('fever')) {
    return `Fever is your body's natural response to infection or illness. Normal body temperature is around 98.6°F (37°C).

**Fever management:**
• Stay hydrated with plenty of fluids
• Rest and avoid strenuous activity
• Dress lightly and keep room temperature comfortable
• Consider fever reducers (acetaminophen, ibuprofen) if comfortable

**Seek medical care if:**
• Temperature above 103°F (39.4°C)
• Fever persists more than 3 days
• Accompanied by severe symptoms (difficulty breathing, chest pain, severe headache)
• Signs of dehydration
• In infants under 3 months: any fever warrants immediate medical attention

**Red flags:**
• Stiff neck with fever
• Severe abdominal pain
• Difficulty breathing
• Confusion or altered mental state

${userRole === 'doctor' ? 'Consider source of infection, patient age, immunocompromised status, and associated symptoms when determining treatment approach.' : 'Monitor symptoms closely and don\'t hesitate to seek medical care if concerned.'}`;
  }

  if (lowerMessage.includes('drug interaction') || lowerMessage.includes('medication')) {
    return `Drug interactions can be serious and require careful monitoring. Common types include:

**Major interaction categories:**
• Drug-drug interactions
• Drug-food interactions
• Drug-disease interactions
• Drug-supplement interactions

**High-risk combinations to be aware of:**
• Warfarin with antibiotics, NSAIDs, or certain supplements
• ACE inhibitors with potassium supplements
• Statins with certain antibiotics or antifungals
• MAO inhibitors with many medications and foods

**Always inform healthcare providers about:**
• All prescription medications
• Over-the-counter drugs
• Supplements and herbal products
• Recreational substances

${userRole === 'doctor' ? 'Use drug interaction checkers, consider pharmacokinetic and pharmacodynamic interactions, and monitor patients closely when starting new medications.' : 'Keep an updated list of all medications and supplements, and always check with your pharmacist or doctor before starting new medications.'}`;
  }

  if (lowerMessage.includes('hypertension') || lowerMessage.includes('blood pressure')) {
    return `Hypertension (high blood pressure) is often called the "silent killer" because it typically has no symptoms.

**Blood pressure categories:**
• Normal: Less than 120/80 mmHg
• Elevated: 120-129 systolic, less than 80 diastolic
• Stage 1: 130-139/80-89 mmHg
• Stage 2: 140/90 mmHg or higher
• Crisis: Higher than 180/120 mmHg (seek immediate care)

**Lifestyle modifications:**
• DASH diet (rich in fruits, vegetables, whole grains)
• Reduce sodium intake (less than 2,300mg daily)
• Regular physical activity (150 minutes moderate exercise weekly)
• Maintain healthy weight
• Limit alcohol consumption
• Quit smoking
• Manage stress

**Monitoring:**
• Regular blood pressure checks
• Home monitoring if recommended
• Annual eye exams
• Kidney function tests

${userRole === 'doctor' ? 'Consider 10-year cardiovascular risk assessment, target BP goals based on patient factors, and stepped approach to antihypertensive therapy per current guidelines.' : 'Work with your healthcare team to develop a comprehensive management plan and monitor regularly.'}`;
  }

  if (lowerMessage.includes('diabetes')) {
    return `Diabetes management requires a comprehensive approach focusing on blood sugar control and preventing complications.

**Key management strategies:**
• Blood glucose monitoring as recommended
• Medication adherence (insulin, oral medications)
• Carbohydrate counting and meal planning
• Regular physical activity
• Weight management

**Target ranges (general guidelines):**
• Fasting glucose: 80-130 mg/dL
• Post-meal glucose: Less than 180 mg/dL
• HbA1c: Less than 7% for most adults

**Regular monitoring:**
• HbA1c every 3-6 months
• Annual eye exams
• Foot exams
• Kidney function tests
• Lipid profiles
• Blood pressure monitoring

**Warning signs to watch for:**
• Symptoms of high blood sugar (excessive thirst, frequent urination, fatigue)
• Symptoms of low blood sugar (shakiness, sweating, confusion)
• Foot problems or slow-healing wounds

${userRole === 'doctor' ? 'Individualize HbA1c targets based on patient factors. Consider cardiovascular benefits of newer diabetes medications and screen regularly for complications.' : 'Work closely with your diabetes care team and don\'t hesitate to contact them with concerns about blood sugar control.'}`;
  }

  // General health and wellness responses
  if (lowerMessage.includes('exercise') || lowerMessage.includes('physical activity')) {
    return `Regular physical activity is one of the most important things you can do for your health.

**Current recommendations:**
• Adults: At least 150 minutes moderate-intensity aerobic activity weekly
• Plus muscle-strengthening activities 2+ days per week
• Or 75 minutes vigorous-intensity aerobic activity weekly

**Benefits include:**
• Improved cardiovascular health
• Better weight management
• Stronger bones and muscles
• Reduced risk of chronic diseases
• Better mental health and mood
• Improved sleep quality

**Getting started safely:**
• Start slowly and gradually increase intensity
• Choose activities you enjoy
• Warm up before and cool down after exercise
• Stay hydrated
• Listen to your body

**Consult healthcare provider before starting if you have:**
• Heart disease or risk factors
• Diabetes
• Joint problems
• Previous injuries

${userRole === 'doctor' ? 'Consider exercise stress testing for high-risk patients and provide specific recommendations based on patient conditions and limitations.' : 'Find activities you enjoy to make exercise a sustainable part of your lifestyle.'}`;
  }

  if (lowerMessage.includes('sleep') || lowerMessage.includes('insomnia')) {
    return `Good sleep hygiene is essential for physical and mental health. Most adults need 7-9 hours of sleep per night.

**Sleep hygiene tips:**
• Maintain consistent sleep schedule (same bedtime/wake time daily)
• Create comfortable sleep environment (cool, dark, quiet)
• Avoid screens 1 hour before bedtime
• Limit caffeine, especially afternoon/evening
• Avoid large meals, alcohol, and nicotine before bed
• Regular daytime exercise (but not close to bedtime)

**Relaxation techniques:**
• Deep breathing exercises
• Progressive muscle relaxation
• Meditation or mindfulness
• Reading or gentle stretching

**When to seek help:**
• Difficulty falling asleep or staying asleep for weeks
• Daytime fatigue affecting daily activities
• Loud snoring or breathing interruptions during sleep
• Restless legs or other sleep disturbances

${userRole === 'doctor' ? 'Consider sleep study referral for suspected sleep apnea. Evaluate medications that may affect sleep and underlying conditions contributing to insomnia.' : 'If sleep problems persist despite good sleep hygiene, consult your healthcare provider to rule out underlying sleep disorders.'}`;
  }

  if (lowerMessage.includes('nutrition') || lowerMessage.includes('diet')) {
    return `A balanced diet is fundamental to good health and disease prevention.

**Key principles of healthy eating:**
• Eat a variety of foods from all food groups
• Focus on whole, minimally processed foods
• Include plenty of fruits and vegetables (aim for 5-9 servings daily)
• Choose whole grains over refined grains
• Include lean proteins (fish, poultry, legumes, nuts)
• Limit saturated fats, trans fats, and added sugars
• Stay hydrated with water

**Portion control tips:**
• Use smaller plates and bowls
• Fill half your plate with vegetables
• Quarter with lean protein
• Quarter with whole grains
• Listen to hunger and fullness cues

**Special considerations:**
• Mediterranean diet for heart health
• DASH diet for blood pressure control
• Diabetic meal planning for blood sugar management
• Adequate calcium and vitamin D for bone health

${userRole === 'doctor' ? 'Consider referral to registered dietitian for complex nutritional needs. Assess for nutritional deficiencies and drug-nutrient interactions.' : 'Consider consulting with a registered dietitian for personalized nutrition advice, especially if you have specific health conditions.'}`;
  }

  // Clinical guidelines for doctors
  if (userRole === 'doctor' && lowerMessage.includes('guidelines')) {
    return `Current clinical guidelines emphasize evidence-based practice and patient-centered care:

**Key guideline sources:**
• American Heart Association (AHA)
• American Diabetes Association (ADA)
• American College of Cardiology (ACC)
• U.S. Preventive Services Task Force (USPSTF)
• Centers for Disease Control and Prevention (CDC)

**Recent updates to consider:**
• Blood pressure targets individualized based on cardiovascular risk
• Diabetes management with emphasis on cardiovascular outcomes
• Cancer screening recommendations updated based on latest evidence
• Antibiotic stewardship to combat resistance

**Implementation strategies:**
• Use clinical decision support tools
• Regular continuing medical education
• Quality improvement initiatives
• Patient shared decision-making

Stay current with guideline updates through professional organizations and peer-reviewed literature.`;
  }

  // Default responses based on context
  if (context === 'doctor_consultation') {
    return `I understand you're seeking clinical guidance. While I can provide general medical information, please remember that clinical decisions should always be based on:

• Complete patient history and physical examination
• Appropriate diagnostic testing when indicated
• Current evidence-based guidelines
• Individual patient factors and preferences
• Consultation with specialists when appropriate

For specific clinical scenarios, consider:
• Reviewing current practice guidelines
• Consulting with colleagues or specialists
• Using clinical decision support tools
• Engaging in shared decision-making with patients

Is there a specific clinical topic or condition you'd like to discuss further?`;
  }

  if (context === 'patient_chat') {
    return `I'm here to help provide general health information and support. Based on your question, here are some key points to consider:

• Always consult with your healthcare provider for personalized medical advice
• Keep track of your symptoms and any changes
• Maintain open communication with your medical team
• Follow prescribed treatment plans consistently
• Don't hesitate to seek emergency care if you have concerning symptoms

Remember, this information is for educational purposes and doesn't replace professional medical advice. Your healthcare provider knows your specific situation best.

What specific health topic would you like to learn more about?`;
  }

  // Fallback response
  return `Thank you for your question. I'm here to provide general health information and support. 

For medical concerns, I recommend:
• Consulting with qualified healthcare professionals
• Seeking emergency care for urgent symptoms
• Following evidence-based medical guidelines
• Maintaining regular preventive care

${userRole === 'patient' ? 'Please remember that this information is educational and doesn\'t replace professional medical advice.' : 'Consider current clinical guidelines and individual patient factors when making medical decisions.'}

Is there a specific health topic you'd like to explore further?`;
}