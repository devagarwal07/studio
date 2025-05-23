
"use client";

import type React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation'; // Keep useRouter for potential future use if needed
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { auth } from '@/lib/firebase';
import { createUserWithEmailAndPassword, updateProfile, fetchSignInMethodsForEmail } from 'firebase/auth';
import Link from 'next/link';
import { createOrUpdateMember } from '@/services/memberService'; // Import Firestore service
import type { Member } from '@/types';

// Simple email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Basic password validation (example: at least 6 characters)
const passwordRegex = /^.{6,}$/;

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // const router = useRouter(); // Keep for potential future use, but not needed for redirect now

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();

    // --- Input Validation ---
    if (!displayName.trim()) {
      toast({ title: "Display name is required", variant: "destructive" });
      return;
    }
    if (!emailRegex.test(email)) {
      toast({ title: "Invalid email format", variant: "destructive" });
      return;
    }
     if (!passwordRegex.test(password)) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    // --- End Input Validation ---

    setIsLoading(true);

    try {
        // 1. Check if email already exists
        const methods = await fetchSignInMethodsForEmail(auth, email);
        if (methods.length > 0) {
            toast({
                title: "Email Already Exists",
                description: "This email is already registered. Please login or use a different email.",
                variant: "destructive",
            });
            setIsLoading(false);
            return;
        }

        // 2. Create user in Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        if (user) {
            // 3. Update Firebase Auth profile (display name)
            await updateProfile(user, { displayName: displayName.trim() });

            // 4. Create member document in Firestore with 'member' role
            const memberData: Omit<Member, 'id'> = {
                name: displayName.trim(),
                email: user.email!, // Email is guaranteed non-null after successful signup
                points: 0, // Initial points
                role: 'member', // All signups through this page are members
            };
            await createOrUpdateMember(memberData, user.uid);

            toast({
                title: "Signup Successful",
                description: "Account created. Redirecting...",
            });

            // NO LONGER NEEDED: AuthProvider will handle redirection based on role
            // The onAuthStateChanged listener in AuthProvider will detect the new user
            // and redirect them to the /member dashboard.

        } else {
             throw new Error("User creation failed unexpectedly.");
        }

    } catch (error: any) {
      console.error("Signup failed:", error);
      // Provide more specific error messages
      let description = "Could not create account. Please try again.";
      if (error.code === 'auth/email-already-in-use') {
        description = "This email is already registered. Please login.";
      } else if (error.code === 'auth/weak-password') {
        description = "Password is too weak. Please choose a stronger password.";
      } else if (error.message) {
          description = error.message;
      }
      toast({
        title: "Signup Failed",
        description: description,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Sign Up as Member</CardTitle>
          <CardDescription>Create your Leaderboard Lite member account.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSignup}>
          <CardContent className="grid gap-4">
            {/* Display Name */}
            <div className="grid gap-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                type="text"
                placeholder="Your Name"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={isLoading}
              />
            </div>
            {/* Email */}
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            {/* Password */}
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="******"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
               />
            </div>
            {/* Confirm Password */}
             <div className="grid gap-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="******"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
               />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-center space-y-2">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating Account..." : "Sign Up as Member"}
            </Button>
             <p className="text-sm text-muted-foreground">
               Already have an account?{' '}
               <Link href="/auth/login" className="underline hover:text-primary">
                 Login
               </Link>
             </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
