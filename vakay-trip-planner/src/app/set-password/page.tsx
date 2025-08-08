// src/app/set-password/page.tsx
import { UpdatePasswordForm } from '../(app)/dashboard/profile/_components/UpdatePasswordForm';

export default function SetPasswordPage() {
  return (
    <div className="container mx-auto max-w-md py-12">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold mb-2 text-gray-800">Set Your Password</h1>
        <p className="mb-6 text-gray-600">You must set a password before you can use the app. Please create a secure password below.</p>
        <UpdatePasswordForm />
      </div>
    </div>
  );
}
