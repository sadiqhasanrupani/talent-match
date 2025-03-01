"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { JobPosting } from "@/lib/types";

const jobFormSchema = z.object({
  job_id: z.string().min(1, { message: "Job ID is required." }),
  title: z.string().min(2, { message: "Title must be at least 2 characters." }),
  description: z
    .string()
    .min(50, { message: "Please provide a more detailed job description." }),
});

export default function AddJob() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialize Pinecone indexes when the component mounts
  useEffect(() => {
    async function initializePinecone() {
      try {
        const response = await fetch("/api/init-pinecone");
        if (!response.ok) {
          throw new Error("Failed to initialize Pinecone");
        }
        console.log("Pinecone initialized successfully");
      } catch (error) {
        console.error("Error initializing Pinecone:", error);
        toast.error(
          "Failed to initialize the matching system. Some features may not work correctly.",
        );
      } finally {
        setIsInitializing(false);
      }
    }

    initializePinecone();
  }, []);

  const form = useForm<z.infer<typeof jobFormSchema>>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      job_id: "",
      title: "",
      description: "",
    },
  });

  async function onSubmit(values: z.infer<typeof jobFormSchema>) {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/store-job", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values as JobPosting),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to store job");
      }

      toast.success("Job posted successfully!");
      router.push("/jobs");
    } catch (error) {
      console.error("Error submitting job:", error);
      toast.error("Failed to post job. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Post a Job</CardTitle>
          <CardDescription>
            Enter job details to find matching candidates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="job_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job ID</FormLabel>
                    <FormControl>
                      <Input placeholder="JOB-2025-001" {...field} />
                    </FormControl>
                    <FormDescription>
                      A unique identifier for this job posting.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Senior Software Engineer"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Detailed job description including requirements, responsibilities, and qualifications..."
                        className="min-h-[300px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Provide a comprehensive description for better candidate
                      matching.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || isInitializing}
              >
                {isInitializing
                  ? "Initializing..."
                  : isSubmitting
                    ? "Posting..."
                    : "Post Job"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
