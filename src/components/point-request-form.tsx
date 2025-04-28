
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

const pointRequestFormSchema = z.object({
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }).max(200, {
    message: "Description must not be longer than 200 characters.",
  }),
   points: z.coerce.number().min(1, {message: "Points must be at least 1."}).max(100, {message: "Points cannot exceed 100 per request."})
});

type PointRequestFormValues = z.infer<typeof pointRequestFormSchema>;

// Mock function to submit point request
async function submitPointRequest(data: PointRequestFormValues): Promise<boolean> {
  console.log("Submitting point request:", data);
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 700));
  // In a real app, this would interact with your backend API
  return true; // Simulate success
}

interface PointRequestFormProps {
  onSuccess?: () => void; // Optional callback on successful submission
}

export function PointRequestForm({ onSuccess }: PointRequestFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<PointRequestFormValues>({
    resolver: zodResolver(pointRequestFormSchema),
    defaultValues: {
      description: "",
      points: 1,
    },
    mode: "onChange",
  });

  async function onSubmit(data: PointRequestFormValues) {
    setIsLoading(true);
    try {
      const success = await submitPointRequest(data);
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
                 <Input type="number" placeholder="Enter points" {...field} min="1" max="100" />
              </FormControl>
               <FormDescription>
                How many points are you requesting? (1-100)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading}>
           {isLoading ? "Submitting..." : "Request Points"}
        </Button>
      </form>
    </Form>
  );
}
