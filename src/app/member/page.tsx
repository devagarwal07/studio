
import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { PointRequestForm } from "@/components/point-request-form";
import { Skeleton } from "@/components/ui/skeleton";
import type { Member } from '@/types';
import { Button } from '@/components/ui/button'; // Import Button
import Link from 'next/link'; // Import Link
import { LogOut } from 'lucide-react'; // Import LogOut icon

// Mock function to get member data - replace with actual data fetching
async function getMemberData(): Promise<{ members: Member[], currentUserPoints: number }> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  // In a real app, fetch from your database/API
  const members: Member[] = [
    { id: '1', name: 'Alice', points: 150 },
    { id: '2', name: 'Bob (You)', points: 120 }, // Assuming this is the current user
    { id: '3', name: 'Charlie', points: 95 },
    { id: '4', name: 'Diana', points: 180 },
  ];
  const currentUserPoints = members.find(m => m.name === 'Bob (You)')?.points ?? 0;
  return { members, currentUserPoints };
}

function LogoutButton() {
  return (
    <form action="/auth/logout" method="post">
      <Button variant="ghost" size="icon" type="submit" title="Logout">
        <LogOut className="h-5 w-5" />
      </Button>
    </form>
  );
}


export default async function MemberDashboard() {
  // Fetch data in the Server Component
  const { members, currentUserPoints } = await getMemberData();

  return (
    <div className="container mx-auto p-4 md:p-8 min-h-screen">
       <header className="flex justify-between items-center mb-6">
         <h1 className="text-3xl font-bold text-primary">Member Dashboard</h1>
         <LogoutButton />
       </header>

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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Request Points</CardTitle>
              <CardDescription>Submit a request for points earned.</CardDescription>
            </CardHeader>
            <CardContent>
              {/* PointRequestForm is a Client Component */}
              <PointRequestForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Add metadata for the page
export const metadata = {
  title: "Member Dashboard | Leaderboard Lite",
  description: "View your points, the leaderboard, and request more points.",
};

