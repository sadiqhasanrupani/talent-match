"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  BriefcaseIcon,
  SearchIcon,
  ArrowLeftIcon,
  UserIcon,
  BuildingIcon,
  MapPinIcon,
  CalendarIcon,
} from "lucide-react";
import { toast } from "sonner";
import type { JobMatch } from "@/lib/types";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Gemini AI is now handling score normalization in the API
// The API returns a normalizedScore property (0-100)

// Get badge color based on normalized score
function getBadgeVariant(
  normalizedScore: number,
): "default" | "secondary" | "destructive" | "outline" {
  if (normalizedScore >= 70) return "default"; // green
  if (normalizedScore >= 40) return "secondary"; // orange/yellow
  return "destructive"; // red
}

// Get background color based on normalized score
function getScoreBackground(normalizedScore: number): string {
  if (normalizedScore >= 70) return "bg-green-50";
  if (normalizedScore >= 40) return "bg-amber-50";
  return "bg-red-50";
}

// Get progress bar color based on normalized score
function getProgressColor(normalizedScore: number): string {
  if (normalizedScore >= 70) return "bg-green-500";
  if (normalizedScore >= 40) return "bg-amber-500";
  return "bg-red-500";
}

export default function SearchJobsPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [tabLoading, setTabLoading] = useState(false);
  const [jobs, setJobs] = useState<JobMatch[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  async function searchJobs() {
    if (!email.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      const response = await fetch(
        `/api/match-jobs/${encodeURIComponent(email)}`,
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch matching jobs");
      }

      setJobs(data.matches || []);

      if (data.matches && data.matches.length === 0) {
        toast.info("No matching jobs found for this candidate");
      }
    } catch (error) {
      console.error("Error searching jobs:", error);
      toast.error("Failed to search jobs. Please try again.");
      setJobs([]);
    } finally {
      setIsLoading(false);
    }
  }

  // Filter jobs based on active tab using AI-generated normalized score
  const filteredJobs = jobs.filter((job) => {
    // Use the normalizedScore property directly from the API
    const normalizedScore = job.normalizedScore ?? 0;
    if (activeTab === "all") return true;
    if (activeTab === "high") return normalizedScore >= 70;
    if (activeTab === "medium")
      return normalizedScore >= 40 && normalizedScore < 70;
    if (activeTab === "low") return normalizedScore < 40;
    return true;
  });

  // Generate mock data for job details (in a real app, this would come from the API)
  const getJobDetails = (job: JobMatch) => {
    return {
      company: job.company || "Company name",
      location: job.location || "Remote",
      postedDate: job.posted_date || "Recently",
      salary: job.salary || "$80K - $120K",
      jobType: job.job_type || "Full-time",
    };
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex items-center mb-6">
        <Link href="/" className="mr-4">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-slate-100"
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          Search Jobs
        </h1>
      </div>

      <Card className="mb-8 border-none shadow-md">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-primary" />
            Find matching jobs for a candidate
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Enter candidate email..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-slate-300 focus-visible:ring-primary"
                onKeyDown={(e) => e.key === "Enter" && searchJobs()}
              />
            </div>
            <Button
              onClick={searchJobs}
              disabled={isLoading}
              className="transition-all duration-300 hover:shadow-md"
            >
              <SearchIcon className="h-4 w-4 mr-2" />
              {isLoading ? "Searching..." : "Search"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {hasSearched && jobs.length > 0 && (
        <Tabs
          defaultValue="all"
          className="mb-6"
          onValueChange={(value) => {
            setTabLoading(true);
            setActiveTab(value);
            // Simulate a slight delay when switching tabs for better UX
            setTimeout(() => setTabLoading(false), 300);
          }}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              Results ({jobs.length} jobs)
            </h2>
            <TabsList className="bg-slate-100">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="high">Strong Matches</TabsTrigger>
              <TabsTrigger value="medium">Potential</TabsTrigger>
              <TabsTrigger value="low">Low Match</TabsTrigger>
            </TabsList>
          </div>
        </Tabs>
      )}

      {isLoading || tabLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card
              key={i}
              className="border border-slate-200 overflow-hidden hover:shadow-md transition-shadow duration-300"
            >
              <CardHeader className="bg-slate-50 pb-3">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="pt-4">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
                <div className="mt-4">
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-8 w-full rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : hasSearched && jobs.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
          <div className="bg-slate-100 h-24 w-24 rounded-full flex items-center justify-center mx-auto mb-6">
            <BriefcaseIcon className="h-12 w-12 text-slate-400" />
          </div>
          <h3 className="text-xl font-medium mb-2">No matching jobs found</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Try a different email or add more jobs to the platform.
          </p>
          <Link href="/jobs/add">
            <Button className="shadow-md hover:shadow-lg transition-shadow">
              Post a Job
            </Button>
          </Link>
        </div>
      ) : filteredJobs.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map((job, index) => {
            // Use normalizedScore directly from the API (calculated by Gemini AI)
            const normalizedScore = job.normalizedScore;
            const jobDetails = getJobDetails(job);

            return (
              <Card
                key={index}
                className="border border-slate-200 overflow-hidden hover:shadow-md transition-all duration-300 group"
              >
                <CardHeader
                  className={`pb-3 ${getScoreBackground(normalizedScore ?? 0)}`}
                >
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg line-clamp-1">
                      {job.title}
                    </CardTitle>
                    <Badge
                      variant={getBadgeVariant(normalizedScore ?? 0)}
                      className="ml-2"
                    >
                      {normalizedScore ?? 0}%
                    </Badge>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground gap-1">
                    <BuildingIcon className="h-3 w-3" />
                    <span className="line-clamp-1">{jobDetails.company}</span>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge
                      variant="outline"
                      className="bg-slate-50 flex items-center gap-1"
                    >
                      <MapPinIcon className="h-3 w-3" />
                      {jobDetails.location}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="bg-slate-50 flex items-center gap-1"
                    >
                      <CalendarIcon className="h-3 w-3" />
                      {jobDetails.postedDate}
                    </Badge>
                    <Badge variant="outline" className="bg-slate-50">
                      {jobDetails.jobType}
                    </Badge>
                    {jobDetails.salary && (
                      <Badge variant="outline" className="bg-slate-50">
                        {jobDetails.salary}
                      </Badge>
                    )}
                  </div>

                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-1 flex items-center gap-1">
                      <span className="inline-block h-2 w-2 rounded-full bg-primary"></span>
                      Description
                    </h4>
                    <p className="text-sm text-muted-foreground line-clamp-3 pl-3 border-l-2 border-slate-200">
                      {job.description}
                    </p>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-1 flex items-center gap-1">
                      <span className="inline-block h-2 w-2 rounded-full bg-primary"></span>
                      Match Score
                    </h4>
                    <div className="bg-slate-100 h-4 rounded-full w-full overflow-hidden">
                      <div
                        className={`h-4 rounded-full ${getProgressColor(normalizedScore ?? 0)} transition-all duration-500 ease-in-out`}
                        style={{ width: `${normalizedScore ?? 0}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs font-medium">
                        {(normalizedScore ?? 0) >= 70
                          ? "Strong Match"
                          : (normalizedScore ?? 0) >= 40
                            ? "Potential Match"
                            : "Low Match"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ID: {job.id}
                      </p>
                    </div>
                  </div>

                  <div className="text-xs text-blue-600 mb-2 hidden">
                    <p className="flex items-center gap-1">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 8V4H8"></path>
                        <rect width="16" height="12" x="4" y="8" rx="2"></rect>
                        <path d="M2 14h2"></path>
                        <path d="M20 14h2"></path>
                        <path d="M15 13v2"></path>
                        <path d="M9 13v2"></path>
                      </svg>
                      Powered by Gemini AI
                    </p>
                  </div>

                  {job.ai_feedback && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-1 flex items-center gap-1">
                        <span className="inline-block h-2 w-2 rounded-full bg-primary"></span>
                        AI Feedback
                      </h4>
                      <div
                        className={`p-2 rounded-md ${getScoreBackground(normalizedScore ?? 0)} text-sm`}
                      >
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {job.ai_feedback.text}
                        </p>
                        {job.ai_feedback.details && (
                          <p className="text-xs mt-1 opacity-80">
                            {job.ai_feedback.details}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="pt-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full group-hover:bg-slate-50 transition-colors"
                    asChild
                  >
                    <Link
                      href={`/jobs/${job.id}?candidate=${encodeURIComponent(email)}`}
                    >
                      View Full Details
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
