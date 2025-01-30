"use client"
import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ArrowRight, Clock, AlertCircle } from "lucide-react"
import type { QuizData, Question, Option } from "../utils/parseQuiz"
import ReactMarkdown from "react-markdown"
import { playSound } from "../utils/sounds"

// Helper function to format time
const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

const ContentSection = ({ content }: { content: string }) => {
  if (!content) return null;
  return (
    <div 
      className="prose max-w-none"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};

const renderStudyMaterial = (question: Question, isAnswerCorrect: boolean | null) => {
  const correctAnswer = question.options.find(o => o.is_correct)

  return (
    <div className="space-y-8">
      {/* Detailed Solution */}
      <div className="prose max-w-none bg-white/50 p-6 rounded-xl">
        <h3 className="text-xl font-semibold mb-4">
          Detailed Solution
          {question.is_mandatory && 
            <span className="ml-2 text-red-500 text-sm">*Required</span>
          }
        </h3>
        <div className={`p-4 rounded-lg ${isAnswerCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <p className="font-medium mb-2">
            {isAnswerCorrect ? '✓ Correct!' : `✗ Incorrect. The correct answer was: ${correctAnswer?.description}`}
          </p>
          <ReactMarkdown>{question.detailed_solution}</ReactMarkdown>
        </div>
      </div>

      {/* Content Sections */}
      {(question.reading_material?.content_sections?.length ?? 0) > 0 && (
        <div className="bg-blue-50/50 p-6 rounded-xl">
          <h3 className="text-xl font-semibold mb-4 text-blue-800">Reading Material</h3>
          {question.reading_material?.keywords && (
            <div className="mb-4 flex flex-wrap gap-2">
              {JSON.parse(question.reading_material.keywords).map((keyword: string, index: number) => (
                <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                  {keyword}
                </span>
              ))}
            </div>
          )}
          {question.reading_material?.content_sections?.map((section, index) => (
            <div key={index} dangerouslySetInnerHTML={{ __html: section }} />
          ))}
        </div>
      )}

      {/* Practice Material */}
      {(question.reading_material?.practice_material?.content?.length ?? 0) > 0 && (
        <div className="bg-purple-50/50 p-6 rounded-xl">
          <h3 className="text-xl font-semibold mb-4 text-purple-800">Practice Material</h3>
          {question.reading_material?.practice_material?.content?.map((content, index) => (
            <div key={index} dangerouslySetInnerHTML={{ __html: content }} />
          ))}
        </div>
      )}
    </div>
  )
}

const renderProgressBar = (currentQuestion: number, totalQuestions: number) => {
  const progress = (currentQuestion / totalQuestions) * 100
  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
      <div 
        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2.5 rounded-full transition-all duration-300" 
        style={{ width: `${progress}%` }} 
      />
    </div>
  )
}

const renderQuestion = (question: Question, isAnswerCorrect: boolean | null, userAnswers: number[], currentQuestion: number, handleAnswer: (optionId: number) => void, handleNext: () => void) => {
  return (
    <div className="space-y-6">
      {/* Topic Badge */}
      {question.topic && (
        <div className="mb-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
            Topic: {question.topic}
          </span>
        </div>
      )}

      <div className="prose max-w-none">
        <h3 className="text-xl font-semibold text-gray-800">
          {question.description}
          {question.is_mandatory && 
            <span className="ml-2 text-red-500 text-sm">*Required</span>
          }
        </h3>
      </div>
      
      <div className="space-y-3">
        {question.options.map((option) => (
          <button
            key={option.id}
            onClick={() => handleAnswer(Number(option.id))}
            className={`w-full text-left p-4 rounded-xl transition-all ${
              userAnswers[currentQuestion] === option.id
                ? isAnswerCorrect 
                  ? "bg-green-500 text-white"
                  : "bg-red-500 text-white"
                : "bg-white hover:bg-gray-50"
            }`}
            disabled={isAnswerCorrect !== null}
          >
            {option.description}
          </button>
        ))}
      </div>

      {!question.is_mandatory && !isAnswerCorrect && (
        <motion.button
          onClick={handleNext}
          className="flex items-center justify-center w-full gap-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all text-lg font-medium"
        >
          Skip to Next Question
          <ArrowRight size={20} />
        </motion.button>
      )}
    </div>
  )
}

export default function Quiz({ quizData }: { quizData: QuizData }) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [userAnswers, setUserAnswers] = useState<number[]>([])
  const [showResults, setShowResults] = useState(false)
  const [showStudyMaterial, setShowStudyMaterial] = useState(false)
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null)
  const [hasStarted, setHasStarted] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(quizData.duration * 60) // Convert minutes to seconds
  const [isTimeUp, setIsTimeUp] = useState(false)
  const [mistakeCount, setMistakeCount] = useState(0)
  const [countdown, setCountdown] = useState<number | null>(null)

  // Remove sound from countdown effect
  useEffect(() => {
    if (countdown !== null) {
      if (countdown > 0) {
        const timer = setTimeout(() => {
          setCountdown(countdown - 1)
        }, 1000)
        return () => clearTimeout(timer)
      } else {
        setCountdown(null)
        setHasStarted(true)
      }
    }
  }, [countdown])

  // Timer effect
  useEffect(() => {
    if (hasStarted && !showResults && !isTimeUp) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsTimeUp(true)
            setShowResults(true)
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [hasStarted, showResults, isTimeUp])

  // Calculate score considering positive and negative marking
  const calculateScore = useCallback(() => {
    return userAnswers.reduce((score, answer, index) => {
      const correctAnswer = quizData.questions[index].options.find((o) => o.is_correct)
      const isCorrect = answer === Number(correctAnswer?.id)
      
      const correctMarks = parseFloat(quizData.correct_answer_marks)
      const negativeMarks = parseFloat(quizData.negative_marks)
      
      return score + (isCorrect ? correctMarks : (answer ? -negativeMarks : 0))
    }, 0)
  }, [userAnswers, quizData.correct_answer_marks, quizData.negative_marks, quizData.questions])

  // Modify handleAnswer to play sounds
  const handleAnswer = (optionId: number) => {
    const isCorrect = quizData.questions[currentQuestion].options.find(
      (o) => o.id === optionId
    )?.is_correct

    if (!isCorrect) {
      setMistakeCount(prev => prev + 1)
      playSound('incorrect')
    } else {
      playSound('correct')
    }

    setIsAnswerCorrect(!!isCorrect)
    setUserAnswers((prev) => {
      const newAnswers = [...prev]
      newAnswers[currentQuestion] = optionId
      return newAnswers
    })
    setShowStudyMaterial(true)
  }

  // Handle moving to next question
  const handleNext = () => {
    if (currentQuestion < quizData.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setIsAnswerCorrect(null)
      setShowStudyMaterial(false)
    } else {
      setShowResults(true)
    }
  }
  // Timer component
  const Timer = () => (
    <div className="fixed top-4 right-4 bg-white p-3 rounded-xl shadow-md border border-gray-200">
      <div className="flex items-center gap-2">
        <Clock className={`w-5 h-5 ${timeRemaining < 60 ? 'text-red-500 animate-pulse' : 'text-blue-500'}`} />
        <span className={`font-mono font-bold ${timeRemaining < 60 ? 'text-red-500' : 'text-blue-500'}`}>
          {formatTime(timeRemaining)}
        </span>
      </div>
    </div>
  )

  // Add mistake counter display
  const renderMistakeCounter = () => (
    <div className="flex items-center gap-2 text-sm font-medium">
      <span className="text-red-500">
        Mistakes: {mistakeCount}/{quizData.max_mistake_count}
      </span>
      {mistakeCount >= quizData.max_mistake_count && (
        <span className="text-red-600">Maximum mistakes reached!</span>
      )}
    </div>
  )

  // Quiz start screen
  if (!hasStarted && countdown === null) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 max-w-4xl mx-auto bg-white rounded-2xl shadow-xl"
      >
        <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          {quizData.title}
        </h1>
        <div className="space-y-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-100">
            <h2 className="text-xl font-semibold mb-4 text-blue-800">Quiz Overview</h2>
            <ul className="list-none space-y-3">
              {[
                { icon: "📝", text: `${quizData.questions.length} questions` },
                { icon: "⏱️", text: `${quizData.duration} minutes duration` },
                { icon: "✅", text: `+${quizData.correct_answer_marks} marks for correct answer` },
                { icon: "❌", text: `-${quizData.negative_marks} marks for wrong answer` },
                { icon: "⚡", text: "Immediate feedback after each answer" },
                { icon: "📚", text: "Study materials for incorrect answers" }
              ].map((item, index) => (
                <li key={index} className="flex items-center gap-3 text-gray-700">
                  <span className="text-xl">{item.icon}</span>
                  {item.text}
                </li>
              ))}
            </ul>
          </div>

          {quizData.topic && (
            <div className="bg-gradient-to-br from-green-50 to-blue-50 p-6 rounded-xl border border-green-100">
              <h2 className="text-xl font-semibold mb-2 text-green-800">Topic</h2>
              <p className="text-gray-700">{quizData.topic}</p>
            </div>
          )}
          
          {quizData.description && (
            <div className="prose max-w-none bg-gray-50 p-6 rounded-xl">
              <ReactMarkdown>{quizData.description}</ReactMarkdown>
            </div>
          )}
        </div>
        
        <button
          onClick={() => setCountdown(3)}
          className="flex items-center justify-center w-full gap-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all text-lg font-medium shadow-md hover:shadow-lg"
        >
          Start Quiz
          <ArrowRight size={20} />
        </button>
      </motion.div>
    )
  }

  // Add countdown screen
  if (countdown !== null) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed inset-0 flex items-center justify-center bg-white"
      >
        <motion.div
          key={countdown}
          initial={{ scale: 2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
        >
          {countdown === 0 ? "GO!" : countdown}
        </motion.div>
      </motion.div>
    )
  }

  if (showResults) {
    const score = calculateScore()
    const maxScore = quizData.questions.length * parseFloat(quizData.correct_answer_marks)
    const percentage = (score / maxScore) * 100
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 max-w-4xl mx-auto bg-white rounded-2xl shadow-xl"
      >
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-100 mb-6">
          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Quiz Results {isTimeUp && "- Time's Up!"}
          </h2>
          
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-medium">Final Score:</span>
              <span className="text-2xl font-bold text-blue-600">{score.toFixed(1)}/{maxScore}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-1000"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="font-semibold mb-2 text-blue-800">Time Taken</h3>
              <p className="text-gray-700">
                {isTimeUp ? 
                  "Time's up! Quiz submitted automatically." :
                  `${quizData.duration * 60 - timeRemaining} seconds`
                }
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="font-semibold mb-2 text-blue-800">Scoring Breakdown</h3>
              <div className="space-y-2 text-sm">
                <p className="text-green-600">
                  Correct Answers: {userAnswers.filter((answer, index) => 
                    answer === quizData.questions[index].options.find(o => o.is_correct)?.id
                  ).length} × +{quizData.correct_answer_marks} marks
                </p>
                <p className="text-red-600">
                  Wrong Answers: {userAnswers.filter((answer, index) => 
                    answer && answer !== quizData.questions[index].options.find(o => o.is_correct)?.id
                  ).length} × -{quizData.negative_marks} marks
                </p>
                <p className="text-gray-600">
                  Unanswered: {quizData.questions.length - userAnswers.filter(Boolean).length}
                </p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="font-semibold mb-2 text-blue-800">Performance Analysis</h3>
              <p className="text-gray-700">
                {percentage >= 80 ? "🧬 Outstanding! Like a perfectly replicated DNA strand, your understanding is nearly flawless!" :
                 percentage >= 60 ? "🔬 Good work! Like a cell in metaphase, you're right in the middle of mastering this!" :
                 "🧫 Keep practicing! Like the process of mitosis, learning takes time and energy!"}
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="font-semibold mb-2 text-blue-800">Question Review</h3>
              <div className="space-y-2">
                {quizData.questions.map((question, index) => {
                  const userAnswer = userAnswers[index];
                  const correctAnswer = question.options.find(o => o.is_correct);
                  const isCorrect = userAnswer === correctAnswer?.id;

                  return (
                    <div key={index} className={`p-3 rounded-lg ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                      <p className="font-medium text-sm">Q{index + 1}: {question.description}</p>
                      <p className={`text-sm ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                        {isCorrect ? '✓ Correct' : `✗ Incorrect (Correct: ${correctAnswer?.description})`}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setCurrentQuestion(0)
              setUserAnswers([])
              setShowResults(false)
              setShowStudyMaterial(false)
              setIsAnswerCorrect(null)
              setTimeRemaining(quizData.duration * 60)
              setIsTimeUp(false)
            }}
            className="flex items-center justify-center w-full gap-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all text-lg font-medium shadow-md hover:shadow-lg"
          >
            Try Again
            <ArrowRight size={20} />
          </button>
        </div>
      </motion.div>
    )
  }
  const question = quizData.questions[currentQuestion]

  return (
    <div className="p-8 max-w-4xl mx-auto bg-white rounded-2xl shadow-xl">
      <Timer />
      
      <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        {quizData.title}
      </h1>
      
      {renderMistakeCounter()}
      
      {renderProgressBar(currentQuestion, quizData.questions.length)}
      
      <div className="flex items-center justify-between mb-6">
        <p className="text-gray-600 font-medium">
          Question {currentQuestion + 1} of {quizData.questions.length}
        </p>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-green-600">+{quizData.correct_answer_marks}</span>
          <span className="text-gray-400">/</span>
          <span className="text-red-600">-{quizData.negative_marks}</span>
        </div>
      </div>
      
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-100 mb-6">
        {!showStudyMaterial ? (
          renderQuestion(question, isAnswerCorrect, userAnswers, currentQuestion, handleAnswer, handleNext)
        ) : (
          renderStudyMaterial(question, isAnswerCorrect)
        )}
      </div>
      
      {(isAnswerCorrect || (!question.is_mandatory && showStudyMaterial)) && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <button
            onClick={handleNext}
            className="flex items-center justify-center w-full gap-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all text-lg font-medium shadow-md hover:shadow-lg"
          >
            {currentQuestion === quizData.questions.length - 1 ? "Finish Quiz" : "Next Question"}
            <ArrowRight size={20} />
          </button>
        </motion.div>
      )}
    </div>
  )
}
