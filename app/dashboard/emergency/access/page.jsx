'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Search, 
  Filter, 
  Eye, 
  Calendar,
  MapPin,
  Clock,
  AlertTriangle,
  User,
  FileText,
  Activity,
  Loader2,
  TrendingUp,
  BarChart3,
  Phone,
  Download,
  X,
  Image,
  File
} from 'lucide-react';
import { toast } from 'sonner';

export default function EmergencyAccess() {
  const { user } = useAuth();
  const [accessLogs, setAccessLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [viewingFile, setViewingFile] = useState(null);
  const [stats, setStats] = useState({
    todayAccess: 0,
    activeEmergencies: 0,
    weeklyAccess: 0,
    avgResponseTime: 0,
  });

  useEffect(() => {
    fetchAccessLogs();
    fetchStats();
  }, [timeFilter]);

  const fetchAccessLogs = async () => {
    try {
      const response = await fetch('/api/auth/emergency/dashboard-stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAccessLogs(data.recentAccess || []);
      } else {
        throw new Error('Failed to fetch access logs');
      }
    } catch (error) {
      console.error('Error fetching access logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/auth/emergency/dashboard-stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats({
          todayAccess: data.todayAccess || 0,
          activeEmergencies: data.activeEmergencies || 0,
          weeklyAccess: data.weeklyAccess || 0,
          avgResponseTime: data.avgResponseTime || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
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
        url: '/api/placeholder-image'
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

  const filteredLogs = accessLogs.filter(log => {
    const matchesSearch = log.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.accessReason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    
    let matchesTime = true;
    if (timeFilter !== 'all') {
      const now = new Date();
      const logTime = new Date(log.accessTime);
      
      switch (timeFilter) {
        case 'today':
          matchesTime = logTime.toDateString() === now.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesTime = logTime >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesTime = logTime >= monthAgo;
          break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesTime;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAccessTypeIcon = (type) => {
    switch (type) {
      case 'qr-scan':
        return '📱';
      case 'manual-entry':
        return '⌨️';
      default:
        return '🔍';
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Emergency Access Management</h1>
        <p className="text-muted-foreground">
          Monitor and manage emergency patient data access
        </p>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-sm font-medium">Today's Access</p>
                <p className="text-2xl font-bold">{stats.todayAccess}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm font-medium">Active Cases</p>
                <p className="text-2xl font-bold">{stats.activeEmergencies}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium">This Week</p>
                <p className="text-2xl font-bold">{stats.weeklyAccess}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium">Avg Response</p>
                <p className="text-2xl font-bold">{stats.avgResponseTime}m</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by patient name, emergency type, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={timeFilter} onValueChange={setTimeFilter}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <Calendar className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Time" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Enhanced Access Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Emergency Access History</CardTitle>
          <CardDescription>
            Complete log of emergency patient data access ({filteredLogs.length} records)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              <p className="text-muted-foreground mt-2">Loading access logs...</p>
            </div>
          ) : filteredLogs.length > 0 ? (
            <div className="space-y-4">
              {filteredLogs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{getAccessTypeIcon(log.accessType)}</span>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold">{log.patientName}</h3>
                            <Badge className={getStatusColor('completed')}>
                              completed
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground font-medium text-red-600">
                            Emergency QR code access
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(log.accessTime).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span>{log.accessReason || 'Emergency access'}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>Duration: {log.duration || 'N/A'}</span>
                        </div>
                      </div>

                      {/* Emergency Contact */}
                      {log.emergencyContact && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 text-sm flex items-center">
                            <Phone className="mr-1 h-3 w-3" />
                            Emergency Contact:
                          </h4>
                          <div className="text-sm text-blue-800 dark:text-blue-200">
                            <span className="font-medium">{log.emergencyContact.name}</span>
                            <span className="mx-2">•</span>
                            <span>{log.emergencyContact.phone}</span>
                            <span className="mx-2">•</span>
                            <span>{log.emergencyContact.relationship}</span>
                          </div>
                        </div>
                      )}

                      {/* Files accessed */}
                      {log.filesAccessed && log.filesAccessed.length > 0 && (
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2 text-sm">
                            Files Accessed:
                          </h4>
                          <div className="space-y-1">
                            {log.filesAccessed.map((file, fileIndex) => {
                              const FileIcon = getFileIcon(file.mimetype);
                              return (
                                <div key={fileIndex} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded text-xs">
                                  <div className="flex items-center space-x-2">
                                    <FileIcon className="h-3 w-3 text-blue-600" />
                                    <span>{file.originalName}</span>
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
                                      onClick={() => downloadFile(null, fileIndex, file.originalName)}
                                      className="h-6 px-2 text-xs"
                                    >
                                      <Download className="h-2 w-2" />
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      
                      <div className="text-sm">
                        <span className="font-medium">Responder:</span> {user?.profile?.firstName} {user?.profile?.lastName}
                        <span className="mx-2 text-muted-foreground">•</span>
                        <span className="text-muted-foreground">{formatDuration(log.accessTime)}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-2 ml-4">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        Details
                      </Button>
                      <Button variant="outline" size="sm">
                        <FileText className="h-4 w-4 mr-1" />
                        Report
                      </Button>
                      {log.patientPhone && (
                        <Button variant="outline" size="sm" className="text-blue-600">
                          <Phone className="h-4 w-4 mr-1" />
                          Call
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No access logs found</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' || timeFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'No emergency access has been recorded yet'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

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
    </div>
  );
}