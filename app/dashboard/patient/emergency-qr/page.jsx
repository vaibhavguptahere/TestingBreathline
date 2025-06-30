'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { QRCodeSVG } from 'qrcode.react';
import { 
  QrCode, 
  RefreshCw, 
  Download, 
  Share2, 
  AlertTriangle,
  Clock,
  Shield,
  Copy,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

export default function EmergencyQR() {
  const { user } = useAuth();
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expiryOption, setExpiryOption] = useState('24h');
  const [copied, setCopied] = useState(false);

  const expiryOptions = [
    { value: '1h', label: '1 Hour' },
    { value: '6h', label: '6 Hours' },
    { value: '12h', label: '12 Hours' },
    { value: '24h', label: '24 Hours' },
    { value: '48h', label: '48 Hours' },
    { value: '7d', label: '7 Days' },
  ];

  const generateQR = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/patient/emergency-qr', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ expiresIn: expiryOption }),
      });

      if (response.ok) {
        const data = await response.json();
        setQrData(data);
        toast.success('Emergency QR code generated successfully');
      } else {
        throw new Error('Failed to generate QR code');
      }
    } catch (error) {
      toast.error('Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('QR code copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const downloadQR = () => {
    if (!qrData) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const qrElement = document.getElementById('emergency-qr');
    
    // Create a larger canvas for better quality
    canvas.width = 400;
    canvas.height = 500;
    
    // White background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add title
    ctx.fillStyle = 'black';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Emergency Medical Access', canvas.width / 2, 30);
    
    ctx.font = '14px Arial';
    ctx.fillText(`${user?.profile?.firstName} ${user?.profile?.lastName}`, canvas.width / 2, 55);
    
    // Convert QR SVG to canvas (simplified approach)
    const svgData = new XMLSerializer().serializeToString(qrElement.querySelector('svg'));
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    img.onload = () => {
      ctx.drawImage(img, 50, 80, 300, 300);
      
      // Add expiry info
      ctx.font = '12px Arial';
      ctx.fillText(`Expires: ${new Date(Date.now() + getExpiryMs(expiryOption)).toLocaleString()}`, canvas.width / 2, 420);
      ctx.fillText('Scan for emergency medical access', canvas.width / 2, 440);
      
      // Download
      const link = document.createElement('a');
      link.download = `emergency-qr-${user?.profile?.firstName}-${user?.profile?.lastName}.png`;
      link.href = canvas.toDataURL();
      link.click();
      
      URL.revokeObjectURL(url);
    };
    
    img.src = url;
  };

  const getExpiryMs = (option) => {
    const multipliers = {
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '12h': 12 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '48h': 48 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
    };
    return multipliers[option] || multipliers['24h'];
  };

  const getExpiryDate = () => {
    if (!qrData) return null;
    return new Date(Date.now() + getExpiryMs(expiryOption));
  };

  useEffect(() => {
    // Generate initial QR code
    generateQR();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Emergency QR Code</h1>
        <p className="text-muted-foreground">
          Generate a secure QR code for emergency medical access
        </p>
      </div>

      <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800 dark:text-red-200">
          <strong>Emergency Use Only:</strong> This QR code provides access to your critical medical 
          information for emergency responders. Keep it secure and only share when necessary.
        </AlertDescription>
      </Alert>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* QR Code Display */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <QrCode className="mr-2 h-5 w-5" />
              Emergency QR Code
            </CardTitle>
            <CardDescription>
              Scan this code to access emergency medical information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {qrData ? (
              <div className="space-y-4">
                <div id="emergency-qr" className="flex justify-center p-6 bg-white rounded-lg border">
                  <QRCodeSVG
                    value={qrData.qrToken}
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Patient:</span>
                    <span>{qrData.patientName}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Generated:</span>
                    <span>{new Date(qrData.generatedAt).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Expires:</span>
                    <span className="text-red-600">
                      {getExpiryDate()?.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(qrData.qrToken)}
                    className="flex-1"
                  >
                    {copied ? (
                      <CheckCircle className="mr-2 h-4 w-4" />
                    ) : (
                      <Copy className="mr-2 h-4 w-4" />
                    )}
                    {copied ? 'Copied!' : 'Copy Code'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={downloadQR}
                    className="flex-1"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <QrCode className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Generate your emergency QR code</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Settings and Information */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>QR Code Settings</CardTitle>
              <CardDescription>
                Configure your emergency QR code preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Expiry Time</label>
                <Select value={expiryOption} onValueChange={setExpiryOption}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {expiryOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Choose how long the QR code remains valid
                </p>
              </div>

              <Button
                onClick={generateQR}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Generate New QR Code
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-5 w-5" />
                Security Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Encrypted Access</p>
                  <p className="text-xs text-muted-foreground">
                    QR codes use secure tokens with time-based expiration
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Audit Logging</p>
                  <p className="text-xs text-muted-foreground">
                    All emergency access attempts are logged for security
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <Clock className="h-4 w-4 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Time-Limited</p>
                  <p className="text-xs text-muted-foreground">
                    Codes automatically expire for enhanced security
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How to Use</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start space-x-2">
                <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <p>Generate and save your emergency QR code</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <p>Keep it accessible (wallet, phone, medical bracelet)</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                <p>Emergency responders can scan for instant access</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold">4</span>
                <p>Regenerate periodically for security</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}