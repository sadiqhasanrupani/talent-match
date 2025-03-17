import { clsx, type ClassValue } from "clsx"
import { AlertCircleIcon, CheckCircleIcon, XCircleIcon } from "lucide-react"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getFeedback(normalizedScore: number): {
  text: string
  category: "exceptional" | "high" | "medium" | "low"
  details: string
} {
  if (normalizedScore >= 90) {
    return {
      text: "Exceptional match! Candidate is highly aligned with job requirements.",
      category: "exceptional",
      details:
        "This candidate demonstrates an exceptional match to the position requirements. Their skills and experience closely align with what you're looking for, suggesting they could be a top performer.",
    }
  } else if (normalizedScore >= 70) {
    return {
      text: "Strong match! Candidate has relevant skills for this position.",
      category: "high",
      details:
        "This candidate shows strong alignment with the job requirements. Their background suggests they have most of the key skills needed for success in this role.",
    }
  } else if (normalizedScore >= 40) {
    return {
      text: "Potential match. Further screening recommended.",
      category: "medium",
      details:
        "While this candidate shows potential, there may be some skills gaps that should be explored further. Consider focusing interview questions on these potential gaps.",
    }
  } else {
    return {
      text: "Limited alignment with job requirements.",
      category: "low",
      details:
        "This candidate's experience appears to have limited alignment with the job requirements. There may be significant skills gaps that would require substantial training.",
    }
  }
}

export function generateInterviewQuestions(normalizedScore: number, skills: string): string[] {
  const skillsList = skills
    .split(/,|\.|and/)
    .map((s) => s.trim())
    .filter(Boolean)
  const randomSkills = skillsList.sort(() => 0.5 - Math.random()).slice(0, 2)

  const questions = []

  if (normalizedScore >= 90) {
    questions.push(
      `You seem to have strong experience with ${randomSkills[0] || "relevant technologies"}. Can you describe a complex problem you solved using this skill and how your approach demonstrated expertise beyond the basics?`,
    )
    questions.push(
      `Given your strong background, how would you approach mentoring junior team members in ${
        randomSkills[1] || "this field"
      } while maintaining your own productivity?`,
    )
    questions.push(
      `What's your vision for how ${
        randomSkills[0] || "this technology"
      } will evolve in the next few years, and how do you stay ahead of these changes?`,
    )
  } else if (normalizedScore >= 70) {
    questions.push(
      `Can you walk me through a project where you used ${
        randomSkills[0] || "relevant skills"
      } to solve a business problem?`,
    )
    questions.push(
      `What approaches do you take when learning new aspects of ${
        randomSkills[1] || "technologies in this field"
      } that you haven't worked with before?`,
    )
    questions.push(
      `Describe a situation where you had to collaborate with others to implement a solution using ${
        randomSkills[0] || "your technical skills"
      }. What was your specific contribution?`,
    )
  } else if (normalizedScore >= 40) {
    questions.push(
      `While your experience with ${
        randomSkills[0] || "this area"
      } may not be extensive, what steps have you taken to develop this skill?`,
    )
    questions.push(
      `How would you approach getting up to speed quickly on ${
        randomSkills[1] || "technologies used in this role"
      } if you were hired?`,
    )
    questions.push(
      `Can you describe a time when you had to quickly learn a new technology or skill for a project? What was your approach?`,
    )
  } else {
    questions.push(
      `Though your experience doesn't directly align with ${
        randomSkills[0] || "our requirements"
      }, what transferable skills do you believe would help you succeed in this role?`,
    )
    questions.push(
      `What specifically interests you about working with ${
        randomSkills[1] || "the technologies in this position"
      } despite your different background?`,
    )
    questions.push(
      `How do you envision overcoming the learning curve to become proficient in the technical areas required for this position?`,
    )
  }

  return questions.slice(0, 3)
}

export function getBadgeVariant(
  category: "exceptional" | "high" | "medium" | "low",
): "default" | "secondary" | "destructive" | "outline" {
  switch (category) {
    case "exceptional":
      return "default"
    case "high":
      return "default"
    case "medium":
      return "secondary"
    case "low":
      return "destructive"
    default:
      return "outline"
  }
}

export function getFeedbackIcon(category: "exceptional" | "high" | "medium" | "low") {
  switch (category) {
    case "exceptional":
      return <CheckCircleIcon className="h-4 w-4 text-emerald-500" />
    case "high":
      return <CheckCircleIcon className="h-4 w-4 text-green-500" />
    case "medium":
      return <AlertCircleIcon className="h-4 w-4 text-amber-500" />
    case "low":
      return <XCircleIcon className="h-4 w-4 text-red-500" />
  }
}
