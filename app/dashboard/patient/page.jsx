'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Upload, 
  Users, 
  QrCode, 
  Activity,
  TrendingUp,
  Calendar,
  Shield,
  Download,
  Eye,
  Bot,
  Loader2,
  BarChart3,
  Clock,
  HardDrive,
  Share2
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function PatientDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalRecords: 0,
    sharedDoctors: 0,
    recentActivity: 0,
    storageUsed: 0,
    totalFiles: 0,
    totalSize: 0,
    pendingRequests: 0,
    recentRecords: [],
    categoryBreakdown: [],
    uploadTrends: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/auth/patient/dashboard-stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        throw new Error('Failed to fetch dashboard data');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (recordId, fileIndex, fileName) => {
    try {
      const response = await fetch(`/api/auth/patient/records/${recordId}/download?fileIndex=${fileIndex}`, {
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

  const quickActions = [
    {
      title: 'Upload Records',
      description: 'Add new medical documents',
      icon: Upload,
      href: '/dashboard/patient/upload',
      color: 'bg-blue-500',
      count: stats.totalFiles,
    },
    {
      title: 'View Records',
      description: 'Browse your medical history',
      icon: FileText,
      href: '/dashboard/patient/records',
      color: 'bg-green-500',
      count: stats.totalRecords,
    },
    {
      title: 'Share Access',
      description: 'Manage doctor permissions',
      icon: Users,
      href: '/dashboard/patient/shared-access',
      color: 'bg-purple-500',
      count: stats.sharedDoctors,
    },
    {
      title: 'Emergency QR',
      description: 'Generate emergency access code',
      icon: QrCode,
      href: '/dashboard/patient/emergency-qr',
      color: 'bg-red-500',
    },
  ];

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

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {user?.profile?.firstName}!
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your medical records securely and efficiently.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            <Shield className="mr-1 h-3 w-3" />
            Secure Account
          </Badge>
          {stats.pendingRequests > 0 && (
            <Badge className="bg-orange-100 text-orange-800">
              {stats.pendingRequests} Pending Request{stats.pendingRequests > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRecords}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalFiles} files uploaded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shared with Doctors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sharedDoctors}</div>
            <p className="text-xs text-muted-foreground">
              Active access permissions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentActivity}</div>
            <p className="text-xs text-muted-foreground">
              Actions this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.storageUsed}%</div>
            <Progress value={stats.storageUsed} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {formatFileSize(stats.totalSize)} used
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className={`w-12 h-12 rounded-lg ${action.color} flex items-center justify-center mb-3 relative`}>
                    <action.icon className="h-6 w-6 text-white" />
                    {action.count !== undefined && action.count > 0 && (
                      <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs">
                        {action.count}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg">{action.title}</CardTitle>
                  <CardDescription>{action.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Records and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Medical Records</CardTitle>
            <CardDescription>Your latest uploaded documents</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentRecords.length > 0 ? (
              <div className="space-y-4">
                {stats.recentRecords.map((record) => (
                  <div key={record._id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium">{record.title}</p>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Badge className={getCategoryColor(record.category)} variant="outline">
                            {record.category.replace('-', ' ')}
                          </Badge>
                          <span>{new Date(record.createdAt).toLocaleDateString()}</span>
                          {record.files && record.files.length > 0 && (
                            <span>{record.files.length} file{record.files.length > 1 ? 's' : ''}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Link href={`/dashboard/patient/records/edit/${record._id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      {record.files && record.files.length > 0 && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => downloadFile(record._id, 0, record.files[0].originalName)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                <Link href="/dashboard/patient/records">
                  <Button variant="outline" className="w-full">
                    View All Records
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No records yet</p>
                <Link href="/dashboard/patient/upload">
                  <Button className="mt-2">Upload Your First Record</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Record Categories</CardTitle>
            <CardDescription>Breakdown of your medical records by type</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.categoryBreakdown.length > 0 ? (
              <div className="space-y-3">
                {stats.categoryBreakdown.map((category) => (
                  <div key={category._id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge className={getCategoryColor(category._id)} variant="outline">
                        {category._id.replace('-', ' ')}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">{category.count}</span>
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(category.count / stats.totalRecords) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No data to display</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Assistant and Upload Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bot className="mr-2 h-5 w-5 text-purple-600" />
              AI Medical Assistant
            </CardTitle>
            <CardDescription>
              Get personalized health insights and symptom analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Bot className="h-5 w-5 text-purple-600" />
                  <span className="font-medium text-purple-900 dark:text-purple-100">
                    AI Health Assistant
                  </span>
                </div>
                <p className="text-sm text-purple-800 dark:text-purple-200">
                  Analyze your medical records, get symptom insights, and receive personalized health recommendations.
                </p>
              </div>
              <div className="space-y-2">
                <Link href="/dashboard/patient/ai-assistant">
                  <Button className="w-full">
                    <Bot className="mr-2 h-4 w-4" />
                    Try AI Assistant
                  </Button>
                </Link>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="text-xs">
                    <FileText className="mr-1 h-3 w-3" />
                    Analyze Records
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs">
                    <Activity className="mr-1 h-3 w-3" />
                    Symptom Checker
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upload Activity</CardTitle>
            <CardDescription>Your medical record upload trends over time</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.uploadTrends.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Monthly Uploads</span>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600">
                      {stats.uploadTrends.length > 1 ? 'Growing' : 'Stable'}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {stats.uploadTrends.slice(-6).map((trend, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">
                        {new Date(trend._id.year, trend._id.month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${Math.min((trend.count / Math.max(...stats.uploadTrends.map(t => t.count))) * 100, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium w-8">{trend.count}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-blue-600">{stats.totalRecords}</p>
                      <p className="text-xs text-muted-foreground">Total Records</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">{stats.totalFiles}</p>
                      <p className="text-xs text-muted-foreground">Total Files</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No upload activity yet</p>
                <Link href="/dashboard/patient/upload">
                  <Button variant="outline" className="mt-2">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload First Record
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="mr-2 h-5 w-5" />
            Account Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.totalRecords}</p>
              <p className="text-sm text-muted-foreground">Medical Records</p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Share2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.sharedDoctors}</p>
              <p className="text-sm text-muted-foreground">Shared Doctors</p>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <Upload className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.totalFiles}</p>
              <p className="text-sm text-muted-foreground">Files Uploaded</p>
            </div>
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <Clock className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.recentActivity}</p>
              <p className="text-sm text-muted-foreground">Recent Activity</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}