
'use client'; // Needs client-side hook for redirection checking

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // User is logged in, redirect to appropriate dashboard
        // Basic example: redirect all logged-in users to /member
        // More complex logic (like checking admin role) should happen
        // either here (if client-side check is sufficient) or ideally
        // within the AuthProvider or dedicated middleware/route handlers.
        router.replace('/member'); // Or determine '/admin' based on role
      } else {
        // User is not logged in, redirect to login
        router.replace('/auth/login');
      }
    }
  }, [user, loading, router]);

  // Display a loading indicator while checking auth state
  return (
     <div className="flex items-center justify-center min-h-screen">
            <Skeleton className="h-12 w-12 rounded-full animate-spin" />
             <Skeleton className="h-4 w-[250px] ml-4" />
        </div>
  );
}
