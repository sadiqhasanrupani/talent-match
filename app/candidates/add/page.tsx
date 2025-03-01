"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Candidate } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation } from "@tanstack/react-query";

import { resumeTextExtractor } from "@/http/post/resume-etractor";
import { submitProfileHandler } from "@/http/post/submite-profile-handler";
import { formatResume } from "@/lib/format-resume";

const candidateFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  linkedin_url: z
    .string()
    .url({ message: "Please enter a valid LinkedIn URL." })
    .optional()
    .or(z.literal("")),
  skills_experience: z.string().min(10, {
    message: "Please provide more details about your skills and experience.",
  }),
  resume_text: z.string().optional(),
  resume_file: z.any().optional(),
});

export default function AddCandidate() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Tracks which resume upload method is currently selected (file or text)
  // eslint-disable-next-line
  const [resumeUploadMethod, setResumeUploadMethod] = useState<"file" | "text">(
    "file",
  );
  // Stores the uploaded resume file
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeData, setResumeData] = useState<string>();

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

  /**
   * Handles file input changes for resume uploads
   *
   * Validates that the uploaded file is a PDF and updates the resumeFile state.
   * Shows an error message if a non-PDF file is uploaded.
   *
   * @param {React.ChangeEvent<HTMLInputElement>} e - The file input change event
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

  const form = useForm<z.infer<typeof candidateFormSchema>>({
    resolver: zodResolver(candidateFormSchema),
    defaultValues: {
      name: "",
      email: "",
      linkedin_url: "",
      skills_experience: "",
      resume_text: "",
    },
  });

  const {
    isPending: submitProfileIsPending,
    isError: submitProfileIsError,
    error: submitProfileError,
    mutate: submitProfileMutate,
  } = useMutation({
    mutationKey: ["submit-profile"],
    mutationFn: submitProfileHandler,
    onSuccess(data) {
      toast.success("Your profile was successfully submitted!");
    },
  });

  const {
    isPending: resumeExtractionIsPending,
    isError: resumeExtractionIsError,
    error: resumeExtractionError,
    mutate: resumeExtractionMutate,
  } = useMutation({
    mutationKey: ["resume-text-extraction"],
    mutationFn: resumeTextExtractor,
    async onSuccess(data) {
      toast.success("Resume successfully processed");

      const formattedResumeData = await formatResume(data.resumeData as any);
      setResumeData(formattedResumeData);
      const formData = form.getValues();

      submitProfileMutate({
        email: formData.email,
        linkedin_url: formData.linkedin_url || "",
        name: formData.name,
        resume_text: formattedResumeData,
        skills_experience: formData.skills_experience,
      });
    },
  });

  useEffect(() => {
    if (resumeExtractionIsError) {
      toast.error(
        resumeExtractionError.message ||
          "something went wrong please try again",
      );
    }
  }, [resumeExtractionIsError, resumeExtractionError]);
  async function onSubmit(values: z.infer<typeof candidateFormSchema>) {
    // Check if either resumeFile state has a file or resume_text form field has content
    if (
      !resumeFile &&
      (!values.resume_text || values.resume_text.trim().length === 0)
    ) {
      form.setError("resume_text", {
        type: "manual",
        message: "Either resume text or a resume file is required",
      });
      return;
    }

    if (resumeFile) {
      const formData = new FormData();
      formData.append("pdf", resumeFile);
      resumeExtractionMutate(formData);
    } else {
      submitProfileMutate({
        email: values.email,
        linkedin_url: values.linkedin_url || "",
        name: values.name,
        resume_text: values.resume_text || "",
        skills_experience: values.skills_experience,
      });
    }

    try {
      const response = await fetch("/api/store-candidate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values as Candidate),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to store candidate");
      }

      toast.success("Profile submitted successfully!");
      router.push("/candidates");
    } catch (error) {
      console.error("Error submitting candidate:", error);
      toast.error("Failed to submit profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Add Your Profile</CardTitle>
          <CardDescription>
            Enter your details to find matching job opportunities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                      <Input placeholder="john.doe@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="linkedin_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LinkedIn URL (Optional)</FormLabel>
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

              <FormField
                control={form.control}
                name="skills_experience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Skills & Experience</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="List your key skills and experience..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Summarize your key skills, technologies, and work
                      experience.
                    </FormDescription>
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
                      name="resume_file"
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
                                      <label className="text-primary cursor-pointer hover:underline">
                                        <strong className="font-bold underline">
                                          Browse
                                        </strong>
                                        &nbsp; to upload your resume
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
                      name="resume_text"
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

              <Button
                type="submit"
                className="w-full"
                disabled={resumeExtractionIsPending}
              >
                {isInitializing
                  ? "Initializing..."
                  : resumeExtractionIsPending
                    ? "Submitting..."
                    : "Submit Profile"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
