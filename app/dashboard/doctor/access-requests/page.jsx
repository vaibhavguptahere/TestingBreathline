'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Users,
  UserPlus,
  Search,
  Calendar,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Send,
  FileText,
  Edit,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';

export default function DoctorAccessRequests() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [accessRequests, setAccessRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);

  const [requestForm, setRequestForm] = useState({
    patientEmail: '',
    reason: '',
    accessLevel: 'read',
    recordCategories: ['all'],
    urgency: 'routine',
  });

  useEffect(() => {
    fetchPatients();
    fetchAccessRequests();
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
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const fetchAccessRequests = async () => {
    try {
      const response = await fetch('/api/auth/doctor/access-requests', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAccessRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Error fetching access requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAccess = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/auth/doctor/request-access', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestForm),
      });

      if (response.ok) {
        toast.success('Access request sent successfully');
        setShowRequestDialog(false);
        resetForm();
        fetchAccessRequests();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send access request');
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleEditRequest = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/auth/doctor/access-requests/${editingRequest}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestForm),
      });

      if (response.ok) {
        toast.success('Access request updated successfully');
        setEditingRequest(null);
        resetForm();
        fetchAccessRequests();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update access request');
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDeleteRequest = async (requestId) => {
    if (!confirm('Are you sure you want to delete this access request?')) {
      return;
    }

    try {
      const response = await fetch(`/api/auth/doctor/access-requests/${requestId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        toast.success('Access request deleted successfully');
        fetchAccessRequests();
      } else {
        throw new Error('Failed to delete access request');
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const resetForm = () => {
    setRequestForm({
      patientEmail: '',
      reason: '',
      accessLevel: 'read',
      recordCategories: ['all'],
      urgency: 'routine',
    });
    setShowRequestDialog(false);
    setEditingRequest(null);
  };

  const startEdit = (request) => {
    setRequestForm({
      patientEmail: request.patientEmail,
      reason: request.reason,
      accessLevel: request.accessLevel,
      recordCategories: request.recordCategories,
      urgency: request.urgency,
    });
    setEditingRequest(request.id);
    setShowRequestDialog(true);
  };

  const getAccessLevelColor = (level) => {
    const colors = {
      read: 'bg-blue-100 text-blue-800',
      write: 'bg-green-100 text-green-800',
      full: 'bg-purple-100 text-purple-800',
    };
    return colors[level] || colors.read;
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      expired: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
      denied: 'bg-gray-100 text-gray-800',
      approved: 'bg-green-100 text-green-800',
    };
    return colors[status] || colors.pending;
  };

  const getUrgencyColor = (urgency) => {
    const colors = {
      routine: 'bg-gray-100 text-gray-800',
      urgent: 'bg-orange-100 text-orange-800',
      emergency: 'bg-red-100 text-red-800',
    };
    return colors[urgency] || colors.routine;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Patient Access Management</h1>
          <p className="text-muted-foreground">
            Manage access to patient medical records and send access requests
          </p>
        </div>
        <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingRequest(null)}>
              <Send className="mr-2 h-4 w-4" />
              Request Access
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingRequest ? 'Edit Access Request' : 'Request Patient Access'}
              </DialogTitle>
              <DialogDescription>
                {editingRequest
                  ? 'Update your access request details'
                  : 'Send a request to access a patient\'s medical records'
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={editingRequest ? handleEditRequest : handleRequestAccess} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="patientEmail">Patient Email</Label>
                <Input
                  id="patientEmail"
                  type="email"
                  value={requestForm.patientEmail}
                  onChange={(e) => setRequestForm({ ...requestForm, patientEmail: e.target.value })}
                  placeholder="patient@email.com"
                  required
                  disabled={editingRequest}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Access</Label>
                <Textarea
                  id="reason"
                  value={requestForm.reason}
                  onChange={(e) => setRequestForm({ ...requestForm, reason: e.target.value })}
                  placeholder="Explain why you need access to this patient's records..."
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="accessLevel">Access Level</Label>
                  <Select
                    value={requestForm.accessLevel}
                    onValueChange={(value) => setRequestForm({ ...requestForm, accessLevel: value })}
                  >
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
                  <Label htmlFor="urgency">Urgency</Label>
                  <Select
                    value={requestForm.urgency}
                    onValueChange={(value) => setRequestForm({ ...requestForm, urgency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="routine">Routine</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button type="submit" className="flex-1">
                  <Send className="mr-2 h-4 w-4" />
                  {editingRequest ? 'Update Request' : 'Send Request'}
                </Button>
                {editingRequest && (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Access Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="mr-2 h-5 w-5" />
            My Access Requests
          </CardTitle>
          <CardDescription>
            Requests you've sent to patients for medical record access
          </CardDescription>
        </CardHeader>
        <CardContent>
          {accessRequests.length > 0 ? (
            <div className="space-y-4">
              {accessRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-semibold">{request.patientName}</h4>
                      <Badge className={getStatusColor(request.status)}>
                        {request.status}
                      </Badge>
                      <Badge className={getUrgencyColor(request.urgency)}>
                        {request.urgency}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{request.patientEmail}</p>
                    <p className="text-sm">{request.reason}</p>
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <span>
                        Requested:{' '}
                        {request?.requestedAt
                          ? new Date(request.requestedAt).toLocaleDateString()
                          : 'N/A'}
                      </span>
                      {request?.accessLevel && (
                        <Badge className={getAccessLevelColor(request.accessLevel)}>
                          {request.accessLevel}
                        </Badge>
                      )}
                    </div>

                  </div>
                  <div className="flex space-x-2">
                    {request.status === 'pending' && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => startEdit(request)}>
                          <Edit className="mr-1 h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteRequest(request.id)}
                        >
                          <Trash2 className="mr-1 h-4 w-4" />
                          Delete
                        </Button>
                      </>
                    )}
                    {request.status === 'approved' && (
                      <Button size="sm" variant="outline">
                        <Eye className="mr-1 h-4 w-4" />
                        View Records
                      </Button>
                    )}
                    {request.status === 'denied' && (
                      <Button size="sm" variant="outline" disabled>
                        <XCircle className="mr-1 h-4 w-4" />
                        Denied
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Send className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No access requests</h3>
              <p className="text-muted-foreground mb-4">
                You haven't sent any access requests yet
              </p>
              <Button onClick={() => setShowRequestDialog(true)}>
                <Send className="mr-2 h-4 w-4" />
                Send First Request
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Patient Access */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5" />
            Current Patient Access
          </CardTitle>
          <CardDescription>
            Patients who have granted you access to their medical records
          </CardDescription>
        </CardHeader>
        <CardContent>
          {patients.length > 0 ? (
            <div className="space-y-4">
              {patients.map((patient) => (
                <div key={patient.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-semibold">
                        {patient.profile.firstName} {patient.profile.lastName}
                      </h4>
                      <Badge className={getStatusColor('active')}>
                        active
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{patient.profile.phone}</p>
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <span>
                        Last accessed:{' '}
                        {patient?.lastAccess
                          ? new Date(patient.lastAccess).toLocaleDateString()
                          : 'N/A'}
                      </span>
                      <span>{patient?.recordCount ?? 0} records</span>
                      <Badge className={getAccessLevelColor('read')}>
                        read
                      </Badge>
                    </div>

                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      <Eye className="mr-1 h-4 w-4" />
                      View Records
                    </Button>
                    <Button size="sm" variant="outline">
                      <FileText className="mr-1 h-4 w-4" />
                      Add Note
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No patient access</h3>
              <p className="text-muted-foreground mb-4">
                No patients have granted you access yet
              </p>
              <Button onClick={() => setShowRequestDialog(true)}>
                <Send className="mr-2 h-4 w-4" />
                Request Access
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Access Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="mr-2 h-5 w-5" />
            Access Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start space-x-2">
            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Professional Use Only</p>
              <p className="text-xs text-muted-foreground">
                Access patient records only for legitimate medical purposes
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Patient Consent Required</p>
              <p className="text-xs text-muted-foreground">
                Always obtain proper consent before requesting access
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Audit Trail</p>
              <p className="text-xs text-muted-foreground">
                All access is logged and monitored for compliance
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Time-Limited Access</p>
              <p className="text-xs text-muted-foreground">
                Access permissions may expire and require renewal
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}