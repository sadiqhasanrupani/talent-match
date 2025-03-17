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
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  SearchIcon,
  ArrowLeftIcon,
  BriefcaseIcon,
  FilterIcon,
  DollarSignIcon,
  MapPinIcon,
  ClockIcon,
} from "lucide-react";
import { toast } from "sonner";
import type { CandidateMatch } from "@/lib/types";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SearchCandidatesClient() {
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [jobType, setJobType] = useState("Full-time");
  const [salary, setSalary] = useState("₹90,000.00");
  const [location, setLocation] = useState("In person");
  const [isLoading, setIsLoading] = useState(false);
  const [candidates, setCandidates] = useState<CandidateMatch[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [jobDetails, setJobDetails] = useState<any | null>(null);
  const [selectedCandidate, setSelectedCandidate] =
    useState<CandidateMatch | null>(null);

  async function searchCandidates() {
    if (!jobTitle.trim()) {
      toast.error("Please enter a job title");
      return;
    }

    if (!jobDescription.trim()) {
      toast.error("Please enter job requirements");
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      const response = await fetch("/api/search-candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: jobTitle,
          description: jobDescription,
          type: jobType,
          salary,
          location,
        }),
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to fetch matching candidates");

      if (data.job) {
        setJobDetails({
          id: data.job.job_id || "unknown",
          title: data.job.title,
          description: data.job.description,
          type: data.job.type,
          salary: data.job.salary,
          location: data.job.location,
        });
      }

      const candidatesWithScores = (data.matches || []).sort(
        (a: CandidateMatch, b: CandidateMatch) =>
          (b.score ?? 0) - (a.score ?? 0),
      );

      setCandidates(candidatesWithScores);
      if (data.matches?.length === 0) {
        toast.info("No matching candidates found for this job");
      }
    } catch (error) {
      console.error("Error searching candidates:", error);
      toast.error("Failed to search candidates. Please try again.");
      setCandidates([]);
    } finally {
      setIsLoading(false);
    }
  }

  const filteredCandidates = candidates.filter((candidate) => {
    const score = candidate.score ?? 0;
    switch (activeTab) {
      case "high":
        return score >= 70;
      case "medium":
        return score >= 40 && score < 70;
      case "low":
        return score < 40;
      default:
        return true;
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-[1400px]">
        {/* Header */}
        <header className="flex items-center gap-6 mb-8">
          <Link href="/" className="shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-white/80"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              <span className="sr-only">Go back</span>
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Search Candidates
            </h1>
            <p className="text-slate-500 mt-1">
              Find the perfect match for your job opening
            </p>
          </div>
        </header>

        {/* Search Form */}
        <Card className="mb-8 border-none shadow-xl bg-white rounded-2xl overflow-hidden">
          <CardHeader className="border-b pb-6 bg-gradient-to-r from-slate-50 to-white">
            <CardTitle className="flex items-center gap-2 text-xl text-slate-800">
              <BriefcaseIcon className="h-5 w-5 text-primary" />
              Job Requirements
            </CardTitle>
            <CardDescription>
              Enter the job details to find candidates that best match your
              requirements
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label
                  htmlFor="jobTitle"
                  className="block text-sm font-medium mb-2 text-slate-700"
                >
                  Job Title
                </label>
                <Input
                  id="jobTitle"
                  placeholder="E.g. Senior React Developer"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="border-slate-200 focus-visible:ring-primary"
                />
              </div>
              <div>
                <label
                  htmlFor="jobType"
                  className="block text-sm font-medium mb-2 text-slate-700"
                >
                  Job Type
                </label>
                <div className="relative">
                  <select
                    id="jobType"
                    value={jobType}
                    onChange={(e) => setJobType(e.target.value)}
                    className="w-full rounded-md border-slate-200 focus-visible:ring-primary pr-10 py-2"
                  >
                    <option>Full-time</option>
                    <option>Part-time</option>
                    <option>Contract</option>
                    <option>Freelance</option>
                  </select>
                  <ClockIcon className="absolute right-3 top-2.5 h-5 w-5 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label
                  htmlFor="salary"
                  className="block text-sm font-medium mb-2 text-slate-700"
                >
                  Monthly Salary
                </label>
                <div className="relative">
                  <Input
                    id="salary"
                    type="text"
                    placeholder="E.g. ₹90,000.00"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    className="border-slate-200 focus-visible:ring-primary pl-8"
                  />
                  <DollarSignIcon className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                </div>
              </div>
              <div>
                <label
                  htmlFor="location"
                  className="block text-sm font-medium mb-2 text-slate-700"
                >
                  Work Location
                </label>
                <div className="relative">
                  <select
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full rounded-md border-slate-200 focus-visible:ring-primary pr-10 py-2"
                  >
                    <option>In person</option>
                    <option>Remote</option>
                    <option>Hybrid</option>
                  </select>
                  <MapPinIcon className="absolute right-3 top-2.5 h-5 w-5 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div className="md:col-span-2">
                <label
                  htmlFor="jobDescription"
                  className="block text-sm font-medium mb-2 text-slate-700"
                >
                  Job Requirements
                </label>
                <textarea
                  id="jobDescription"
                  placeholder="Describe the skills, experience, and qualifications required for this position..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="w-full rounded-md border-slate-200 focus-visible:ring-primary min-h-[120px] p-3"
                  rows={4}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="pt-2 pb-6 flex justify-end bg-slate-50">
            <Button
              onClick={searchCandidates}
              disabled={isLoading}
              className="transition-all duration-300 hover:shadow-md px-8"
              size="lg"
            >
              <SearchIcon className="h-4 w-4 mr-2" />
              {isLoading ? "Searching..." : "Search Candidates"}
            </Button>
          </CardFooter>
        </Card>

        {/* Results Section */}
        {hasSearched && candidates.length > 0 && jobDetails && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
            {/* Main Content */}
            <div className="space-y-6">
              {/* Job Details & Filters */}
              <div className="grid md:grid-cols-[1fr_auto] gap-6">
                <Card className="border-none shadow-lg bg-white rounded-xl overflow-hidden">
                  <CardHeader className="pb-3 border-b bg-gradient-to-r from-slate-50 to-white">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <BriefcaseIcon className="h-5 w-5 text-primary" />
                      {jobDetails.title}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1">
                        <ClockIcon className="h-4 w-4 text-slate-400" />
                        {jobDetails.type}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSignIcon className="h-4 w-4 text-slate-400" />
                        {jobDetails.salary}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPinIcon className="h-4 w-4 text-slate-400" />
                        {jobDetails.location}
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">
                      {jobDetails.description}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-lg bg-white rounded-xl overflow-hidden h-fit">
                  <CardHeader className="pb-3 border-b bg-gradient-to-r from-slate-50 to-white">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FilterIcon className="h-4 w-4 text-primary" />
                      Filter Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <Tabs
                      value={activeTab}
                      onValueChange={setActiveTab}
                      className="w-full"
                    >
                      <TabsList className="w-full bg-slate-100 p-1">
                        <TabsTrigger value="all" className="flex-1">
                          All
                        </TabsTrigger>
                        <TabsTrigger value="high" className="flex-1">
                          Strong
                        </TabsTrigger>
                        <TabsTrigger value="medium" className="flex-1">
                          Potential
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
