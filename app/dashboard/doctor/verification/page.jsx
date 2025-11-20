'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Upload,
  File,
  Loader2,
  FileCheck,
  AlertTriangle,
  Trash2,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';

const DOCUMENT_TYPES = [
  {
    id: 'MRN',
    label: 'Medical Registration Number (MRN/MCI)',
    description: 'Medical Council of India or State Medical Council registration certificate',
    required: true,
  },
  {
    id: 'GOVERNMENT_ID',
    label: 'Government ID',
    description: 'Aadhar, PAN, or Passport (clear government-issued ID)',
    required: true,
  },
  {
    id: 'HOSPITAL_ID',
    label: 'Hospital ID / Employment Proof',
    description: 'Hospital ID card, employment letter, or hospital stamp with details',
    required: true,
  },
  {
    id: 'MEDICAL_CERTIFICATE',
    label: 'Medical Certificate / Proof',
    description: 'Medical degree, qualification certificate, or professional credential',
    required: false,
  },
];

export default function DoctorVerification() {
  const { user } = useAuth();
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState({});
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (user?.role !== 'doctor') {
      window.location.href = '/dashboard/patient';
    }
  }, [user]);

  useEffect(() => {
    fetchVerificationStatus();
  }, []);

  const fetchVerificationStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/doctor/verification/upload', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setVerificationStatus(data);
      } else {
        throw new Error('Failed to fetch verification status');
      }
    } catch (error) {
      console.error('Error fetching verification status:', error);
      toast.error('Failed to load verification status');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (docType, file) => {
    if (!file) {
      setSelectedFiles(prev => {
        const updated = { ...prev };
        delete updated[docType];
        return updated;
      });
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error(`${file.name} is too large. Maximum size is 10MB.`);
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error(`${file.name} has unsupported format. Use JPG, PNG, or PDF.`);
      return;
    }

    setSelectedFiles(prev => ({
      ...prev,
      [docType]: file,
    }));
  };

  const handleSubmit = async () => {
    const requiredDocs = DOCUMENT_TYPES.filter(d => d.required).map(d => d.id);
    const missingDocs = requiredDocs.filter(doc => !selectedFiles[doc]);

    if (missingDocs.length > 0) {
      toast.error(`Missing required documents: ${missingDocs.join(', ')}`);
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();

      Object.entries(selectedFiles).forEach(([docType, file]) => {
        formData.append('documents', file);
        formData.append('documentTypes', docType);
      });

      const response = await fetch('/api/auth/doctor/verification/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Documents uploaded successfully!');
        setSelectedFiles({});
        await fetchVerificationStatus();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  if (!user || user.role !== 'doctor') {
    return null;
  }

  const getStatusBadge = (status) => {
    const config = {
      not_submitted: {
        color: 'bg-gray-100 text-gray-800',
        icon: AlertCircle,
        label: 'Not Submitted',
      },
      submitted: {
        color: 'bg-blue-100 text-blue-800',
        icon: Clock,
        label: 'Submitted',
      },
      under_review: {
        color: 'bg-yellow-100 text-yellow-800',
        icon: Clock,
        label: 'Under Review',
      },
      need_resubmission: {
        color: 'bg-orange-100 text-orange-800',
        icon: AlertTriangle,
        label: 'Need Resubmission',
      },
      verified: {
        color: 'bg-green-100 text-green-800',
        icon: CheckCircle,
        label: 'Verified',
      },
      rejected: {
        color: 'bg-red-100 text-red-800',
        icon: AlertCircle,
        label: 'Rejected',
      },
      suspended: {
        color: 'bg-purple-100 text-purple-800',
        icon: AlertTriangle,
        label: 'Suspended',
      },
    };

    const config_ = config[status] || config.not_submitted;
    const Icon = config_.icon;

    return (
      <Badge className={`flex items-center gap-1 w-fit ${config_.color}`}>
        <Icon className="h-4 w-4" />
        {config_.label}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Doctor Identity Verification</h1>
          <p className="text-muted-foreground">
            Complete your identity verification to access patient data
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : verificationStatus ? (
          <div className="space-y-6">
            {/* Current Status */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Verification Status</CardTitle>
                    <CardDescription>
                      Your current identity verification status
                    </CardDescription>
                  </div>
                  {getStatusBadge(verificationStatus.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {verificationStatus.status === 'verified' && (
                  <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800 dark:text-green-200">
                      Your identity has been verified. You can now access patient data.
                    </AlertDescription>
                  </Alert>
                )}

                {verificationStatus.status === 'rejected' && (
                  <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800 dark:text-red-200">
                      <strong>Rejection Reason:</strong> {verificationStatus.rejectionReason}
                    </AlertDescription>
                  </Alert>
                )}

                {verificationStatus.status === 'need_resubmission' && (
                  <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-900/20">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-800 dark:text-orange-200">
                      <strong>Admin Notes:</strong> {verificationStatus.verificationNotes?.notes}
                    </AlertDescription>
                  </Alert>
                )}

                {verificationStatus.status === 'suspended' && (
                  <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800 dark:text-red-200">
                      Your verification has been suspended. Please contact support.
                    </AlertDescription>
                  </Alert>
                )}

                {['submitted', 'under_review'].includes(verificationStatus.status) && (
                  <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800 dark:text-blue-200">
                      Your documents are under review. We'll notify you once the verification is complete.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Uploaded Documents */}
            {verificationStatus.documents.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Uploaded Documents</CardTitle>
                  <CardDescription>
                    Your current verification documents
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {verificationStatus.documents.map(doc => (
                      <div
                        key={doc.fileName}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <File className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">{doc.type}</p>
                            <p className="text-xs text-muted-foreground">
                              {(doc.fileSize / 1024 / 1024).toFixed(2)}MB • Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Upload Form */}
            {!['verified', 'suspended'].includes(verificationStatus.status) && (
              <Card>
                <CardHeader>
                  <CardTitle>Upload Documents</CardTitle>
                  <CardDescription>
                    Submit your identity verification documents
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {DOCUMENT_TYPES.map(docType => (
                    <div key={docType.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-medium flex items-center gap-2">
                            {docType.label}
                            {docType.required && <span className="text-red-600">*</span>}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {docType.description}
                          </p>
                        </div>
                        {selectedFiles[docType.id] && (
                          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                        )}
                      </div>

                      {selectedFiles[docType.id] ? (
                        <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                          <div className="flex items-center gap-2">
                            <File className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-green-800 dark:text-green-200">
                              {selectedFiles[docType.id].name}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFileSelect(docType.id, null)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <label className="flex items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer hover:bg-muted/50 transition-colors">
                          <input
                            type="file"
                            className="hidden"
                            accept=".jpg,.jpeg,.png,.pdf"
                            onChange={(e) => handleFileSelect(docType.id, e.target.files?.[0])}
                          />
                          <div className="text-center">
                            <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm font-medium">Click to upload</p>
                            <p className="text-xs text-muted-foreground">
                              JPG, PNG or PDF (max 10MB)
                            </p>
                          </div>
                        </label>
                      )}
                    </div>
                  ))}

                  {uploading && (
                    <div className="space-y-2">
                      <Progress value={uploadProgress} className="h-2" />
                      <p className="text-sm text-muted-foreground">Uploading documents...</p>
                    </div>
                  )}

                  <Button
                    onClick={handleSubmit}
                    disabled={uploading || Object.keys(selectedFiles).length === 0}
                    className="w-full"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <FileCheck className="mr-2 h-4 w-4" />
                        Submit for Verification
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
