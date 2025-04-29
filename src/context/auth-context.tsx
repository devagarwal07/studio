
'use client';

import type { User } from 'firebase/auth';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth } from '@/lib/firebase'; // Adjust the path as necessary
import { useRouter, usePathname } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton'; // For loading state
import { toast } from '@/hooks/use-toast'; // Import toast

interface AuthContextProps {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isAdmin: boolean | null; // null = checking, false = not admin, true = admin
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

// --- !! IMPORTANT !! ---
// Replace this mock function with your actual server-side role verification logic.
// This could involve checking custom claims or querying a database.
// Never rely solely on client-side checks for authorization.
async function checkAdminRole(user: User | null): Promise<boolean> {
    if (!user) return false;
    // Example: Check custom claim (requires backend setup to set the claim)
    // try {
    //     const idTokenResult = await user.getIdTokenResult();
    //     return !!idTokenResult.claims.admin;
    // } catch (error) {
    //     console.error("Error checking admin claim:", error);
    //     return false;
    // }

    // --- Mock Admin Check (REMOVE IN PRODUCTION) ---
    // For demonstration, assume a specific email is the admin
    return user.email === 'admin@example.com'; // !!! REPLACE THIS CHECK !!!
    // --- End Mock Admin Check ---
}


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null); // Track admin status
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(true); // Start loading indicator during potential async checks/redirects

      const isAuthPage = pathname.startsWith('/auth');
      const intendedRole = sessionStorage.getItem('intendedRole');
       sessionStorage.removeItem('intendedRole'); // Clear intended role after reading

      let currentIsAdmin = false;
      if (currentUser) {
         currentIsAdmin = await checkAdminRole(currentUser);
         setIsAdmin(currentIsAdmin); // Store the verified admin status
      } else {
          setIsAdmin(false); // Not admin if not logged in
      }

      // Redirection Logic
      if (!currentUser) {
        // If user logs out or is not logged in
        if (!isAuthPage) {
            router.push('/auth/login'); // Redirect to login if not already on an auth page
        }
         setLoading(false); // Finished processing logout/unauthenticated state
      } else {
        // User is logged in
        if (isAuthPage) {
             // If logged in and on an auth page, redirect based on intended/verified role
             if (intendedRole === 'admin' && currentIsAdmin) {
                 router.push('/admin');
             } else if (intendedRole === 'admin' && !currentIsAdmin) {
                  toast({ title: "Access Denied", description: "You are not authorized as an admin.", variant: "destructive" });
                  await firebaseSignOut(auth); // Log out user if they tried to access admin without rights
                  router.push('/auth/login'); // Send back to login
             }
             else {
                 router.push('/member'); // Default to member dashboard
             }
        } else {
             // If logged in and NOT on an auth page, verify current location matches role
             const isOnAdminPage = pathname.startsWith('/admin');
             const isOnMemberPage = pathname.startsWith('/member');

             if (isOnAdminPage && !currentIsAdmin) {
                  toast({ title: "Access Denied", description: "Redirecting to member dashboard.", variant: "destructive" });
                  router.push('/member');
             } else if (isOnMemberPage && currentIsAdmin) {
                   // Optional: Admins could potentially access member page too, or redirect them
                  // console.log("Admin accessing member page.");
                   // router.push('/admin'); // Or force redirect admin to admin page
             }
             // If roles match current page, do nothing
              setLoading(false); // Finished processing logged-in state
        }
      }

      // Ensure loading is false if no redirection happened or after potential redirect push
      // Use a small timeout to allow Next.js router to potentially navigate before hiding loader
       setTimeout(() => setLoading(false), 50);

    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [router, pathname]); // Rerun effect when route changes

   const signOut = async () => {
    setLoading(true); // Show loading during sign out
    try {
      await firebaseSignOut(auth);
      // The onAuthStateChanged listener will handle setting user to null,
      // clearing admin status, and redirecting to login.
      setUser(null);
      setIsAdmin(false);
      // router.push('/auth/login'); // Listener handles redirection
    } catch (error) {
      console.error("Error signing out: ", error);
       toast({ title: "Logout Failed", description: "Please try again.", variant: "destructive"});
      setLoading(false); // Stop loading on error
    }
    // Loading is set to false by the onAuthStateChanged listener after state update
  };


  // Show a loading state while Firebase initializes or redirection occurs
  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <Skeleton className="h-12 w-12 rounded-full animate-spin" />
             <p className='ml-4 text-muted-foreground'>Loading authentication...</p>
        </div>
    ) ;
  }


  return (
    <AuthContext.Provider value={{ user, loading, signOut, isAdmin }}>
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
