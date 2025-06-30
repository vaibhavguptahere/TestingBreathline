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
  MessageCircle,
  Send,
  BarChart3,
  Users,
  Stethoscope
} from 'lucide-react';
import { toast } from 'sonner';

export default function DoctorAIAssistant() {
  const { user } = useAuth();
  const [selectedPatient, setSelectedPatient] = useState('');
  const [analysisType, setAnalysisType] = useState('comprehensive');
  const [customQuery, setCustomQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [rateLimitInfo, setRateLimitInfo] = useState(null);
  const [loadingRateLimit, setLoadingRateLimit] = useState(true);

  // Mock patients - in real app, fetch from API
  const patients = [
    { id: '1', name: 'John Smith', age: 45, conditions: ['Diabetes', 'Hypertension'] },
    { id: '2', name: 'Sarah Johnson', age: 32, conditions: ['Asthma'] },
    { id: '3', name: 'Michael Brown', age: 58, conditions: ['Heart Disease', 'High Cholesterol'] },
  ];

  const analysisTypes = [
    { value: 'comprehensive', label: 'Comprehensive Health Summary' },
    { value: 'risk-assessment', label: 'Risk Assessment' },
    { value: 'treatment-plan', label: 'Treatment Plan Review' },
    { value: 'drug-interactions', label: 'Drug Interaction Analysis' },
    { value: 'custom', label: 'Custom Analysis' },
  ];

  useEffect(() => {
    fetchRateLimitInfo();
    // Add welcome message
    setChatMessages([{
      id: Date.now(),
      type: 'ai',
      content: `Hello Dr. ${user?.profile?.firstName || 'Doctor'}! I'm your AI clinical assistant. I can help with patient analysis, clinical decision support, and medical information. How can I assist you today?`,
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

  const generateAISummary = async () => {
    if (!selectedPatient) {
      toast.error('Please select a patient');
      return;
    }

    // Check rate limit
    if (rateLimitInfo && rateLimitInfo.remaining <= 0) {
      toast.error('Daily AI request limit reached. Resets at midnight.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/ai/patient-summary', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId: selectedPatient,
          analysisType,
          customQuery: analysisType === 'custom' ? customQuery : null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAiSummary(data.summary);
        toast.success('AI analysis completed successfully');
        
        // Update rate limit
        setRateLimitInfo(prev => ({
          ...prev,
          used: prev.used + 1,
          remaining: prev.remaining - 1,
        }));
      } else {
        throw new Error('Failed to generate AI summary');
      }
    } catch (error) {
      toast.error('Failed to generate AI summary');
    } finally {
      setLoading(false);
    }
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
          context: 'doctor_consultation',
          patientId: selectedPatient,
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

  const getRiskLevelColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Clinical Assistant</h1>
        <p className="text-muted-foreground">
          Get AI-powered insights and analysis for your patients and clinical decisions
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

      <Tabs defaultValue="patient-analysis" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="patient-analysis">Patient Analysis</TabsTrigger>
          <TabsTrigger value="clinical-chat">Clinical Chat</TabsTrigger>
        </TabsList>

        <TabsContent value="patient-analysis" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* AI Analysis Input */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="mr-2 h-5 w-5 text-purple-600" />
                  Patient AI Analysis
                </CardTitle>
                <CardDescription>
                  Select a patient and analysis type to generate AI insights
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Patient</label>
                  <select
                    value={selectedPatient}
                    onChange={(e) => setSelectedPatient(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">Choose a patient</option>
                    {patients.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.name} (Age {patient.age})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Analysis Type</label>
                  <select
                    value={analysisType}
                    onChange={(e) => setAnalysisType(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    {analysisTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {analysisType === 'custom' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Custom Query</label>
                    <Textarea
                      value={customQuery}
                      onChange={(e) => setCustomQuery(e.target.value)}
                      placeholder="Enter your specific question or analysis request..."
                      rows={3}
                    />
                  </div>
                )}

                <Button
                  onClick={generateAISummary}
                  disabled={loading || !selectedPatient || (rateLimitInfo && rateLimitInfo.remaining <= 0)}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating AI Analysis...
                    </>
                  ) : (
                    <>
                      <Bot className="mr-2 h-4 w-4" />
                      Generate AI Analysis
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

                {selectedPatient && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                      Selected Patient
                    </h4>
                    {(() => {
                      const patient = patients.find(p => p.id === selectedPatient);
                      return patient ? (
                        <div className="text-sm">
                          <p>{patient.name}, Age {patient.age}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {patient.conditions.map((condition, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {condition}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lightbulb className="mr-2 h-5 w-5 text-yellow-600" />
                  Quick Clinical Actions
                </CardTitle>
                <CardDescription>
                  Common AI-powered clinical analysis tools
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  Analyze Lab Results
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Risk Stratification
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Drug Interaction Check
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <User className="mr-2 h-4 w-4" />
                  Patient Similarity Analysis
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Treatment Effectiveness
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* AI Analysis Results */}
          {aiSummary && (
            <Card className="border-purple-200 bg-purple-50 dark:bg-purple-900/20">
              <CardHeader>
                <CardTitle className="flex items-center text-purple-900 dark:text-purple-100">
                  <Bot className="mr-2 h-5 w-5" />
                  AI Clinical Analysis Results
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge className={getRiskLevelColor(aiSummary.aiInsights?.riskLevel)}>
                    Risk Level: {aiSummary.aiInsights?.riskLevel}
                  </Badge>
                  <Badge variant="outline">
                    Confidence: {Math.round(aiSummary.confidence * 100)}%
                  </Badge>
                  <Badge variant="outline">
                    Records: {aiSummary.medicalHistory?.totalRecords || 0}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Patient Overview */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                    <h4 className="font-semibold mb-2 flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Patient Overview
                    </h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Name:</span> {aiSummary.patientInfo.name}</p>
                      <p><span className="font-medium">Age:</span> {aiSummary.patientInfo.age}</p>
                      <p><span className="font-medium">Email:</span> {aiSummary.patientInfo.email}</p>
                      <p><span className="font-medium">Phone:</span> {aiSummary.patientInfo.phone}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                    <h4 className="font-semibold mb-2">Medical History Summary</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Total Records:</span> {aiSummary.medicalHistory.totalRecords}</p>
                      <p><span className="font-medium">Conditions:</span> {aiSummary.medicalHistory.chronicConditions?.length || 0}</p>
                      <p><span className="font-medium">Allergies:</span> {aiSummary.medicalHistory.allergies?.length || 0}</p>
                      <p><span className="font-medium">Medications:</span> {aiSummary.currentMedications?.length || 0}</p>
                    </div>
                  </div>
                </div>

                {/* Medical History */}
                {aiSummary.medicalHistory.chronicConditions?.length > 0 && (
                  <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                    <h4 className="font-semibold mb-3">Chronic Conditions</h4>
                    <div className="flex flex-wrap gap-2">
                      {aiSummary.medicalHistory.chronicConditions.map((condition, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {condition}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Current Medications */}
                {aiSummary.currentMedications?.length > 0 && (
                  <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                    <h4 className="font-semibold mb-3">Current Medications</h4>
                    <div className="grid md:grid-cols-2 gap-3">
                      {aiSummary.currentMedications.slice(0, 6).map((med, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <p className="font-medium">{med.name}</p>
                          <p className="text-sm text-muted-foreground">{med.dosage}</p>
                          <p className="text-xs text-muted-foreground">{med.purpose}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Insights */}
                <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg">
                  <h4 className="font-semibold mb-3 flex items-center">
                    <Brain className="mr-2 h-4 w-4" />
                    AI Clinical Insights
                  </h4>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="font-medium text-sm mb-2">Risk Assessment:</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(aiSummary.riskFactors || {}).map(([category, factors]) => (
                          factors.length > 0 && (
                            <div key={category} className="text-xs">
                              <span className="font-medium capitalize">{category}:</span> {factors.join(', ')}
                            </div>
                          )
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="font-medium text-sm mb-2">Clinical Recommendations:</p>
                      <ul className="space-y-1">
                        {aiSummary.recommendations?.slice(0, 3).map((rec, index) => (
                          <li key={index} className="text-sm flex items-start">
                            <CheckCircle className="mr-2 h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Emergency Information */}
                {aiSummary.emergencyInfo && (
                  <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <p className="font-medium text-red-800 dark:text-red-200">Emergency Information</p>
                        <div className="text-sm text-red-700 dark:text-red-300">
                          <p><strong>Emergency Contact:</strong> {aiSummary.emergencyInfo.emergencyContact?.name || 'Not provided'}</p>
                          <p><strong>Critical Allergies:</strong> {aiSummary.emergencyInfo.criticalAllergies?.join(', ') || 'None listed'}</p>
                          <p><strong>Emergency Records:</strong> {aiSummary.emergencyInfo.emergencyRecords || 0}</p>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="text-xs text-muted-foreground text-center">
                  Analysis generated on {new Date(aiSummary.lastUpdated).toLocaleString()} • 
                  Confidence: {Math.round(aiSummary.confidence * 100)}%
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="clinical-chat" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Chat Interface */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageCircle className="mr-2 h-5 w-5 text-blue-600" />
                    AI Clinical Chat
                  </CardTitle>
                  <CardDescription>
                    Get clinical decision support and medical information
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
                      placeholder="Ask about clinical decisions, drug interactions, diagnoses..."
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

            {/* Clinical Tools */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Stethoscope className="mr-2 h-5 w-5 text-green-600" />
                    Quick Clinical Queries
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-sm"
                    onClick={() => setCurrentMessage("What are the latest guidelines for hypertension management?")}
                  >
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Clinical Guidelines
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-sm"
                    onClick={() => setCurrentMessage("Check drug interactions for metformin and lisinopril")}
                  >
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Drug Interactions
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-sm"
                    onClick={() => setCurrentMessage("Differential diagnosis for chest pain in 45-year-old male")}
                  >
                    <Brain className="mr-2 h-4 w-4" />
                    Differential Diagnosis
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-sm"
                    onClick={() => setCurrentMessage("Recommended lab tests for diabetes monitoring")}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Lab Recommendations
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Patient Context</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select Patient for Context</label>
                    <select
                      value={selectedPatient}
                      onChange={(e) => setSelectedPatient(e.target.value)}
                      className="w-full p-2 border rounded-md text-sm"
                    >
                      <option value="">No patient selected</option>
                      {patients.map((patient) => (
                        <option key={patient.id} value={patient.id}>
                          {patient.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground">
                      Select a patient to provide context for AI responses
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}