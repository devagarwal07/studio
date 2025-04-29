
'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { PointRequestForm } from "@/components/point-request-form";
import { PointRequestList } from "@/components/point-request-list"; // Import list for history
import { Skeleton } from "@/components/ui/skeleton";
import type { Member, PointRequest } from '@/types';
import { Button } from '@/components/ui/button';
import { LogOut, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { toast } from '@/hooks/use-toast';
import { getAllMembers, getMemberById } from '@/services/memberService';
import { getMemberPointRequests } from '@/services/requestService'; // Import service to get member requests


// Separate LogoutButton component
function LogoutButton() {
  const { signOut } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

   const handleLogout = async () => {
        setIsLoggingOut(true);
        await signOut(); // AuthProvider handles state change and redirect
    };

  return (
    <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout" disabled={isLoggingOut}>
      {isLoggingOut ? <Skeleton className="h-5 w-5 rounded-full animate-spin border-t-primary border-2" /> : <LogOut className="h-5 w-5" />}
    </Button>
  );
}

export default function MemberDashboard() {
   const { user, loading: authLoading, isAdmin, memberRole } = useAuth();
   const [members, setMembers] = useState<Member[]>([]);
   const [currentUserData, setCurrentUserData] = useState<Member | null>(null);
   const [memberRequests, setMemberRequests] = useState<PointRequest[]>([]); // State for member's request history
   const [isLoadingData, setIsLoadingData] = useState(true);
   const [isRefreshing, setIsRefreshing] = useState(false);

   const fetchData = useCallback(async (userId: string | undefined) => {
      if (!userId) {
          setIsLoadingData(false); // Stop loading if no user ID
          return; // Should not happen if user is authenticated
      }
      setIsLoadingData(true); // Use main loading indicator
      setIsRefreshing(true); // Indicate refresh start
       try {
           const [allMembers, userData, userRequests] = await Promise.all([
               getAllMembers(),
               getMemberById(userId),
               getMemberPointRequests(userId) // Fetch specific member's requests
           ]);

           // Mark the current user in the leaderboard list
           const displayMembers = allMembers.map(m =>
               m.id === userId ? { ...m, name: `${m.name} (You)` } : m
           );

           setMembers(displayMembers);
           setCurrentUserData(userData);
           setMemberRequests(userRequests);
           console.log("Fetched member data:", userData);
           console.log("Fetched member requests:", userRequests);
           console.log("Fetched all members for leaderboard:", displayMembers);

       } catch (error: any) {
           console.error("Failed to load member data:", error);
           toast({ title: "Error Loading Data", description: "Could not fetch dashboard data.", variant: "destructive"});
           setMembers([]);
           setCurrentUserData(null);
           setMemberRequests([]);
       } finally {
           setIsLoadingData(false);
           setIsRefreshing(false); // Indicate refresh end
       }
   }, []); // No dependencies needed for the function itself, userId passed directly


    useEffect(() => {
        // Fetch data only when auth is resolved and user exists
        if (!authLoading && user) {
             console.log("Auth resolved, user exists. Fetching member data for:", user.uid);
             fetchData(user.uid);
        } else if (!authLoading && !user) {
             console.log("Auth resolved, no user. Skipping data fetch.");
             setIsLoadingData(false); // Stop loading if no user
        }
         // If authLoading is true, wait for it to resolve
    }, [authLoading, user, fetchData]);

    const handleRequestSuccess = () => {
        // Refetch data after a successful point request submission
         if(user) {
             fetchData(user.uid);
         }
    }

   // Display loading skeleton if initial auth check is happening OR if data is being fetched/refreshed
   if (authLoading || isLoadingData) {
       return (
          <div className="container mx-auto p-4 md:p-8 min-h-screen flex flex-col items-center pt-16">
              <Skeleton className="h-16 w-16 rounded-full animate-spin border-t-primary border-4 mb-4" />
               <p className="text-muted-foreground">Loading Member Dashboard...</p>
              {/* More detailed skeleton */}
               <div className="w-full max-w-6xl mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-4">
                     <Skeleton className="h-10 w-1/3" />
                     <Skeleton className="h-8 w-1/2" />
                     <Skeleton className="h-[300px] w-full rounded-md" />
                  </div>
                  <div className="lg:col-span-1 space-y-6">
                      <Skeleton className="h-[150px] w-full rounded-md" />
                      <Skeleton className="h-[250px] w-full rounded-md" />
                       <Skeleton className="h-[200px] w-full rounded-md" />
                  </div>
               </div>
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

    // If user data failed to load after loading is complete
     if (!currentUserData && !isLoadingData) {
         return (
             <div className="container mx-auto p-4 md:p-8 min-h-screen flex flex-col items-center justify-center">
                 <Card className="p-6 text-center">
                     <CardTitle className="text-destructive">Error</CardTitle>
                     <CardDescription>Could not load your profile data. Please try refreshing or contact support.</CardDescription>
                      <Button variant="outline" onClick={() => fetchData(user.uid)} disabled={isRefreshing} className="mt-4 mr-2">
                         {isRefreshing ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                         Retry
                     </Button>
                     <LogoutButton />
                 </Card>
             </div>
         );
     }


  return (
    <div className="container mx-auto p-4 md:p-8 min-h-screen">
       <header className="flex justify-between items-center mb-6">
         <h1 className="text-3xl font-bold text-primary">Member Dashboard</h1>
          <div className="flex items-center gap-2">
             {user && <span className="text-sm text-muted-foreground hidden md:inline">Welcome, {currentUserData?.name || user.displayName || user.email}</span>}
              <Button variant="ghost" size="icon" onClick={() => fetchData(user.uid)} disabled={isRefreshing} title="Refresh Data">
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
                 <CardDescription>See where you rank among members.</CardDescription>
               </CardHeader>
               <CardContent>
                 <Suspense fallback={<Skeleton className="h-[300px] w-full rounded-md" />}>
                   <LeaderboardTable members={members} />
                 </Suspense>
               </CardContent>
             </Card>
           </div>

           {/* Right Column: Points, Request Form, History */}
           <div className="lg:col-span-1 space-y-6">
              <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg">
               <CardHeader>
                 <CardTitle>Your Points</CardTitle>
               </CardHeader>
               <CardContent>
                  {/* Add perspective and animation */}
                  <div className="perspective-1000">
                    <p className="text-6xl font-bold text-primary animate-score-pop" style={{ textShadow: '2px 2px 4px hsla(var(--primary-foreground), 0.3)' }}>
                      {currentUserData?.points ?? 0}
                    </p>
                  </div>
                  {/* Display name/email subtly */}
                 {(currentUserData?.name || user?.displayName) && <p className="text-sm text-muted-foreground mt-2">Logged in as: {currentUserData?.name || user.displayName}</p>}
                 {/* {user?.email && <p className="text-xs text-muted-foreground">{user.email}</p>} */}
               </CardContent>
             </Card>

             <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg">
               <CardHeader>
                 <CardTitle>Request Points</CardTitle>
                 <CardDescription>Submit a request for points earned.</CardDescription>
               </CardHeader>
               <CardContent>
                 <PointRequestForm
                   userId={user?.uid}
                   userName={currentUserData?.name || user?.displayName || user?.email || 'User'}
                   onSuccess={handleRequestSuccess} // Add the callback here
                   />
               </CardContent>
             </Card>

              {/* Request History Card */}
               <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg">
                 <CardHeader>
                   <CardTitle>Your Request History</CardTitle>
                   <CardDescription>Status of your past point requests.</CardDescription>
                 </CardHeader>
                 <CardContent>
                    <Suspense fallback={<Skeleton className="h-[150px] w-full rounded-md" />}>
                       <PointRequestList requests={memberRequests} showActions={false} />
                   </Suspense>
                 </CardContent>
               </Card>

           </div>
         </div>

        {/* Add CSS for animation */}
         <style jsx>{`
            @keyframes score-pop {
                0% { transform: scale(0.9) rotateX(10deg); opacity: 0.8; }
                50% { transform: scale(1.05) rotateX(-5deg); opacity: 1; }
                100% { transform: scale(1) rotateX(0deg); opacity: 1; }
            }
            .animate-score-pop {
                animation: score-pop 0.6s ease-out forwards;
                 transform-origin: center bottom;
            }
            .perspective-1000 {
                 perspective: 1000px;
            }
         `}</style>
    </div>
  );
}
