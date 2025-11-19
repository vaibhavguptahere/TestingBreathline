'use client';

import { useAuth } from '@/context/AuthContext';
import { DoctorSettingsForm } from '@/components/doctor-settings-form';

export default function DoctorSettingsPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your professional profile and notification preferences
        </p>
      </div>

      <DoctorSettingsForm user={user} />
    </div>
  );
}
