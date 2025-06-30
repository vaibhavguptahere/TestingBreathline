'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  FileText, 
  Search, 
  Filter, 
  Plus, 
  Calendar,
  Download,
  Eye,
  Bot,
  Loader2,
  Edit,
  Trash2,
  File,
  Image,
  Share2
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function MedicalRecords() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [analyzingRecord, setAnalyzingRecord] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 0 });

  const [newRecord, setNewRecord] = useState({
    title: '',
    description: '',
    category: 'general',
    recordDate: new Date().toISOString().split('T')[0],
    isEmergencyVisible: false,
  });

  useEffect(() => {
    fetchRecords();
  }, [categoryFilter, pagination.page]);

  const fetchRecords = async () => {
    try {
      const response = await fetch(`/api/auth/patient/records?category=${categoryFilter}&page=${pagination.page}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRecords(data.records || []);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching records:', error);
      toast.error('Failed to fetch records');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRecord = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/auth/patient/records', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newRecord),
      });

      if (response.ok) {
        toast.success('Record added successfully');
        setShowAddDialog(false);
        setNewRecord({
          title: '',
          description: '',
          category: 'general',
          recordDate: new Date().toISOString().split('T')[0],
          isEmergencyVisible: false,
        });
        fetchRecords();
      } else {
        throw new Error('Failed to add record');
      }
    } catch (error) {
      toast.error('Failed to add record');
    }
  };

  const handleDeleteRecord = async (recordId) => {
    if (!confirm('Are you sure you want to delete this record? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/auth/patient/records/${recordId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        toast.success('Record deleted successfully');
        fetchRecords();
      } else {
        throw new Error('Failed to delete record');
      }
    } catch (error) {
      toast.error('Failed to delete record');
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

  const analyzeWithAI = async (record) => {
    setAnalyzingRecord(record._id);
    setAiAnalysis(null);

    try {
      const response = await fetch('/api/ai/analyze-document', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentText: record.description,
          documentType: record.category,
          symptoms: record.title,
        }),
      });

      if (response.ok) {
        const analysis = await response.json();
        setAiAnalysis(analysis);
        toast.success('AI analysis completed');
      } else {
        throw new Error('AI analysis failed');
      }
    } catch (error) {
      toast.error('AI analysis failed');
    } finally {
      setAnalyzingRecord(null);
    }
  };

  const filteredRecords = records.filter(record =>
    record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryColor = (category) => {
    const colors = {
      general: 'bg-gray-100 text-gray-800',
      'lab-results': 'bg-blue-100 text-blue-800',
      prescription: 'bg-green-100 text-green-800',
      imaging: 'bg-purple-100 text-purple-800',
      emergency: 'bg-red-100 text-red-800',
      consultation: 'bg-yellow-100 text-yellow-800',
    };
    return colors[category] || colors.general;
  };

  const getFileIcon = (mimetype) => {
    if (mimetype?.startsWith('image/')) return Image;
    return File;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Medical Records</h1>
          <p className="text-muted-foreground">Manage your medical documents and history</p>
        </div>
        <div className="flex space-x-2">
          <Link href="/dashboard/patient/upload">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Upload Files
            </Button>
          </Link>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add Record
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add Medical Record</DialogTitle>
                <DialogDescription>
                  Create a new medical record entry
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddRecord} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newRecord.title}
                    onChange={(e) => setNewRecord({ ...newRecord, title: e.target.value })}
                    placeholder="Record title"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={newRecord.category}
                    onValueChange={(value) => setNewRecord({ ...newRecord, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="lab-results">Lab Results</SelectItem>
                      <SelectItem value="prescription">Prescription</SelectItem>
                      <SelectItem value="imaging">Imaging</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                      <SelectItem value="consultation">Consultation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recordDate">Record Date</Label>
                  <Input
                    id="recordDate"
                    type="date"
                    value={newRecord.recordDate}
                    onChange={(e) => setNewRecord({ ...newRecord, recordDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newRecord.description}
                    onChange={(e) => setNewRecord({ ...newRecord, description: e.target.value })}
                    placeholder="Record description or notes"
                    rows={3}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="emergency"
                    checked={newRecord.isEmergencyVisible}
                    onCheckedChange={(checked) => setNewRecord({ ...newRecord, isEmergencyVisible: checked })}
                  />
                  <Label htmlFor="emergency">Visible in emergency situations</Label>
                </div>
                <Button type="submit" className="w-full">Add Record</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="general">General</SelectItem>
            <SelectItem value="lab-results">Lab Results</SelectItem>
            <SelectItem value="prescription">Prescription</SelectItem>
            <SelectItem value="imaging">Imaging</SelectItem>
            <SelectItem value="emergency">Emergency</SelectItem>
            <SelectItem value="consultation">Consultation</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Records Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : filteredRecords.length > 0 ? (
        <div className="space-y-4">
          {filteredRecords.map((record) => (
            <Card key={record._id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{record.title}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge className={getCategoryColor(record.category)}>
                        {record.category.replace('-', ' ')}
                      </Badge>
                      {record.metadata?.isEmergencyVisible && (
                        <Badge variant="outline" className="text-red-600 border-red-600">
                          Emergency Visible
                        </Badge>
                      )}
                      {record.files && record.files.length > 0 && (
                        <Badge variant="outline">
                          {record.files.length} file{record.files.length > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => analyzeWithAI(record)}
                      disabled={analyzingRecord === record._id}
                    >
                      {analyzingRecord === record._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                      AI Analyze
                    </Button>
                    <Link href={`/dashboard/patient/records/edit/${record._id}`}>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteRecord(record._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{record.description}</p>
                
                {/* Files Section */}
                {record.files && record.files.length > 0 && (
                  <div className="space-y-3 mb-4">
                    <h4 className="font-medium text-sm">Attached Files:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {record.files.map((file, fileIndex) => {
                        const FileIcon = getFileIcon(file.mimetype);
                        return (
                          <div key={fileIndex} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <FileIcon className="h-5 w-5 text-blue-600" />
                              <div>
                                <p className="text-sm font-medium truncate max-w-[150px]">{file.originalName}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatFileSize(file.size)} • {file.mimetype}
                                </p>
                              </div>
                            </div>
                            <div className="flex space-x-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => downloadFile(record._id, fileIndex, file.originalName)}
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Eye className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <Calendar className="mr-1 h-4 w-4" />
                      {new Date(record.metadata?.recordDate || record.createdAt).toLocaleDateString()}
                    </div>
                    {record.metadata?.doctorId && (
                      <div>
                        Added by Dr. {record.metadata.doctorId.profile?.firstName}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Share2 className="h-4 w-4 mr-1" />
                      Share
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.pages} ({pagination.total} total records)
              </p>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === pagination.pages}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No records found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || categoryFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Start by adding your first medical record'
              }
            </p>
            <div className="flex space-x-2 justify-center">
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Record
              </Button>
              <Link href="/dashboard/patient/upload">
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Upload Files
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Analysis Results */}
      {aiAnalysis && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-900 dark:text-blue-100">
              <Bot className="mr-2 h-5 w-5" />
              AI Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Summary</h4>
              <p className="text-sm">{aiAnalysis.analysis.summary}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Key Findings</h4>
              <ul className="list-disc list-inside space-y-1">
                {aiAnalysis.analysis.findings.map((finding, index) => (
                  <li key={index} className="text-sm">{finding}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Recommendations</h4>
              <ul className="list-disc list-inside space-y-1">
                {aiAnalysis.analysis.recommendations.map((rec, index) => (
                  <li key={index} className="text-sm">{rec}</li>
                ))}
              </ul>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Confidence: {Math.round(aiAnalysis.analysis.confidence * 100)}%</span>
              <span>Severity: {aiAnalysis.analysis.severity}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}