
"use client";

import type React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import Link from 'next/link'; // Import Link for signup
import { Separator } from '@/components/ui/separator'; // Import Separator

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "Login Successful",
        description: "Redirecting to dashboard...",
      });
      // Redirection is handled by AuthProvider's onAuthStateChanged listener
      // router.push('/member'); // Or '/admin' based on logic within AuthProvider or subsequent check
    } catch (error: any) {
      console.error("Login failed:", error);
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast({
        title: "Login Successful",
        description: "Logged in with Google.",
      });
       // Redirection is handled by AuthProvider's onAuthStateChanged listener
    } catch (error: any) {
      console.error("Google Sign-In failed:", error);
      toast({
        title: "Google Sign-In Failed",
        description: error.message || "Could not sign in with Google. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };


  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>Enter your email below to login to your account</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading || isGoogleLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading || isGoogleLoading}
               />
            </div>
             <Button type="submit" className="w-full mt-2" disabled={isLoading || isGoogleLoading}>
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </CardContent>
        </form>
         <Separator className="my-4" />
          <CardContent>
             <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading || isGoogleLoading}>
               {isGoogleLoading ? "Signing in..." : (
                 <>
                   <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48px" height="48px"><path fill="#EA4335" d="M24 9.5c3.9 0 6.8 1.7 8.4 3.2l6.3-6.3C34.9 2.8 30 .5 24 .5 14.9.5 7.7 6.4 4.9 14.5l7.4 5.8C13.8 14.3 18.5 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.6H24v8.8h12.7c-.6 2.9-2.3 5.4-4.9 7.1l7.4 5.8C42.9 37.9 46.5 31.7 46.5 24.5z"/><path fill="#FBBC05" d="M12.3 20.3c-.5-1.5-.7-3.1-.7-4.8s.3-3.3.7-4.8l-7.4-5.8C2.8 9.1 1.5 13.9 1.5 19c0 5.1 1.3 9.9 3.7 14.2l7.1-5.9z"/><path fill="#34A853" d="M24 47.5c5.9 0 10.8-1.9 14.4-5.2l-7.4-5.8c-2 1.4-4.5 2.2-7 2.2-5.5 0-10.2-3.8-11.8-8.9l-7.4 5.8C7.7 41.6 14.9 47.5 24 47.5z"/><path fill="none" d="M0 0h48v48H0z"/></svg>
                    Login with Google
                 </>
               )}
             </Button>
          </CardContent>
        <CardFooter className="flex flex-col items-center space-y-2">
           <p className="text-sm text-muted-foreground">
             Don't have an account?{' '}
             <Link href="/auth/signup" className="underline hover:text-primary">
               Sign up
             </Link>
           </p>
        </CardFooter>
      </Card>
    </div>
  );
}

export const metadata = {
  title: "Login | Leaderboard Lite",
  description: "Login to your Leaderboard Lite account.",
};
