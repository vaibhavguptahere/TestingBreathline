'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export function PatientSettingsForm({ user }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
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
  });

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const response = await fetch('/api/auth/patient/profile', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProfileData({
          firstName: data.profile?.firstName || '',
          lastName: data.profile?.lastName || '',
          phone: data.profile?.phone || '',
          dateOfBirth: data.profile?.dateOfBirth ? new Date(data.profile.dateOfBirth).toISOString().split('T')[0] : '',
          address: data.profile?.address || '',
          emergencyContact: {
            name: data.profile?.emergencyContact?.name || '',
            phone: data.profile?.emergencyContact?.phone || '',
            relationship: data.profile?.emergencyContact?.relationship || '',
          },
        });

        if (data.profile?.settings) {
          setSettings(data.profile.settings);
        }
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
      toast.error('Failed to load profile data');
    } finally {
      setIsFetching(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('emergencyContact.')) {
      const field = name.split('.')[1];
      setProfileData((prev) => ({
        ...prev,
        emergencyContact: {
          ...prev.emergencyContact,
          [field]: value,
        },
      }));
    } else {
      setProfileData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSettingChange = (key) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/patient/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save profile');
      }

      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/patient/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save settings');
      }

      toast.success('Settings updated successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Tabs defaultValue="profile" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="preferences">Preferences</TabsTrigger>
      </TabsList>

      <TabsContent value="profile">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Update your personal information and contact details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={profileData.firstName}
                      onChange={handleProfileChange}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={profileData.lastName}
                      onChange={handleProfileChange}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={profileData.phone}
                      onChange={handleProfileChange}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      name="dateOfBirth"
                      type="date"
                      value={profileData.dateOfBirth}
                      onChange={handleProfileChange}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    name="address"
                    value={profileData.address}
                    onChange={handleProfileChange}
                    disabled={isLoading}
                    placeholder="Street address, city, state, zip"
                  />
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Emergency Contact</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContactName">Contact Name</Label>
                    <Input
                      id="emergencyContactName"
                      name="emergencyContact.name"
                      value={profileData.emergencyContact.name}
                      onChange={handleProfileChange}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="emergencyContactPhone">Contact Phone</Label>
                      <Input
                        id="emergencyContactPhone"
                        name="emergencyContact.phone"
                        type="tel"
                        value={profileData.emergencyContact.phone}
                        onChange={handleProfileChange}
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emergencyContactRelationship">Relationship</Label>
                      <Input
                        id="emergencyContactRelationship"
                        name="emergencyContact.relationship"
                        value={profileData.emergencyContact.relationship}
                        onChange={handleProfileChange}
                        disabled={isLoading}
                        placeholder="e.g., Spouse, Parent"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Profile'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="preferences">
        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>
              Manage how you receive notifications and alerts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Receive email updates about your records and activities
                    </p>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={() => handleSettingChange('emailNotifications')}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <p className="font-medium">SMS Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Receive SMS alerts for important events
                    </p>
                  </div>
                  <Switch
                    checked={settings.smsNotifications}
                    onCheckedChange={() => handleSettingChange('smsNotifications')}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <p className="font-medium">Emergency Alerts</p>
                    <p className="text-sm text-muted-foreground">
                      Critical emergency access notifications
                    </p>
                  </div>
                  <Switch
                    checked={settings.emergencyAlerts}
                    onCheckedChange={() => handleSettingChange('emergencyAlerts')}
                  />
                </div>
              </div>

              <Button
                onClick={handleSaveSettings}
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Preferences'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
