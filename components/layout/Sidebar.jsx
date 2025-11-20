'use client';

import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard,
  FileText,
  Users,
  Upload,
  QrCode,
  Share2,
  Bot,
  Stethoscope,
  Brain,
  UserCheck,
  Activity,
  History,
  Scan,
  Settings,
  Shield,
  Siren,
  HeartPulse
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const { user } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const getNavigationItems = () => {
    const baseItems = [
      {
        title: 'Dashboard',
        href: `/dashboard/${user.role}`,
        icon: LayoutDashboard,
      },
    ];

    switch (user.role) {
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
            title: 'Shared Access',
            href: '/dashboard/patient/shared-access',
            icon: Share2,
          },
          {
            title: 'Access Requests',
            href: '/dashboard/patient/access-requests',
            icon: UserCheck,
          },
          {
            title: 'Emergency QR',
            href: '/dashboard/patient/emergency-qr',
            icon: QrCode,
          },
          {
            title: 'AI Assistant',
            href: '/dashboard/patient/ai-assistant',
            icon: Bot,
            badge: 'AI',
          },
          {
            title: 'Settings',
            href: '/dashboard/patient/settings',
            icon: Settings,
          },
        ];

      case 'doctor':
        return [
          ...baseItems,
          {
            title: 'Identity Verification',
            href: '/dashboard/doctor/verification',
            icon: Shield,
          },
          {
            title: 'My Patients',
            href: '/dashboard/doctor/patients',
            icon: Users,
          },
          {
            title: 'Access Requests',
            href: '/dashboard/doctor/access-requests',
            icon: UserCheck,
          },
          {
            title: 'AI Assistant',
            href: '/dashboard/doctor/ai-assistant',
            icon: Bot,
            badge: 'AI',
          },
          {
            title: 'Smart Diagnosis',
            href: '/dashboard/doctor/smart-diagnosis',
            icon: Brain,
            badge: 'AI',
          },
          {
            title: 'Settings',
            href: '/dashboard/doctor/settings',
            icon: Settings,
          },
        ];

      case 'emergency':
        return [
          ...baseItems,
          {
            title: 'QR Scanner',
            href: '/dashboard/emergency/scanner',
            icon: Scan,
          },
          {
            title: 'Emergency Access',
            href: '/dashboard/emergency/access',
            icon: Activity,
          },
          {
            title: 'Access History',
            href: '/dashboard/emergency/history',
            icon: History,
          },
          {
            title: 'Settings',
            href: '/dashboard/emergency/settings',
            icon: Settings,
          },
        ];

      case 'admin':
        return [
          ...baseItems,
          {
            title: 'Doctor Verifications',
            href: '/dashboard/admin',
            icon: FileText,
          },
          {
            title: 'Access Requests',
            href: '/dashboard/admin',
            icon: Users,
          },
          {
            title: 'Audit Logs',
            href: '/dashboard/admin',
            icon: Activity,
          },
          {
            title: 'Settings',
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
    <div className="flex h-full w-64 flex-col bg-background border-r">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/" className="flex items-center space-x-2">
          <HeartPulse className="h-6 w-6 text-blue-600" />
          <span className="text-xl font-bold">Breathline</span>
        </Link>
      </div>

      <div className="flex-1 overflow-auto py-4">
        <nav className="space-y-1 px-3">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start',
                    isActive && 'bg-secondary'
                  )}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.title}
                  {item.badge && (
                    <Badge variant="outline" className="ml-auto text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </Button>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t p-4">
        <div className="flex items-center space-x-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            {user.role === 'doctor' && <Stethoscope className="h-4 w-4" />}
            {user.role === 'emergency' && <Siren className="h-4 w-4" />}
            {user.role === 'patient' && <Shield className="h-4 w-4" />}
            {user.role === 'admin' && <Activity className="h-4 w-4" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user.profile?.firstName} {user.profile?.lastName}
            </p>
            <p className="text-xs text-muted-foreground capitalize">
              {user.role}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
