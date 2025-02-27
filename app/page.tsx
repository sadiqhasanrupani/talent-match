import CandidateForm from "@/components/candidate-form";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 md:p-8 bg-gray-50">
      <div className="w-full max-w-3xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            Candidate Application
          </h1>
          <p className="text-muted-foreground mt-2">
            Submit your information to apply for this position
          </p>
        </div>
        <CandidateForm />
      </div>
    </main>
  );
}
