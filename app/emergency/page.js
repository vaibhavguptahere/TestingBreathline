'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, QrCode, Scan, Shield, User, FileText, HeartPulse } from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ui/theme-toggle';
export default function EmergencyAccess() {
  const [qrCode, setQrCode] = useState('');
  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleQRScan = async (e) => {
    e.preventDefault();
    if (!qrCode.trim()) return;

    setLoading(true);
    setError('');
    setPatientData(null);

    try {
      const response = await fetch('/api/emergency/access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qrToken: qrCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to access patient data');
      }

      setPatientData(data.patient);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center space-x-2 justify-center mb-8">
            <HeartPulse className="h-8 w-8 text-blue-600" />
            <Link href="/">
              <span className="text-2xl font-bold text-gray-900 dark:text-white mr-6">Breathline</span>
            </Link>
            <ThemeToggle />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Emergency Access Portal
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Secure access to critical medical information for emergency situations
          </p>
        </div>

        {/* Emergency Notice */}
        <Alert className="mb-8 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            <strong>Emergency Use Only:</strong> This portal is designed for authorized emergency
            responders to access critical patient information during medical emergencies.
          </AlertDescription>
        </Alert>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* QR Code Scanner */}
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <QrCode className="h-6 w-6 text-red-600" />
                <span>Emergency QR Access</span>
              </CardTitle>
              <CardDescription>
                Scan or enter the patient&rsquo;s emergency QR code to access their medical information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleQRScan} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="qrCode">Emergency QR Code</Label>
                  <Input
                    id="qrCode"
                    value={qrCode}
                    onChange={(e) => setQrCode(e.target.value)}
                    placeholder="Enter QR code or scan QR code"
                    required
                    className="font-mono"
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-700"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Scan className="mr-2 h-4 w-4 animate-pulse" />
                      Accessing Patient Data...
                    </>
                  ) : (
                    <>
                      <Scan className="mr-2 h-4 w-4" />
                      Access Patient Data
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="font-semibold mb-2 flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  For Emergency Responders
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  If you&rsquo;re an authorized emergency responder, you can register for an account
                  to access additional features and maintain access logs.
                </p>
                <Link href="/register">
                  <Button variant="outline" className="mt-2">
                    Register as Emergency Responder
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Patient Information Display */}
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-6 w-6 text-blue-600" />
                <span>Patient Information</span>
              </CardTitle>
              <CardDescription>
                Critical medical information for emergency care
              </CardDescription>
            </CardHeader>
            <CardContent>
              {patientData ? (
                <div className="space-y-6">
                  {/* Patient Basic Info */}
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      Patient Details
                    </h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="font-medium">Name:</span>
                        <p>{patientData.profile.firstName} {patientData.profile.lastName}</p>
                      </div>
                      <div>
                        <span className="font-medium">Date of Birth:</span>
                        <p>{patientData.profile.dateOfBirth ?
                          new Date(patientData.profile.dateOfBirth).toLocaleDateString() :
                          'Not provided'
                        }</p>
                      </div>
                      <div>
                        <span className="font-medium">Phone:</span>
                        <p>{patientData.profile.phone || 'Not provided'}</p>
                      </div>
                      <div>
                        <span className="font-medium">Address:</span>
                        <p>{patientData.profile.address || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  {patientData.profile.emergencyContact && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">
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
                      <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                        Emergency Medical Records
                      </h3>
                      <div className="space-y-2">
                        {patientData.emergencyRecords.map((record, index) => (
                          <div key={index} className="text-sm">
                            <p className="font-medium">{record.title}</p>
                            <p className="text-gray-600 dark:text-gray-400">{record.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800 dark:text-amber-200">
                      This access has been logged for security and compliance purposes.
                    </AlertDescription>
                  </Alert>
                </div>
              ) : (
                <div className="text-center py-12">
                  <QrCode className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Enter an emergency QR code to view patient information
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>
            This emergency access portal is HIPAA compliant and maintains detailed audit logs.
            Unauthorized access is prohibited and will be reported to authorities.
          </p>
        </div>
      </div>
    </div>
  );
}