
'use client'; // This component needs state for handling updates

import { useState, useEffect, Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { PointRequestList } from "@/components/point-request-list";
import { Skeleton } from "@/components/ui/skeleton";
import type { Member, PointRequest } from '@/types';
import { Button } from '@/components/ui/button'; // Import Button
import Link from 'next/link'; // Import Link
import { LogOut } from 'lucide-react'; // Import LogOut icon

// Mock function to get initial data - replace with actual data fetching
async function getAdminData(): Promise<{ members: Member[], requests: PointRequest[] }> {
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
  const handleLogout = () => {
    // Clear the mock cookie
    document.cookie = 'userRole=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    // Redirect to login (client-side for immediate effect after cookie clear)
    window.location.href = '/auth/login';
  };

  return (
     <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
       <LogOut className="h-5 w-5" />
     </Button>
  );
}


export default function AdminDashboard() {
  const [members, setMembers] = useState<Member[]>([]);
  const [requests, setRequests] = useState<PointRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const data = await getAdminData();
      setMembers(data.members);
      setRequests(data.requests);
      setIsLoading(false);
    }
    loadData();
  }, []);

  // Function to update request status locally after approval/rejection
  const handleUpdateRequest = (requestId: string, status: 'approved' | 'rejected') => {
    setRequests(prevRequests =>
      prevRequests.map(req =>
        req.id === requestId ? { ...req, status: status } : req
      )
    );
     // OPTIONAL: If approval affects points, update members list here too
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

// Add metadata for the page
export const metadata = {
  title: "Admin Dashboard | Leaderboard Lite",
  description: "Manage members, view the leaderboard, and process point requests.",
};

