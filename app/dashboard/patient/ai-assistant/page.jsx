'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
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
  Sparkles,
  BarChart3,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';

export default function PatientAIAssistant() {
  const { user } = useAuth();
  const [chatMessages, setChatMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [symptoms, setSymptoms] = useState([]);
  const [currentSymptom, setCurrentSymptom] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [documentText, setDocumentText] = useState('');
  const [documentType, setDocumentType] = useState('lab-results');
  const [rateLimitInfo, setRateLimitInfo] = useState(null);
  const [loadingRateLimit, setLoadingRateLimit] = useState(true);

  const commonSymptoms = [
    'Headache', 'Fever', 'Cough', 'Fatigue', 'Nausea',
    'Dizziness', 'Chest pain', 'Shortness of breath', 'Back pain', 'Joint pain',
    'Sore throat', 'Runny nose', 'Stomach pain', 'Muscle aches', 'Rash'
  ];

  useEffect(() => {
    fetchRateLimitInfo();
    // Add welcome message
    setChatMessages([{
      id: Date.now(),
      type: 'ai',
      content: `Hello ${user?.profile?.firstName || 'there'}! I'm your AI health assistant. I can help answer questions about your health, analyze your medical records, and provide personalized health insights. What would you like to know today?`,
      timestamp: new Date(),
    }]);
  }, [user]);

  const fetchRateLimitInfo = async () => {
    try {
      const response = await fetch('/api/ai/rate-limit', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRateLimitInfo(data);
      }
    } catch (error) {
      console.error('Error fetching rate limit info:', error);
    } finally {
      setLoadingRateLimit(false);
    }
  };

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

    // Check rate limit
    if (rateLimitInfo && rateLimitInfo.remaining <= 0) {
      toast.error('Daily AI request limit reached. Resets at midnight.');
      return;
    }

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: currentMessage,
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/ai/openai-chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentMessage,
          context: 'patient_chat',
          patientId: user._id,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const aiResponse = {
          id: Date.now() + 1,
          type: 'ai',
          content: data.response,
          timestamp: new Date(),
        };
        setChatMessages(prev => [...prev, aiResponse]);
        
        // Update rate limit info
        if (data.rateLimitInfo) {
          setRateLimitInfo(prev => ({
            ...prev,
            used: prev.used + 1,
            remaining: data.rateLimitInfo.remaining,
          }));
        }
      } else {
        if (data.rateLimitExceeded) {
          toast.error(data.error);
        } else {
          throw new Error(data.error || 'Failed to get AI response');
        }
      }
    } catch (error) {
      toast.error('Failed to get AI response');
      const errorResponse = {
        id: Date.now() + 1,
        type: 'ai',
        content: 'I apologize, but I encountered an error. Please try again later.',
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const analyzeSymptoms = async () => {
    if (symptoms.length === 0) {
      toast.error('Please add at least one symptom');
      return;
    }

    // Check rate limit
    if (rateLimitInfo && rateLimitInfo.remaining <= 0) {
      toast.error('Daily AI request limit reached. Resets at midnight.');
      return;
    }

    setAnalyzing(true);
    try {
      const response = await fetch('/api/ai/smart-diagnosis', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symptoms,
          patientId: user._id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAiAnalysis(data.diagnosis);
        toast.success('Symptom analysis completed');
        
        // Update rate limit
        setRateLimitInfo(prev => ({
          ...prev,
          used: prev.used + 1,
          remaining: prev.remaining - 1,
        }));
      } else {
        throw new Error('Analysis failed');
      }
    } catch (error) {
      toast.error('Failed to analyze symptoms');
    } finally {
      setAnalyzing(false);
    }
  };

  const analyzeDocument = async () => {
    if (!documentText.trim()) {
      toast.error('Please enter document text to analyze');
      return;
    }

    // Check rate limit
    if (rateLimitInfo && rateLimitInfo.remaining <= 0) {
      toast.error('Daily AI request limit reached. Resets at midnight.');
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
        
        // Update rate limit
        setRateLimitInfo(prev => ({
          ...prev,
          used: prev.used + 1,
          remaining: prev.remaining - 1,
        }));
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
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high':
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

      {/* Rate Limit Info */}
      {!loadingRateLimit && rateLimitInfo && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center">
              <BarChart3 className="mr-2 h-4 w-4" />
              Daily AI Usage
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Used: {rateLimitInfo.used} / {rateLimitInfo.dailyLimit}</span>
                <span>{rateLimitInfo.remaining} remaining</span>
              </div>
              <Progress value={rateLimitInfo.percentage} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Resets at: {new Date(rateLimitInfo.resetTime).toLocaleTimeString()}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

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
                    {chatMessages.map((message) => (
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
                          <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                          <p className="text-xs opacity-70 mt-1">
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    
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
                      disabled={rateLimitInfo && rateLimitInfo.remaining <= 0}
                    />
                    <Button 
                      onClick={sendChatMessage} 
                      disabled={!currentMessage.trim() || isTyping || (rateLimitInfo && rateLimitInfo.remaining <= 0)}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {rateLimitInfo && rateLimitInfo.remaining <= 0 && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Daily AI request limit reached. Resets at midnight.
                      </AlertDescription>
                    </Alert>
                  )}
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
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-sm"
                    onClick={() => setCurrentMessage("Tell me about heart health tips")}
                  >
                    <Heart className="mr-2 h-4 w-4" />
                    Heart Health Tips
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-sm"
                    onClick={() => setCurrentMessage("What are good exercise guidelines?")}
                  >
                    <Activity className="mr-2 h-4 w-4" />
                    Exercise Guidelines
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-sm"
                    onClick={() => setCurrentMessage("How much water should I drink daily?")}
                  >
                    <Droplets className="mr-2 h-4 w-4" />
                    Hydration Tips
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-sm"
                    onClick={() => setCurrentMessage("What are good sleep hygiene practices?")}
                  >
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
                    <Shield className="h-4 w-4" />
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
                  disabled={analyzing || symptoms.length === 0 || (rateLimitInfo && rateLimitInfo.remaining <= 0)}
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
                
                {rateLimitInfo && rateLimitInfo.remaining <= 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      Daily AI request limit reached. Resets at midnight.
                    </AlertDescription>
                  </Alert>
                )}
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
                {aiAnalysis && aiAnalysis.primaryDiagnosis ? (
                  <div className="space-y-4">
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{aiAnalysis.primaryDiagnosis.condition}</h4>
                        <div className="flex items-center space-x-2">
                          <Badge className={getSeverityColor(aiAnalysis.primaryDiagnosis.severity)}>
                            {aiAnalysis.primaryDiagnosis.severity}
                          </Badge>
                          <span className={`text-sm font-medium ${getProbabilityColor(aiAnalysis.primaryDiagnosis.probability * 100)}`}>
                            {Math.round(aiAnalysis.primaryDiagnosis.probability * 100)}%
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{aiAnalysis.primaryDiagnosis.reasoning}</p>
                      
                      {aiAnalysis.primaryDiagnosis.supportingEvidence && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium">Supporting Evidence:</p>
                          <ul className="text-xs space-y-1">
                            {aiAnalysis.primaryDiagnosis.supportingEvidence.map((evidence, idx) => (
                              <li key={idx} className="flex items-start">
                                <CheckCircle className="mr-1 h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                                {evidence}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {aiAnalysis.recommendations && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Recommendations:</p>
                        <ul className="space-y-1">
                          {aiAnalysis.recommendations.slice(0, 3).map((rec, index) => (
                            <li key={index} className="text-sm flex items-start">
                              <CheckCircle className="mr-2 h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {aiAnalysis.patientContext && (
                      <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
                        <User className="h-4 w-4 text-blue-600" />
                        <AlertDescription>
                          <div className="space-y-1">
                            <p className="font-medium text-blue-800 dark:text-blue-200">Patient Context:</p>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                              Age: {aiAnalysis.patientContext.age} | 
                              Medical Records: {aiAnalysis.analysisMetadata?.medicalRecords || 0} | 
                              Chronic Conditions: {aiAnalysis.patientContext.chronicConditions?.length || 0}
                            </p>
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="text-xs text-muted-foreground p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="font-medium mb-1">⚠️ Important Disclaimer</p>
                      <p>This AI analysis is for informational purposes only and should not replace professional medical advice. Always consult with healthcare professionals for medical concerns.</p>
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
                  <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="lab-results">Lab Results</option>
                    <option value="imaging">Medical Imaging</option>
                    <option value="prescription">Prescription</option>
                    <option value="consultation">Consultation Notes</option>
                    <option value="general">General Medical Document</option>
                  </select>
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
                  disabled={analyzing || !documentText.trim() || (rateLimitInfo && rateLimitInfo.remaining <= 0)}
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
                
                {rateLimitInfo && rateLimitInfo.remaining <= 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      Daily AI request limit reached. Resets at midnight.
                    </AlertDescription>
                  </Alert>
                )}
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