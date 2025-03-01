"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BriefcaseIcon, UserIcon, SearchIcon } from "lucide-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Header } from "@/components/header";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header showNav={false} />

      <main className="container mx-auto px-4 py-12">
        <section className="mb-12 text-center">
          <h2 className="text-4xl font-bold mb-4">AI-Powered Job Matching</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Connect the right candidates with the right jobs using advanced AI
            matching technology.
          </p>
        </section>

        <section className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                <span>For Candidates</span>
              </CardTitle>
              <CardDescription>
                Upload your resume and find matching job opportunities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/candidates/add">
                <Button className="w-full">Add Your Profile</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BriefcaseIcon className="h-5 w-5" />
                <span>For Employers</span>
              </CardTitle>
              <CardDescription>
                Post job descriptions and find qualified candidates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/jobs/add">
                <Button className="w-full">Post a Job</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SearchIcon className="h-5 w-5" />
                <span>Search</span>
              </CardTitle>
              <CardDescription>
                Search for candidates or jobs in our database
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <Link href="/search/candidates">
                  <Button variant="outline" className="w-full">
                    Search Candidates
                  </Button>
                </Link>
                <Link href="/search/jobs">
                  <Button variant="outline" className="w-full">
                    Search Jobs
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
