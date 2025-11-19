'use client';

import { useAuth } from '@/context/AuthContext';
import { PatientSettingsForm } from '@/components/patient-settings-form';

export default function PatientSettingsPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your profile information and notification preferences
        </p>
      </div>

      <PatientSettingsForm user={user} />
    </div>
  );
}
