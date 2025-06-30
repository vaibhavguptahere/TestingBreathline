'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Users, 
  Search, 
  Eye, 
  Calendar,
  FileText,
  Bot,
  Loader2,
  Phone,
  Mail,
  MapPin,
  Download,
  Clock,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function DoctorPatients() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientRecords, setPatientRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await fetch('/api/auth/doctor/patients', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPatients(data.patients || []);
      } else {
        throw new Error('Failed to fetch patients');
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast.error('Failed to fetch patients');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientRecords = async (patientId) => {
    setLoadingRecords(true);
    try {
      const response = await fetch(`/api/auth/doctor/patient-records/${patientId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPatientRecords(data.records || []);
      } else {
        throw new Error('Failed to fetch patient records');
      }
    } catch (error) {
      toast.error('Failed to fetch patient records');
    } finally {
      setLoadingRecords(false);
    }
  };

  const handleViewPatient = (patient) => {
    setSelectedPatient(patient);
    fetchPatientRecords(patient.id);
  };

  const downloadFile = async (patientId, recordId, fileIndex, fileName) => {
    try {
      const response = await fetch(`/api/auth/doctor/patient-records/${patientId}/${recordId}/download?fileIndex=${fileIndex}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Download initiated for ${fileName}`);
        // In a real implementation, you would handle the actual file download here
        console.log('Download URL:', data.file.downloadUrl);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Download failed');
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const analyzePatientWithAI = async (patient) => {
    toast.info('AI analysis started...');
    // Simulate AI analysis
    setTimeout(() => {
      toast.success('AI analysis completed - check the AI Assistant tab for detailed insights');
    }, 2000);
  };

  const filteredPatients = patients.filter(patient =>
    `${patient.profile.firstName} ${patient.profile.lastName}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryColor = (category) => {
    const colors = {
      'lab-results': 'bg-blue-100 text-blue-800',
      'imaging': 'bg-purple-100 text-purple-800',
      'prescription': 'bg-green-100 text-green-800',
      'consultation': 'bg-yellow-100 text-yellow-800',
      'emergency': 'bg-red-100 text-red-800',
      'general': 'bg-gray-100 text-gray-800',
    };
    return colors[category] || colors.general;
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'N/A';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Patients</h1>
        <p className="text-muted-foreground">
          Patients who have granted you access to their medical records
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search patients..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Patients Grid */}
      {filteredPatients.length > 0 ? (
        <div className="grid gap-4">
          {filteredPatients.map((patient) => (
            <Card key={patient.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">
                      {patient.profile.firstName} {patient.profile.lastName}
                    </CardTitle>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>Age: {calculateAge(patient.profile.dateOfBirth)}</span>
                      <span className="flex items-center">
                        <Phone className="mr-1 h-3 w-3" />
                        {patient.profile.phone || 'Not provided'}
                      </span>
                      <span className="flex items-center">
                        <Mail className="mr-1 h-3 w-3" />
                        {patient.email}
                      </span>
                      <span>{patient.recordCount} records</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={patient.accessLevel === 'write' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                        {patient.accessLevel} access
                      </Badge>
                      {patient.expiresAt && (
                        <Badge variant="outline" className="text-xs">
                          Expires: {new Date(patient.expiresAt).toLocaleDateString()}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => analyzePatientWithAI(patient)}
                    >
                      <Bot className="h-4 w-4 mr-1" />
                      AI Analyze
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewPatient(patient)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Records
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>
                            {selectedPatient?.profile.firstName} {selectedPatient?.profile.lastName} - Medical Records
                          </DialogTitle>
                          <DialogDescription>
                            Patient medical history and records
                          </DialogDescription>
                        </DialogHeader>
                        
                        {selectedPatient && (
                          <div className="space-y-6">
                            {/* Patient Info */}
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-lg">Patient Information</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="font-medium">Name:</span>
                                    <p>{selectedPatient.profile.firstName} {selectedPatient.profile.lastName}</p>
                                  </div>
                                  <div>
                                    <span className="font-medium">Age:</span>
                                    <p>{calculateAge(selectedPatient.profile.dateOfBirth)} years</p>
                                  </div>
                                  <div>
                                    <span className="font-medium">Date of Birth:</span>
                                    <p>{selectedPatient.profile.dateOfBirth ? 
                                      new Date(selectedPatient.profile.dateOfBirth).toLocaleDateString() : 
                                      'Not provided'
                                    }</p>
                                  </div>
                                  <div>
                                    <span className="font-medium">Phone:</span>
                                    <p>{selectedPatient.profile.phone || 'Not provided'}</p>
                                  </div>
                                  <div>
                                    <span className="font-medium">Email:</span>
                                    <p>{selectedPatient.email}</p>
                                  </div>
                                  <div>
                                    <span className="font-medium">Address:</span>
                                    <p>{selectedPatient.profile.address || 'Not provided'}</p>
                                  </div>
                                </div>
                                
                                {selectedPatient.profile.emergencyContact && (
                                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                    <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2">Emergency Contact</h4>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                      <div>
                                        <span className="font-medium">Name:</span>
                                        <p>{selectedPatient.profile.emergencyContact.name}</p>
                                      </div>
                                      <div>
                                        <span className="font-medium">Phone:</span>
                                        <p>{selectedPatient.profile.emergencyContact.phone}</p>
                                      </div>
                                      <div>
                                        <span className="font-medium">Relationship:</span>
                                        <p>{selectedPatient.profile.emergencyContact.relationship}</p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>

                            {/* Medical Records */}
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-lg">Medical Records</CardTitle>
                              </CardHeader>
                              <CardContent>
                                {loadingRecords ? (
                                  <div className="flex justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                  </div>
                                ) : patientRecords.length > 0 ? (
                                  <div className="space-y-4">
                                    {patientRecords.map((record) => (
                                      <div key={record._id} className="border rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-2">
                                          <div className="flex items-center space-x-2">
                                            <h4 className="font-medium">{record.title}</h4>
                                            <Badge className={getCategoryColor(record.category)}>
                                              {record.category.replace('-', ' ')}
                                            </Badge>
                                            {record.metadata?.isEmergencyVisible && (
                                              <Badge variant="outline" className="text-red-600 border-red-600">
                                                Emergency Visible
                                              </Badge>
                                            )}
                                          </div>
                                          <div className="flex items-center text-xs text-muted-foreground">
                                            <Calendar className="mr-1 h-3 w-3" />
                                            {new Date(record.metadata?.recordDate || record.createdAt).toLocaleDateString()}
                                          </div>
                                        </div>
                                        
                                        <p className="text-sm text-muted-foreground mb-3">{record.description}</p>
                                        
                                        {record.files && record.files.length > 0 && (
                                          <div className="space-y-2">
                                            <p className="text-sm font-medium">Attached Files:</p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                              {record.files.map((file, fileIndex) => (
                                                <div key={fileIndex} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                                                  <div className="flex items-center space-x-2">
                                                    <FileText className="h-4 w-4 text-blue-600" />
                                                    <div>
                                                      <p className="text-sm font-medium">{file.originalName}</p>
                                                      <p className="text-xs text-muted-foreground">
                                                        {file.size ? `${Math.round(file.size / 1024)} KB` : 'Unknown size'}
                                                      </p>
                                                    </div>
                                                  </div>
                                                  {selectedPatient.accessLevel === 'write' && (
                                                    <Button
                                                      size="sm"
                                                      variant="outline"
                                                      onClick={() => downloadFile(selectedPatient.id, record._id, fileIndex, file.originalName)}
                                                    >
                                                      <Download className="h-3 w-3" />
                                                    </Button>
                                                  )}
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-8">
                                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-muted-foreground">No records available</p>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                    <Link href={`/dashboard/doctor/patients/${patient.id}`}>
                      <Button size="sm">
                        <Activity className="h-4 w-4 mr-1" />
                        Full View
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <Calendar className="mr-1 h-4 w-4" />
                      Access granted: {new Date(patient.grantedAt).toLocaleDateString()}
                    </div>
                    {patient.lastAccess && (
                      <div className="flex items-center">
                        <Clock className="mr-1 h-4 w-4" />
                        Last accessed: {new Date(patient.lastAccess).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    Active Access
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No patients found</h3>
            <p className="text-muted-foreground">
              {searchTerm 
                ? 'Try adjusting your search criteria'
                : 'No patients have granted you access yet'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}