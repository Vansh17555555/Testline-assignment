import type { QuizData } from "../utils/parseQuiz"
import Quiz from "../components/Quiz"
import { parseQuizData } from "../utils/parseQuiz"

async function getQuizData(): Promise<QuizData> {
  const res = await fetch("https://api.jsonserve.com/Uw5CrX")
  if (!res.ok) {
    throw new Error("Failed to fetch quiz data")
  }
  const data = await res.json()
  return parseQuizData(data)
}

export default async function Home() {
  const quizData = await getQuizData()

  return (
    <main className="min-h-screen py-8 bg-gradient-to-br from-blue-50 via-purple-50 to-blue-50">
      <div className="absolute inset-0 bg-[url('/dna-pattern.svg')] opacity-5 pointer-events-none" />
      <Quiz quizData={quizData} />
    </main>
  )
}

