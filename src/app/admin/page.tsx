
'use client'; // This component needs state for handling updates and auth context

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation'; // Still useful for potential client-side actions if needed
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
// IMPORTANT: Add proper server-side security checks - ensure only verified admins can fetch this data
async function getAdminData(userId: string | undefined): Promise<{ members: Member[], requests: PointRequest[] }> {
   console.log("Attempting to fetch admin data for user:", userId);
   if (!userId) throw new Error("Authentication required");

   // !! IMPORTANT: Server-side validation should confirm the `userId` IS an admin !!
   // This is crucial even if AuthProvider restricts access, to protect the API endpoint itself.

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
            // toast({ title: "Logged Out Successfully" }); // Optional: Toast on successful logout
            // Redirect handled by AuthProvider
        } catch (error) {
            console.error("Logout failed:", error);
            toast({ title: "Logout Failed", description: "Please try again.", variant: "destructive" });
            setIsLoggingOut(false); // Re-enable button if logout fails
        }
         // Don't set isLoggingOut to false here, page should redirect or change state
    };

  return (
     <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout" disabled={isLoggingOut}>
        {isLoggingOut ? <Skeleton className="h-5 w-5 rounded-full animate-spin" /> : <LogOut className="h-5 w-5" />}
     </Button>
  );
}


export default function AdminDashboard() {
  const { user, loading: authLoading, isAdmin } = useAuth(); // Get user, loading state, and isAdmin status
  const router = useRouter(); // Keep router for potential future use
  const [members, setMembers] = useState<Member[]>([]);
  const [requests, setRequests] = useState<PointRequest[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true); // Renamed to avoid conflict with authLoading

  // Authorization is now primarily handled by AuthProvider redirecting non-admins away.
  // We can use the `isAdmin` state from context to decide whether to fetch/render data.

  useEffect(() => {
    // Fetch data only if the user is authenticated and verified as admin
    async function loadData() {
       // Check if auth check is done, user exists, and isAdmin is confirmed true
       if (!authLoading && user && isAdmin === true) {
           setIsLoadingData(true);
            try {
                const data = await getAdminData(user.uid); // Pass user ID
                setMembers(data.members);
                setRequests(data.requests);
            } catch (error: any) {
                 console.error("Failed to load admin data:", error);
                 toast({ title: "Error Loading Data", description: error.message || "Could not fetch admin data.", variant: "destructive"});
                 setMembers([]);
                 setRequests([]);
            } finally {
                setIsLoadingData(false);
            }
       } else if (!authLoading && (user === null || isAdmin === false)) {
            // If auth check is done but user is not admin or not logged in, ensure loading is false.
            // AuthProvider should have already redirected, but this is a safeguard.
            setIsLoadingData(false);
             if (isAdmin === false) {
                // Optionally show a message if somehow the user landed here without being admin
                // toast({ title: "Access Denied", description: "Redirecting...", variant: "destructive" });
             }
       }
    }

    loadData();
  }, [user, authLoading, isAdmin]); // Depend on user, authLoading, and isAdmin status


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

   // Show loading skeleton while auth is checking or if isAdmin is still null
   if (authLoading || isAdmin === null) {
      return (
        <div className="container mx-auto p-4 md:p-8 min-h-screen flex justify-center items-center">
             <Skeleton className="h-16 w-16 rounded-full animate-spin" />
        </div>
      );
   }

   // If AuthProvider confirmed user is NOT admin, show minimal content or null.
   // Ideally, AuthProvider redirects before this point.
   if (isAdmin === false) {
      return (
          <div className="container mx-auto p-4 md:p-8 min-h-screen">
             <p>Access Denied. You do not have permission to view this page.</p>
              {/* Optionally add a button to redirect to member page or logout */}
              <Button onClick={() => router.push('/member')} className="mt-4 mr-2">Go to Member Dashboard</Button>
              <LogoutButton />
          </div>
      );
   }


  // Render dashboard only if authenticated and confirmed as admin
  return (
    <div className="container mx-auto p-4 md:p-8 min-h-screen">
       <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary">Admin Dashboard</h1>
        {user && <span className="text-sm text-muted-foreground hidden md:inline">Welcome, {user.displayName || user.email}</span>}
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
                 {isLoadingData ? (
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
                 {isLoadingData ? (
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
                 {isLoadingData ? (
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
