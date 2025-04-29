
'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { PointRequestList } from "@/components/point-request-list";
import { Skeleton } from "@/components/ui/skeleton";
import type { Member, PointRequest } from '@/types';
import { Button } from '@/components/ui/button';
import { LogOut, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { toast } from '@/hooks/use-toast';
import { getAllMembers } from '@/services/memberService';
import { getPointRequests, approvePointRequest, rejectPointRequest } from '@/services/requestService'; // Import request services

// Separate component for Logout Button logic
function LogoutButton() {
  const { signOut } = useAuth();
   const [isLoggingOut, setIsLoggingOut] = useState(false);

   const handleLogout = async () => {
        setIsLoggingOut(true);
        // signOut function now handles loading state and redirection via AuthProvider
        await signOut();
        // Don't set isLoggingOut to false, page state should change or redirect
    };

  return (
     <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout" disabled={isLoggingOut}>
        {isLoggingOut ? <Skeleton className="h-5 w-5 rounded-full animate-spin border-t-primary border-2" /> : <LogOut className="h-5 w-5" />}
     </Button>
  );
}

export default function AdminDashboard() {
  const { user, loading: authLoading, isAdmin, memberRole } = useAuth();
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [requests, setRequests] = useState<PointRequest[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
     console.log("Admin attempting to fetch data. isAdmin state:", isAdmin, "memberRole:", memberRole);
     if (isAdmin === false) {
          console.log("isAdmin is false, skipping data fetch.");
          setIsLoadingData(false); // Ensure loading stops if access is denied
          return; // Don't fetch if not admin
     }
      setIsRefreshing(true); // Indicate refresh start
      setIsLoadingData(true); // Also use main loading indicator
      try {
          // Fetch members and requests concurrently
          const [fetchedMembers, fetchedRequests] = await Promise.all([
              getAllMembers(),
              getPointRequests() // Fetch all requests initially
          ]);
          console.log("Fetched members:", fetchedMembers);
          console.log("Fetched requests:", fetchedRequests);
          setMembers(fetchedMembers);
          setRequests(fetchedRequests);
       } catch (error: any) {
           console.error("Failed to load admin data:", error);
           toast({ title: "Error Loading Data", description: error.message || "Could not fetch admin data.", variant: "destructive"});
           setMembers([]);
           setRequests([]);
       } finally {
           setIsLoadingData(false);
            setIsRefreshing(false); // Indicate refresh end
       }
  }, [isAdmin, memberRole]); // Depend on isAdmin status

  useEffect(() => {
    // Fetch data only when auth is resolved and user is confirmed admin
     if (!authLoading && isAdmin === true) {
          console.log("Auth resolved, user is admin. Initial data fetch.");
          fetchData();
     } else if (!authLoading && (user === null || isAdmin === false)) {
          console.log("Auth resolved, user not logged in or not admin. No data fetch.");
          setIsLoadingData(false); // Ensure loading indicator stops if access denied early
     }
      // If authLoading is true, we wait.
  }, [authLoading, isAdmin, user, fetchData]);


 // Handler for approving/rejecting requests - uses Firestore services
 const handleUpdateRequest = useCallback(async (requestId: string, newStatus: 'approved' | 'rejected') => {
     const requestToUpdate = requests.find(req => req.id === requestId);
     if (!requestToUpdate) {
         toast({ title: "Error", description: "Request not found.", variant: "destructive" });
         return;
     }

     try {
         if (newStatus === 'approved') {
             await approvePointRequest(requestToUpdate); // This handles both request status and member points
             toast({ title: "Request Approved", description: `${requestToUpdate.points} points awarded to ${requestToUpdate.memberName}.` });
         } else { // newStatus === 'rejected'
             await rejectPointRequest(requestId);
             toast({ title: "Request Rejected" });
         }
         // Refetch data to show updated state
         await fetchData();
     } catch (error: any) {
         console.error(`Failed to ${newStatus} request:`, error);
         toast({ title: "Action Failed", description: error.message || `Could not ${newStatus} the request.`, variant: "destructive" });
     }
     // No need for local state update, fetchData handles refresh
 }, [requests, fetchData]);


  const pendingRequests = requests.filter(req => req.status === 'pending');
  const processedRequests = requests.filter(req => req.status !== 'pending').sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime());

   // Display loading skeleton if initial auth check is happening OR if data is being fetched/refreshed
   if (authLoading || isLoadingData) {
       return (
         <div className="container mx-auto p-4 md:p-8 min-h-screen flex flex-col items-center pt-16">
              <Skeleton className="h-16 w-16 rounded-full animate-spin border-t-primary border-4 mb-4" />
               <p className="text-muted-foreground">Loading Admin Dashboard...</p>
              {/* More detailed skeleton */}
              <div className="w-full max-w-6xl mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-4">
                     <Skeleton className="h-10 w-1/3" />
                     <Skeleton className="h-8 w-1/2" />
                     <Skeleton className="h-[300px] w-full rounded-md" />
                  </div>
                  <div className="lg:col-span-1 space-y-6">
                      <Skeleton className="h-[200px] w-full rounded-md" />
                      <Skeleton className="h-[200px] w-full rounded-md" />
                  </div>
              </div>
         </div>
       );
   }

   // If AuthProvider confirmed user is NOT admin (isAdmin is explicitly false)
   // AuthProvider should redirect, but this is a backup display.
   if (isAdmin === false) {
      return (
          <div className="container mx-auto p-4 md:p-8 min-h-screen flex flex-col items-center justify-center">
             <Card className="p-6 text-center">
                 <CardTitle className="text-destructive">Access Denied</CardTitle>
                 <CardDescription>You do not have permission to view this page.</CardDescription>
                 <Button onClick={() => router.push('/member')} className="mt-4 mr-2">Go to Member Dashboard</Button>
                 <LogoutButton />
             </Card>
          </div>
      );
   }

    // If user is null after loading (shouldn't happen if AuthProvider works correctly)
    if (!user) {
        return (
            <div className="container mx-auto p-4 md:p-8 min-h-screen flex flex-col items-center justify-center">
                <p className="text-muted-foreground">User not found. Please log in.</p>
                 <Button onClick={() => router.push('/auth/login')} className="mt-4">Go to Login</Button>
            </div>
        );
    }

  // Render dashboard only if authenticated and confirmed as admin
  return (
    <div className="container mx-auto p-4 md:p-8 min-h-screen">
       <header className="flex justify-between items-center mb-6">
         <h1 className="text-3xl font-bold text-primary">Admin Dashboard</h1>
         <div className="flex items-center gap-2">
            {user && <span className="text-sm text-muted-foreground hidden md:inline">Welcome, {user.displayName || user.email}</span>}
             <Button variant="ghost" size="icon" onClick={fetchData} disabled={isRefreshing} title="Refresh Data">
                 {isRefreshing ? <RefreshCw className="h-5 w-5 animate-spin" /> : <RefreshCw className="h-5 w-5" />}
             </Button>
            <LogoutButton />
         </div>
       </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leaderboard Section */}
        <div className="lg:col-span-2">
          <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg overflow-hidden">
             <CardHeader>
                <CardTitle>Leaderboard</CardTitle>
                <CardDescription>Overview of all member points.</CardDescription>
             </CardHeader>
             <CardContent>
                <Suspense fallback={<Skeleton className="h-[300px] w-full rounded-md" />}>
                    {/* No extra loading check needed here, parent handles isLoadingData */}
                    <LeaderboardTable members={members} />
                </Suspense>
             </CardContent>
          </Card>
        </div>

        {/* Point Requests Section */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg">
             <CardHeader>
                <CardTitle>Pending Point Requests</CardTitle>
                <CardDescription>Approve or reject requests.</CardDescription>
             </CardHeader>
             <CardContent>
                <Suspense fallback={<Skeleton className="h-[200px] w-full rounded-md" />}>
                    <PointRequestList
                        requests={pendingRequests}
                        showActions={true}
                        onUpdateRequest={handleUpdateRequest} // Pass the Firestore update handler
                    />
                </Suspense>
             </CardContent>
          </Card>

           <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg">
             <CardHeader>
                <CardTitle>Processed Requests</CardTitle>
                <CardDescription>History of approved/rejected requests.</CardDescription>
             </CardHeader>
             <CardContent>
                <Suspense fallback={<Skeleton className="h-[200px] w-full rounded-md" />}>
                   <PointRequestList requests={processedRequests} showActions={false} />
                </Suspense>
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
