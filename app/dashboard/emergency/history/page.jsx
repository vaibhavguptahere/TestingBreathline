'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Search, 
  Filter, 
  Download, 
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  User,
  FileText,
  BarChart3,
  TrendingUp,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';

export default function EmergencyHistory() {
  const { user } = useAuth();
  const [accessHistory, setAccessHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [typeFilter, setTypeFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAccess: 0,
    thisMonth: 0,
    avgResponseTime: 0,
    emergencyTypes: {}
  });

  useEffect(() => {
    fetchAccessHistory();
  }, []);

  const fetchAccessHistory = async () => {
    try {
      const response = await fetch('/api/auth/emergency/dashboard-stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAccessHistory(data.recentAccess || []);
        
        // Calculate stats from the data
        const totalAccess = data.recentAccess?.length || 0;
        const thisMonth = data.recentAccess?.filter(h => 
          new Date(h.accessTime).getMonth() === new Date().getMonth()
        ).length || 0;
        
        const emergencyTypes = data.recentAccess?.reduce((acc, h) => {
          const type = 'Emergency QR code access';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {}) || {};
        
        setStats({
          totalAccess,
          thisMonth,
          avgResponseTime: data.avgResponseTime || 0,
          emergencyTypes
        });
      } else {
        throw new Error('Failed to fetch access history');
      }
    } catch (error) {
      console.error('Error fetching access history:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = accessHistory.filter(record => {
    const matchesSearch = record.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.accessReason?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || record.accessType === typeFilter;
    
    const matchesDate = !dateRange.from || !dateRange.to || 
                       (new Date(record.accessTime) >= dateRange.from && 
                        new Date(record.accessTime) <= dateRange.to);
    
    return matchesSearch && matchesType && matchesDate;
  });

  const exportHistory = () => {
    // In a real implementation, this would generate and download a CSV/PDF report
    const csvContent = filteredHistory.map(record => 
      `${record.patientName},Emergency QR code access,${record.accessTime},${record.accessReason || 'Emergency access'},Completed`
    ).join('\n');
    
    console.log('Exporting history:', csvContent);
    alert('Export functionality would be implemented here');
  };

  const getOutcomeColor = (outcome) => {
    return 'bg-green-100 text-green-800';
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Access History</h1>
          <p className="text-muted-foreground">
            Complete history of emergency patient data access
          </p>
        </div>
        <Button onClick={exportHistory} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Total Access</p>
                <p className="text-2xl font-bold">{stats.totalAccess}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium">This Month</p>
                <p className="text-2xl font-bold">{stats.thisMonth}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm font-medium">Avg Response</p>
                <p className="text-2xl font-bold">{stats.avgResponseTime}m</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm font-medium">Emergency Types</p>
                <p className="text-2xl font-bold">{Object.keys(stats.emergencyTypes).length || 1}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by patient name or access reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full lg:w-[200px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Access Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="qr-access">QR Access</SelectItem>
            <SelectItem value="emergency-access">Emergency Access</SelectItem>
          </SelectContent>
        </Select>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full lg:w-[200px]">
              <CalendarIcon className="mr-2 h-4 w-4" />
              Date Range
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={setDateRange}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Emergency Access Records</CardTitle>
          <CardDescription>
            Detailed history of all emergency patient data access
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredHistory.length > 0 ? (
            <div className="space-y-4">
              {filteredHistory.map((record) => (
                <div key={record.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold">{record.patientName}</h3>
                        <Badge variant="outline">Emergency Access</Badge>
                        <Badge className={getOutcomeColor('completed')}>
                          Completed
                        </Badge>
                      </div>
                      <p className="text-sm font-medium text-red-600">Emergency QR code access</p>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <p>{new Date(record.accessTime).toLocaleDateString()}</p>
                      <p>{new Date(record.accessTime).toLocaleTimeString()}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-3">
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span>{record.accessReason || 'Emergency access'}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span>Response: Immediate</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span>Duration: {record.duration || 'N/A'}</span>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <p className="text-sm font-medium mb-1">Critical Information Accessed:</p>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-xs">
                        Emergency Medical Records
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Emergency Contact Information
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Patient Demographics
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Access Method: QR Code Scan</span>
                    <span>Responder: {user?.profile?.firstName} {user?.profile?.lastName}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No records found</h3>
              <p className="text-muted-foreground">
                {searchTerm || typeFilter !== 'all' || dateRange.from 
                  ? 'Try adjusting your search criteria'
                  : 'No emergency access history available'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}