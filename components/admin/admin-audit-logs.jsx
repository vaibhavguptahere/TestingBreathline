'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    fetchAuditLogs();
  }, [actionFilter, severityFilter, page]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const url = new URL('/api/admin/audit-logs', window.location.origin);
      if (actionFilter) url.searchParams.append('action', actionFilter);
      if (severityFilter) url.searchParams.append('severity', severityFilter);
      url.searchParams.append('page', page);
      url.searchParams.append('limit', 50);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
        setPagination(data.pagination);
      } else {
        throw new Error('Failed to fetch audit logs');
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      'low': 'bg-blue-100 text-blue-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'high': 'bg-orange-100 text-orange-800',
      'critical': 'bg-red-100 text-red-800',
    };
    return colors[severity] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status) => {
    const colors = {
      'success': 'text-green-600',
      'failure': 'text-red-600',
      'warning': 'text-yellow-600',
    };
    return colors[status] || 'text-gray-600';
  };

  const actionOptions = [
    'DOCTOR_VERIFICATION_SUBMITTED',
    'DOCTOR_VERIFICATION_APPROVED',
    'DOCTOR_VERIFICATION_REJECTED',
    'DOCTOR_VERIFICATION_RESUBMISSION_REQUESTED',
    'DOCTOR_VERIFICATION_SUSPENDED',
    'PATIENT_ACCESS_REQUEST_CREATED',
    'PATIENT_ACCESS_REQUEST_APPROVED',
    'PATIENT_ACCESS_REQUEST_REJECTED',
    'PATIENT_DATA_ACCESSED',
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit Logs</CardTitle>
        <CardDescription>
          Complete history of all system actions and access events
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex gap-4 flex-wrap">
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Actions</SelectItem>
              {actionOptions.map(action => (
                <SelectItem key={action} value={action}>
                  {action.replace(/_/g, ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Severity Levels</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Logs Table */}
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : logs.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Action</th>
                    <th className="text-left py-3 px-4">Actor</th>
                    <th className="text-left py-3 px-4">Description</th>
                    <th className="text-left py-3 px-4">Severity</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log._id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {log.action.replace(/_/g, ' ')}
                        </code>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-xs font-medium">{log.actor.name}</p>
                          <p className="text-xs text-muted-foreground">{log.actor.email}</p>
                          <Badge variant="outline" className="text-xs mt-1">
                            {log.actorRole}
                          </Badge>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground max-w-xs truncate">
                        {log.description}
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={`text-xs ${getSeverityColor(log.severity)}`}>
                          {log.severity.charAt(0).toUpperCase() + log.severity.slice(1)}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs font-medium ${getStatusColor(log.status)}`}>
                          {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.pages} ({pagination.total} total)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === pagination.pages}
                    onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No audit logs found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
