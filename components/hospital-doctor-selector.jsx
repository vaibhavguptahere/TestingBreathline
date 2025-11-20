'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Building,
  Users,
  Search,
  Loader2,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  MapPin,
  Phone,
  Mail,
} from 'lucide-react';
import { toast } from 'sonner';

export default function HospitalDoctorSelector({ onDoctorSelected, onCancel }) {
  const [step, setStep] = useState('hospital'); // 'hospital' or 'doctor'
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [hospitalSearchTerm, setHospitalSearchTerm] = useState('');
  const [doctorSearchTerm, setDoctorSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [fetchingDoctors, setFetchingDoctors] = useState(false);
  const [accessLevel, setAccessLevel] = useState('read');
  const [expiresIn, setExpiresIn] = useState('30d');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchHospitals();
  }, []);

  const fetchHospitals = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/hospitals');
      if (response.ok) {
        const data = await response.json();
        setHospitals(data.hospitals || []);
      } else {
        throw new Error('Failed to fetch hospitals');
      }
    } catch (error) {
      console.error('Error fetching hospitals:', error);
      toast.error('Failed to load hospitals');
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async (hospitalId) => {
    try {
      setFetchingDoctors(true);
      const response = await fetch(`/api/hospitals/${hospitalId}/doctors`);
      if (response.ok) {
        const data = await response.json();
        setDoctors(data.doctors || []);
        setSelectedHospital(data.hospital);
      } else {
        throw new Error('Failed to fetch doctors');
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast.error('Failed to load doctors for this hospital');
    } finally {
      setFetchingDoctors(false);
    }
  };

  const handleHospitalSelect = (hospital) => {
    fetchDoctors(hospital._id);
    setStep('doctor');
  };

  const handleDoctorSelect = (doctor) => {
    setSelectedDoctor(doctor);
  };

  const handleSubmit = async () => {
    if (!selectedDoctor) {
      toast.error('Please select a doctor');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/auth/patient/shared-access', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          doctorId: selectedDoctor._id,
          accessLevel,
          expiresIn,
          recordCategories: ['all'],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Access shared with ${selectedDoctor.firstName} ${selectedDoctor.lastName}. ${data.recordsUpdated} records updated.`);
        onDoctorSelected?.({
          doctor: selectedDoctor,
          hospital: selectedHospital,
          accessLevel,
          expiresIn,
        });
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to share access');
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredHospitals = hospitals.filter(hospital =>
    hospital.name.toLowerCase().includes(hospitalSearchTerm.toLowerCase()) ||
    hospital.email?.toLowerCase().includes(hospitalSearchTerm.toLowerCase())
  );

  const filteredDoctors = doctors.filter(doctor =>
    `${doctor.firstName} ${doctor.lastName}`.toLowerCase().includes(doctorSearchTerm.toLowerCase()) ||
    doctor.email.toLowerCase().includes(doctorSearchTerm.toLowerCase()) ||
    (doctor.specialization?.toLowerCase().includes(doctorSearchTerm.toLowerCase()))
  );

  if (step === 'hospital') {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Select Hospital</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Choose a hospital to see registered doctors
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search hospitals by name or email..."
            value={hospitalSearchTerm}
            onChange={(e) => setHospitalSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : filteredHospitals.length > 0 ? (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredHospitals.map((hospital) => (
              <Card
                key={hospital._id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleHospitalSelect(hospital)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Building className="h-4 w-4 text-blue-600" />
                        <h4 className="font-semibold">{hospital.name}</h4>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        {hospital.address && (
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-3 w-3" />
                            <span>
                              {hospital.address.street}, {hospital.address.city}
                            </span>
                          </div>
                        )}
                        {hospital.phone && (
                          <div className="flex items-center space-x-2">
                            <Phone className="h-3 w-3" />
                            <span>{hospital.phone}</span>
                          </div>
                        )}
                        {hospital.email && (
                          <div className="flex items-center space-x-2">
                            <Mail className="h-3 w-3" />
                            <span>{hospital.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {hospitalSearchTerm ? 'No hospitals found matching your search' : 'No hospitals available'}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => {
            setStep('hospital');
            setSelectedDoctor(null);
            setDoctorSearchTerm('');
          }}
        >
          ← Back to Hospitals
        </Button>
        <h3 className="text-lg font-semibold mb-2">Select Doctor</h3>
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center space-x-2">
            <Building className="h-4 w-4 text-blue-600" />
            <div>
              <p className="text-sm font-medium">{selectedHospital?.name}</p>
              {selectedHospital?.address && (
                <p className="text-xs text-muted-foreground">
                  {selectedHospital.address.city}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search doctors by name, email, or specialization..."
          value={doctorSearchTerm}
          onChange={(e) => setDoctorSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {fetchingDoctors ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : filteredDoctors.length > 0 ? (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredDoctors.map((doctor) => (
            <Card
              key={doctor._id}
              className={`cursor-pointer transition-colors ${
                selectedDoctor?._id === doctor._id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'hover:bg-muted/50'
              }`}
              onClick={() => handleDoctorSelect(doctor)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {selectedDoctor?._id === doctor._id && (
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                      )}
                      <h4 className="font-semibold">
                        {doctor.firstName} {doctor.lastName}
                      </h4>
                      {doctor.specialization && (
                        <Badge variant="secondary" className="text-xs">
                          {doctor.specialization}
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-3 w-3" />
                        <span>{doctor.email}</span>
                      </div>
                      {doctor.licenseNumber && (
                        <div className="text-xs">
                          License: {doctor.licenseNumber}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {doctorSearchTerm ? 'No doctors found matching your search' : 'No doctors registered at this hospital'}
          </AlertDescription>
        </Alert>
      )}

      {selectedDoctor && (
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <p className="text-sm font-medium mb-4">Access Settings</p>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="accessLevel">Access Level</Label>
                <Select value={accessLevel} onValueChange={setAccessLevel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="read">Read Only</SelectItem>
                    <SelectItem value="write">Read & Write</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiresIn">Access Duration</Label>
                <Select value={expiresIn} onValueChange={setExpiresIn}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">7 Days</SelectItem>
                    <SelectItem value="30d">30 Days</SelectItem>
                    <SelectItem value="90d">90 Days</SelectItem>
                    <SelectItem value="1y">1 Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2 pt-4">
        <Button
          variant="outline"
          onClick={() => {
            setStep('hospital');
            setSelectedDoctor(null);
            setDoctorSearchTerm('');
          }}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!selectedDoctor || submitting}
          className="flex-1"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sharing Access...
            </>
          ) : (
            'Share Access'
          )}
        </Button>
      </div>
    </div>
  );
}
