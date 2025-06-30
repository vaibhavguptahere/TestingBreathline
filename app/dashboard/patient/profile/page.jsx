'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Shield, 
  Bell,
  Save,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

export default function ProfileSettings() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    phone: '',
    address: '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: '',
    },
  });

  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    emergencyAlerts: true,
    dataSharing: false,
    twoFactorAuth: false,
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (user?.profile) {
      setProfile({
        firstName: user.profile.firstName || '',
        lastName: user.profile.lastName || '',
        dateOfBirth: user.profile.dateOfBirth || '',
        phone: user.profile.phone || '',
        address: user.profile.address || '',
        emergencyContact: {
          name: user.profile.emergencyContact?.name || '',
          phone: user.profile.emergencyContact?.phone || '',
          relationship: user.profile.emergencyContact?.relationship || '',
        },
      });
    }
  }, [user]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/patient/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
      });

      if (response.ok) {
        const data = await response.json();
        updateUser({ profile: data.profile });
        toast.success('Profile updated successfully');
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setLoading(true);
    try {
      // Simulate password change
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Password changed successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      toast.error('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsUpdate = async (setting, value) => {
    setSettings(prev => ({ ...prev, [setting]: value }));
    
    try {
      // Simulate settings update
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success('Settings updated');
    } catch (error) {
      toast.error('Failed to update settings');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profile Settings</h1>
        <p className="text-muted-foreground">
          Manage your account information and preferences
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5" />
              Personal Information
            </CardTitle>
            <CardDescription>
              Update your personal details and contact information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={profile.firstName}
                    onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={profile.lastName}
                    onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed. Contact support if needed.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={profile.dateOfBirth}
                  onChange={(e) => setProfile({ ...profile, dateOfBirth: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={profile.address}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  rows={3}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-semibold">Emergency Contact</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="emergencyName">Contact Name</Label>
                  <Input
                    id="emergencyName"
                    value={profile.emergencyContact.name}
                    onChange={(e) => setProfile({
                      ...profile,
                      emergencyContact: { ...profile.emergencyContact, name: e.target.value }
                    })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="emergencyPhone">Phone</Label>
                    <Input
                      id="emergencyPhone"
                      type="tel"
                      value={profile.emergencyContact.phone}
                      onChange={(e) => setProfile({
                        ...profile,
                        emergencyContact: { ...profile.emergencyContact, phone: e.target.value }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergencyRelationship">Relationship</Label>
                    <Input
                      id="emergencyRelationship"
                      value={profile.emergencyContact.relationship}
                      onChange={(e) => setProfile({
                        ...profile,
                        emergencyContact: { ...profile.emergencyContact, relationship: e.target.value }
                      })}
                      placeholder="e.g., Spouse, Parent"
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Update Profile
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Security & Privacy */}
        <div className="space-y-6">
          {/* Password Change */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-5 w-5" />
                Security
              </CardTitle>
              <CardDescription>
                Change your password and security settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    required
                  />
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Changing...
                    </>
                  ) : (
                    'Change Password'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="mr-2 h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>
                Manage your notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive updates via email</p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => handleSettingsUpdate('emailNotifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">SMS Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive text message alerts</p>
                </div>
                <Switch
                  checked={settings.smsNotifications}
                  onCheckedChange={(checked) => handleSettingsUpdate('smsNotifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Emergency Alerts</p>
                  <p className="text-sm text-muted-foreground">Critical emergency notifications</p>
                </div>
                <Switch
                  checked={settings.emergencyAlerts}
                  onCheckedChange={(checked) => handleSettingsUpdate('emergencyAlerts', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-muted-foreground">Add extra security to your account</p>
                </div>
                <Switch
                  checked={settings.twoFactorAuth}
                  onCheckedChange={(checked) => handleSettingsUpdate('twoFactorAuth', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Data Sharing</p>
                  <p className="text-sm text-muted-foreground">Allow anonymous data for research</p>
                </div>
                <Switch
                  checked={settings.dataSharing}
                  onCheckedChange={(checked) => handleSettingsUpdate('dataSharing', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Account Type:</span>
                <span className="capitalize">{user?.role}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-medium">Member Since:</span>
                <span>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-medium">Last Login:</span>
                <span>{user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'N/A'}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}