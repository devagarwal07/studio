
"use client";

import type React from 'react';
import { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
// import { useAuth } from '@/context/auth-context'; // Not strictly needed here if userId/Name passed as props

const pointRequestFormSchema = z.object({
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }).max(200, {
    message: "Description must not be longer than 200 characters.",
  }),
   points: z.coerce.number().min(1, {message: "Points must be at least 1."}).max(100, {message: "Points cannot exceed 100 per request."})
});

type PointRequestFormValues = z.infer<typeof pointRequestFormSchema>;

// Mock function to submit point request - Update to include user info
// TODO: Replace with actual Firestore/API call
async function submitPointRequest(data: PointRequestFormValues, userId?: string, userName?: string): Promise<boolean> {
  if (!userId) {
    console.error("Cannot submit request without user ID.");
    return false;
  }
  console.log("Submitting point request:", { ...data, userId, userName });
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 700));
  // In a real app, this would interact with your backend API, creating a document
  // in a 'pointRequests' collection in Firestore, including userId, userName, etc.
  return true; // Simulate success
}

interface PointRequestFormProps {
  userId?: string; // Pass user ID
  userName?: string; // Pass user name
  onSuccess?: () => void; // Optional callback on successful submission
}

export function PointRequestForm({ userId, userName, onSuccess }: PointRequestFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  // const { user } = useAuth(); // Could get user here, but passing props is clearer for component reuse

  const form = useForm<PointRequestFormValues>({
    resolver: zodResolver(pointRequestFormSchema),
    defaultValues: {
      description: "",
      points: 1,
    },
    mode: "onChange",
  });

  async function onSubmit(data: PointRequestFormValues) {
     if (!userId) {
       toast({ title: "Error", description: "You must be logged in to submit a request.", variant: "destructive" });
       return;
     }
    setIsLoading(true);
    try {
      // Pass user info to the submission function
      const success = await submitPointRequest(data, userId, userName);
      if (success) {
        toast({
          title: "Request Submitted",
          description: "Your point request has been submitted for approval.",
        });
        form.reset(); // Reset form fields
        onSuccess?.(); // Call the success callback if provided
      } else {
        throw new Error("Submission failed");
      }
    } catch (error) {
       toast({
        title: "Submission Failed",
        description: "Could not submit point request. Please try again.",
        variant: "destructive",
      });
    } finally {
       setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reason for Points</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the activity you completed..."
                  className="resize-none"
                  {...field}
                  disabled={!userId} // Disable if not logged in
                />
              </FormControl>
              <FormDescription>
                Explain why you deserve these points.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="points"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Points Requested</FormLabel>
              <FormControl>
                 <Input
                   type="number"
                   placeholder="Enter points"
                   {...field}
                   min="1"
                   max="100"
                   disabled={!userId} // Disable if not logged in
                  />
              </FormControl>
               <FormDescription>
                How many points are you requesting? (1-100)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading || !userId}>
           {!userId ? "Login Required" : isLoading ? "Submitting..." : "Request Points"}
        </Button>
      </form>
    </Form>
  );
}
