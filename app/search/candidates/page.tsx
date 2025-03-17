"use client";

import { useState } from "react";
import { CandidateMatch } from "@/lib/types";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { generateInterviewQuestions, getBadgeVariant, getFeedback, getFeedbackIcon } from "@/lib/utils";
import { ArrowLeftIcon, BriefcaseIcon, ClockIcon, DollarSignIcon, ExternalLinkIcon, FilterIcon, Link, MapPinIcon, MessageSquareIcon, SearchIcon, UserIcon, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";

export default function SearchCandidatesPage() {
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

  const router = useRouter();

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
        {/* Back Button */}
        <Button size={"icon"} className="rounded-full" onClick={() => router.back()}>
          <ArrowLeftIcon className="h-5 w-5" />
        </Button>

        {/* Header */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mb-8">
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
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
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
                <Select value={jobType} onValueChange={setJobType}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select job type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Full-time">Full-time</SelectItem>
                    <SelectItem value="Part-time">Part-time</SelectItem>
                    <SelectItem value="Contract">Contract</SelectItem>
                    <SelectItem value="Freelance">Freelance</SelectItem>
                  </SelectContent>
                </Select>
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
                <Select value={location} onValueChange={setLocation}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select work location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="In person">In person</SelectItem>
                    <SelectItem value="Remote">Remote</SelectItem>
                    <SelectItem value="Hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
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
                      <Accordion type="single" collapsible>
                        <AccordionItem value="item-1">
                          <AccordionTrigger>Job Description</AccordionTrigger>
                          <AccordionContent>
                            {jobDetails.description}
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
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
                        <TabsTrigger value="low" className="flex-1">
                          Low
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                    <div className="mt-4 text-center">
                      <p className="text-sm font-medium text-slate-700">
                        {filteredCandidates.length} candidates
                      </p>
                      <p className="text-xs text-slate-500">
                        {activeTab === "all"
                          ? "Showing all candidates"
                          : activeTab === "high"
                            ? "Showing candidates with 70%+ match"
                            : activeTab === "medium"
                              ? "Showing candidates with 40-69% match"
                              : "Showing candidates with <40% match"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Candidates Grid */}
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredCandidates.map((candidate, index) => {
                  const feedback = getFeedback(candidate.score ?? 0);
                  return (
                    <Card
                      key={index}
                      className={`group transition-all duration-300 hover:shadow-xl border-none shadow-lg
                        ${selectedCandidate?.id === candidate.id ? "ring-2 ring-primary" : ""}
                        cursor-pointer bg-white hover:scale-[1.02] rounded-xl overflow-hidden`}
                      onClick={() => setSelectedCandidate(candidate)}
                    >
                      <CardHeader
                        className={`pb-3 border-b ${feedback.category === "exceptional"
                          ? "bg-emerald-50"
                          : feedback.category === "high"
                            ? "bg-green-50"
                            : feedback.category === "medium"
                              ? "bg-amber-50"
                              : "bg-red-50"
                          }`}
                      >
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">
                            {candidate.name}
                          </CardTitle>
                          <Badge
                            variant={getBadgeVariant(feedback.category)}
                            className="ml-2"
                          >
                            {candidate.score}%
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-500">
                          {candidate.email}
                        </p>
                      </CardHeader>

                      <CardContent className="pt-4 space-y-4">
                        <div>
                          <h4 className="text-sm font-medium mb-2 flex items-center gap-2 text-slate-700">
                            <span className="h-2 w-2 rounded-full bg-primary"></span>
                            Skills & Experience
                          </h4>
                          <p className="text-sm text-slate-600 line-clamp-3">
                            {candidate.skills_experience}
                          </p>
                        </div>

                        <Separator />

                        <div>
                          <h4 className="text-sm font-medium mb-2 flex items-center gap-2 text-slate-700">
                            <span className="h-2 w-2 rounded-full bg-primary"></span>
                            Match Analysis
                          </h4>
                          <div className="bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 ${(candidate.score ?? 0) >= 90
                                ? "bg-emerald-500"
                                : (candidate.score ?? 0) >= 70
                                  ? "bg-green-500"
                                  : (candidate.score ?? 0) >= 40
                                    ? "bg-amber-500"
                                    : "bg-red-500"
                                }`}
                              style={{ width: `${candidate.score ?? 0}%` }}
                            />
                          </div>
                        </div>

                        <div
                          className={`p-3 rounded-lg ${feedback.category === "exceptional"
                            ? "bg-emerald-50"
                            : feedback.category === "high"
                              ? "bg-green-50"
                              : feedback.category === "medium"
                                ? "bg-amber-50"
                                : "bg-red-50"
                            }`}
                        >
                          <div className="flex gap-2">
                            {getFeedbackIcon(feedback.category)}
                            <p className="text-sm">{feedback.text}</p>
                          </div>
                        </div>
                      </CardContent>

                      {candidate.linkedin_url && (
                        <CardFooter className="pt-0 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full group-hover:bg-slate-50"
                            asChild
                          >
                            <a
                              href={candidate.linkedin_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-2"
                            >
                              <ExternalLinkIcon className="h-3 w-3" />
                              View LinkedIn Profile
                            </a>
                          </Button>
                        </CardFooter>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Interview Questions Panel */}
            <div className="lg:sticky lg:top-8 space-y-4">
              <Card className="border-none shadow-lg bg-white rounded-xl overflow-hidden">
                <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-white">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquareIcon className="h-4 w-4 text-primary" />
                    Interview Questions
                  </CardTitle>
                  <CardDescription>
                    {selectedCandidate
                      ? `Suggested questions for ${selectedCandidate.name}`
                      : "Select a candidate to see suggested questions"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  {selectedCandidate ? (
                    <ScrollArea className="h-[calc(100vh-300px)] pr-4">
                      <div className="space-y-4">
                        {generateInterviewQuestions(
                          selectedCandidate.score ?? 0,
                          selectedCandidate.skills_experience,
                        ).map((question, index) => (
                          <div
                            key={index}
                            className="p-4 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors"
                          >
                            <div className="flex gap-3">
                              <span className="bg-primary/10 text-primary h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium">
                                {index + 1}
                              </span>
                              <p className="text-sm text-slate-700">
                                {question}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="text-center py-12 text-slate-500">
                      <MessageSquareIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-sm">
                        Select a candidate to view suggested interview questions
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card
                key={i}
                className="border-none shadow-lg bg-white rounded-xl overflow-hidden"
              >
                <CardHeader className="pb-3 border-b">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                  <Separator />
                  <div>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-8 w-full rounded-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {hasSearched && candidates.length === 0 && !isLoading && (
          <Card className="border-none shadow-lg bg-white rounded-xl text-center py-16">
            <CardContent>
              <div className="bg-slate-100 h-24 w-24 rounded-full flex items-center justify-center mx-auto mb-6">
                <UserIcon className="h-12 w-12 text-slate-400" />
              </div>
              <h3 className="text-xl font-medium mb-2 text-slate-800">
                No matching candidates found
              </h3>
              <p className="text-slate-600 mb-6 max-w-md mx-auto">
                Try adjusting your search criteria or add more candidates to the
                platform.
              </p>
              <Button
                asChild
                className="shadow-md hover:shadow-lg transition-shadow"
              >
                <Link href="/candidates/new">Add a Candidate</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
