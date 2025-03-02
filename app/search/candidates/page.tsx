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
  UserIcon,
  SearchIcon,
  ArrowLeftIcon,
  ExternalLinkIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  XCircleIcon,
  BriefcaseIcon,
} from "lucide-react";
import { toast } from "sonner";
import type { CandidateMatch, JobPosting } from "@/lib/types";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

function getFeedback(normalizedScore: number): {
  text: string;
  category: "exceptional" | "high" | "medium" | "low";
  details: string;
} {
  if (normalizedScore >= 90) {
    return {
      text: "Exceptional match! Candidate is highly aligned with job requirements.",
      category: "exceptional",
      details:
        "This candidate demonstrates an exceptional match to the position requirements. Their skills and experience closely align with what you're looking for, suggesting they could be a top performer. Consider fast-tracking this candidate in your hiring process.",
    };
  } else if (normalizedScore >= 70) {
    return {
      text: "Strong match! Candidate has relevant skills for this position.",
      category: "high",
      details:
        "This candidate shows strong alignment with the job requirements. Their background suggests they have most of the key skills needed for success in this role. They would likely require minimal training to become productive.",
    };
  } else if (normalizedScore >= 40) {
    return {
      text: "Potential match. Further screening recommended to assess skill alignment.",
      category: "medium",
      details:
        "While this candidate shows potential, there may be some skills gaps that should be explored further. They have some relevant experience but might need additional training in certain areas. Consider focusing interview questions on these potential gaps.",
    };
  } else {
    return {
      text: "Limited alignment with job requirements. Consider focusing on other candidates.",
      category: "low",
      details:
        "This candidate's experience appears to have limited alignment with the job requirements. There may be significant skills gaps that would require substantial training. Unless they have unique qualities not captured in their profile, other candidates may be better suited for this role.",
    };
  }
}

// Generate tailored interview questions based on match score
function generateInterviewQuestions(
  normalizedScore: number,
  skills: string,
): string[] {
  const skillsList = skills
    .split(/,|\.|and/)
    .map((s) => s.trim())
    .filter(Boolean);
  const randomSkills = skillsList.sort(() => 0.5 - Math.random()).slice(0, 2);

  const questions = [];

  if (normalizedScore >= 90) {
    // For exceptional matches, focus on advanced capabilities and leadership
    questions.push(
      `You seem to have strong experience with ${randomSkills[0] || "relevant technologies"}. Can you describe a complex problem you solved using this skill and how your approach demonstrated expertise beyond the basics?`,
    );
    questions.push(
      `Given your strong background, how would you approach mentoring junior team members in ${randomSkills[1] || "this field"} while maintaining your own productivity?`,
    );
    questions.push(
      `What's your vision for how ${randomSkills[0] || "this technology"} will evolve in the next few years, and how do you stay ahead of these changes?`,
    );
  } else if (normalizedScore >= 70) {
    // For strong matches, focus on specific experiences and problem-solving
    questions.push(
      `Can you walk me through a project where you used ${randomSkills[0] || "relevant skills"} to solve a business problem?`,
    );
    questions.push(
      `What approaches do you take when learning new aspects of ${randomSkills[1] || "technologies in this field"} that you haven't worked with before?`,
    );
    questions.push(
      `Describe a situation where you had to collaborate with others to implement a solution using ${randomSkills[0] || "your technical skills"}. What was your specific contribution?`,
    );
  } else if (normalizedScore >= 40) {
    // For potential matches, focus on growth and skill development
    questions.push(
      `While your experience with ${randomSkills[0] || "this area"} may not be extensive, what steps have you taken to develop this skill?`,
    );
    questions.push(
      `How would you approach getting up to speed quickly on ${randomSkills[1] || "technologies used in this role"} if you were hired?`,
    );
    questions.push(
      `Can you describe a time when you had to quickly learn a new technology or skill for a project? What was your approach?`,
    );
  } else {
    // For low matches, focus on transferable skills and motivation
    questions.push(
      `Though your experience doesn't directly align with ${randomSkills[0] || "our requirements"}, what transferable skills do you believe would help you succeed in this role?`,
    );
    questions.push(
      `What specifically interests you about working with ${randomSkills[1] || "the technologies in this position"} despite your different background?`,
    );
    questions.push(
      `How do you envision overcoming the learning curve to become proficient in the technical areas required for this position?`,
    );
  }

  // Return 2-3 questions
  return questions.slice(0, 3);
}

// Get badge color based on score category
function getBadgeVariant(
  category: "exceptional" | "high" | "medium" | "low",
): "default" | "secondary" | "destructive" | "outline" {
  switch (category) {
    case "exceptional":
      return "default"; // green
    case "high":
      return "default"; // green
    case "medium":
      return "secondary"; // orange/yellow
    case "low":
      return "destructive"; // red
    default:
      return "outline";
  }
}

// Get icon based on score category
function getFeedbackIcon(category: "exceptional" | "high" | "medium" | "low") {
  switch (category) {
    case "exceptional":
      return <CheckCircleIcon className="h-4 w-4 text-emerald-500" />;
    case "high":
      return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
    case "medium":
      return <AlertCircleIcon className="h-4 w-4 text-amber-500" />;
    case "low":
      return <XCircleIcon className="h-4 w-4 text-red-500" />;
  }
}

export default function SearchCandidatesPage() {
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [candidates, setCandidates] = useState<CandidateMatch[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [jobDetails, setJobDetails] = useState<JobPosting | null>(null);

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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: jobTitle,
          description: jobDescription,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch matching candidates");
      }

      // Set job details from API response
      if (data.job) {
        setJobDetails({
          id: data.job.job_id || "unknown", // Handle potential missing job_id
          title: data.job.title,
          description: data.job.description,
        });
      }
      // The candidates already have scores and AI feedback from the API
      const candidatesWithScores = (data.matches || []).sort(
        (a: CandidateMatch, b: CandidateMatch) =>
          (b.score ?? 0) - (a.score ?? 0),
      );

      setCandidates(candidatesWithScores);
      if (data.matches && data.matches.length === 0) {
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

  // Filter candidates based on active tab
  const filteredCandidates = candidates.filter((candidate) => {
    if (activeTab === "all") return true;
    if (activeTab === "high") return (candidate.score ?? 0) >= 70;
    if (activeTab === "medium")
      return (candidate.score ?? 0) >= 40 && (candidate.score ?? 0) < 70;
    if (activeTab === "low") return (candidate.score ?? 0) < 40;
    return true;
  });

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
          Search Candidates
        </h1>
      </div>

      <Card className="mb-8 border-none shadow-md">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <BriefcaseIcon className="h-5 w-5 text-primary" />
            Find candidates matching job requirements
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="jobTitle"
                className="block text-sm font-medium mb-1"
              >
                Job Title
              </label>
              <Input
                id="jobTitle"
                placeholder="E.g. Senior React Developer"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="border-slate-300 focus-visible:ring-primary w-full"
              />
            </div>

            <div>
              <label
                htmlFor="jobDescription"
                className="block text-sm font-medium mb-1"
              >
                Job Requirements
              </label>
              <textarea
                id="jobDescription"
                placeholder="Describe the skills, experience, and qualifications required for this position..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="w-full rounded-md border-slate-300 focus-visible:ring-primary min-h-[100px] p-2"
                rows={4}
              />
            </div>

            <div className="flex justify-end">
              <Button
                onClick={searchCandidates}
                disabled={isLoading}
                className="transition-all duration-300 hover:shadow-md"
              >
                <SearchIcon className="h-4 w-4 mr-2" />
                {isLoading ? "Searching..." : "Search Candidates"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {hasSearched && candidates.length > 0 && jobDetails && (
        <>
          <Card className="mb-6 border-none shadow-sm bg-gradient-to-r from-slate-50 to-slate-100">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <BriefcaseIcon className="h-5 w-5 text-primary" />
                {jobDetails.title}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                AI-matched candidates for this position
              </p>
              <p className="text-sm text-muted-foreground">
                Job ID: {jobDetails.id}
              </p>
            </CardHeader>
            <CardContent>
              <h3 className="text-sm font-medium mb-2">Job Description</h3>
              <p className="text-sm text-muted-foreground line-clamp-4">
                {jobDetails.description}
              </p>
            </CardContent>
          </Card>

          <Tabs
            defaultValue="all"
            className="mb-6"
            onValueChange={setActiveTab}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                Results ({candidates.length} candidates)
              </h2>
              <TabsList className="bg-slate-100">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="high">Strong Matches</TabsTrigger>
                <TabsTrigger value="medium">Potential</TabsTrigger>
                <TabsTrigger value="low">Low Match</TabsTrigger>
              </TabsList>
            </div>
          </Tabs>
        </>
      )}

      {isLoading ? (
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
      ) : hasSearched && candidates.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
          <div className="bg-slate-100 h-24 w-24 rounded-full flex items-center justify-center mx-auto mb-6">
            <UserIcon className="h-12 w-12 text-slate-400" />
          </div>
          <h3 className="text-xl font-medium mb-2">
            No matching candidates found
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Try different job requirements or add more candidates to the
            platform.
          </p>
          <Link href="/candidates/new">
            <Button className="shadow-md hover:shadow-lg transition-shadow">
              Add a Candidate
            </Button>
          </Link>
        </div>
      ) : filteredCandidates.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCandidates.map((candidate, index) => {
            // Use AI-generated feedback from the API instead of local generation
            const feedback = candidate.ai_feedback || {
              text: "Candidate evaluation completed by AI.",
              category:
                candidate.score >= 70
                  ? "high"
                  : candidate.score >= 40
                    ? "medium"
                    : "low",
              details: "Review candidate profile for more details.",
            };

            return (
              <Card
                key={index}
                className="border border-slate-200 overflow-hidden hover:shadow-md transition-all duration-300 group"
              >
                <CardHeader
                  className={`pb-3 ${
                    feedback.category === "exceptional"
                      ? "bg-emerald-50"
                      : feedback.category === "high"
                        ? "bg-green-50"
                        : feedback.category === "medium"
                          ? "bg-amber-50"
                          : "bg-red-50"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{candidate.name}</CardTitle>
                    <Badge
                      variant={getBadgeVariant(feedback.category)}
                      className="ml-2"
                    >
                      {candidate.score}%
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {candidate.email}
                  </p>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-1 flex items-center gap-1">
                      <span className="inline-block h-2 w-2 rounded-full bg-primary"></span>
                      Skills & Experience
                    </h4>
                    <p className="text-sm text-muted-foreground line-clamp-3 pl-3 border-l-2 border-slate-200">
                      {candidate.skills_experience}
                    </p>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-1 flex items-center gap-1">
                      <span className="inline-block h-2 w-2 rounded-full bg-primary"></span>
                      Match Score
                    </h4>
                    <div className="bg-slate-100 h-4 rounded-full w-full overflow-hidden">
                      <div
                        className={`h-4 rounded-full ${
                          (candidate.score ?? 0) >= 90
                            ? "bg-emerald-500"
                            : (candidate.score ?? 0) >= 70
                              ? "bg-green-500"
                              : (candidate.score ?? 0) >= 40
                                ? "bg-amber-500"
                                : "bg-red-500"
                        } transition-all duration-500 ease-in-out`}
                        style={{ width: `${candidate.score ?? 0}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs font-medium">
                        {(candidate.score ?? 0) >= 90
                          ? "Exceptional Match"
                          : (candidate.score ?? 0) >= 70
                            ? "Strong Match"
                            : (candidate.score ?? 0) >= 40
                              ? "Potential Match"
                              : "Low Match"}
                      </p>
                      <p className="text-xs text-blue-600 items-center gap-1 hidden">
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
                          <rect
                            width="16"
                            height="12"
                            x="4"
                            y="8"
                            rx="2"
                          ></rect>
                          <path d="M2 14h2"></path>
                          <path d="M20 14h2"></path>
                          <path d="M15 13v2"></path>
                          <path d="M9 13v2"></path>
                        </svg>
                        Powered by Gemini AI
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-1 flex items-center gap-1">
                      <span className="inline-block h-2 w-2 rounded-full bg-primary"></span>
                      AI Feedback
                    </h4>
                    <div
                      className={`flex items-start gap-2 p-3 rounded-md ${
                        feedback.category === "exceptional"
                          ? "bg-emerald-50 border border-emerald-100"
                          : feedback.category === "high"
                            ? "bg-green-50 border border-green-100"
                            : feedback.category === "medium"
                              ? "bg-amber-50 border border-amber-100"
                              : "bg-red-50 border border-red-100"
                      }`}
                    >
                      {getFeedbackIcon(feedback.category)}
                      <div className="space-y-2">
                        <p className="text-sm font-medium">{feedback.text}</p>
                        <p className="text-xs text-muted-foreground">
                          {feedback.details}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4 hidden">
                    <h4 className="text-sm font-medium mb-1 flex items-center gap-1">
                      <span className="inline-block h-2 w-2 rounded-full bg-primary"></span>
                      Suggested Interview Questions
                    </h4>
                    <div className="space-y-2 bg-slate-50 p-3 rounded-md border border-slate-100">
                      {/* Use AI-generated interview questions from the API instead of locally generated ones */}
                      {(candidate.interview_questions || []).map(
                        (questionItem, i) => {
                          // Handle both string questions and object format with question and rationale
                          const isObjectFormat =
                            typeof questionItem === "object" &&
                            questionItem !== null;
                          const questionText = isObjectFormat
                            ? questionItem.question
                            : questionItem;
                          const rationale = isObjectFormat
                            ? questionItem.rationale
                            : null;

                          return (
                            <div key={i} className="flex gap-2">
                              <span className="bg-primary/10 text-primary h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium">
                                {i + 1}
                              </span>
                              <div>
                                <p className="text-sm">{questionText}</p>
                                {rationale && (
                                  <p className="text-xs text-muted-foreground mt-1 pl-2 border-l border-slate-200">
                                    <span className="font-medium">
                                      Why ask:
                                    </span>{" "}
                                    {rationale}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        },
                      )}
                    </div>
                  </div>
                </CardContent>
                {candidate.linkedin_url && (
                  <CardFooter className="pt-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full group-hover:bg-slate-50 transition-colors"
                      asChild
                    >
                      <a
                        href={candidate.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLinkIcon className="h-3 w-3 mr-2" />
                        View LinkedIn Profile
                      </a>
                    </Button>
                  </CardFooter>
                )}
              </Card>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
