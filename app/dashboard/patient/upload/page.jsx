'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  FileText, 
  Image, 
  File, 
  X, 
  Bot,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

export default function UploadDocuments() {
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'general',
    recordDate: new Date().toISOString().split('T')[0],
    isEmergencyVisible: false,
  });

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const validFiles = selectedFiles.filter(file => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/gif',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      if (file.size > maxSize) {
        toast.error(`${file.name} is too large. Maximum size is 10MB.`);
        return false;
      }
      
      if (!allowedTypes.includes(file.type)) {
        toast.error(`${file.name} is not a supported file type.`);
        return false;
      }
      
      return true;
    });

    setFiles(prev => [...prev, ...validFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
    }))]);
  };

  const removeFile = (id) => {
    setFiles(prev => {
      const updated = prev.filter(f => f.id !== id);
      // Clean up preview URLs
      const removed = prev.find(f => f.id === id);
      if (removed?.preview) {
        URL.revokeObjectURL(removed.preview);
      }
      return updated;
    });
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (files.length === 0) {
      toast.error('Please select at least one file to upload');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const uploadFormData = new FormData();
      files.forEach(({ file }) => {
        uploadFormData.append('files', file);
      });
      
      uploadFormData.append('title', formData.title);
      uploadFormData.append('description', formData.description);
      uploadFormData.append('category', formData.category);
      uploadFormData.append('recordDate', formData.recordDate);
      uploadFormData.append('isEmergencyVisible', formData.isEmergencyVisible.toString());

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch('/api/auth/patient/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: uploadFormData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.ok) {
        const result = await response.json();
        toast.success('Files uploaded successfully!');
        
        // Reset form
        setFiles([]);
        setFormData({
          title: '',
          description: '',
          category: 'general',
          recordDate: new Date().toISOString().split('T')[0],
          isEmergencyVisible: false,
        });
        
        // Trigger AI analysis if enabled
        if (formData.description) {
          analyzeWithAI(result.record);
        }
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      toast.error('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const analyzeWithAI = async (record) => {
    setAnalyzing(true);
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
      }
    } catch (error) {
      toast.error('AI analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return Image;
    if (fileType === 'application/pdf') return FileText;
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
      <div>
        <h1 className="text-3xl font-bold">Upload Documents</h1>
        <p className="text-muted-foreground">Upload and manage your medical documents securely</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upload Form */}
        <Card>
          <CardHeader>
            <CardTitle>Document Upload</CardTitle>
            <CardDescription>
              Upload medical documents, lab results, prescriptions, and more
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Document Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Blood Test Results - January 2024"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
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
                  value={formData.recordDate}
                  onChange={(e) => setFormData({ ...formData, recordDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the document contents, symptoms, or relevant notes..."
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="emergency"
                  checked={formData.isEmergencyVisible}
                  onCheckedChange={(checked) => setFormData({ ...formData, isEmergencyVisible: checked })}
                />
                <Label htmlFor="emergency">Make visible in emergency situations</Label>
              </div>

              {/* File Upload Area */}
              <div className="space-y-2">
                <Label>Files</Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                    accept=".pdf,.jpg,.jpeg,.png,.gif,.txt,.doc,.docx"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PDF, Images, Documents (Max 10MB each)
                    </p>
                  </label>
                </div>
              </div>

              {/* Selected Files */}
              {files.length > 0 && (
                <div className="space-y-2">
                  <Label>Selected Files ({files.length})</Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {files.map(({ file, id, preview }) => {
                      const FileIcon = getFileIcon(file.type);
                      return (
                        <div key={id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                          <div className="flex items-center space-x-2">
                            {preview ? (
                              <img src={preview} alt="" className="w-8 h-8 object-cover rounded" />
                            ) : (
                              <FileIcon className="h-8 w-8 text-muted-foreground" />
                            )}
                            <div>
                              <p className="text-sm font-medium truncate max-w-[200px]">{file.name}</p>
                              <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Upload Progress */}
              {uploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}

              <Button type="submit" className="w-full" disabled={uploading || files.length === 0}>
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Documents
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* AI Analysis Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bot className="mr-2 h-5 w-5" />
                AI Document Analysis
              </CardTitle>
              <CardDescription>
                Get instant insights from your medical documents using AI
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analyzing ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">Analyzing document...</p>
                </div>
              ) : aiAnalysis ? (
                <div className="space-y-4">
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Analysis completed with {Math.round(aiAnalysis.analysis.confidence * 100)}% confidence
                    </AlertDescription>
                  </Alert>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Summary</h4>
                    <p className="text-sm text-muted-foreground">{aiAnalysis.analysis.summary}</p>
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
                </div>
              ) : (
                <div className="text-center py-8">
                  <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Upload a document with description to get AI analysis
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upload Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Supported Formats</p>
                  <p className="text-xs text-muted-foreground">PDF, JPEG, PNG, GIF, TXT, DOC, DOCX</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">File Size Limit</p>
                  <p className="text-xs text-muted-foreground">Maximum 10MB per file</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Security</p>
                  <p className="text-xs text-muted-foreground">All files are encrypted and stored securely</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}