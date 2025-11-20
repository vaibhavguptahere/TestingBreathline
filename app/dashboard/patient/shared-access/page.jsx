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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import HospitalDoctorSelector from '@/components/hospital-doctor-selector';
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
  Loader2,
  AlertTriangle,
  Building,
  Mail,
  FileText,
  Building2
} from 'lucide-react';
import { toast } from 'sonner';

export default function SharedAccess() {
  const { user } = useAuth();
  const [sharedAccess, setSharedAccess] = useState([]);
  const [accessRequests, setAccessRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareDialogTab, setShareDialogTab] = useState('hospital');
  const [searchTerm, setSearchTerm] = useState('');
  const [sharingAccess, setSharingAccess] = useState(false);

  const [shareForm, setShareForm] = useState({
    doctorEmail: '',
    accessLevel: 'read',
    expiresIn: '30d',
    recordCategories: ['all'],
  });

  useEffect(() => {
    fetchSharedAccess();
    fetchAccessRequests();
  }, []);

  const fetchSharedAccess = async () => {
    try {
      const response = await fetch('/api/auth/patient/shared-access', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSharedAccess(data.sharedAccess || []);
      } else {
        throw new Error('Failed to fetch shared access');
      }
    } catch (error) {
      console.error('Error fetching shared access:', error);
      toast.error('Failed to load shared access data');
    }
  };

  const fetchAccessRequests = async () => {
    try {
      const response = await fetch('/api/auth/patient/access-requests', {
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

  const handleShareAccess = async (e) => {
    e.preventDefault();
    setSharingAccess(true);

    try {
      const response = await fetch('/api/auth/patient/shared-access', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(shareForm),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Access shared successfully. ${data.recordsUpdated} records updated.`);
        setShowShareDialog(false);
        setShareForm({
          doctorEmail: '',
          accessLevel: 'read',
          expiresIn: '30d',
          recordCategories: ['all'],
        });
        fetchSharedAccess();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to share access');
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSharingAccess(false);
    }
  };

  const handleAccessRequest = async (requestId, action) => {
    try {
      const response = await fetch(`/api/auth/patient/access-requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        toast.success(`Access request ${action}ed`);
        fetchAccessRequests();
        fetchSharedAccess();
      } else {
        throw new Error(`Failed to ${action} request`);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const revokeAccess = async (accessId, doctorName) => {
    if (!confirm(`Are you sure you want to revoke access for ${doctorName}? This will remove their access to all your medical records.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/auth/patient/shared-access/${accessId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Access revoked successfully. ${data.recordsUpdated} records updated.`);
        fetchSharedAccess();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to revoke access');
      }
    } catch (error) {
      toast.error(error.message);
    }
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
      revoked: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || colors.pending;
  };

  const filteredSharedAccess = sharedAccess.filter(access =>
    access.doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    access.doctor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    access.doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Shared Access</h1>
          <p className="text-muted-foreground">
            Manage doctor access to your medical records
          </p>
        </div>
        <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Share Access
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Share Medical Records Access</DialogTitle>
              <DialogDescription>
                Choose a method to grant a doctor access to your medical records
              </DialogDescription>
            </DialogHeader>

            <Tabs value={shareDialogTab} onValueChange={setShareDialogTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="hospital" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Hospital</span>
                </TabsTrigger>
                <TabsTrigger value="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span className="hidden sm:inline">Email</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="hospital" className="space-y-4">
                <HospitalDoctorSelector
                  onDoctorSelected={() => {
                    setShowShareDialog(false);
                    fetchSharedAccess();
                  }}
                  onCancel={() => setShowShareDialog(false)}
                />
              </TabsContent>

              <TabsContent value="email">
                <form onSubmit={handleShareAccess} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="doctorEmail">Doctor's Email</Label>
                    <Input
                      id="doctorEmail"
                      type="email"
                      value={shareForm.doctorEmail}
                      onChange={(e) => setShareForm({ ...shareForm, doctorEmail: e.target.value })}
                      placeholder="doctor@hospital.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accessLevel">Access Level</Label>
                    <Select
                      value={shareForm.accessLevel}
                      onValueChange={(value) => setShareForm({ ...shareForm, accessLevel: value })}
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
                    <Label htmlFor="expiresIn">Access Duration</Label>
                    <Select
                      value={shareForm.expiresIn}
                      onValueChange={(value) => setShareForm({ ...shareForm, expiresIn: value })}
                    >
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
                  <div className="flex gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowShareDialog(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1" disabled={sharingAccess}>
                      {sharingAccess ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sharing Access...
                        </>
                      ) : (
                        'Share Access'
                      )}
                    </Button>
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      {/* Access Requests */}
      {accessRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              Pending Access Requests
            </CardTitle>
            <CardDescription>
              Doctors requesting access to your medical records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {accessRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-semibold">{request.doctor.name}</h4>
                      <Badge variant="outline">{request.doctor.specialization}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{request.doctor.email}</p>
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
                    <Button
                      size="sm"
                      onClick={() => handleAccessRequest(request.id, 'approve')}
                    >
                      <CheckCircle className="mr-1 h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAccessRequest(request.id, 'deny')}
                    >
                      <XCircle className="mr-1 h-4 w-4" />
                      Deny
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search doctors by name, email, or specialization..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Current Shared Access */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5" />
            Current Shared Access ({filteredSharedAccess.length})
          </CardTitle>
          <CardDescription>
            Doctors who currently have access to your records
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredSharedAccess.length > 0 ? (
            <div className="space-y-4">
              {filteredSharedAccess.map((access) => (
                <div key={access.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center space-x-3">
                      <div>
                        <h4 className="font-semibold">{access.doctor.name}</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {access.doctor.specialization}
                          </Badge>
                          <Badge className={getStatusColor(access.status)}>
                            {access.status}
                          </Badge>
                          <Badge className={getAccessLevelColor(access.accessLevel)}>
                            {access.accessLevel}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Mail className="h-3 w-3" />
                        <span>{access.doctor.email}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Building className="h-3 w-3" />
                        <span>{access.doctor.hospital}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>Granted: {new Date(access.grantedAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          {access.expiresAt
                            ? `Expires: ${new Date(access.expiresAt).toLocaleDateString()}`
                            : 'No expiration'
                          }
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-1">
                        <FileText className="h-3 w-3" />
                        <span>{access.recordCount} records accessible</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-2 ml-4">
                    <Button size="sm" variant="outline">
                      <Eye className="mr-1 h-4 w-4" />
                      View Details
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => revokeAccess(access.id, access.doctor.name)}
                    >
                      Revoke Access
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm ? 'No matching doctors found' : 'No shared access'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm
                  ? 'Try adjusting your search criteria'
                  : "You haven't shared access with any doctors yet"
                }
              </p>
              {!searchTerm && (
                <Button onClick={() => setShowShareDialog(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Share Access
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="mr-2 h-5 w-5" />
            Security & Privacy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start space-x-2">
            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Full Control</p>
              <p className="text-xs text-muted-foreground">
                You can revoke access at any time
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Audit Trail</p>
              <p className="text-xs text-muted-foreground">
                All access is logged and monitored
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Time-Limited</p>
              <p className="text-xs text-muted-foreground">
                Access automatically expires based on your settings
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Secure Sharing</p>
              <p className="text-xs text-muted-foreground">
                Only share access with verified healthcare professionals
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
