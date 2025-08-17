// src/app/set-password/page.tsx
'use client';
import { useActionState, useState } from 'react';
import { completeAccountSetup } from '../(app)/dashboard/profile/actions';
import { Eye, EyeOff } from 'lucide-react';
import { 
  StandardPageLayout, 
  PageHeader, 
  ContentSection,
  StandardInput
} from '@/components/ui';

export default function SetPasswordPage() {
  const [state, formAction] = useActionState(completeAccountSetup, { message: '' });
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const handleSubmit = async (formData: FormData) => {
    formData.set('full_name', fullName);
    formData.set('password', password);
    formData.set('confirmPassword', confirm);
    await formAction(formData);
  };

  return (
    <StandardPageLayout maxWidth="sm" background="gray">
      <PageHeader
        title="Complete Your Account"
        description="Set a display name and create a password to start using the app."
      />
      
      <ContentSection>
        <form action={handleSubmit} className="space-y-6">
          <StandardInput
            label="Display Name"
            name="full_name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            placeholder="e.g., Alex Johnson"
          />
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showNew ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="block w-full rounded-md border-gray-300 shadow-sm pr-10 focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Enter password"
              />
              <button 
                type="button" 
                aria-label={showNew ? 'Hide password' : 'Show password'} 
                onClick={() => setShowNew((v) => !v)} 
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showNew ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">Min 8 chars, at least one uppercase and one number or special character.</p>
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                className="block w-full rounded-md border-gray-300 shadow-sm pr-10 focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Confirm password"
              />
              <button 
                type="button" 
                aria-label={showConfirm ? 'Hide password' : 'Show password'} 
                onClick={() => setShowConfirm((v) => !v)} 
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showConfirm ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
              </button>
            </div>
          </div>
          
          {state.message && (
            <p className="text-sm text-gray-600">{state.message}</p>
          )}
          
          <div className="flex justify-end">
            <button 
              type="submit" 
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
            >
              Save and Continue
            </button>
          </div>
        </form>
      </ContentSection>
    </StandardPageLayout>
  );
}
