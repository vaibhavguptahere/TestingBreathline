'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft,
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
  Activity,
  Filter,
  Heart,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

export default function PatientDetailPage({ params }) {
  const { user } = useAuth();
  const router = useRouter();
  const { patientId } = params;
  const [patient, setPatient] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 0 });

  useEffect(() => {
    fetchPatientRecords();
  }, [patientId, categoryFilter, pagination.page]);

  const fetchPatientRecords = async () => {
    try {
      const response = await fetch(`/api/auth/doctor/patient-records/${patientId}?category=${categoryFilter}&page=${pagination.page}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPatient(data.patient);
        setRecords(data.records || []);
        setPagination(data.pagination);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch patient records');
      }
    } catch (error) {
      console.error('Error fetching patient records:', error);
      toast.error(error.message);
      router.push('/dashboard/doctor/patients');
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (recordId, fileIndex, fileName) => {
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

  const viewRecord = async (recordId) => {
    try {
      const response = await fetch(`/api/auth/doctor/patient-records/${patientId}/${recordId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Handle record viewing - could open in modal or navigate to detail page
        console.log('Record details:', data.record);
        toast.success('Record accessed successfully');
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to access record');
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const filteredRecords = records.filter(record =>
    record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.description.toLowerCase().includes(searchTerm.toLowerCase())
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

  if (!patient) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Patient not found</h3>
        <p className="text-muted-foreground mb-4">
          You may not have access to this patient's records or the patient doesn't exist.
        </p>
        <Button onClick={() => router.push('/dashboard/doctor/patients')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Patients
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          onClick={() => router.push('/dashboard/doctor/patients')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Patients
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {patient.profile.firstName} {patient.profile.lastName}
          </h1>
          <p className="text-muted-foreground">
            Patient medical records and information
          </p>
        </div>
      </div>

      {/* Patient Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5" />
            Patient Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Basic Information</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Name:</span>
                    <p>{patient.profile.firstName} {patient.profile.lastName}</p>
                  </div>
                  <div>
                    <span className="font-medium">Age:</span>
                    <p>{calculateAge(patient.profile.dateOfBirth)} years</p>
                  </div>
                  <div>
                    <span className="font-medium">Date of Birth:</span>
                    <p>{patient.profile.dateOfBirth ? 
                      new Date(patient.profile.dateOfBirth).toLocaleDateString() : 
                      'Not provided'
                    }</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Contact Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-3 w-3" />
                    <span>{patient.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-3 w-3" />
                    <span>{patient.profile.phone || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-3 w-3" />
                    <span>{patient.profile.address || 'Not provided'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Access Information</h4>
                <div className="space-y-2">
                  <Badge className={patient.accessLevel === 'write' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                    {patient.accessLevel} access
                  </Badge>
                  <div className="text-sm text-muted-foreground">
                    <p>Granted: {new Date(patient.accessGrantedAt).toLocaleDateString()}</p>
                    {patient.accessExpiresAt && (
                      <p>Expires: {new Date(patient.accessExpiresAt).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {patient.profile.emergencyContact && (
            <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2 flex items-center">
                <Heart className="mr-2 h-4 w-4" />
                Emergency Contact
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Name:</span>
                  <p>{patient.profile.emergencyContact.name}</p>
                </div>
                <div>
                  <span className="font-medium">Phone:</span>
                  <p>{patient.profile.emergencyContact.phone}</p>
                </div>
                <div>
                  <span className="font-medium">Relationship:</span>
                  <p>{patient.profile.emergencyContact.relationship}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="general">General</SelectItem>
            <SelectItem value="lab-results">Lab Results</SelectItem>
            <SelectItem value="prescription">Prescription</SelectItem>
            <SelectItem value="imaging">Imaging</SelectItem>
            <SelectItem value="emergency">Emergency</SelectItem>
            <SelectItem value="consultation">Consultation</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Medical Records */}
      <Card>
        <CardHeader>
          <CardTitle>Medical Records ({pagination.total})</CardTitle>
          <CardDescription>
            Patient's medical history and documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredRecords.length > 0 ? (
            <div className="space-y-4">
              {filteredRecords.map((record) => (
                <div key={record._id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
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
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => viewRecord(record._id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                      >
                        <Bot className="h-4 w-4 mr-1" />
                        AI Analyze
                      </Button>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">{record.description}</p>
                  
                  {record.files && record.files.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Attached Files:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {record.files.map((file, fileIndex) => (
                          <div key={fileIndex} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                            <div className="flex items-center space-x-2">
                              <FileText className="h-4 w-4 text-blue-600" />
                              <div>
                                <p className="text-sm font-medium truncate max-w-[150px]">{file.originalName}</p>
                                <p className="text-xs text-muted-foreground">
                                  {file.size ? `${Math.round(file.size / 1024)} KB` : 'Unknown size'}
                                </p>
                              </div>
                            </div>
                            {patient.accessLevel === 'write' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => downloadFile(record._id, fileIndex, file.originalName)}
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <Calendar className="mr-1 h-3 w-3" />
                        {new Date(record.metadata?.recordDate || record.createdAt).toLocaleDateString()}
                      </div>
                      {record.metadata?.doctorId && (
                        <div>
                          Added by Dr. {record.metadata.doctorId.profile?.firstName}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Page {pagination.page} of {pagination.pages}
                  </p>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page === 1}
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page === pagination.pages}
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No records found</h3>
              <p className="text-muted-foreground">
                {searchTerm || categoryFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'This patient has no medical records yet'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}