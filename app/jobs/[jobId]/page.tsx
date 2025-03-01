"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeftIcon,
  BriefcaseIcon,
  BuildingIcon,
  CalendarIcon,
  MapPinIcon,
  ClockIcon,
  DollarSignIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowRightIcon,
  UserIcon,
} from "lucide-react";
import { toast } from "sonner";
import type { JobMatch } from "@/lib/types";

// Function to normalize score from Pinecone (-1 to 1) to a 0-100 scale
function normalizeScore(score: number): number {
  return Math.round(((score + 1) / 2) * 100);
}

// Get badge color based on normalized score
function getBadgeVariant(
  normalizedScore: number,
): "default" | "secondary" | "destructive" | "outline" {
  if (normalizedScore >= 70) return "default"; // green
  if (normalizedScore >= 40) return "secondary"; // orange/yellow
  return "destructive"; // red
}

// Get progress bar color based on normalized score
function getProgressColor(normalizedScore: number): string {
  if (normalizedScore >= 70) return "bg-green-500";
  if (normalizedScore >= 40) return "bg-amber-500";
  return "bg-red-500";
}

// Get background color based on normalized score
function getScoreBackground(normalizedScore: number): string {
  if (normalizedScore >= 70) return "bg-green-50";
  if (normalizedScore >= 40) return "bg-amber-50";
  return "bg-red-50";
}

export default function JobDetailsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [job, setJob] = useState<JobMatch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applicationStatus, setApplicationStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  // Get job ID from route params
  const params = useParams();
  const jobId = params?.jobId as string;
  
  // Get candidate email from search params if available
  const candidateEmail = searchParams.get('candidate');

  useEffect(() => {
    async function fetchJobDetails() {
      if (!jobId) {
        setError("Job ID is required");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // If a candidate email is provided, fetch the job with AI matching context
        const endpoint = candidateEmail 
          ? `/api/match-jobs/${encodeURIComponent(candidateEmail)}?jobId=${encodeURIComponent(jobId)}`
          : `/api/jobs/${encodeURIComponent(jobId)}`;

        const response = await fetch(endpoint);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch job details");
        }

        // If fetched via match-jobs endpoint, use the first job from matches
        // (our updated API now returns only the requested job in the matches array)
        if (candidateEmail) {
          if (data.matches && data.matches.length > 0) {
            setJob(data.matches[0]);
          } else {
            throw new Error("Job not found in matching results");
          }
        } else {
          // Direct job fetch
          setJob(data);
        }
      } catch (err) {
        console.error("Error fetching job details:", err);
        setError(err instanceof Error ? err.message : "Failed to load job details");
        toast.error("Failed to load job details");
      } finally {
        setIsLoading(false);
      }
    }

    fetchJobDetails();
  }, [jobId, candidateEmail]);

  const handleApply = async () => {
    setApplicationStatus('submitting');
    
    try {
      // Mock application submission - in a real app, this would POST to an API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setApplicationStatus('success');
      toast.success("Application submitted successfully!");
    } catch (err) {
      console.error("Error submitting application:", err);
      setApplicationStatus('error');
      toast.error("Failed to submit application. Please try again.");
    }
  };

  // Format the posted date nicely if available
  const formatPostedDate = (dateString?: string) => {
    if (!dateString) return "Recently posted";
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return "Today";
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center mb-6">
          <Link href="/search/jobs" className="mr-4">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-slate-100"
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </Button>
          </Link>
          <Skeleton className="h-10 w-64" />
        </div>

        <Card className="border-none shadow-md mb-8">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-t-lg">
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-2 mb-6">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-6 w-20" />
            </div>
            
            <div className="mb-6 border-b pb-6">
              <Skeleton className="h-5 w-40 mb-3" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-4/5 mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            
            <div className="mb-6">
              <Skeleton className="h-5 w-40 mb-3" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-full" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center mb-6">
          <Link href="/search/jobs" className="mr-4">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-slate-100"
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Job Details
          </h1>
        </div>

        <Card className="border-none shadow-md">
          <CardHeader className="bg-red-50 rounded-t-lg">
            <CardTitle className="text-red-600 flex items-center gap-2">
              <XCircleIcon className="h-5 w-5" />
              Error Loading Job
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-muted-foreground mb-6">
              {error || "We couldn't find the job you're looking for. It may have been removed or the link is incorrect."}
            </p>
            <Button asChild>
              <Link href="/search/jobs">
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Job Search
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const normalizedScore = job.normalizedScore !== undefined 
    ? job.normalizedScore 
    : job.score !== undefined ? normalizeScore(job.score) : undefined;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-center mb-6">
        <Link href="/search/jobs" className="mr-4">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-slate-100"
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          Job Details
        </h1>
      </div>

      <Card className="border-none shadow-md mb-8">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-t-lg">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{job.title}</CardTitle>
              <CardDescription className="flex items-center mt-1">
                <BuildingIcon className="h-4 w-4 mr-1 text-muted-foreground" />
                {job.company || "Company name not provided"}
              </CardDescription>
            </div>
            {normalizedScore !== undefined && (
              <Badge variant={getBadgeVariant(normalizedScore)} className="text-md px-2 py-1">
                {normalizedScore}% Match
              </Badge>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3 mb-6">
            {job.location && (
              <Badge variant="outline" className="bg-slate-50 flex items-center gap-1 px-3 py-1">
                <MapPinIcon className="h-3 w-3" />
                {job.location}
              </Badge>
            )}
            {job.posted_date && (
              <Badge variant="outline" className="bg-slate-50 flex items-center gap-1 px-3 py-1">
                <CalendarIcon className="h-3 w-3" />
                {formatPostedDate(job.posted_date)}
              </Badge>
            )}
            {job.job_type && (
              <Badge variant="outline" className="bg-slate-50 flex items-center gap-1 px-3 py-1">
                <ClockIcon className="h-3 w-3" />
                {job.job_type}
              </Badge>
            )}
            {job.salary && (
              <Badge variant="outline" className="bg-slate-50 flex items-center gap-1 px-3 py-1">
                <DollarSignIcon className="h-3 w-3" />
                {job.salary}
              </Badge>
            )}
          </div>
          
          <div className="mb-6 border-b pb-6">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <BriefcaseIcon className="h-5 w-5 text-primary" />
              Job Description
            </h2>
            <div className="prose prose-slate max-w-none">
              {job.description.split('\n').map((paragraph, i) => (
                <p key={i} className={paragraph.trim() ? "mb-4" : ""}>{paragraph}</p>
              ))}
            </div>
          </div>
          
          {job.ai_feedback && candidateEmail && (
            <div className={`mb-6 p-4 rounded-lg ${getScoreBackground(normalizedScore || 0)}`}>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-primary" />
                AI Feedback for You
              </h2>
              <div className="mb-3">
                <h3 className="font-medium">{job.ai_feedback.text}</h3>
                <p className="text-muted-foreground mt-1">{job.ai_feedback.details}</p>
              </div>
              
              {normalizedScore !== undefined && (
                <div>
                  <div className="flex justify-between text-sm text-muted-foreground mb-1">
                    <span>Match Score</span>
                    <span>{normalizedScore}%</span>
                  </div>
                  <div className="bg-white/50 h-2 rounded-full w-full overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ease-in-out ${getProgressColor(normalizedScore)}`}
                      style={{ width: `${normalizedScore}%` }}
                    />
                  </div>
                  <p className="text-xs mt-1">
                    {normalizedScore >= 90
                      ? "Exceptional Match - You're a perfect fit for this role"
                      : normalizedScore >= 70
                      ? "Strong Match - You have most of the qualifications for this role"
                      : normalizedScore >= 40
                      ? "Potential Match - You have some relevant skills for this position"
                      : "Low Match - This role may require skills that differ from your profile"}
                  </p>
                </div>
              )}
            </div>
          )}

        </CardContent>
        <CardFooter className="flex-col space-y-4">
          <Button 
            className="w-full flex items-center justify-center gap-2"
            onClick={handleApply}
            disabled={applicationStatus === 'submitting' || applicationStatus === 'success'}
          >
            {applicationStatus === 'submitting' ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Submitting...
              </>
            ) : applicationStatus === 'success' ? (
              <>
                <CheckCircleIcon className="h-4 w-4" />
                Application Submitted
              </>
            ) : (
              <>
                Apply for this job
                <ArrowRightIcon className="h-4 w-4" />
              </>
            )}
          </Button>
          {applicationStatus === 'error' && (
            <p className="text-sm text-red-500 text-center">
              There was an error submitting your application. Please try again.
            </p>
          )}
          {applicationStatus === 'success' && (
            <p className="text-sm text-green-600 text-center">
              Your application has been successfully submitted! The employer will be in touch if your profile matches their requirements.
            </p>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
