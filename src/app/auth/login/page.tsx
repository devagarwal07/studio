
"use client";

import type React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/hooks/use-toast";

// Mock login function - replace with actual auth logic
async function mockLogin(role: 'admin' | 'member'): Promise<boolean> {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
  // In a real app, you'd set a session token/cookie here upon successful login
  document.cookie = `userRole=${role}; path=/; max-age=3600`; // Expires in 1 hour
  return true;
}

export default function LoginPage() {
  const [role, setRole] = useState<'admin' | 'member'>('member');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    const success = await mockLogin(role);

    setIsLoading(false);

    if (success) {
      toast({
        title: "Login Successful",
        description: `Redirecting to ${role} dashboard...`,
      });
      // Redirect based on role
      router.push(role === 'admin' ? '/admin' : '/member');
      router.refresh(); // Ensure layout re-renders based on new cookie
    } else {
      toast({
        title: "Login Failed",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>Select your role to login.</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="grid gap-4">
            {/* Remove username/password for simplicity in this mock */}
            {/* <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="m@example.com" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required />
            </div> */}
            <RadioGroup defaultValue="member" onValueChange={(value: 'admin' | 'member') => setRole(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="member" id="r1" />
                <Label htmlFor="r1">Member</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="admin" id="r2" />
                <Label htmlFor="r2">Admin</Label>
              </div>
            </RadioGroup>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Logging in..." : `Login as ${role === 'admin' ? 'Admin' : 'Member'}`}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
