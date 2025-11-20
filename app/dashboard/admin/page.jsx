'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  BarChart3,
  CheckCircle,
  AlertTriangle,
  Clock,
  XCircle,
  Shield,
  Users,
  FileText,
  Activity,
  Loader2,
  LogOut,
  FileCheck,
  AlertOctagon,
} from 'lucide-react';
import { toast } from 'sonner';
import AdminVerifications from '@/components/admin/admin-verifications';
import AdminAccessRequests from '@/components/admin/admin-access-requests';
import AdminAuditLogs from '@/components/admin/admin-audit-logs';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (user?.role !== 'admin') {
      // Redirect non-admins
      window.location.href = '/dashboard/patient';
    }
  }, [user]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/dashboard-stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        throw new Error('Failed to fetch stats');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage doctor verifications, patient access requests, and audit logs
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : stats ? (
          <>
            {/* Stats Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {/* Doctor Verification Stats */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center justify-between">
                    <span>Total Doctors</span>
                    <Shield className="h-4 w-4 text-blue-600" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.verificationStats.total}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.verificationStats.verified} verified
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center justify-between">
                    <span>Pending Review</span>
                    <Clock className="h-4 w-4 text-yellow-600" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    {stats.verificationStats.submitted + stats.verificationStats.underReview}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Need admin action
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center justify-between">
                    <span>Active Requests</span>
                    <Users className="h-4 w-4 text-green-600" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {stats.accessRequestStats.pending}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Waiting for patient approval
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center justify-between">
                    <span>Rejections</span>
                    <AlertOctagon className="h-4 w-4 text-red-600" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {stats.accessRequestStats.rejected}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Access denied
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Suspicious Activity Alert */}
            {stats.suspiciousActivity?.doctorsWithMultipleRejections?.length > 0 && (
              <Alert className="mb-8 border-red-500 bg-red-50 dark:bg-red-900/20">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription>
                  <strong>Suspicious Activity Detected:</strong> {' '}
                  {stats.suspiciousActivity.doctorsWithMultipleRejections.map(d => d.email).join(', ')} have multiple rejected access requests.
                </AlertDescription>
              </Alert>
            )}

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Overview</span>
                </TabsTrigger>
                <TabsTrigger value="verifications" className="flex items-center gap-2">
                  <FileCheck className="h-4 w-4" />
                  <span className="hidden sm:inline">Verifications</span>
                </TabsTrigger>
                <TabsTrigger value="access-requests" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Requests</span>
                </TabsTrigger>
                <TabsTrigger value="audit-logs" className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  <span className="hidden sm:inline">Audit</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid lg:grid-cols-2 gap-4">
                  {/* Pending Verifications */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Pending Verifications
                      </CardTitle>
                      <CardDescription>
                        Awaiting admin review
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {stats.pendingVerifications.length > 0 ? (
                          stats.pendingVerifications.map(v => (
                            <div key={v._id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                              <div className="flex-1">
                                <p className="text-sm font-medium">{v.doctor.name}</p>
                                <p className="text-xs text-muted-foreground">{v.doctor.email}</p>
                              </div>
                              <Badge variant="outline">
                                {v.status === 'submitted' ? 'Submitted' : 'Under Review'}
                              </Badge>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">No pending verifications</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Access Requests */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Recent Access Requests
                      </CardTitle>
                      <CardDescription>
                        Patient approval pending
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {stats.recentAccessRequests.length > 0 ? (
                          stats.recentAccessRequests.slice(0, 5).map(r => (
                            <div key={r._id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{r.doctor.name}</p>
                                <p className="text-xs text-muted-foreground truncate">→ {r.patient.name}</p>
                              </div>
                              <Badge variant="secondary">Pending</Badge>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">No recent requests</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Critical Logs */}
                {stats.criticalLogs.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        Critical Activity Log
                      </CardTitle>
                      <CardDescription>
                        Last 10 critical or high severity actions
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {stats.criticalLogs.map(log => (
                          <div key={log._id} className="flex items-start gap-2 p-2 text-xs bg-muted rounded">
                            <AlertTriangle className="h-3 w-3 text-red-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{log.action}</p>
                              <p className="text-muted-foreground truncate">{log.actor}</p>
                            </div>
                            <span className="text-muted-foreground text-xs whitespace-nowrap">
                              {new Date(log.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="verifications">
                <AdminVerifications onRefresh={fetchStats} />
              </TabsContent>

              <TabsContent value="access-requests">
                <AdminAccessRequests onRefresh={fetchStats} />
              </TabsContent>

              <TabsContent value="audit-logs">
                <AdminAuditLogs />
              </TabsContent>
            </Tabs>
          </>
        ) : null}
      </div>
    </div>
  );
}
