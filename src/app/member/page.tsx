
'use client'; // This page now needs client-side hooks for auth state

import { Suspense, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { PointRequestForm } from "@/components/point-request-form";
import { Skeleton } from "@/components/ui/skeleton";
import type { Member } from '@/types';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/context/auth-context'; // Import useAuth
import { toast } from '@/hooks/use-toast'; // Import toast for feedback

// Mock function to get member data - replace with actual data fetching
// TODO: Replace with actual Firestore/API call using authenticated user ID
async function getMemberData(userId: string | undefined): Promise<{ members: Member[], currentUserPoints: number }> {
  console.log("Fetching member data for user:", userId); // Log the user ID being used
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Replace with actual data fetching from Firestore or your backend
  // Example: Fetch all members for the leaderboard
  // Example: Fetch specific user's points based on userId
  const members: Member[] = [
    { id: 'user1', name: 'Alice', points: 150 },
    { id: 'user2', name: 'Bob', points: 120 }, // Assume this might be the current user
    { id: 'user3', name: 'Charlie', points: 95 },
    { id: 'user4', name: 'Diana', points: 180 },
     // Add the current user if not already present, or update their points
     ...(userId && !['user1', 'user2', 'user3', 'user4'].includes(userId) ? [{ id: userId, name: 'You (New)', points: 0 }] : [])
  ];

   // Find the current user's data - NEEDS REAL IMPLEMENTATION
  const currentUserData = members.find(m => m.id === userId); // Use ID for matching
  const currentUserPoints = currentUserData?.points ?? 0; // Default to 0 if user not found (or new)

  // If the logged-in user was found, update their name to include "(You)"
  const displayMembers = members.map(m =>
     m.id === userId ? { ...m, name: `${m.name} (You)` } : m
  );


  return { members: displayMembers, currentUserPoints };
}

function LogoutButton() {
  const { signOut } = useAuth(); // Use signOut from context
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
        // No finally block needed as redirection should occur
    };

  return (
    <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout" disabled={isLoggingOut}>
      {isLoggingOut ? <Skeleton className="h-5 w-5 rounded-full animate-spin" /> : <LogOut className="h-5 w-5" />}
    </Button>
  );
}


export default function MemberDashboard() {
   const { user } = useAuth(); // Get user from context
   const [members, setMembers] = useState<Member[]>([]);
   const [currentUserPoints, setCurrentUserPoints] = useState<number>(0);
   const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            if (!user) {
                // Should be handled by AuthProvider redirection, but good failsafe
                 toast({ title: "Not Authenticated", description: "Redirecting to login...", variant: "destructive"});
                // router.push('/auth/login'); // Handled by AuthProvider
                return;
            }
             setIsLoading(true);
            try {
                // Pass the user's UID to fetch their specific data and the general leaderboard
                const data = await getMemberData(user.uid);
                setMembers(data.members);
                setCurrentUserPoints(data.currentUserPoints);
            } catch (error) {
                 console.error("Failed to load member data:", error);
                 toast({ title: "Error Loading Data", description: "Could not fetch dashboard data.", variant: "destructive"});
                 // Handle error state, maybe show an error message
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, [user]); // Re-run when user state changes


  return (
    <div className="container mx-auto p-4 md:p-8 min-h-screen">
       <header className="flex justify-between items-center mb-6">
         <h1 className="text-3xl font-bold text-primary">Member Dashboard</h1>
         <LogoutButton />
       </header>

       {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <div className="lg:col-span-2 space-y-4">
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-[200px] w-full rounded-md" />
             </div>
             <div className="lg:col-span-1 space-y-6">
                 <Skeleton className="h-[100px] w-full rounded-md" />
                 <Skeleton className="h-[250px] w-full rounded-md" />
             </div>
          </div>
       ) : (
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           {/* Leaderboard Section */}
           <div className="lg:col-span-2">
             <Card>
               <CardHeader>
                 <CardTitle>Leaderboard</CardTitle>
                 <CardDescription>See where you rank among members.</CardDescription>
               </CardHeader>
               <CardContent>
                 <Suspense fallback={<Skeleton className="h-[200px] w-full rounded-md" />}>
                   <LeaderboardTable members={members} />
                 </Suspense>
               </CardContent>
             </Card>
           </div>

           {/* Point Request Section */}
           <div className="lg:col-span-1 space-y-6">
              <Card>
               <CardHeader>
                 <CardTitle>Your Points</CardTitle>
               </CardHeader>
               <CardContent>
                 <p className="text-4xl font-bold">{currentUserPoints}</p>
                 {user?.displayName && <p className="text-sm text-muted-foreground mt-1">Welcome, {user.displayName}!</p>}
                 {user?.email && <p className="text-xs text-muted-foreground">{user.email}</p>}
               </CardContent>
             </Card>

             <Card>
               <CardHeader>
                 <CardTitle>Request Points</CardTitle>
                 <CardDescription>Submit a request for points earned.</CardDescription>
               </CardHeader>
               <CardContent>
                 {/* Pass necessary user info if the form needs it */}
                 <PointRequestForm userId={user?.uid} userName={user?.displayName || user?.email || 'User'} />
               </CardContent>
             </Card>
           </div>
         </div>
       )}
    </div>
  );
}

// Removed metadata export as it's not allowed in "use client" components
// export const metadata = {
//   title: "Member Dashboard | Leaderboard Lite",
//   description: "View your points, the leaderboard, and request more points.",
// };
