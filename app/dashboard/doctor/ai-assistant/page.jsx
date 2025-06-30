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
  Zap
} from 'lucide-react';
import { toast } from 'sonner';

export default function AIAssistant() {
  const { user } = useAuth();
  const [selectedPatient, setSelectedPatient] = useState('');
  const [analysisType, setAnalysisType] = useState('comprehensive');
  const [customQuery, setCustomQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState(null);
  const [documentAnalysis, setDocumentAnalysis] = useState(null);
  const [analyzingDocument, setAnalyzingDocument] = useState(false);
  const [documentText, setDocumentText] = useState('');
  const [documentType, setDocumentType] = useState('lab-results');
  const [symptoms, setSymptoms] = useState('');

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

  const documentTypes = [
    { value: 'lab-results', label: 'Lab Results' },
    { value: 'imaging', label: 'Medical Imaging' },
    { value: 'prescription', label: 'Prescription' },
    { value: 'consultation', label: 'Consultation Notes' },
    { value: 'general', label: 'General Medical Document' },
  ];

  const generateAISummary = async () => {
    if (!selectedPatient) {
      toast.error('Please select a patient');
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
      } else {
        throw new Error('Failed to generate AI summary');
      }
    } catch (error) {
      toast.error('Failed to generate AI summary');
    } finally {
      setLoading(false);
    }
  };

  const analyzeDocument = async () => {
    if (!documentText.trim()) {
      toast.error('Please enter document text to analyze');
      return;
    }

    setAnalyzingDocument(true);
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
          symptoms,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setDocumentAnalysis(data);
        toast.success('Document analysis completed successfully');
      } else {
        throw new Error('Failed to analyze document');
      }
    } catch (error) {
      toast.error('Failed to analyze document');
    } finally {
      setAnalyzingDocument(false);
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

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'low':
        return 'text-green-600';
      case 'moderate':
        return 'text-yellow-600';
      case 'high':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Medical Assistant</h1>
        <p className="text-muted-foreground">
          Get AI-powered insights and analysis for your patients and medical documents
        </p>
      </div>

      <Tabs defaultValue="patient-analysis" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="patient-analysis">Patient Analysis</TabsTrigger>
          <TabsTrigger value="document-analysis">Document Analysis</TabsTrigger>
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
                  <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{patient.name}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              Age {patient.age}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Analysis Type</label>
                  <Select value={analysisType} onValueChange={setAnalysisType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {analysisTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  disabled={loading || !selectedPatient}
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
                  Quick AI Actions
                </CardTitle>
                <CardDescription>
                  Common AI-powered medical analysis tools
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
                  AI Medical Analysis Results
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge className={getRiskLevelColor(aiSummary.aiInsights?.riskLevel)}>
                    Risk Level: {aiSummary.aiInsights?.riskLevel}
                  </Badge>
                  <Badge variant="outline">
                    Confidence: {Math.round(aiSummary.confidence * 100)}%
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
                      <p><span className="font-medium">Gender:</span> {aiSummary.patientInfo.gender}</p>
                      <p><span className="font-medium">Blood Type:</span> {aiSummary.patientInfo.bloodType}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                    <h4 className="font-semibold mb-2">AI Health Assessment</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Overall Health:</span> {aiSummary.aiInsights.overallHealth}</p>
                      <p><span className="font-medium">Risk Level:</span> 
                        <Badge className={`ml-2 ${getRiskLevelColor(aiSummary.aiInsights.riskLevel)}`}>
                          {aiSummary.aiInsights.riskLevel}
                        </Badge>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Medical History */}
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                  <h4 className="font-semibold mb-3">Medical History</h4>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-red-700 dark:text-red-400 mb-1">Chronic Conditions</p>
                      <ul className="space-y-1">
                        {aiSummary.medicalHistory.chronicConditions.map((condition, index) => (
                          <li key={index} className="text-xs">• {condition}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium text-orange-700 dark:text-orange-400 mb-1">Allergies</p>
                      <ul className="space-y-1">
                        {aiSummary.medicalHistory.allergies.map((allergy, index) => (
                          <li key={index} className="text-xs">• {allergy}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium text-blue-700 dark:text-blue-400 mb-1">Surgeries</p>
                      <ul className="space-y-1">
                        {aiSummary.medicalHistory.surgeries.map((surgery, index) => (
                          <li key={index} className="text-xs">• {surgery}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Current Medications */}
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                  <h4 className="font-semibold mb-3">Current Medications</h4>
                  <div className="grid md:grid-cols-2 gap-3">
                    {aiSummary.currentMedications.map((med, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <p className="font-medium">{med.name}</p>
                        <p className="text-sm text-muted-foreground">{med.dosage}</p>
                        <p className="text-xs text-muted-foreground">{med.purpose}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Insights */}
                <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg">
                  <h4 className="font-semibold mb-3 flex items-center">
                    <Brain className="mr-2 h-4 w-4" />
                    AI Insights & Recommendations
                  </h4>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="font-medium text-sm mb-2">Priority Areas for Attention:</p>
                      <div className="flex flex-wrap gap-2">
                        {aiSummary.aiInsights.priorityAreas.map((area, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {area}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="font-medium text-sm mb-2">AI Recommendations:</p>
                      <ul className="space-y-1">
                        {aiSummary.recommendations.slice(0, 3).map((rec, index) => (
                          <li key={index} className="text-sm flex items-start">
                            <CheckCircle className="mr-2 h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <p className="font-medium text-sm mb-2">Next Steps:</p>
                      <ul className="space-y-1">
                        {aiSummary.aiInsights.nextSteps.map((step, index) => (
                          <li key={index} className="text-sm flex items-start">
                            <TrendingUp className="mr-2 h-3 w-3 text-blue-600 mt-0.5 flex-shrink-0" />
                            {step}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Emergency Information */}
                <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium text-red-800 dark:text-red-200">Emergency Information</p>
                      <div className="text-sm text-red-700 dark:text-red-300">
                        <p><strong>Emergency Contact:</strong> {aiSummary.emergencyInfo.emergencyContact}</p>
                        <p><strong>Critical Allergies:</strong> {aiSummary.emergencyInfo.criticalAllergies.join(', ')}</p>
                        <p><strong>Current Medications:</strong> {aiSummary.emergencyInfo.currentMedications.join(', ')}</p>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>

                <div className="text-xs text-muted-foreground text-center">
                  Analysis generated on {new Date(aiSummary.lastUpdated).toLocaleString()} • 
                  Confidence: {Math.round(aiSummary.confidence * 100)}%
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="document-analysis" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Document Analysis Input */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Scan className="mr-2 h-5 w-5 text-blue-600" />
                  Document AI Analysis
                </CardTitle>
                <CardDescription>
                  Analyze medical documents with AI for insights and recommendations
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
                      {documentTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Document Text</label>
                  <Textarea
                    value={documentText}
                    onChange={(e) => setDocumentText(e.target.value)}
                    placeholder="Paste or type the medical document content here..."
                    rows={6}
                    className="min-h-[150px]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Patient Symptoms (Optional)</label>
                  <Input
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    placeholder="e.g., chest pain, shortness of breath..."
                  />
                </div>

                <Button
                  onClick={analyzeDocument}
                  disabled={analyzingDocument || !documentText.trim()}
                  className="w-full"
                >
                  {analyzingDocument ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing Document...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Analyze Document
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Analysis Features */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="mr-2 h-5 w-5 text-green-600" />
                  AI Analysis Features
                </CardTitle>
                <CardDescription>
                  What our AI can analyze in medical documents
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Key Findings Extraction</p>
                    <p className="text-xs text-muted-foreground">
                      Identifies important medical findings and abnormalities
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Risk Assessment</p>
                    <p className="text-xs text-muted-foreground">
                      Evaluates potential health risks and severity levels
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Treatment Recommendations</p>
                    <p className="text-xs text-muted-foreground">
                      Suggests follow-up actions and treatment options
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Drug Interactions</p>
                    <p className="text-xs text-muted-foreground">
                      Checks for potential medication conflicts
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Trend Analysis</p>
                    <p className="text-xs text-muted-foreground">
                      Identifies patterns and changes over time
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Document Analysis Results */}
          {documentAnalysis && (
            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
              <CardHeader>
                <CardTitle className="flex items-center text-blue-900 dark:text-blue-100">
                  <Brain className="mr-2 h-5 w-5" />
                  Document Analysis Results
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge className={getRiskLevelColor(documentAnalysis.analysis?.severity)}>
                    Severity: {documentAnalysis.analysis?.severity}
                  </Badge>
                  <Badge variant="outline">
                    Confidence: {Math.round(documentAnalysis.analysis?.confidence * 100)}%
                  </Badge>
                  <Badge variant="outline">
                    <Clock className="mr-1 h-3 w-3" />
                    {new Date(documentAnalysis.timestamp).toLocaleString()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Summary */}
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center">
                    <FileText className="mr-2 h-4 w-4" />
                    Analysis Summary
                  </h4>
                  <p className="text-sm">{documentAnalysis.analysis?.summary}</p>
                </div>

                {/* Key Findings */}
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                  <h4 className="font-semibold mb-3 flex items-center">
                    <Activity className="mr-2 h-4 w-4" />
                    Key Findings
                  </h4>
                  <ul className="space-y-2">
                    {documentAnalysis.analysis?.findings?.map((finding, index) => (
                      <li key={index} className="text-sm flex items-start">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        {finding}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Recommendations */}
                <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg">
                  <h4 className="font-semibold mb-3 flex items-center">
                    <Lightbulb className="mr-2 h-4 w-4" />
                    AI Recommendations
                  </h4>
                  <ul className="space-y-2">
                    {documentAnalysis.analysis?.recommendations?.map((rec, index) => (
                      <li key={index} className="text-sm flex items-start">
                        <CheckCircle className="mr-2 h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Severity Assessment */}
                <Alert className={`border-${documentAnalysis.analysis?.severity === 'high' ? 'red' : documentAnalysis.analysis?.severity === 'moderate' ? 'yellow' : 'green'}-200`}>
                  <AlertTriangle className={`h-4 w-4 ${getSeverityColor(documentAnalysis.analysis?.severity)}`} />
                  <AlertDescription>
                    <div className="space-y-1">
                      <p className="font-medium">Severity Assessment: {documentAnalysis.analysis?.severity?.toUpperCase()}</p>
                      <p className="text-sm">
                        {documentAnalysis.analysis?.severity === 'high' && 'Immediate attention may be required. Consider urgent follow-up.'}
                        {documentAnalysis.analysis?.severity === 'moderate' && 'Monitor closely and schedule appropriate follow-up.'}
                        {documentAnalysis.analysis?.severity === 'low' && 'Routine monitoring and standard care protocols apply.'}
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>

                <div className="text-xs text-muted-foreground text-center">
                  Document Type: {documentAnalysis.analysis?.documentType} • 
                  Analyzed: {new Date(documentAnalysis.analysis?.analyzedAt).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}