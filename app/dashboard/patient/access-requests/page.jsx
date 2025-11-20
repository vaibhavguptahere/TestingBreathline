'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Search,
  Calendar,
  Stethoscope,
} from 'lucide-react';
import { toast } from 'sonner';

export default function PatientAccessRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [responseDialog, setResponseDialog] = useState(null);
  const [durationDays, setDurationDays] = useState('30');
  const [rejectionReason, setRejectionReason] = useState('');
  const [addToTrusted, setAddToTrusted] = useState(false);
  const [responding, setResponding] = useState(false);

  useEffect(() => {
    if (user?.role !== 'patient') {
      window.location.href = '/dashboard/doctor';
    }
  }, [user]);

  useEffect(() => {
    fetchAccessRequests();
  }, [statusFilter]);

  const fetchAccessRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/patient/access-request-by-id', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRequests(data.accessRequests || []);
      } else {
        throw new Error('Failed to fetch access requests');
      }
    } catch (error) {
      console.error('Error fetching access requests:', error);
      toast.error('Failed to load access requests');
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (action) => {
    if (!selectedRequest) return;

    setResponding(true);
    try {
      const payload = {
        action,
        durationDays: parseInt(durationDays) || 30,
      };

      if (action === 'reject') {
        payload.reason = rejectionReason || 'Access declined';
      } else if (action === 'approve') {
        payload.addToTrusted = addToTrusted;
      }

      const response = await fetch(
        `/api/auth/patient/access-request-by-id/${selectedRequest._id}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        toast.success(`Request ${action}ed successfully`);
        setResponseDialog(null);
        setSelectedRequest(null);
        setDurationDays('30');
        setRejectionReason('');
        setAddToTrusted(false);
        await fetchAccessRequests();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to respond');
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setResponding(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'expired': 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'expired':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const filteredRequests = requests.filter(req => {
    const matchesSearch = `${req.doctor.name} ${req.doctor.email} ${req.doctor.specialization}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (!user || user.role !== 'patient') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Access Requests</h1>
          <p className="text-muted-foreground">
            Manage doctor requests to access your medical records
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pending & Historical Requests</CardTitle>
            <CardDescription>
              Review and respond to doctor access requests
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="flex gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <Input
                  placeholder="Search doctor name, email, or specialization..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-10"
                  prefix={<Search className="h-4 w-4" />}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Requests</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Requests List */}
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : filteredRequests.length > 0 ? (
              <div className="space-y-3">
                {filteredRequests.map(request => (
                  <Card key={request._id} className="border">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          {/* Doctor Info */}
                          <div className="flex items-start gap-3 mb-3">
                            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                              <Stethoscope className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-lg">{request.doctor.name}</p>
                              <p className="text-sm text-muted-foreground">{request.doctor.email}</p>
                              {request.doctor.specialization && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Specialization: {request.doctor.specialization}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Request Details */}
                          <div className="grid md:grid-cols-2 gap-3 mt-3 p-3 bg-muted/50 rounded-lg">
                            <div>
                              <p className="text-xs font-medium text-muted-foreground">Reason for Access</p>
                              <p className="text-sm mt-1">{request.reason || 'No reason provided'}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-muted-foreground">Access Level</p>
                              <Badge variant="secondary" className="mt-1">
                                {request.accessLevel === 'read' ? 'View Only' : 'View & Edit'}
                              </Badge>
                            </div>
                          </div>

                          {/* Timestamps */}
                          {request.approvedAt && (
                            <div className="mt-2 text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Approved on {new Date(request.approvedAt).toLocaleDateString()}
                              {request.expiresAt && ` • Expires ${new Date(request.expiresAt).toLocaleDateString()}`}
                            </div>
                          )}

                          {request.rejectedAt && (
                            <div className="mt-2 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                              <XCircle className="h-3 w-3" />
                              Rejected on {new Date(request.rejectedAt).toLocaleDateString()}
                              {request.rejectionReason && ` • ${request.rejectionReason}`}
                            </div>
                          )}
                        </div>

                        {/* Status & Actions */}
                        <div className="flex flex-col items-end gap-3">
                          <Badge className={`flex items-center gap-1 ${getStatusColor(request.status)}`}>
                            {getStatusIcon(request.status)}
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </Badge>

                          {request.status === 'pending' && (
                            <div className="flex gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setSelectedRequest(request);
                                      setResponseDialog('approve');
                                    }}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Approve
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Approve Access Request</DialogTitle>
                                    <DialogDescription>
                                      Grant {request.doctor.name} access to your medical records
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label htmlFor="duration">Access Duration (days)</Label>
                                      <Select value={durationDays} onValueChange={setDurationDays}>
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="7">7 Days</SelectItem>
                                          <SelectItem value="30">30 Days</SelectItem>
                                          <SelectItem value="90">90 Days</SelectItem>
                                          <SelectItem value="365">1 Year</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                      <Checkbox
                                        id="trusted"
                                        checked={addToTrusted}
                                        onCheckedChange={setAddToTrusted}
                                      />
                                      <Label htmlFor="trusted" className="text-sm font-normal cursor-pointer">
                                        Add to trusted doctors (auto-approve future requests for 30 days)
                                      </Label>
                                    </div>

                                    <div className="flex gap-2">
                                      <Button
                                        variant="outline"
                                        onClick={() => {
                                          setResponseDialog(null);
                                          setSelectedRequest(null);
                                          setDurationDays('30');
                                          setAddToTrusted(false);
                                        }}
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        onClick={() => handleResponse('approve')}
                                        disabled={responding}
                                      >
                                        {responding && (
                                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        )}
                                        Approve Access
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>

                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => {
                                      setSelectedRequest(request);
                                      setResponseDialog('reject');
                                    }}
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Reject
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Reject Access Request</DialogTitle>
                                    <DialogDescription>
                                      Decline {request.doctor.name}'s access request
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label htmlFor="reason">Reason for Rejection (optional)</Label>
                                      <Textarea
                                        id="reason"
                                        placeholder="Explain why you're rejecting this request..."
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                      />
                                    </div>

                                    <div className="flex gap-2">
                                      <Button
                                        variant="outline"
                                        onClick={() => {
                                          setResponseDialog(null);
                                          setSelectedRequest(null);
                                          setRejectionReason('');
                                        }}
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        variant="destructive"
                                        onClick={() => handleResponse('reject')}
                                        disabled={responding}
                                      >
                                        {responding && (
                                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        )}
                                        Reject
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-2">No access requests found</p>
                <p className="text-sm text-muted-foreground">
                  {statusFilter
                    ? `No ${statusFilter} requests`
                    : 'Doctors will send requests to access your records'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
