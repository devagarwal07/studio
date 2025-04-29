
'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/auth-context'; // Import useAuth to potentially access loading state if needed

export default function HomePage() {
   const { loading } = useAuth(); // Get loading state from context

   // No need for redirection logic here anymore, AuthProvider handles it.
   // We can just show a loading indicator if auth is still loading,
   // otherwise AuthProvider will have already redirected.

  // Display a loading indicator while checking auth state initially
  // or let AuthProvider handle the loading screen
   if (loading) {
       return (
         <div className="flex items-center justify-center min-h-screen bg-background">
                <Skeleton className="h-12 w-12 rounded-full animate-spin" />
                 <p className='ml-4 text-muted-foreground'>Initializing...</p>
            </div>
      );
   }

   // If not loading, AuthProvider should have redirected.
   // This return might not even be reached in most cases.
   // You could potentially show a generic message or a minimal layout here.
   return (
        <div className="flex items-center justify-center min-h-screen bg-background">
             {/* Optionally show something if needed, but usually redirect happens */}
             <p className="text-muted-foreground">Redirecting...</p>
        </div>
    );
}
