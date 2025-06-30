'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  Stethoscope, 
  Activity, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  TrendingUp,
  Loader2,
  Plus,
  X,
  Zap,
  FileText,
  Heart,
  Thermometer,
  Droplets,
  Wind,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';

export default function SmartDiagnosis() {
  const { user } = useAuth();
  const [symptoms, setSymptoms] = useState([]);
  const [currentSymptom, setCurrentSymptom] = useState('');
  const [patientHistory, setPatientHistory] = useState('');
  const [vitalSigns, setVitalSigns] = useState({
    bloodPressure: '',
    heartRate: '',
    temperature: '',
    respiratoryRate: '',
    oxygenSaturation: '',
  });
  const [labResults, setLabResults] = useState({
    glucose: '',
    cholesterol: '',
    troponin: '',
    creatinine: '',
    hemoglobin: '',
    whiteBloodCells: '',
    platelets: '',
    bilirubin: '',
  });
  const [diagnosis, setDiagnosis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [patientInfo, setPatientInfo] = useState({
    age: '',
    gender: '',
    weight: '',
    height: '',
  });

  const commonSymptoms = [
    'Chest pain', 'Shortness of breath', 'Headache', 'Fever', 'Nausea',
    'Vomiting', 'Dizziness', 'Fatigue', 'Abdominal pain', 'Back pain',
    'Cough', 'Sore throat', 'Joint pain', 'Muscle pain', 'Rash'
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

  const handleVitalChange = (vital, value) => {
    setVitalSigns(prev => ({ ...prev, [vital]: value }));
  };

  const handleLabChange = (lab, value) => {
    setLabResults(prev => ({ ...prev, [lab]: value }));
  };

  const handlePatientInfoChange = (field, value) => {
    setPatientInfo(prev => ({ ...prev, [field]: value }));
  };

  const generateDiagnosis = async () => {
    if (symptoms.length === 0) {
      toast.error('Please add at least one symptom');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/ai/smart-diagnosis', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symptoms,
          patientHistory,
          vitalSigns,
          labResults,
          patientInfo,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setDiagnosis(data);
        toast.success('Smart diagnosis completed successfully');
      } else {
        throw new Error('Failed to generate diagnosis');
      }
    } catch (error) {
      toast.error('Failed to generate diagnosis');
    } finally {
      setLoading(false);
    }
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

  const getUrgencyColor = (urgency) => {
    switch (urgency?.toLowerCase()) {
      case 'routine':
        return 'text-green-600';
      case 'urgent':
        return 'text-yellow-600';
      case 'immediate':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getProbabilityColor = (probability) => {
    if (probability >= 0.8) return 'text-red-600 font-bold';
    if (probability >= 0.6) return 'text-orange-600 font-semibold';
    if (probability >= 0.4) return 'text-yellow-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Smart Diagnosis Assistant</h1>
        <p className="text-muted-foreground">
          AI-powered diagnostic support system for clinical decision making
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Input Section */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="patient-info" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="patient-info">Patient Info</TabsTrigger>
              <TabsTrigger value="symptoms">Symptoms</TabsTrigger>
              <TabsTrigger value="vitals">Vitals</TabsTrigger>
              <TabsTrigger value="labs">Lab Results</TabsTrigger>
            </TabsList>

            <TabsContent value="patient-info" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="mr-2 h-5 w-5 text-blue-600" />
                    Patient Information
                  </CardTitle>
                  <CardDescription>
                    Basic patient demographics and information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Age</label>
                      <Input
                        type="number"
                        value={patientInfo.age}
                        onChange={(e) => handlePatientInfoChange('age', e.target.value)}
                        placeholder="Patient age"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Gender</label>
                      <Select
                        value={patientInfo.gender}
                        onValueChange={(value) => handlePatientInfoChange('gender', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Weight (kg)</label>
                      <Input
                        type="number"
                        value={patientInfo.weight}
                        onChange={(e) => handlePatientInfoChange('weight', e.target.value)}
                        placeholder="Weight in kg"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Height (cm)</label>
                      <Input
                        type="number"
                        value={patientInfo.height}
                        onChange={(e) => handlePatientInfoChange('height', e.target.value)}
                        placeholder="Height in cm"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Medical History</label>
                    <Textarea
                      value={patientHistory}
                      onChange={(e) => setPatientHistory(e.target.value)}
                      placeholder="Enter relevant medical history, medications, allergies, family history, previous surgeries..."
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="symptoms" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Stethoscope className="mr-2 h-5 w-5 text-blue-600" />
                    Patient Symptoms
                  </CardTitle>
                  <CardDescription>
                    Add the patient's presenting symptoms and complaints
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
                      <Plus className="h-4 w-4" />
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
                        >
                          {symptom}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {symptoms.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Current Symptoms:</p>
                      <div className="flex flex-wrap gap-2">
                        {symptoms.map((symptom, index) => (
                          <Badge key={index} variant="outline" className="flex items-center gap-1">
                            {symptom}
                            <X 
                              className="h-3 w-3 cursor-pointer" 
                              onClick={() => removeSymptom(symptom)}
                            />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="vitals" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="mr-2 h-5 w-5 text-green-600" />
                    Vital Signs
                  </CardTitle>
                  <CardDescription>
                    Current vital signs and measurements
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center">
                        <Heart className="mr-1 h-4 w-4" />
                        Blood Pressure
                      </label>
                      <Input
                        value={vitalSigns.bloodPressure}
                        onChange={(e) => handleVitalChange('bloodPressure', e.target.value)}
                        placeholder="120/80 mmHg"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center">
                        <Activity className="mr-1 h-4 w-4" />
                        Heart Rate
                      </label>
                      <Input
                        value={vitalSigns.heartRate}
                        onChange={(e) => handleVitalChange('heartRate', e.target.value)}
                        placeholder="72 bpm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center">
                        <Thermometer className="mr-1 h-4 w-4" />
                        Temperature
                      </label>
                      <Input
                        value={vitalSigns.temperature}
                        onChange={(e) => handleVitalChange('temperature', e.target.value)}
                        placeholder="98.6°F / 37°C"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center">
                        <Wind className="mr-1 h-4 w-4" />
                        Respiratory Rate
                      </label>
                      <Input
                        value={vitalSigns.respiratoryRate}
                        onChange={(e) => handleVitalChange('respiratoryRate', e.target.value)}
                        placeholder="16/min"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center">
                        <Droplets className="mr-1 h-4 w-4" />
                        O2 Saturation
                      </label>
                      <Input
                        value={vitalSigns.oxygenSaturation}
                        onChange={(e) => handleVitalChange('oxygenSaturation', e.target.value)}
                        placeholder="98%"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="labs" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Laboratory Results</CardTitle>
                  <CardDescription>
                    Recent lab values and test results (optional)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Glucose</label>
                      <Input
                        value={labResults.glucose}
                        onChange={(e) => handleLabChange('glucose', e.target.value)}
                        placeholder="mg/dL"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Cholesterol</label>
                      <Input
                        value={labResults.cholesterol}
                        onChange={(e) => handleLabChange('cholesterol', e.target.value)}
                        placeholder="mg/dL"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Troponin</label>
                      <Input
                        value={labResults.troponin}
                        onChange={(e) => handleLabChange('troponin', e.target.value)}
                        placeholder="ng/mL"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Creatinine</label>
                      <Input
                        value={labResults.creatinine}
                        onChange={(e) => handleLabChange('creatinine', e.target.value)}
                        placeholder="mg/dL"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Hemoglobin</label>
                      <Input
                        value={labResults.hemoglobin}
                        onChange={(e) => handleLabChange('hemoglobin', e.target.value)}
                        placeholder="g/dL"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">WBC Count</label>
                      <Input
                        value={labResults.whiteBloodCells}
                        onChange={(e) => handleLabChange('whiteBloodCells', e.target.value)}
                        placeholder="cells/μL"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Platelets</label>
                      <Input
                        value={labResults.platelets}
                        onChange={(e) => handleLabChange('platelets', e.target.value)}
                        placeholder="cells/μL"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Bilirubin</label>
                      <Input
                        value={labResults.bilirubin}
                        onChange={(e) => handleLabChange('bilirubin', e.target.value)}
                        placeholder="mg/dL"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Button
            onClick={generateDiagnosis}
            disabled={loading || symptoms.length === 0}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Smart Diagnosis...
              </>
            ) : (
              <>
                <Brain className="mr-2 h-4 w-4" />
                Generate Smart Diagnosis
              </>
            )}
          </Button>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {diagnosis ? (
            <>
              {/* Primary Diagnosis */}
              <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
                <CardHeader>
                  <CardTitle className="flex items-center text-blue-900 dark:text-blue-100">
                    <Target className="mr-2 h-5 w-5" />
                    Primary Diagnosis
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Badge className={getSeverityColor(diagnosis.diagnosis?.primaryDiagnosis?.severity)}>
                      {diagnosis.diagnosis?.primaryDiagnosis?.severity} severity
                    </Badge>
                    <Badge variant="outline" className={getProbabilityColor(diagnosis.diagnosis?.primaryDiagnosis?.probability)}>
                      {Math.round(diagnosis.diagnosis?.primaryDiagnosis?.probability * 100)}% probability
                    </Badge>
                    <Badge variant="outline">
                      Confidence: {Math.round(diagnosis.confidence * 100)}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">{diagnosis.diagnosis?.primaryDiagnosis?.condition}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {diagnosis.diagnosis?.primaryDiagnosis?.reasoning}
                    </p>
                  </div>
                  
                  <Alert className={`border-${diagnosis.diagnosis?.primaryDiagnosis?.urgency === 'immediate' ? 'red' : diagnosis.diagnosis?.primaryDiagnosis?.urgency === 'urgent' ? 'yellow' : 'green'}-200`}>
                    <AlertTriangle className={`h-4 w-4 ${getUrgencyColor(diagnosis.diagnosis?.primaryDiagnosis?.urgency)}`} />
                    <AlertDescription>
                      <span className="font-medium">Urgency: {diagnosis.diagnosis?.primaryDiagnosis?.urgency?.toUpperCase()}</span>
                      <br />
                      {diagnosis.diagnosis?.primaryDiagnosis?.urgency === 'immediate' && 'Requires immediate medical attention and intervention'}
                      {diagnosis.diagnosis?.primaryDiagnosis?.urgency === 'urgent' && 'Should be addressed promptly within hours'}
                      {diagnosis.diagnosis?.primaryDiagnosis?.urgency === 'routine' && 'Can be managed with routine care and follow-up'}
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              {/* Differential Diagnoses */}
              <Card>
                <CardHeader>
                  <CardTitle>Differential Diagnoses</CardTitle>
                  <CardDescription>
                    Other conditions to consider based on the presentation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {diagnosis.diagnosis?.differentialDiagnoses?.slice(1).map((diff, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{diff.condition}</h4>
                          <div className="flex items-center space-x-2">
                            <Badge className={getSeverityColor(diff.severity)}>
                              {diff.severity}
                            </Badge>
                            <Badge variant="outline" className={getProbabilityColor(diff.probability)}>
                              {Math.round(diff.probability * 100)}%
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{diff.reasoning}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
                    Clinical Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {diagnosis.diagnosis?.recommendations?.map((rec, index) => (
                      <li key={index} className="text-sm flex items-start">
                        <Zap className="mr-2 h-3 w-3 text-blue-600 mt-0.5 flex-shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Suggested Tests */}
              <Card>
                <CardHeader>
                  <CardTitle>Suggested Diagnostic Tests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-2">
                    {diagnosis.diagnosis?.suggestedTests?.map((test, index) => (
                      <Badge key={index} variant="outline" className="justify-start p-2">
                        <Eye className="mr-1 h-3 w-3" />
                        {test}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Risk Stratification */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="mr-2 h-5 w-5 text-orange-600" />
                    Risk Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Overall Risk:</span>
                      <Badge className={getSeverityColor(diagnosis.diagnosis?.riskStratification?.overall)}>
                        {diagnosis.diagnosis?.riskStratification?.overall}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Cardiac Risk:</span>
                      <Badge className={getSeverityColor(diagnosis.diagnosis?.riskStratification?.cardiac)}>
                        {diagnosis.diagnosis?.riskStratification?.cardiac}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Immediate Risk:</span>
                      <Badge className={getSeverityColor(diagnosis.diagnosis?.riskStratification?.immediate)}>
                        {diagnosis.diagnosis?.riskStratification?.immediate}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="text-xs text-muted-foreground text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="font-medium mb-1">⚠️ Clinical Decision Support Tool</p>
                <p>This AI-generated diagnosis is for clinical decision support only. Always use clinical judgment and consider patient-specific factors. Not a substitute for professional medical diagnosis.</p>
                <p className="mt-2">
                  Analysis generated: {new Date(diagnosis.timestamp).toLocaleString()} • 
                  Analyzed by: {diagnosis.analyzedBy}
                </p>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Smart Diagnosis Ready</h3>
                <p className="text-muted-foreground mb-4">
                  Enter patient symptoms and clinical data to generate AI-powered diagnostic insights
                </p>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>✓ Advanced machine learning algorithms</p>
                  <p>✓ Evidence-based medical knowledge</p>
                  <p>✓ Differential diagnosis support</p>
                  <p>✓ Risk stratification analysis</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}