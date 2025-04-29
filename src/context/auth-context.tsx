
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
         // Reset local state immediately on sign out intent
         setUser(null);
         setMemberRole(null);
    } catch (error) {
      console.error("Error signing out: ", error);
       toast({ title: "Logout Failed", description: "Please try again.", variant: "destructive"});
    } finally {
      // Loading state will be managed by the subsequent onAuthStateChanged trigger
      // setLoading(false); // Avoid setting false here, let the listener handle it
    }
  }, [router]);


  useEffect(() => {
    console.log("AuthProvider effect running. Pathname:", pathname);
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log("onAuthStateChanged triggered. currentUser:", currentUser ? currentUser.uid : 'null');
      setLoading(true); // Start loading whenever auth state changes
      setUser(currentUser);
      setMemberRole(null); // Reset role while checking

      let currentRole: 'member' | 'admin' | null = null;
      let targetPath: string | null = null; // Variable to store the redirect target
      let needsRedirect = false;

      if (currentUser) {
        try {
            currentRole = await verifyUserRole(currentUser);
            console.log("Verified role:", currentRole);
            setMemberRole(currentRole); // Set the role state

            if (!currentRole) {
                // User authenticated but no Firestore profile/role found
                console.error(`User ${currentUser.uid} authenticated but no Firestore role found. Signing out.`);
                toast({ title: "Profile Error", description: "User profile data is missing or invalid. Please sign up again or contact support.", variant: "destructive" });
                await handleSignOut(); // Initiate sign out
                // Sign out will trigger another auth state change, which will redirect to login if needed
                // No need to set targetPath here, let the next cycle handle it
            } else {
                 // User logged in and role verified
                 const isAuthPage = pathname.startsWith('/auth');
                 const isHomePage = pathname === '/';
                 const isAdminPage = pathname.startsWith('/admin');
                 const isMemberPage = pathname.startsWith('/member');

                 if (isAuthPage || isHomePage) {
                    // Redirect from auth/home page to appropriate dashboard
                    targetPath = currentRole === 'admin' ? '/admin' : '/member';
                    console.log(`User logged in (role: ${currentRole}), redirecting from ${pathname} to ${targetPath}`);
                    needsRedirect = true;
                 } else if (isAdminPage && currentRole !== 'admin') {
                    // Non-admin on admin page
                    console.log("Role mismatch: Non-admin on admin page. Redirecting to member.");
                    toast({ title: "Access Denied", description: "Redirecting to your dashboard.", variant: "destructive" });
                    targetPath = '/member';
                    needsRedirect = true;
                 } else if (isMemberPage && currentRole === 'admin') {
                     // Admin on member page - allow
                     console.log("Admin on member page. Access allowed.");
                     needsRedirect = false;
                 } else if ((isAdminPage && currentRole === 'admin') || (isMemberPage && currentRole === 'member')){
                     // User on correct page
                     console.log("User logged in, on correct page. No redirect needed.");
                     needsRedirect = false;
                 } else {
                     // Catch-all for unexpected state (e.g., logged in but on a non-existent page)
                     // Default to redirecting to their dashboard
                     console.warn(`User logged in (role: ${currentRole}), on unexpected page ${pathname}. Redirecting.`);
                     targetPath = currentRole === 'admin' ? '/admin' : '/member';
                     needsRedirect = true;
                 }
            }
        } catch (error) {
            // Error during role verification
            console.error("Error during role verification:", error);
            toast({ title: "Authentication Error", description: "Could not verify user details.", variant: "destructive"});
            await handleSignOut(); // Initiate sign out
            // Let the next auth state change handle redirection
        }
      } else {
          // No user logged in
           const isAuthPage = pathname.startsWith('/auth');
           if (!isAuthPage) {
                console.log("User not logged in, redirecting to login.");
                targetPath = '/auth/login';
                needsRedirect = true;
           } else {
                console.log("User not logged in, on auth page. No redirect needed.");
                needsRedirect = false;
           }
      }

       // Perform redirection if needed
       if (needsRedirect && targetPath && targetPath !== pathname) {
            router.push(targetPath);
            // Setting loading false after push might be too early,
            // but let's try it to avoid prolonged loading screens.
            // If issues persist, remove this line and rely on the next effect run.
             setLoading(false);
       } else {
            // No redirect needed or already on the target path
            setLoading(false); // Stop loading
       }

      // Mark auth as initialized after the first check attempt (success or failure)
       if (!authInitialized) {
           setAuthInitialized(true);
           // If not redirecting, ensure loading stops after initialization
           if (!needsRedirect) {
               setLoading(false);
           }
       }

       console.log(`Auth state update complete. User: ${currentUser?.uid ?? 'null'}, Role: ${currentRole}, Loading: ${!needsRedirect && !authInitialized ? true : loading}, Redirecting: ${needsRedirect}, Target: ${targetPath}`);

    });

    // Cleanup subscription on unmount
    return () => {
         console.log("Auth listener unsubscribing.");
         unsubscribe();
    }
    // Include handleSignOut in dependency array
  }, [router, pathname, authInitialized, handleSignOut]); // Re-run when dependencies change

  // Show a loading state ONLY during the very initial Firebase auth check
  // OR if loading is explicitly true (e.g., during sign out)
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
