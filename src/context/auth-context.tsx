
'use client';

import type { User } from 'firebase/auth';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { auth } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { getMemberById } from '@/services/memberService'; // Import Firestore service

interface AuthContextProps {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isAdmin: boolean | null; // null = checking, false = not admin, true = admin
  memberRole: 'member' | 'admin' | null; // Store the role fetched from Firestore
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

// --- Role Verification Function ---
async function verifyUserRole(user: User | null): Promise<'member' | 'admin' | null> {
    if (!user) return null;
    try {
        const memberProfile = await getMemberById(user.uid);
        return memberProfile?.role ?? null; // Return the role from Firestore or null if profile doesn't exist
    } catch (error) {
        console.error("Error fetching user role from Firestore:", error);
        toast({ title: "Error", description: "Could not verify user role.", variant: "destructive"});
        return null; // Return null on error
    }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [memberRole, setMemberRole] = useState<'member' | 'admin' | null>(null);
  const [loading, setLoading] = useState(true); // Initialize as true
  const [authInitialized, setAuthInitialized] = useState(false); // Track initial auth check
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = useCallback(async () => {
    console.log("Attempting sign out...");
    setLoading(true); // Show loading during sign out
    try {
      await firebaseSignOut(auth);
      // Listener below will handle state updates (user=null, role=null) and redirect
       console.log("Sign out successful, auth state change should trigger redirect.");
        toast({ title: "Logged Out", description: "You have been logged out." });
         // Explicitly push to login, as sometimes the listener might have race conditions on fast signouts
         router.push('/auth/login');
    } catch (error) {
      console.error("Error signing out: ", error);
       toast({ title: "Logout Failed", description: "Please try again.", variant: "destructive"});
      setLoading(false); // Stop loading on error
    }
     // Loading is set to false by the onAuthStateChanged listener after state update
  }, [router]);


  useEffect(() => {
    console.log("AuthProvider effect running. Pathname:", pathname);
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log("onAuthStateChanged triggered. currentUser:", currentUser ? currentUser.uid : 'null');
      setLoading(true); // Set loading true whenever auth state might be changing
      setUser(currentUser);

      let currentRole: 'member' | 'admin' | null = null;
      if (currentUser) {
          currentRole = await verifyUserRole(currentUser);
          console.log("Verified role:", currentRole);
           setMemberRole(currentRole);
           // Handle cases where Firestore profile might be missing after auth creation
           if (!currentRole) {
               console.error(`User ${currentUser.uid} authenticated but no Firestore role found.`);
               toast({ title: "Profile Incomplete", description: "User profile data missing. Please contact support or try signing up again.", variant: "destructive" });
               await handleSignOut(); // Sign out the user if profile is invalid/missing
               setAuthInitialized(true);
               setLoading(false);
               return; // Stop further processing for this user
           }
      } else {
          console.log("No current user, setting role to null.");
          setMemberRole(null);
      }

      const isAuthPage = pathname.startsWith('/auth');
      const isAdminPage = pathname.startsWith('/admin');
      const isMemberPage = pathname.startsWith('/member');
       const isHomePage = pathname === '/';

      console.log(`Routing checks: isAuthPage=${isAuthPage}, isAdminPage=${isAdminPage}, isMemberPage=${isMemberPage}, isHomePage=${isHomePage}, currentUser=${!!currentUser}, currentRole=${currentRole}`);


       // --- Redirection Logic ---
        if (!currentUser) {
            // Not logged in
            if (!isAuthPage && !isHomePage /* Allow access to home page if needed */) {
                console.log("User not logged in, redirecting to login.");
                router.push('/auth/login');
            } else {
                console.log("User not logged in, but on auth/home page. No redirect needed.");
                 setLoading(false); // Stop loading if on allowed public page
            }
        } else {
            // Logged in
             if (!currentRole) {
                 // This case is handled above by signing out, but as a safeguard:
                 console.error("User logged in but role check failed. Forcing sign out.");
                 await handleSignOut();
             }
            else if (isAuthPage || isHomePage) {
                // Logged in, but on auth page or home page -> redirect to dashboard
                console.log(`User logged in (role: ${currentRole}), redirecting from auth/home page.`);
                if (currentRole === 'admin') {
                    router.push('/admin');
                } else {
                    router.push('/member');
                }
            } else {
                // Logged in and on a dashboard page -> verify correct dashboard
                if (isAdminPage && currentRole !== 'admin') {
                    console.log("Role mismatch: Non-admin on admin page. Redirecting to member.");
                    toast({ title: "Access Denied", description: "Redirecting to your dashboard.", variant: "destructive" });
                    router.push('/member');
                } else if (isMemberPage && currentRole !== 'member') {
                    // Allow admins to see member page, or redirect if needed
                    // console.log("Role mismatch: Admin on member page. Allowing access / Redirecting to admin.");
                     // toast({ title: "Redirecting", description: "Redirecting to admin dashboard.", variant: "default" });
                     // router.push('/admin'); // Uncomment to force admins to admin page
                     setLoading(false); // Allow access or stop loading if no redirect needed here
                } else {
                     console.log("User logged in, on correct page. No redirect needed.");
                     setLoading(false); // Correct page, stop loading
                }
            }
        }


      // Mark auth as initialized after the first check completes
        if (!authInitialized) {
            setAuthInitialized(true);
        }

      // Ensure loading is false if no redirection is needed or after navigation starts
      // Use a small timeout only if a redirect wasn't explicitly pushed immediately
      // to prevent hiding loader too early on fast networks/cached pages.
       if (loading) { // Check if loading is still true (meaning no immediate redirect pushed)
            setTimeout(() => {
                 console.log("Setting loading to false after timeout.");
                 setLoading(false);
             }, 100); // Adjust timeout if needed
       }


    });

    // Cleanup subscription on unmount
    return () => {
         console.log("Auth listener unsubscribing.");
         unsubscribe();
    }
    // Include handleSignOut in dependency array if needed, but it's memoized with useCallback
  }, [router, pathname, authInitialized, handleSignOut]); // Re-run when route changes or auth initializes

  // Show a loading state ONLY during the very initial Firebase auth check
  if (!authInitialized || loading) {
     console.log(`Showing loading screen: authInitialized=${authInitialized}, loading=${loading}`);
    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <Skeleton className="h-12 w-12 rounded-full animate-spin border-t-primary border-4" />
             <p className='ml-4 text-muted-foreground'>Initializing Authentication...</p>
        </div>
    ) ;
  }

   console.log("Rendering children, auth initialized and not loading.");
  return (
    <AuthContext.Provider value={{ user, loading, signOut: handleSignOut, isAdmin: memberRole === 'admin', memberRole }}>
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
