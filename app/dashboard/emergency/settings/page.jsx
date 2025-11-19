'use client';

import { useAuth } from '@/context/AuthContext';
import { EmergencySettingsForm } from '@/components/emergency-settings-form';

export default function EmergencySettingsPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your professional profile and notification preferences
        </p>
      </div>

      <EmergencySettingsForm user={user} />
    </div>
  );
}
