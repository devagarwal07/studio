
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
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { getMemberById, createOrUpdateMember } from '@/services/memberService'; // Import Firestore service
import type { Member } from '@/types';


type Role = 'member' | 'admin';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role>('member'); // Default to member
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const router = useRouter();

    // Function to handle role verification after successful Firebase Auth sign-in
    const verifyRoleAndRedirect = async (user: import('firebase/auth').User, intendedRole: Role) => {
        try {
            const memberProfile = await getMemberById(user.uid);

            if (!memberProfile) {
                 // Handle case where user exists in Auth but not Firestore (e.g., incomplete signup OR admin not yet in DB)
                 // For Google Sign-in attempting admin, this is where an admin might be auto-created if desired,
                 // but for this flow (preset admin credentials), we expect admin to exist.
                 if (intendedRole === 'admin') {
                     throw new Error("Admin profile not found in database. Admins must have preset credentials.");
                 }

                 // If it's a member role attempt and profile is missing (e.g., from Google sign-in first time)
                 if (user.displayName && user.email) {
                     console.warn("User found in Auth but not Firestore. Creating member profile...");
                     const memberData: Omit<Member, 'id'> = {
                         name: user.displayName,
                         email: user.email,
                         points: 0,
                         role: 'member', // Only create member profiles here
                     };
                      await createOrUpdateMember(memberData, user.uid);
                      // Now check if the *created* role matches the intended one (should be 'member')
                      if (intendedRole === 'member') router.push('/member');
                      else { // Should not happen if only creating members
                          await signOut(auth);
                          toast({title: "Login Error", description: "Profile created as member, but admin login attempted.", variant: "destructive"});
                      }
                 } else {
                     throw new Error("User profile not found and cannot be created automatically (missing display name or email).");
                 }

            } else if (memberProfile.role !== intendedRole) {
                // Role mismatch
                await signOut(auth); // Sign out the user
                toast({
                    title: "Role Mismatch",
                    description: `You are registered as a ${memberProfile.role}. Please login with the correct role.`,
                    variant: "destructive",
                });
            } else {
                // Role matches, redirect accordingly
                if (intendedRole === 'admin') {
                    router.push('/admin');
                } else {
                    router.push('/member');
                }
                 toast({
                    title: "Login Successful",
                    description: `Redirecting to ${intendedRole} dashboard...`,
                 });
            }
        } catch (error: any) {
            console.error("Role verification failed:", error);
            await signOut(auth); // Sign out on error during verification
            toast({
                title: "Login Error",
                description: error.message || "Could not verify your role. Please try again.",
                variant: "destructive",
            });
        } finally {
             // Reset loading states handled in the main handlers
        }
    };


  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Don't redirect immediately, verify role first
       await verifyRoleAndRedirect(userCredential.user, selectedRole);
    } catch (error: any) { // Added missing opening brace
      console.error("Login failed:", error);
      let description = "Invalid email or password.";
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            description = "Invalid email or password.";
        } else if (error.message) {
            description = error.message;
        }
      toast({
        title: "Login Failed",
        description: description,
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
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

       // Check if the user exists in Firestore and verify/create profile
       const memberProfile = await getMemberById(user.uid);

        if (!memberProfile) {
            // New user via Google Sign-In or existing Auth user missing Firestore profile
            if (selectedRole === 'admin') {
                 await signOut(auth); // Sign out the user
                 toast({
                    title: "Admin Login Failed",
                    description: "Admin accounts must be preset. Google Sign-In cannot create new admin accounts.",
                    variant: "destructive",
                 });
                 setIsGoogleLoading(false);
                 return;
            }

            // If not admin, proceed to create a member profile
            if (!user.displayName || !user.email) {
                 throw new Error("Google account information missing (display name or email).");
            }
             console.log("New Google Sign-In user or missing profile. Creating Firestore entry as member...");
            const memberData: Omit<Member, 'id'> = {
                name: user.displayName,
                email: user.email,
                points: 0,
                role: 'member', // Only create 'member' role through Google Sign-In
            };
            await createOrUpdateMember(memberData, user.uid);

            // Verify the role just created (should be 'member') matches intended role (must be 'member') and redirect
             await verifyRoleAndRedirect(user, 'member');

        } else {
             // Existing user - verify their stored role matches the selected role
              await verifyRoleAndRedirect(user, selectedRole);
        }

    } catch (error: any) {
        console.error("Google Sign-In failed:", error);
        let description = "Could not sign in with Google. Please try again.";
        if (error.code === 'auth/popup-closed-by-user') {
            description = "Google Sign-In cancelled.";
        } else if (error.code === 'auth/account-exists-with-different-credential') {
             description = "An account already exists with this email address using a different sign-in method.";
         } else if (error.message.includes("Role mismatch") || error.message.includes("Admin profile not found")) {
             // Error message from verifyRoleAndRedirect is sufficient
              description = error.message;
         } else if (error.message) {
            description = error.message;
        }
        toast({
            title: "Google Sign-In Failed",
            description: description,
            variant: "destructive",
        });
         // Ensure user is signed out if verification failed mid-process
         if(auth.currentUser && auth.currentUser.uid === error.uid) { 
             await signOut(auth);
         }
    } finally {
        setIsGoogleLoading(false);
    }
};


  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-sm shadow-lg rounded-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-semibold">Login</CardTitle>
          <CardDescription>Select your role and login to your account</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="grid gap-4">
             {/* Role Selection */}
            <div className="grid gap-2">
                <Label>Login As</Label>
                <RadioGroup
                    defaultValue="member"
                    value={selectedRole}
                    onValueChange={(value: Role) => setSelectedRole(value)}
                    className="flex space-x-4"
                    disabled={isLoading || isGoogleLoading}
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
            </div>
            {/* Email/Password Fields */}
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
                className="transition-shadow duration-200 focus:shadow-md"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="******"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading || isGoogleLoading}
                className="transition-shadow duration-200 focus:shadow-md"
               />
            </div>
             <Button type="submit" className="w-full mt-2 transition-transform duration-200 hover:scale-105 active:scale-95" disabled={isLoading || isGoogleLoading}>
              {isLoading ? "Logging in..." : `Login as ${selectedRole === 'admin' ? 'Admin' : 'Member'}`}
            </Button>
          </CardContent>
        </form>
         <Separator className="my-4" />
          <CardContent>
             <Button variant="outline" className="w-full transition-transform duration-200 hover:scale-105 active:scale-95" onClick={handleGoogleSignIn} disabled={isLoading || isGoogleLoading}>
               {isGoogleLoading ? "Signing in..." : (
                 <>
                   <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48px" height="48px"><path fill="#EA4335" d="M24 9.5c3.9 0 6.8 1.7 8.4 3.2l6.3-6.3C34.9 2.8 30 .5 24 .5 14.9.5 7.7 6.4 4.9 14.5l7.4 5.8C13.8 14.3 18.5 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.6H24v8.8h12.7c-.6 2.9-2.3 5.4-4.9 7.1l7.4 5.8C42.9 37.9 46.5 31.7 46.5 24.5z"/><path fill="#FBBC05" d="M12.3 20.3c-.5-1.5-.7-3.1-.7-4.8s.3-3.3.7-4.8l-7.4-5.8C2.8 9.1 1.5 13.9 1.5 19c0 5.1 1.3 9.9 3.7 14.2l7.1-5.9z"/><path fill="#34A853" d="M24 47.5c5.9 0 10.8-1.9 14.4-5.2l-7.4-5.8c-2 1.4-4.5 2.2-7 2.2-5.5 0-10.2-3.8-11.8-8.9l-7.4 5.8C7.7 41.6 14.9 47.5 24 47.5z"/><path fill="none" d="M0 0h48v48H0z"/></svg>
                   {`Login with Google as ${selectedRole === 'admin' ? 'Admin' : 'Member'}`}
                 </>
               )}
             </Button>
          </CardContent>
        <CardFooter className="flex flex-col items-center space-y-2">
           <p className="text-sm text-muted-foreground">
             Don't have an account?{' '}
             <Link href="/auth/signup" className="underline hover:text-primary transition-colors duration-200">
               Sign up as Member
             </Link>
           </p>
        </CardFooter>
      </Card>
    </div>
  );
}
