// src/app/(app)/dashboard/profile/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { UpdatePasswordForm } from './_components/UpdatePasswordForm';
import { Database } from '@/types/database.types';

export default async function ProfilePage() {
    const supabase = createServerComponentClient<Database>({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    return (
        <div className="container mx-auto max-w-2xl">
            <h1 className="text-2xl font-bold text-gray-800">Your Profile</h1>
            <div className="mt-6 rounded-lg bg-white p-6 shadow-md">
                <p className="text-gray-600">Your email: <span className="font-semibold text-gray-900">{user?.email}</span></p>
                <div className="mt-6 border-t pt-6">
                    <h2 className="text-lg font-semibold">Set New Password</h2>
                    <p className="mt-1 text-sm text-gray-500">Create a password for quick access to your account.</p>
                    <div className="mt-4">
                      <UpdatePasswordForm />
                    </div>
                </div>
            </div>
        </div>
    );
}