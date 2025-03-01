"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";

interface HeaderProps {
  showNav?: boolean;
}

export function Header({ showNav = true }: HeaderProps) {
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-6 flex justify-between items-center">
        <Link href="/">
          <h1 className="text-2xl font-bold">Talent Match</h1>
        </Link>
        <div className="flex items-center gap-4">
          {showNav && (
            <nav className="flex gap-4 mr-4">
              <Link href="/candidates">
                <Button variant="ghost">Candidates</Button>
              </Link>
              <Link href="/jobs">
                <Button variant="ghost">Jobs</Button>
              </Link>
              <Link href="/search/candidates">
                <Button variant="ghost">Search Candidates</Button>
              </Link>
              <Link href="/search/jobs">
                <Button variant="ghost">Search Jobs</Button>
              </Link>
            </nav>
          )}
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}

