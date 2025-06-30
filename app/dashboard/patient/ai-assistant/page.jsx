'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bot, 
  Brain, 
  FileText, 
  User, 
  Loader2,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Upload,
  Scan,
  Activity,
  Target,
  Clock,
  Zap,
  Heart,
  Thermometer,
  Droplets,
  Wind,
  Eye,
  MessageCircle,
  Send,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

export default function PatientAIAssistant() {
  const { user } = useAuth();
  const [chatMessages, setChatMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [symptoms, setSymptoms] = useState([]);
  const [currentSymptom, setCurrentSymptom] = useState('');
  const [analysisType, setAnalysisType] = useState('symptom-checker');
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [documentText, setDocumentText] = useState('');
  const [documentType, setDocumentType] = useState('lab-results');

  const commonSymptoms = [
    'Headache', 'Fever', 'Cough', 'Fatigue', 'Nausea',
    'Dizziness', 'Chest pain', 'Shortness of breath', 'Back pain', 'Joint pain',
    'Sore throat', 'Runny nose', 'Stomach pain', 'Muscle aches', 'Rash'
  ];

  const analysisTypes = [
    { value: 'symptom-checker', label: 'Symptom Checker' },
    { value: 'health-insights', label: 'Health Insights' },
    { value: 'medication-info', label: 'Medication Information' },
    { value: 'wellness-tips', label: 'Wellness Tips' },
    { value: 'document-analysis', label: 'Document Analysis' },
  ];

  const addSymptom = () => {
    if (currentSymptom.trim() && !symptoms.includes(currentSymptom.trim())) {
      setSymptoms([...symptoms, currentSymptom.trim()]);
      setCurrentSymptom('');
    }
  };

  const addCommonSymptom = (symptom) => {
    if (!symptoms.includes(symptom)) {
      setSymptoms([...symptoms, symptom]);
    }
  };

  const removeSymptom = (symptomToRemove) => {
    setSymptoms(symptoms.filter(symptom => symptom !== symptomToRemove));
  };

  const sendChatMessage = async () => {
    if (!currentMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: currentMessage,
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        id: Date.now() + 1,
        type: 'ai',
        content: generateAIResponse(currentMessage),
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 2000);
  };

  const generateAIResponse = (message) => {
    const responses = {
      'headache': "Headaches can have various causes including stress, dehydration, lack of sleep, or tension. For mild headaches, try drinking water, resting in a quiet dark room, and applying a cold compress. If headaches are severe, frequent, or accompanied by other symptoms like fever, vision changes, or neck stiffness, please consult a healthcare provider.",
      'fever': "A fever is your body's natural response to infection. For adults, a fever is generally considered 100.4°F (38°C) or higher. Stay hydrated, rest, and consider over-the-counter fever reducers if comfortable. Seek medical attention if fever exceeds 103°F (39.4°C), persists for more than 3 days, or is accompanied by severe symptoms.",
      'cough': "Coughs can be caused by viral infections, allergies, or irritants. For a dry cough, try honey, warm liquids, and humidified air. For productive coughs, stay hydrated to help thin mucus. See a doctor if cough persists more than 3 weeks, produces blood, or is accompanied by fever and difficulty breathing.",
      'default': "I understand you're concerned about your symptoms. While I can provide general health information, it's important to consult with a healthcare professional for proper diagnosis and treatment. They can evaluate your specific situation and provide personalized medical advice."
    };

    const lowerMessage = message.toLowerCase();
    for (const [key, response] of Object.entries(responses)) {
      if (lowerMessage.includes(key)) {
        return response;
      }
    }
    return responses.default;
  };

  const analyzeSymptoms = async () => {
    if (symptoms.length === 0) {
      toast.error('Please add at least one symptom');
      return;
    }

    setAnalyzing(true);
    try {
      // Simulate AI analysis
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const mockAnalysis = {
        symptoms: symptoms,
        possibleCauses: [
          {
            condition: 'Common Cold',
            probability: 75,
            description: 'A viral infection affecting the upper respiratory tract',
            severity: 'mild',
            recommendations: [
              'Get plenty of rest',
              'Stay hydrated with fluids',
              'Use a humidifier or breathe steam',
              'Consider over-the-counter pain relievers'
            ]
          },
          {
            condition: 'Seasonal Allergies',
            probability: 45,
            description: 'Allergic reaction to environmental allergens',
            severity: 'mild',
            recommendations: [
              'Avoid known allergens',
              'Consider antihistamines',
              'Keep windows closed during high pollen days',
              'Shower after being outdoors'
            ]
          },
          {
            condition: 'Stress/Tension',
            probability: 30,
            description: 'Physical symptoms related to stress or anxiety',
            severity: 'mild',
            recommendations: [
              'Practice relaxation techniques',
              'Ensure adequate sleep',
              'Regular exercise',
              'Consider stress management counseling'
            ]
          }
        ],
        whenToSeekCare: [
          'Symptoms worsen or persist beyond 7-10 days',
          'Fever above 101.3°F (38.5°C)',
          'Difficulty breathing or chest pain',
          'Severe headache or neck stiffness',
          'Signs of dehydration'
        ],
        disclaimer: 'This analysis is for informational purposes only and should not replace professional medical advice.'
      };

      setAiAnalysis(mockAnalysis);
      toast.success('Symptom analysis completed');
    } catch (error) {
      toast.error('Analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const analyzeDocument = async () => {
    if (!documentText.trim()) {
      toast.error('Please enter document text to analyze');
      return;
    }

    setAnalyzing(true);
    try {
      const response = await fetch('/api/ai/analyze-document', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentText,
          documentType,
          symptoms: symptoms.join(', '),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAiAnalysis({
          documentAnalysis: data.analysis,
          type: 'document'
        });
        toast.success('Document analysis completed');
      } else {
        throw new Error('Analysis failed');
      }
    } catch (error) {
      toast.error('Document analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const getProbabilityColor = (probability) => {
    if (probability >= 70) return 'text-red-600 font-bold';
    if (probability >= 50) return 'text-orange-600 font-semibold';
    if (probability >= 30) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'mild':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'severe':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Medical Assistant</h1>
        <p className="text-muted-foreground">
          Get personalized health insights and symptom analysis powered by AI
        </p>
      </div>

      <Tabs defaultValue="chat" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="chat">AI Chat</TabsTrigger>
          <TabsTrigger value="symptoms">Symptom Checker</TabsTrigger>
          <TabsTrigger value="documents">Document Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Chat Interface */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageCircle className="mr-2 h-5 w-5 text-blue-600" />
                    AI Health Chat
                  </CardTitle>
                  <CardDescription>
                    Ask questions about your health, symptoms, or general wellness
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Chat Messages */}
                  <div className="h-96 overflow-y-auto border rounded-lg p-4 space-y-4">
                    {chatMessages.length === 0 ? (
                      <div className="text-center py-12">
                        <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">
                          Hi! I'm your AI health assistant. Ask me about symptoms, health concerns, or wellness tips.
                        </p>
                      </div>
                    ) : (
                      chatMessages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] p-3 rounded-lg ${
                              message.type === 'user'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-800'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {message.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                    
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Chat Input */}
                  <div className="flex space-x-2">
                    <Input
                      value={currentMessage}
                      onChange={(e) => setCurrentMessage(e.target.value)}
                      placeholder="Ask about your health concerns..."
                      onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                      className="flex-1"
                    />
                    <Button onClick={sendChatMessage} disabled={!currentMessage.trim() || isTyping}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Sparkles className="mr-2 h-5 w-5 text-purple-600" />
                    Quick Health Tips
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start text-sm">
                    <Heart className="mr-2 h-4 w-4" />
                    Heart Health Tips
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-sm">
                    <Activity className="mr-2 h-4 w-4" />
                    Exercise Guidelines
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-sm">
                    <Droplets className="mr-2 h-4 w-4" />
                    Hydration Reminders
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-sm">
                    <Clock className="mr-2 h-4 w-4" />
                    Sleep Hygiene
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Health Disclaimer</CardTitle>
                </CardHeader>
                <CardContent>
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      This AI assistant provides general health information only. Always consult healthcare professionals for medical advice, diagnosis, or treatment.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="symptoms" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Symptom Input */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="mr-2 h-5 w-5 text-green-600" />
                  Symptom Checker
                </CardTitle>
                <CardDescription>
                  Add your symptoms to get AI-powered health insights
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    value={currentSymptom}
                    onChange={(e) => setCurrentSymptom(e.target.value)}
                    placeholder="Enter a symptom..."
                    onKeyPress={(e) => e.key === 'Enter' && addSymptom()}
                  />
                  <Button onClick={addSymptom} size="icon">
                    <Zap className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium">Common Symptoms:</p>
                  <div className="flex flex-wrap gap-2">
                    {commonSymptoms.map((symptom) => (
                      <Button
                        key={symptom}
                        variant="outline"
                        size="sm"
                        onClick={() => addCommonSymptom(symptom)}
                        disabled={symptoms.includes(symptom)}
                        className="text-xs"
                      >
                        {symptom}
                      </Button>
                    ))}
                  </div>
                </div>

                {symptoms.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Your Symptoms:</p>
                    <div className="flex flex-wrap gap-2">
                      {symptoms.map((symptom, index) => (
                        <Badge key={index} variant="outline" className="flex items-center gap-1">
                          {symptom}
                          <button
                            onClick={() => removeSymptom(symptom)}
                            className="ml-1 hover:text-red-600"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  onClick={analyzeSymptoms}
                  disabled={analyzing || symptoms.length === 0}
                  className="w-full"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing Symptoms...
                    </>
                  ) : (
                    <>
                      <Brain className="mr-2 h-4 w-4" />
                      Analyze Symptoms
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Analysis Results */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="mr-2 h-5 w-5 text-blue-600" />
                  Analysis Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                {aiAnalysis && aiAnalysis.possibleCauses ? (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      {aiAnalysis.possibleCauses.map((cause, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{cause.condition}</h4>
                            <div className="flex items-center space-x-2">
                              <Badge className={getSeverityColor(cause.severity)}>
                                {cause.severity}
                              </Badge>
                              <span className={`text-sm font-medium ${getProbabilityColor(cause.probability)}`}>
                                {cause.probability}%
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{cause.description}</p>
                          <div className="space-y-1">
                            <p className="text-xs font-medium">Recommendations:</p>
                            <ul className="text-xs space-y-1">
                              {cause.recommendations.map((rec, idx) => (
                                <li key={idx} className="flex items-start">
                                  <CheckCircle className="mr-1 h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                                  {rec}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <AlertDescription>
                        <div className="space-y-2">
                          <p className="font-medium text-amber-800 dark:text-amber-200">When to Seek Medical Care:</p>
                          <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                            {aiAnalysis.whenToSeekCare.map((item, index) => (
                              <li key={index} className="flex items-start">
                                <span className="mr-2">•</span>
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </AlertDescription>
                    </Alert>

                    <div className="text-xs text-muted-foreground p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="font-medium mb-1">⚠️ Important Disclaimer</p>
                      <p>{aiAnalysis.disclaimer}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Add your symptoms above to get AI-powered health insights
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Document Analysis Input */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-5 w-5 text-purple-600" />
                  Document Analysis
                </CardTitle>
                <CardDescription>
                  Get AI insights from your medical documents and reports
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Document Type</label>
                  <Select value={documentType} onValueChange={setDocumentType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lab-results">Lab Results</SelectItem>
                      <SelectItem value="imaging">Medical Imaging</SelectItem>
                      <SelectItem value="prescription">Prescription</SelectItem>
                      <SelectItem value="consultation">Consultation Notes</SelectItem>
                      <SelectItem value="general">General Medical Document</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Document Text</label>
                  <Textarea
                    value={documentText}
                    onChange={(e) => setDocumentText(e.target.value)}
                    placeholder="Paste your medical document content here..."
                    rows={8}
                    className="min-h-[200px]"
                  />
                </div>

                <Button
                  onClick={analyzeDocument}
                  disabled={analyzing || !documentText.trim()}
                  className="w-full"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing Document...
                    </>
                  ) : (
                    <>
                      <Scan className="mr-2 h-4 w-4" />
                      Analyze Document
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Document Analysis Results */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lightbulb className="mr-2 h-5 w-5 text-yellow-600" />
                  Document Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                {aiAnalysis && aiAnalysis.type === 'document' ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <h4 className="font-semibold mb-2">Summary</h4>
                      <p className="text-sm">{aiAnalysis.documentAnalysis.summary}</p>
                    </div>
                    
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <h4 className="font-semibold mb-2">Key Findings</h4>
                      <ul className="space-y-1">
                        {aiAnalysis.documentAnalysis.findings.map((finding, index) => (
                          <li key={index} className="text-sm flex items-start">
                            <CheckCircle className="mr-2 h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                            {finding}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <h4 className="font-semibold mb-2">Recommendations</h4>
                      <ul className="space-y-1">
                        {aiAnalysis.documentAnalysis.recommendations.map((rec, index) => (
                          <li key={index} className="text-sm flex items-start">
                            <TrendingUp className="mr-2 h-3 w-3 text-purple-600 mt-0.5 flex-shrink-0" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Confidence: {Math.round(aiAnalysis.documentAnalysis.confidence * 100)}%</span>
                      <span>Severity: {aiAnalysis.documentAnalysis.severity}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Upload a medical document to get AI-powered insights
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}