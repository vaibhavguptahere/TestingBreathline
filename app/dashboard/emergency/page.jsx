'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  QrCode, 
  Scan, 
  Activity, 
  Clock, 
  AlertTriangle,
  User,
  FileText,
  Phone,
  MapPin,
  Heart,
  Loader2,
  TrendingUp,
  BarChart3,
  Users,
  Zap,
  Timer,
  Calendar,
  Download,
  Eye,
  X,
  Image,
  File
} from 'lucide-react';
import { toast } from 'sonner';

export default function EmergencyDashboard() {
  const { user } = useAuth();
  const [qrCode, setQrCode] = useState('');
  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [viewingFile, setViewingFile] = useState(null);
  const [stats, setStats] = useState({
    todayAccess: 0,
    activeEmergencies: 0,
    weeklyAccess: 0,
    totalAccess: 0,
    avgResponseTime: 0,
    uniquePatients: 0,
    recentAccess: [],
    hourlyAccess: [],
    dailyAccess: [],
    accessByReason: [],
  });
  const [dashboardLoading, setDashboardLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/auth/emergency/dashboard-stats', {
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
      setDashboardLoading(false);
    }
  };

  const handleQRScan = async (e) => {
    e.preventDefault();
    if (!qrCode.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/auth/emergency/access', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qrToken: qrCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to access patient data');
      }

      setPatientData(data.patient);
      toast.success('Patient data accessed successfully');
      
      // Refresh dashboard data after successful access
      fetchDashboardData();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (recordId, fileIndex, fileName) => {
    try {
      // This would be implemented to download files from emergency records
      toast.success(`Download initiated for ${fileName}`);
    } catch (error) {
      toast.error('Download failed');
    }
  };

  const viewFile = async (file) => {
    try {
      // In a real implementation, you would fetch the file content from the server
      // For now, we'll simulate file viewing
      setViewingFile({
        ...file,
        content: getFilePreview(file)
      });
    } catch (error) {
      toast.error('Failed to load file');
    }
  };

  const getFilePreview = (file) => {
    // Simulate file content based on file type
    if (file.mimetype?.startsWith('image/')) {
      return {
        type: 'image',
        url: '/api/placeholder-image' // This would be the actual file URL
      };
    } else if (file.mimetype === 'application/pdf') {
      return {
        type: 'pdf',
        content: 'PDF content would be displayed here using a PDF viewer component'
      };
    } else if (file.mimetype?.startsWith('text/')) {
      return {
        type: 'text',
        content: 'Sample medical document content:\n\nPatient: John Doe\nDate: 2024-01-20\nTest Results: Normal\nRecommendations: Continue current treatment'
      };
    } else {
      return {
        type: 'unsupported',
        content: 'File preview not available for this file type. Please download to view.'
      };
    }
  };

  const getFileIcon = (mimetype) => {
    if (mimetype?.startsWith('image/')) return Image;
    return File;
  };

  const getAccessTypeColor = (type) => {
    switch (type) {
      case 'emergency-access':
        return 'bg-red-100 text-red-800';
      case 'qr-access':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (timestamp) => {
    const now = new Date();
    const accessTime = new Date(timestamp);
    const diffMinutes = Math.floor((now - accessTime) / (1000 * 60));
    
    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffMinutes < 1440) {
      return `${Math.floor(diffMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffMinutes / 1440)}d ago`;
    }
  };

  if (dashboardLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Emergency Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            {user?.profile?.department} • Badge #{user?.profile?.badgeNumber}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-red-600 border-red-600">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Emergency Access
          </Badge>
          {stats.activeEmergencies > 0 && (
            <Badge className="bg-red-600 text-white animate-pulse">
              {stats.activeEmergencies} Active
            </Badge>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Access</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayAccess}</div>
            <p className="text-xs text-muted-foreground">
              Emergency records accessed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Emergencies</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.activeEmergencies}</div>
            <p className="text-xs text-muted-foreground">
              Currently in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Access</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.weeklyAccess}</div>
            <p className="text-xs text-muted-foreground">
              This week's emergency access
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgResponseTime}m</div>
            <p className="text-xs text-muted-foreground">
              Average response time
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* QR Scanner */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Scan className="mr-2 h-5 w-5 text-red-600" />
              Emergency QR Scanner
            </CardTitle>
            <CardDescription>
              Scan patient QR code for immediate medical access
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleQRScan} className="space-y-4">
              <div className="space-y-2">
                <Input
                  value={qrCode}
                  onChange={(e) => setQrCode(e.target.value)}
                  placeholder="Scan or enter emergency QR code"
                  className="font-mono"
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-red-600 hover:bg-red-700"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Accessing Patient Data...
                  </>
                ) : (
                  <>
                    <Scan className="mr-2 h-4 w-4" />
                    Access Emergency Data
                  </>
                )}
              </Button>
            </form>

            {patientData && (
              <div className="mt-6 space-y-4">
                <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
                  <AlertTriangle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    Emergency access granted. All access is logged for security.
                  </AlertDescription>
                </Alert>

                {/* Patient Basic Info */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    Patient Information
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-medium">Name:</span>
                      <p>{patientData.profile.firstName} {patientData.profile.lastName}</p>
                    </div>
                    <div>
                      <span className="font-medium">DOB:</span>
                      <p>{patientData.profile.dateOfBirth ? 
                        new Date(patientData.profile.dateOfBirth).toLocaleDateString() : 
                        'Not provided'
                      }</p>
                    </div>
                    <div>
                      <span className="font-medium">Phone:</span>
                      <p className="flex items-center">
                        <Phone className="mr-1 h-3 w-3" />
                        {patientData.profile.phone || 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Address:</span>
                      <p className="flex items-center">
                        <MapPin className="mr-1 h-3 w-3" />
                        {patientData.profile.address || 'Not provided'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Emergency Contact */}
                {patientData.profile.emergencyContact && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2 flex items-center">
                      <Phone className="mr-2 h-4 w-4" />
                      Emergency Contact
                    </h3>
                    <div className="text-sm">
                      <p><span className="font-medium">Name:</span> {patientData.profile.emergencyContact.name}</p>
                      <p><span className="font-medium">Phone:</span> {patientData.profile.emergencyContact.phone}</p>
                      <p><span className="font-medium">Relationship:</span> {patientData.profile.emergencyContact.relationship}</p>
                    </div>
                  </div>
                )}

                {/* Medical Records */}
                {patientData.emergencyRecords && patientData.emergencyRecords.length > 0 && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2 flex items-center">
                      <Heart className="mr-2 h-4 w-4" />
                      Critical Medical Information
                    </h3>
                    <div className="space-y-2">
                      {patientData.emergencyRecords.map((record, index) => (
                        <div key={index} className="text-sm border-l-2 border-green-400 pl-3">
                          <p className="font-medium">{record.title}</p>
                          <p className="text-gray-600 dark:text-gray-400">{record.description}</p>
                          
                          {/* Files in emergency records */}
                          {record.files && record.files.length > 0 && (
                            <div className="mt-2 space-y-1">
                              <p className="text-xs font-medium">Attached Files:</p>
                              {record.files.map((file, fileIndex) => {
                                const FileIcon = getFileIcon(file.mimetype);
                                return (
                                  <div key={fileIndex} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded text-xs">
                                    <div className="flex items-center space-x-2">
                                      <FileIcon className="h-3 w-3 text-blue-600" />
                                      <span>{file.originalName}</span>
                                      <span className="text-muted-foreground">
                                        ({file.size ? `${Math.round(file.size / 1024)} KB` : 'Unknown size'})
                                      </span>
                                    </div>
                                    <div className="flex space-x-1">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => viewFile(file)}
                                        className="h-6 px-2 text-xs"
                                      >
                                        <Eye className="h-2 w-2" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => downloadFile(record._id, fileIndex, file.originalName)}
                                        className="h-6 px-2 text-xs"
                                      >
                                        <Download className="h-2 w-2" />
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Emergency Access */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              Recent Emergency Access
            </CardTitle>
            <CardDescription>
              Your recent emergency patient data access
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentAccess.length > 0 ? (
              <div className="space-y-4">
                {stats.recentAccess.slice(0, 5).map((access) => (
                  <div key={access.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium">{access.patientName}</p>
                        <Badge className={getAccessTypeColor(access.accessType)}>
                          {access.accessType === 'qr-access' ? 'QR Scan' : 'Emergency'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center">
                        <MapPin className="mr-1 h-3 w-3" />
                        {access.accessReason || 'Emergency access'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDuration(access.accessTime)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {new Date(access.accessTime).toLocaleTimeString()}
                      </p>
                      {access.patientPhone && (
                        <p className="text-xs text-muted-foreground">
                          {access.patientPhone}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                
                {stats.recentAccess.length > 5 && (
                  <div className="text-center">
                    <Button variant="outline" size="sm">
                      View All ({stats.recentAccess.length})
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No recent emergency access</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* File Viewer Dialog */}
      <Dialog open={!!viewingFile} onOpenChange={() => setViewingFile(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Viewing: {viewingFile?.originalName}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewingFile(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
            <DialogDescription>
              Emergency medical file viewer
            </DialogDescription>
          </DialogHeader>
          
          {viewingFile && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-2">
                  {getFileIcon(viewingFile.mimetype) === Image ? (
                    <Image className="h-5 w-5 text-blue-600" />
                  ) : (
                    <File className="h-5 w-5 text-blue-600" />
                  )}
                  <div>
                    <p className="font-medium">{viewingFile.originalName}</p>
                    <p className="text-sm text-muted-foreground">
                      {viewingFile.mimetype} • {viewingFile.size ? `${Math.round(viewingFile.size / 1024)} KB` : 'Unknown size'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => downloadFile(null, 0, viewingFile.originalName)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
              
              <div className="border rounded-lg p-4 min-h-[400px] bg-white dark:bg-gray-900">
                {viewingFile.content?.type === 'image' && (
                  <div className="text-center">
                    <div className="w-full h-96 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <Image className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">Image preview would be displayed here</p>
                        <p className="text-sm text-gray-400 mt-2">
                          In a real implementation, the actual image would be loaded from the server
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {viewingFile.content?.type === 'text' && (
                  <div className="font-mono text-sm whitespace-pre-wrap">
                    {viewingFile.content.content}
                  </div>
                )}
                
                {viewingFile.content?.type === 'pdf' && (
                  <div className="text-center">
                    <div className="w-full h-96 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">PDF viewer would be displayed here</p>
                        <p className="text-sm text-gray-400 mt-2">
                          In a real implementation, a PDF viewer component would be integrated
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {viewingFile.content?.type === 'unsupported' && (
                  <div className="text-center py-12">
                    <File className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">{viewingFile.content.content}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Analytics and Performance */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" />
              Performance Metrics
            </CardTitle>
            <CardDescription>
              Your emergency response performance this month
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total Emergency Access</span>
                <span className="font-medium">{stats.totalAccess}</span>
              </div>
              <Progress value={Math.min((stats.totalAccess / 100) * 100, 100)} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Unique Patients Helped</span>
                <span className="font-medium">{stats.uniquePatients}</span>
              </div>
              <Progress value={Math.min((stats.uniquePatients / 50) * 100, 100)} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Average Response Time</span>
                <span className="font-medium">{stats.avgResponseTime} minutes</span>
              </div>
              <Progress value={Math.max(100 - (stats.avgResponseTime / 30) * 100, 0)} className="h-2" />
            </div>

            <div className="pt-4 border-t">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-blue-600">{stats.todayAccess}</p>
                  <p className="text-xs text-muted-foreground">Today</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{stats.weeklyAccess}</p>
                  <p className="text-xs text-muted-foreground">This Week</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">{stats.totalAccess}</p>
                  <p className="text-xs text-muted-foreground">All Time</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Access Patterns */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5" />
              Access Patterns
            </CardTitle>
            <CardDescription>
              Emergency access breakdown by reason
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.accessByReason.length > 0 ? (
              <div className="space-y-3">
                {stats.accessByReason.map((reason, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                      <span className="text-sm">{reason._id || 'Emergency QR code access'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">{reason.count}</span>
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(reason.count / Math.max(...stats.accessByReason.map(r => r.count))) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No access data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Emergency Protocols */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5 text-red-600" />
            Emergency Access Protocols
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start space-x-2">
            <span className="flex-shrink-0 w-5 h-5 bg-red-100 text-red-800 rounded-full flex items-center justify-center text-xs font-bold">1</span>
            <div>
              <p className="text-sm font-medium">Verify Emergency Situation</p>
              <p className="text-xs text-muted-foreground">Ensure legitimate medical emergency before accessing patient data</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="flex-shrink-0 w-5 h-5 bg-red-100 text-red-800 rounded-full flex items-center justify-center text-xs font-bold">2</span>
            <div>
              <p className="text-sm font-medium">Scan QR Code</p>
              <p className="text-xs text-muted-foreground">Use patient's emergency QR code for immediate access</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="flex-shrink-0 w-5 h-5 bg-red-100 text-red-800 rounded-full flex items-center justify-center text-xs font-bold">3</span>
            <div>
              <p className="text-sm font-medium">Document Access</p>
              <p className="text-xs text-muted-foreground">All emergency access is automatically logged and audited</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <span className="flex-shrink-0 w-5 h-5 bg-red-100 text-red-800 rounded-full flex items-center justify-center text-xs font-bold">4</span>
            <div>
              <p className="text-sm font-medium">Contact Emergency Contact</p>
              <p className="text-xs text-muted-foreground">Notify patient's emergency contact when appropriate</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}