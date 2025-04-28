
'use client';

import type { User } from 'firebase/auth';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth } from '@/lib/firebase'; // Adjust the path as necessary
import { useRouter, usePathname } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton'; // For loading state

interface AuthContextProps {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);

       // Basic redirection logic (can be refined)
       const isAuthPage = pathname.startsWith('/auth');

       if (!currentUser && !isAuthPage) {
         // If not logged in and not on an auth page, redirect to login
         router.push('/auth/login');
       } else if (currentUser && isAuthPage) {
            // If logged in and on an auth page, redirect to a default dashboard (e.g., member)
            // More complex role-based redirection can be added here if needed
            router.push('/member'); // Adjust default redirect as needed
       }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [router, pathname]); // Add router and pathname to dependency array

   const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      // The onAuthStateChanged listener will handle setting user to null
      // and redirection logic will trigger.
      router.push('/auth/login'); // Force redirect after sign out
    } catch (error) {
      console.error("Error signing out: ", error);
      // Handle sign-out errors if necessary
    }
  };


  // Show a loading state while Firebase initializes
  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <Skeleton className="h-12 w-12 rounded-full" />
             <Skeleton className="h-4 w-[250px] ml-4" />
        </div>
    ) ; // Or a more sophisticated loading screen
  }


  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
