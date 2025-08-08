// src/app/(app)/_components/LogoutButton.tsx
'use client';

import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button'; // Import the new Button

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh(); // Refreshes the page, the layout will then redirect
  };

  return (
    // Replace the old button with the new one
    <Button variant="outline" size="sm" onClick={handleLogout}>
      Logout
    </Button>
  );
}
