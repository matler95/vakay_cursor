// src/app/(app)/dashboard/profile/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/database.types';
import { EditDisplayNameModal } from './_components/EditDisplayNameModal';
import { EditPasswordModal } from './_components/EditPasswordModal';
import { DeleteAccountModal } from './_components/DeleteAccountModal';
import { 
  StandardPageLayout, 
  PageHeader, 
  ContentSection 
} from '@/components/ui';

export default async function ProfilePage() {
    const supabase = createServerComponentClient<Database>({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch current profile to get full_name
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user?.id || '')
      .single();

    return (
        <StandardPageLayout maxWidth="lg" background="gray">
            <PageHeader
                title="Your Profile"
                description="Manage your account settings and preferences"
            />
            
            <ContentSection>
                <div className="space-y-4">
                  {/* Email section */}
                  <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs uppercase tracking-wide text-gray-500">Email</div>
                        <div className="mt-1 text-gray-900 font-medium">{user?.email}</div>
                      </div>
                    </div>
                  </div>

                  {/* Display name section */}
                  <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs uppercase tracking-wide text-gray-500">Display Name</div>
                        <div className="mt-1 text-gray-900 font-medium">{profile?.full_name || 'New User'}</div>
                      </div>
                      <EditDisplayNameModal currentName={profile?.full_name || ''} />
                    </div>
                  </div>

                  {/* Password section */}
                  <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs uppercase tracking-wide text-gray-500">Password</div>
                        <div className="mt-1 text-gray-900 font-medium">••••••••</div>
                      </div>
                      <EditPasswordModal />
                    </div>
                  </div>

                  {/* Simple delete account button */}
                  <div className="flex justify-end">
                    <DeleteAccountModal />
                  </div>
                </div>
            </ContentSection>
        </StandardPageLayout>
    );
}