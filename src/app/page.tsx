
'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/auth-context';

export default function HomePage() {
   const { loading } = useAuth(); // Get loading state from context

   // AuthProvider handles the actual loading screen and redirection.
   // This component acts as a placeholder while that logic runs.
   // If AuthProvider is still loading, its loading screen will be shown.
   // If AuthProvider finished loading and determined a redirect, it will happen.
   // This component might briefly show if there's a tiny delay.

  return (
        <div className="flex items-center justify-center min-h-screen bg-background">
             {/* Basic indicator, might not be seen if redirection is fast */}
             <Skeleton className="h-12 w-12 rounded-full animate-spin" />
             <p className='ml-4 text-muted-foreground'>Loading...</p>
        </div>
    );
}
