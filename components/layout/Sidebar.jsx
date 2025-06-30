'use client';

import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FileText,
  Users,
  Settings,
  Shield,
  Activity,
  Upload,
  QrCode,
  UserCheck,
  AlertTriangle,
  Database,
  BarChart3,
  HeartPulse,
  Brain,
  Stethoscope,
  Bot
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Sidebar() {
  const { user } = useAuth();
  const pathname = usePathname();

  const getNavigationItems = () => {
    const baseItems = [
      {
        title: 'Dashboard',
        href: `/dashboard/${user?.role}`,
        icon: BarChart3,
      },
    ];

    switch (user?.role) {
      case 'patient':
        return [
          ...baseItems,
          {
            title: 'Medical Records',
            href: '/dashboard/patient/records',
            icon: FileText,
          },
          {
            title: 'Upload Documents',
            href: '/dashboard/patient/upload',
            icon: Upload,
          },
          {
            title: 'AI Assistant',
            href: '/dashboard/patient/ai-assistant',
            icon: Bot,
          },
          {
            title: 'Emergency QR',
            href: '/dashboard/patient/emergency-qr',
            icon: QrCode,
          },
          {
            title: 'Shared Access',
            href: '/dashboard/patient/shared-access',
            icon: Users,
          },
          {
            title: 'Profile Settings',
            href: '/dashboard/patient/profile',
            icon: Settings,
          },
        ];

      case 'doctor':
        return [
          ...baseItems,
          {
            title: 'Patient Records',
            href: '/dashboard/doctor/patients',
            icon: Users,
          },
          {
            title: 'AI Assistant',
            href: '/dashboard/doctor/ai-assistant',
            icon: Brain,
          },
          {
            title: 'Smart Diagnosis',
            href: '/dashboard/doctor/smart-diagnosis',
            icon: Stethoscope,
          },
          {
            title: 'Access Requests',
            href: '/dashboard/doctor/access-requests',
            icon: UserCheck,
          },
          {
            title: 'Profile Settings',
            href: '/dashboard/doctor/profile',
            icon: Settings,
          },
        ];

      case 'emergency':
        return [
          ...baseItems,
          {
            title: 'QR Scanner',
            href: '/dashboard/emergency/scanner',
            icon: QrCode,
          },
          {
            title: 'Emergency Access',
            href: '/dashboard/emergency/access',
            icon: AlertTriangle,
          },
          {
            title: 'Access History',
            href: '/dashboard/emergency/history',
            icon: Activity,
          },
          {
            title: 'Profile Settings',
            href: '/dashboard/emergency/profile',
            icon: Settings,
          },
        ];

      case 'admin':
        return [
          ...baseItems,
          {
            title: 'User Management',
            href: '/dashboard/admin/users',
            icon: Users,
          },
          {
            title: 'Doctor Verification',
            href: '/dashboard/admin/verification',
            icon: UserCheck,
          },
          {
            title: 'Audit Logs',
            href: '/dashboard/admin/logs',
            icon: Activity,
          },
          {
            title: 'System Settings',
            href: '/dashboard/admin/settings',
            icon: Settings,
          },
        ];

      default:
        return baseItems;
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <div className="flex h-full w-64 flex-col bg-card">
      <div className="flex items-center justify-center h-16 border-b">
        <div className="flex items-center space-x-2">
          <HeartPulse className="h-7 w-7 text-blue-600" />
          <Link href="/" className="text-2xl font-bold text-foreground">
            BreathLine
          </Link>
        </div>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-2">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? 'default' : 'ghost'}
                  className={cn(
                    'w-full justify-start h-12 px-4',
                    isActive && 'bg-primary text-primary-foreground'
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.title}
                </Button>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
    </div>
  );
}