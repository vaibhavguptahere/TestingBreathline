"use client";
import Link from 'next/link';
import { HeartPulse, Heart, Users, Lock, Zap, FileText, Shield, ShieldAlert, Siren } from 'lucide-react';
import { use } from 'react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <HeartPulse className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">Breathline</span>
            </div>
            <div className="flex items-center space-x-4">
               <ThemeToggle />
              <Link href="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link href="/register">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Secure Medical Records
              <span className="text-blue-600"> Platform</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
              Professional-grade medical record management with advanced security, 
              role-based access control, and emergency response capabilities.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="text-lg px-8 py-4">
                  Start Free Trial
                </Button>
              </Link>
              <Link href="/emergency">
                <Button size="lg" variant="outline" className="text-lg px-8 py-4">
                  <Zap className="mr-2 h-5 w-5" />
                  Emergency Access
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white/50 dark:bg-gray-800/50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose BreathLine?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Built for healthcare professionals with enterprise-grade security and compliance features.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <Shield className="h-12 w-12 text-blue-600 mb-4" />
                <CardTitle>Bank-Level Security</CardTitle>
                <CardDescription>
                  End-to-end encryption, secure authentication, and comprehensive audit logging.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <Users className="h-12 w-12 text-green-600 mb-4" />
                <CardTitle>Role-Based Access</CardTitle>
                <CardDescription>
                  Granular permissions for patients, doctors, and emergency responders.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <Zap className="h-12 w-12 text-yellow-600 mb-4" />
                <CardTitle>Emergency Access</CardTitle>
                <CardDescription>
                  QR code-based emergency access system for critical situations.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <FileText className="h-12 w-12 text-purple-600 mb-4" />
                <CardTitle>Document Management</CardTitle>
                <CardDescription>
                  Upload, organize, and share medical documents with version control.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <Heart className="h-12 w-12 text-red-600 mb-4" />
                <CardTitle>Patient-Centered</CardTitle>
                <CardDescription>
                  Patients maintain full control over their medical data and access permissions.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <Lock className="h-12 w-12 text-gray-600 mb-4" />
                <CardTitle>HIPAA Compliant</CardTitle>
                <CardDescription>
                  Built to meet healthcare compliance standards with detailed audit trails.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              Ready to Secure Your Medical Records?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
              Join thousands of healthcare professionals who trust BreathLine for secure medical record management.
            </p>
            <Link href="/register">
              <Button size="lg" className="text-lg px-8 py-4">
                Get Started Today
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Shield className="h-6 w-6 text-blue-400" />
                <span className="text-xl font-bold">BreathLine</span>
              </div>
              <p className="text-gray-400">
                Secure medical records platform for healthcare professionals.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Features</li>
                <li>Security</li>
                <li>Compliance</li>
                <li>API</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Documentation</li>
                <li>Help Center</li>
                <li>Contact Us</li>
                <li>Status</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
                <li>HIPAA Compliance</li>
                <li>Security</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 BreathLine. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
