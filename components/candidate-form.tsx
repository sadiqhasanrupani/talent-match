"use client";

import type React from "react";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { submitApplication } from "@/app/actions";

/**
 * Form validation schema for candidate application
 */
const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  linkedinUrl: z.string().url({ message: "Please enter a valid LinkedIn URL" }),
  resumeText: z.string().optional(),
  resumeFile: z.any().optional(),
  skills: z.string().min(10, {
    message: "Please provide more details about your skills and experience",
  }),
});

/**
 * CandidateForm Component
 *
 * A form component that allows candidates to submit job applications.
 * Handles both file and text resume uploads and displays success message upon submission.
 *
 */
export default function CandidateForm() {
  /**
   * Tracks form submission state
   */
  const [isSubmitting, setIsSubmitting] = useState(false);
  /**
   * Tracks if form was successfully submitted
   */
  const [submitSuccess, setSubmitSuccess] = useState(false);
  /**
   * Stores the uploaded resume file
   */
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  /**
   * Tracks which resume upload method is currently selected (file or text)
   */
  // eslint-disable-next-line
  const [resumeUploadMethod, setResumeUploadMethod] = useState<"file" | "text">(
    "file",
  );

  /**
   * Form hook instance for managing form state and validation
   */
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      linkedinUrl: "",
      resumeText: "",
      resumeFile: undefined,
      skills: "",
    },
  });

  /**
   * Handles file input changes for resume uploads
   *
   * Validates that the uploaded file is a PDF and updates the resumeFile state.
   * Shows an error message if a non-PDF file is uploaded.
   *
   * @param {React.ChangeEvent<HTMLInputElement>} e - The file input change event
   * @returns {void}
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setResumeFile(file);
    } else if (file) {
      alert("Please upload a PDF file");
      e.target.value = "";
    }
  };

  /**
   * Handles form submission
   *
   * Prepares the form data, submits the application via API call,
   * and manages loading/success states accordingly.
   *
   * @param {z.infer<typeof formSchema>} values - The validated form values
   */
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      const formData = {
        name: values.name,
        email: values.email,
        linkedIn: values.linkedinUrl,
        skills: values.skills,
      };
      await submitApplication(formData, resumeFile);
      setSubmitSuccess(true);
      form.reset();
      setResumeFile(null);
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <Card className="p-8 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-10 w-10 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="mt-6 text-2xl font-semibold">Application Submitted!</h2>
        <p className="mt-2 text-muted-foreground">
          Thank you for your application. We will review your information and
          get back to you soon.
        </p>
        <Button className="mt-6" onClick={() => setSubmitSuccess(false)}>
          Submit Another Application
        </Button>
      </Card>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="john.doe@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="linkedinUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LinkedIn URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://linkedin.com/in/johndoe"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <FormItem className="mb-2">
                  <FormLabel>Resume</FormLabel>
                </FormItem>
                <Tabs
                  defaultValue="file"
                  className="mt-2"
                  onValueChange={(value) =>
                    setResumeUploadMethod(value as "file" | "text")
                  }
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="file">Upload PDF</TabsTrigger>
                    <TabsTrigger value="text">Enter Text</TabsTrigger>
                  </TabsList>
                  <TabsContent value="file" className="pt-4">
                    <FormField
                      control={form.control}
                      name="resumeFile"
                      render={() => (
                        <FormItem>
                          <FormControl>
                            <div className="border-2 border-dashed rounded-md p-6 text-center">
                              {resumeFile ? (
                                <div className="space-y-2">
                                  <p className="text-sm font-medium">
                                    {resumeFile.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {(resumeFile.size / 1024 / 1024).toFixed(2)}{" "}
                                    MB
                                  </p>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setResumeFile(null)}
                                  >
                                    Remove
                                  </Button>
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Upload className="h-6 w-6 text-primary" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">
                                      Drag and drop your resume, or{" "}
                                      <label className="text-primary cursor-pointer hover:underline">
                                        browse
                                        <input
                                          type="file"
                                          className="sr-only"
                                          accept=".pdf"
                                          onChange={handleFileChange}
                                        />
                                      </label>
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      PDF up to 10MB
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                  <TabsContent value="text" className="pt-4">
                    <FormField
                      control={form.control}
                      name="resumeText"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea
                              placeholder="Paste your resume text here..."
                              className="min-h-[200px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Please include your work history, education, and
                            relevant experience.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                </Tabs>
              </div>

              <FormField
                control={form.control}
                name="skills"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Skills & Experience</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your key skills, technologies, and relevant experience..."
                        className="min-h-[150px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Highlight your most relevant skills and experience for
                      this position.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Application"
          )}
        </Button>
      </form>
    </Form>
  );
}
