
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
import { submitPointRequest } from '@/services/requestService'; // Import the actual service
import { Loader2 } from 'lucide-react'; // Import Loader icon

const pointRequestFormSchema = z.object({
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }).max(200, {
    message: "Description must not be longer than 200 characters.",
  }),
   // Ensure points is treated as a number, coerce if string input
   points: z.coerce.number({ invalid_type_error: "Points must be a number." })
     .int({ message: "Points must be a whole number." })
     .min(1, { message: "Points must be at least 1." })
     .max(100, { message: "Points cannot exceed 100 per request." })
});

type PointRequestFormValues = z.infer<typeof pointRequestFormSchema>;

interface PointRequestFormProps {
  userId?: string; // Pass user ID
  userName?: string; // Pass user name
  onSuccess?: () => void; // Optional callback on successful submission
}

export function PointRequestForm({ userId, userName, onSuccess }: PointRequestFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<PointRequestFormValues>({
    resolver: zodResolver(pointRequestFormSchema),
    defaultValues: {
      description: "",
      points: 1, // Default to 1, but ensure type consistency
    },
    mode: "onChange", // Validate on change
  });

  async function onSubmit(data: PointRequestFormValues) {
     if (!userId || !userName) {
       toast({ title: "Error", description: "You must be logged in to submit a request.", variant: "destructive" });
       return;
     }
    setIsLoading(true);
    try {
      // Prepare data for the service function
      const requestData = {
          memberId: userId,
          memberName: userName, // Include memberName
          description: data.description,
          points: data.points,
      };

      // Call the actual Firestore service function
      const requestId = await submitPointRequest(requestData);
      console.log("Submitted request with ID:", requestId);

      toast({
        title: "Request Submitted",
        description: "Your point request has been submitted for approval.",
      });
      form.reset(); // Reset form fields
      onSuccess?.(); // Call the success callback if provided

    } catch (error: any) {
       console.error("Point request submission failed:", error);
       toast({
        title: "Submission Failed",
        description: error.message || "Could not submit point request. Please try again.",
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
                  placeholder="Describe the activity you completed (e.g., 'Completed project setup', 'Helped new user X')..."
                  className="resize-none focus:shadow-md transition-shadow duration-200"
                  {...field}
                  disabled={!userId || isLoading} // Disable if not logged in or loading
                />
              </FormControl>
              <FormDescription>
                Be specific! This helps the admin approve your request (10-200 chars).
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
                   placeholder="Enter points (1-100)"
                   {...field}
                   min="1"
                   max="100"
                   step="1" // Ensure whole numbers
                   disabled={!userId || isLoading} // Disable if not logged in or loading
                   className="focus:shadow-md transition-shadow duration-200"
                   // Handle potential string values from input type number
                   onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)}
                   onBlur={field.onBlur}
                  />
              </FormControl>
               <FormDescription>
                How many points are you requesting? (Whole number between 1-100)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading || !userId} className="w-full transition-transform duration-200 hover:scale-105 active:scale-95">
           {!userId ? "Login Required" : isLoading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                </>
            ) : "Request Points"}
        </Button>
      </form>
    </Form>
  );
}
