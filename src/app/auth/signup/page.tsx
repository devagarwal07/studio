
"use client";

import type React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"; // Import RadioGroup
import { toast } from "@/hooks/use-toast";
import { auth } from '@/lib/firebase';
import { createUserWithEmailAndPassword, updateProfile, fetchSignInMethodsForEmail } from 'firebase/auth';
import Link from 'next/link';
import { createOrUpdateMember, getMemberById } from '@/services/memberService'; // Import Firestore service
import type { Member } from '@/types';

type Role = 'member' | 'admin';

// Simple email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Basic password validation (example: at least 6 characters)
const passwordRegex = /^.{6,}$/;

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role>('member'); // Default to member
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

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
    // VERY IMPORTANT: Admin role signup should ideally be restricted.
    // For this example, we'll allow it but add checks. In a real app,
    // only existing admins should be able to create new admins.
    if (selectedRole === 'admin') {
        // Optional: Add a simple check or require an admin code
        console.warn("Attempting to sign up as admin. This should be restricted in production.");
        // Example: Prompt for an admin secret code if desired
        // const adminCode = prompt("Enter admin secret code:");
        // if (adminCode !== "SUPER_SECRET_CODE") { // Replace with actual check
        //     toast({ title: "Invalid Admin Code", variant: "destructive" });
        //     return;
        // }
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

            // 4. Create member document in Firestore
            const memberData: Omit<Member, 'id'> = {
                name: displayName.trim(),
                email: user.email!, // Email is guaranteed non-null after successful signup
                points: 0, // Initial points
                role: selectedRole, // Store the selected role
            };
            await createOrUpdateMember(memberData, user.uid);

            toast({
                title: "Signup Successful",
                description: "Account created. Redirecting...",
            });
            // AuthProvider will handle redirection based on role after login state changes.
            // Explicitly set intended role for immediate redirect attempt after signup completes.
            sessionStorage.setItem('intendedRole', selectedRole);
            // The onAuthStateChanged listener in AuthProvider will pick this up.
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
          <CardTitle className="text-2xl">Sign Up</CardTitle>
          <CardDescription>Create your Leaderboard Lite account.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSignup}>
          <CardContent className="grid gap-4">
             {/* Role Selection */}
            <div className="grid gap-2">
                <Label>Sign Up As</Label>
                <RadioGroup
                    defaultValue="member"
                    value={selectedRole}
                    onValueChange={(value: Role) => setSelectedRole(value)}
                    className="flex space-x-4"
                    disabled={isLoading}
                >
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="member" id="r-member" />
                        <Label htmlFor="r-member">Member</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="admin" id="r-admin" />
                        <Label htmlFor="r-admin">Admin</Label>
                    </div>
                </RadioGroup>
                 {selectedRole === 'admin' && (
                     <p className="text-xs text-destructive/80 mt-1">Warning: Admin signup should be restricted in production.</p>
                 )}
            </div>
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
              {isLoading ? "Creating Account..." : `Sign Up as ${selectedRole === 'admin' ? 'Admin' : 'Member'}`}
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
