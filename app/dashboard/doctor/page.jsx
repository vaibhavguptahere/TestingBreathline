'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  FileText, 
  Clock, 
  Activity,
  TrendingUp,
  Calendar,
  UserCheck,
  Bot,
  Eye,
  Phone,
  Mail,
  Loader2,
  BarChart3,
  AlertTriangle,
  Brain,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalPatients: 0,
    pendingRequests: 0,
    recentActivity: 0,
    recordsAccessedThisMonth: 0,
    recentPatients: [],
    activityTrends: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/auth/doctor/dashboard-stats', {
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
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'View Patients',
      description: 'Access patient records',
      icon: Users,
      href: '/dashboard/doctor/patients',
      color: 'bg-blue-500',
      count: stats.totalPatients,
    },
    {
      title: 'Access Requests',
      description: 'Review pending requests',
      icon: UserCheck,
      href: '/dashboard/doctor/access-requests',
      color: 'bg-green-500',
      count: stats.pendingRequests,
    },
    {
      title: 'AI Assistant',
      description: 'Get AI-powered insights',
      icon: Bot,
      href: '/dashboard/doctor/ai-assistant',
      color: 'bg-purple-500',
    },
    {
      title: 'Smart Diagnosis',
      description: 'AI diagnostic support',
      icon: Brain,
      href: '/dashboard/doctor/smart-diagnosis',
      color: 'bg-orange-500',
    },
  ];

  const getActivityTrendPercentage = () => {
    if (stats.activityTrends.length < 2) return 0;
    
    const recent = stats.activityTrends.slice(-7).reduce((sum, day) => sum + day.count, 0);
    const previous = stats.activityTrends.slice(-14, -7).reduce((sum, day) => sum + day.count, 0);
    
    if (previous === 0) return recent > 0 ? 100 : 0;
    return Math.round(((recent - previous) / previous) * 100);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Welcome, Dr. {user?.profile?.firstName}!
          </h1>
          <p className="text-muted-foreground mt-2">
            {user?.profile?.specialization} • {user?.profile?.hospital}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className={`${user?.profile?.verified ? 'text-green-600 border-green-600' : 'text-yellow-600 border-yellow-600'}`}>
            <UserCheck className="mr-1 h-3 w-3" />
            {user?.profile?.verified ? 'Verified' : 'Pending Verification'}
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPatients}</div>
            <p className="text-xs text-muted-foreground">
              Active patient access
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingRequests}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting patient approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentActivity}</div>
            <p className="text-xs text-muted-foreground">
              Actions this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Records Accessed</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recordsAccessedThisMonth}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className={`w-12 h-12 rounded-lg ${action.color} flex items-center justify-center mb-3 relative`}>
                    <action.icon className="h-6 w-6 text-white" />
                    {action.count !== undefined && action.count > 0 && (
                      <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs">
                        {action.count}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg">{action.title}</CardTitle>
                  <CardDescription>{action.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Patients and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Patients</CardTitle>
            <CardDescription>Patients you've recently accessed</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentPatients.length > 0 ? (
              <div className="space-y-4">
                {stats.recentPatients.map((patient) => (
                  <div key={patient.patientId} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{patient.patientName}</p>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <span>{patient.recordCount} records</span>
                          <span>•</span>
                          <span>{patient.accessCount} accesses</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {new Date(patient.lastAccess).toLocaleDateString()}
                      </p>
                      <Link href={`/dashboard/doctor/patients/${patient.patientId}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="mr-1 h-4 w-4" />
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
                <Link href="/dashboard/doctor/patients">
                  <Button variant="outline" className="w-full">
                    View All Patients
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No recent patient access</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activity Overview</CardTitle>
            <CardDescription>Your recent activity trends</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Weekly Activity</span>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600">
                    {getActivityTrendPercentage() > 0 ? '+' : ''}{getActivityTrendPercentage()}%
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Records Viewed</span>
                  <span>{stats.recordsAccessedThisMonth}</span>
                </div>
                <Progress value={(stats.recordsAccessedThisMonth / 100) * 100} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Patient Interactions</span>
                  <span>{stats.recentActivity}</span>
                </div>
                <Progress value={(stats.recentActivity / 50) * 100} className="h-2" />
              </div>

              <div className="pt-4 border-t">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{stats.totalPatients}</p>
                    <p className="text-xs text-muted-foreground">Active Patients</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">{stats.pendingRequests}</p>
                    <p className="text-xs text-muted-foreground">Pending Requests</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Assistant Promotion */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bot className="mr-2 h-5 w-5 text-purple-600" />
            AI Medical Assistant
          </CardTitle>
          <CardDescription>
            Enhance your clinical decision-making with AI-powered insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Available Features:</h4>
              <ul className="text-sm space-y-1">
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-3 w-3 text-green-600" />
                  Patient record analysis
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-3 w-3 text-green-600" />
                  Smart diagnosis suggestions
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-3 w-3 text-green-600" />
                  Treatment recommendations
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-3 w-3 text-green-600" />
                  Document insights
                </li>
              </ul>
            </div>
            <div className="flex flex-col justify-center space-y-2">
              <Link href="/dashboard/doctor/ai-assistant">
                <Button className="w-full">
                  <Bot className="mr-2 h-4 w-4" />
                  Try AI Assistant
                </Button>
              </Link>
              <Link href="/dashboard/doctor/smart-diagnosis">
                <Button variant="outline" className="w-full">
                  <Brain className="mr-2 h-4 w-4" />
                  Smart Diagnosis
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}