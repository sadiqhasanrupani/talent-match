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
  // Filter jobs based on active tab
  const filteredJobs = jobs.filter((job) => {
    const normalizedScore = normalizeScore(job.score);
    if (activeTab === "all") return true;
    if (activeTab === "high") return normalizedScore >= 70;
    if (activeTab === "medium") return normalizedScore >= 40 && normalizedScore < 70;
    if (activeTab === "low") return normalizedScore < 40;
    return true;
  });
            <h2 className="text-xl font-semibold">
              Results ({filteredJobs.length} jobs)
            </h2>
            <TabsList className="bg-slate-100">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="high">Strong Matches</TabsTrigger>
              <TabsTrigger value="medium">Potential</TabsTrigger>
              <TabsTrigger value="low">Low Match</TabsTrigger>
            </TabsList>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map((job, index) => {
            const score = job.score;
            const normalizedScore = normalizeScore(score);
            const jobDetails = getJobDetails(job);

            return (
              <Card
                key={index}
                className="border border-slate-200 overflow-hidden hover:shadow-md transition-all duration-300 group"
              >
                <CardHeader className={`pb-3 ${getScoreBackground(normalizedScore)}`}>
                    <CardTitle className="text-lg line-clamp-1">
                      {job.title}
                    </CardTitle>
                    <Badge variant={getBadgeVariant(normalizedScore)} className="ml-2">
                    <div className="bg-slate-100 h-4 rounded-full w-full overflow-hidden">
                      <div
                        className={`h-4 rounded-full ${getProgressColor(normalizedScore)} transition-all duration-500 ease-in-out`}
                        style={{ width: `${normalizedScore}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs font-medium">
                        {normalizedScore >= 70
                          ? "Strong Match"
                          : normalizedScore >= 40
                            ? "Potential Match"
                            : "Low Match"}
                      </p>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Match: {normalizedScore}% | ID: {job.job_id}
                      </p>
