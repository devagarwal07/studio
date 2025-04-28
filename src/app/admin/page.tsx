
'use client'; // This component needs state for handling updates and auth

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation'; // Import useRouter for redirection
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { PointRequestList } from "@/components/point-request-list";
import { Skeleton } from "@/components/ui/skeleton";
import type { Member, PointRequest } from '@/types';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/context/auth-context'; // Import useAuth
import { toast } from '@/hooks/use-toast'; // Import toast

// Mock function to get initial data - replace with actual data fetching
// TODO: Add proper security checks - ensure only admins can fetch this data
async function getAdminData(userId: string | undefined): Promise<{ members: Member[], requests: PointRequest[] }> {
   console.log("Attempting to fetch admin data for user:", userId);
   if (!userId) throw new Error("Authentication required"); // Basic check

   // !! IMPORTANT: Add server-side validation here to ensure the user `userId` IS an admin !!
   // This might involve checking a custom claim in Firebase Auth or querying a 'roles' collection.
   // Without this, any logged-in user could potentially call this mock.
   // Example (conceptual):
   // const isAdmin = await checkUserAdminRole(userId);
   // if (!isAdmin) throw new Error("Unauthorized: Admin role required");

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1200));

  // In a real app, fetch from your database/API
  const members: Member[] = [
    { id: '1', name: 'Alice', points: 150 },
    { id: '2', name: 'Bob', points: 120 },
    { id: '3', name: 'Charlie', points: 95 },
    { id: '4', name: 'Diana', points: 180 },
  ];
  const requests: PointRequest[] = [
    { id: 'req1', memberId: '2', memberName: 'Bob', description: 'Completed tutorial', requestedAt: new Date(Date.now() - 3600000), status: 'pending', points: 10 },
    { id: 'req2', memberId: '1', memberName: 'Alice', description: 'Helped new member', requestedAt: new Date(Date.now() - 86400000), status: 'pending', points: 25 },
    { id: 'req3', memberId: '3', memberName: 'Charlie', description: 'Fixed a bug', requestedAt: new Date(Date.now() - 172800000), status: 'approved', points: 50 },
     { id: 'req4', memberId: '1', memberName: 'Alice', description: 'Submitted feedback', requestedAt: new Date(Date.now() - 600000), status: 'rejected', points: 5 },
  ];
  return { members, requests };
}


// Separate component for Logout Button logic
function LogoutButton() {
  const { signOut } = useAuth();
   const [isLoggingOut, setIsLoggingOut] = useState(false);

   const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await signOut();
            toast({ title: "Logged Out Successfully" });
            // Redirect handled by AuthProvider
        } catch (error) {
            console.error("Logout failed:", error);
            toast({ title: "Logout Failed", description: "Please try again.", variant: "destructive" });
            setIsLoggingOut(false);
        }
    };

  return (
     <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout" disabled={isLoggingOut}>
        {isLoggingOut ? <Skeleton className="h-5 w-5 rounded-full animate-spin" /> : <LogOut className="h-5 w-5" />}
     </Button>
  );
}


export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth(); // Get user and loading state
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [requests, setRequests] = useState<PointRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null); // null = checking, false = not admin, true = admin

  useEffect(() => {
    // Client-side authorization check (basic example)
    // IMPORTANT: This is NOT secure on its own. Real security requires server-side checks.
    // Use Firebase custom claims or a database role check for proper authorization.
    if (!authLoading) { // Only run after auth state is determined
        if (!user) {
             // Handled by AuthProvider, but good failsafe
             router.push('/auth/login');
             setIsAuthorized(false);
        } else {
            // --- Replace with actual admin check ---
            // Example: Check custom claim (requires backend setup)
            // user.getIdTokenResult().then((idTokenResult) => {
            //   if (idTokenResult.claims.admin) {
            //     setIsAuthorized(true);
            //   } else {
            //     toast({ title: "Access Denied", description: "You do not have permission to view this page.", variant: "destructive" });
            //     router.push('/member'); // Redirect non-admins
            //     setIsAuthorized(false);
            //   }
            // }).catch(error => {
            //      console.error("Error fetching token results:", error);
            //      toast({ title: "Authorization Error", description: "Could not verify permissions.", variant: "destructive" });
            //      router.push('/member');
            //      setIsAuthorized(false);
            // });

            // --- Mock Admin Check (REMOVE IN PRODUCTION) ---
            // For demonstration, assume a specific email is the admin
            if (user.email === 'admin@example.com') { // !!! REPLACE THIS CHECK !!!
                 setIsAuthorized(true);
            } else {
                toast({ title: "Access Denied", description: "You do not have permission to view this page.", variant: "destructive" });
                router.push('/member'); // Redirect non-admins
                setIsAuthorized(false);
            }
             // --- End Mock Admin Check ---
        }
    }
  }, [user, authLoading, router]);


  useEffect(() => {
    // Fetch data only if authorized
    async function loadData() {
       if (isAuthorized === true && user) {
           setIsLoading(true);
            try {
                const data = await getAdminData(user.uid); // Pass user ID
                setMembers(data.members);
                setRequests(data.requests);
            } catch (error: any) {
                 console.error("Failed to load admin data:", error);
                 toast({ title: "Error Loading Data", description: error.message || "Could not fetch admin data.", variant: "destructive"});
                 // Handle error - maybe clear data or show error message
                 setMembers([]);
                 setRequests([]);
            } finally {
                setIsLoading(false);
            }
       } else if (isAuthorized === false) {
            // If determined not authorized, ensure loading is false
            setIsLoading(false);
       }
    }

    loadData();
  }, [isAuthorized, user]); // Depend on authorization status and user


  // Function to update request status locally after approval/rejection
  // TODO: Replace mock functions in PointRequestList with actual Firebase updates
  const handleUpdateRequest = (requestId: string, status: 'approved' | 'rejected') => {
    setRequests(prevRequests =>
      prevRequests.map(req =>
        req.id === requestId ? { ...req, status: status } : req
      )
    );
     // OPTIONAL: If approval affects points, update members list here too
     // TODO: This should reflect actual data update results
     if (status === 'approved') {
        const updatedRequest = requests.find(r => r.id === requestId);
        if (updatedRequest && updatedRequest.points) {
             setMembers(prevMembers => prevMembers.map(mem =>
                 mem.id === updatedRequest.memberId
                 ? { ...mem, points: mem.points + (updatedRequest.points ?? 0) }
                 : mem
             ));
        }
     }
  };


  const pendingRequests = requests.filter(req => req.status === 'pending');
  const processedRequests = requests.filter(req => req.status !== 'pending').sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime()); // Show newest first

   // Loading state for auth check or initial load
   if (authLoading || isAuthorized === null) {
      return <div className="container mx-auto p-4 md:p-8 min-h-screen flex justify-center items-center"><Skeleton className="h-16 w-16 rounded-full animate-spin" /></div>;
   }

   // If not authorized, show minimal content or nothing (already redirected ideally)
   if (!isAuthorized) {
      return <div className="container mx-auto p-4 md:p-8 min-h-screen"><p>Access Denied.</p></div>; // Or just null if redirection is reliable
   }


  // Render dashboard only if authorized
  return (
    <div className="container mx-auto p-4 md:p-8 min-h-screen">
       <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary">Admin Dashboard</h1>
        <LogoutButton />
       </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leaderboard Section */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Leaderboard</CardTitle>
              <CardDescription>Overview of all member points.</CardDescription>
            </CardHeader>
            <CardContent>
               <Suspense fallback={<Skeleton className="h-[200px] w-full rounded-md" />}>
                 {isLoading ? (
                     <Skeleton className="h-[200px] w-full rounded-md" />
                 ) : (
                    <LeaderboardTable members={members} />
                 )}
               </Suspense>
            </CardContent>
          </Card>
        </div>

        {/* Point Requests Section */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pending Point Requests</CardTitle>
              <CardDescription>Approve or reject requests.</CardDescription>
            </CardHeader>
            <CardContent>
               <Suspense fallback={<Skeleton className="h-[150px] w-full rounded-md" />}>
                 {isLoading ? (
                    <Skeleton className="h-[150px] w-full rounded-md" />
                 ) : (
                    <PointRequestList
                        requests={pendingRequests}
                        showActions={true}
                        onUpdateRequest={handleUpdateRequest}
                    />
                 )}
               </Suspense>
            </CardContent>
          </Card>

           <Card>
            <CardHeader>
              <CardTitle>Processed Requests</CardTitle>
              <CardDescription>History of approved/rejected requests.</CardDescription>
            </CardHeader>
            <CardContent>
               <Suspense fallback={<Skeleton className="h-[150px] w-full rounded-md" />}>
                 {isLoading ? (
                     <Skeleton className="h-[150px] w-full rounded-md" />
                 ) : (
                    <PointRequestList requests={processedRequests} showActions={false} />
                 )}
               </Suspense>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


// Removed metadata export as it's not allowed in "use client" components
// export const metadata = {
//   title: "Admin Dashboard | Leaderboard Lite",
//   description: "Manage members, view the leaderboard, and process point requests.",
// };
