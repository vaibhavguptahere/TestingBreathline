'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, CheckCircle, XCircle, AlertCircle, Loader2, Filter } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminAccessRequests({ onRefresh }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAccessRequests();
  }, [statusFilter]);

  const fetchAccessRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/patient-access-requests', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests || []);
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
    const matchesSearch =
      `${req.doctor.name} ${req.doctor.email} ${req.patient.name} ${req.patient.email}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Patient Access Requests</CardTitle>
        <CardDescription>
          Monitor patient approval and access grant history
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Search doctor, patient, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Statuses</SelectItem>
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Doctor</th>
                  <th className="text-left py-3 px-4">Patient</th>
                  <th className="text-left py-3 px-4">Reason</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Requested</th>
                  <th className="text-left py-3 px-4">Expires</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map(req => (
                  <tr key={req._id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium">{req.doctor.name}</p>
                        <p className="text-xs text-muted-foreground">{req.doctor.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium">{req.patient.name}</p>
                        <p className="text-xs text-muted-foreground">{req.patient.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">
                      {req.reason || 'No reason provided'}
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={`flex items-center gap-1 w-fit ${getStatusColor(req.status)}`}>
                        {getStatusIcon(req.status)}
                        {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      {new Date(req.requestedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-xs">
                      {req.expiresAt ? new Date(req.expiresAt).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No access requests found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
