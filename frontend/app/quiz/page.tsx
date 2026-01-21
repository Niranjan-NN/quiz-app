"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  BrainCircuit,
  CheckCircle,
  Trophy,
  Home,
  Loader2,
} from "lucide-react";

import { apiRequest } from "@/lib/api";

type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  answer: string;
};

export default function QuizPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [topic, setTopic] = useState<string>("");
  const [difficulty, setDifficulty] = useState<string>("easy");
  const [numQuestions, setNumQuestions] = useState<number>(5);

  const [loading, setLoading] = useState<boolean>(false);

  const [quizId, setQuizId] = useState<string>("");
  const [error, setError] = useState<string>("");

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>(
    {}
  );

  const [submitted, setSubmitted] = useState<boolean>(false);
  const [result, setResult] = useState<{ score: number; total: number } | null>(
    null
  );

  
  useEffect(() => {
    const mode = searchParams.get("mode");

    if (mode === "retake") {
      const stored = localStorage.getItem("retake_quiz_data");

      if (!stored) {
        setError("No retake quiz data found. Please select an attempt again.");
        return;
      }

      try {
        const parsed = JSON.parse(stored);

        setTopic(parsed?.topic ?? "");
        setDifficulty(parsed?.difficulty ?? "easy");
        setNumQuestions(parsed?.questions?.length ?? 5);

        setQuestions(parsed?.questions ?? []);
        setQuizId("retake-local"); // fake quizId to allow UI

        setSelectedAnswers({});
        setSubmitted(false);
        setResult(null);
      } catch (e) {
        setError("Failed to load retake quiz data.");
      }
    }
  }, [searchParams]);

  
  async function handleCreateQuiz() {
    if (!topic.trim()) {
      setError("Please enter a topic.");
      return;
    }

    setError("");
    setQuizId("");
    setQuestions([]);
    setSelectedAnswers({});
    setSubmitted(false);
    setResult(null);
    setLoading(true);

    try {
      const data = await apiRequest("/quiz/create/", "POST", {
        topic,
        difficulty,
        num_questions: numQuestions,
      });

      const newQuizId = data?.quiz_id ?? "";
      setQuizId(newQuizId);

      const quizData = await apiRequest(`/quiz/${newQuizId}/`, "GET");
      setQuestions(quizData?.questions ?? []);
    } catch (err: any) {
      setError(err?.message || "Quiz creation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleSelectOption(questionId: string, option: string) {
    if (submitted) return;

    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: option,
    }));
  }

  
  async function handleSubmitQuiz() {
    if (questions.length === 0) return;

    if (Object.keys(selectedAnswers).length < questions.length) {
      if (!confirm("You haven't answered all questions. Submit anyway?")) return;
    }

    setError("");

    
    if (quizId === "retake-local") {
      let score = 0;
      for (const q of questions) {
        const selected = selectedAnswers[q.id];
        if (selected && selected === q.answer) score++;
      }

      setSubmitted(true);
      setResult({ score, total: questions.length });

      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    
    if (!quizId) return;

    try {
      const submitData = await apiRequest(`/quiz/${quizId}/submit/`, "POST", {
        answers: selectedAnswers,
      });

      setSubmitted(true);

      setResult({
        score: submitData?.score ?? 0,
        total: submitData?.total ?? questions.length,
      });

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      setError(err?.message || "Submit failed");
    }
  }

  // ---------------------------
  // VIEW 1: CREATE QUIZ FORM
  // ---------------------------
  if (!quizId && questions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <button
          onClick={() => router.push("/dashboard")}
          className="absolute top-6 left-6 flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" /> Back to Dashboard
        </button>

        <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-indigo-100 p-3 rounded-lg">
              <BrainCircuit className="w-6 h-6 text-indigo-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Generate Quiz</h1>
          </div>

          {error && (
            <p className="mb-4 text-red-600 bg-red-50 p-3 rounded-lg text-sm">
              {error}
            </p>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Topic
              </label>
              <input
                className="w-full border border-slate-200 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="Ex: React, Python, SQL..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Difficulty
                </label>
                <select
                  className="w-full border border-slate-200 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Questions
                </label>
                <input
                  className="w-full border border-slate-200 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  type="number"
                  min={5}
                  max={20}
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(Number(e.target.value))}
                />
              </div>
            </div>

            <button
              onClick={handleCreateQuiz}
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 rounded-xl mt-4 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
            >
              {loading ? <Loader2 className="animate-spin" /> : "Start Quiz"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------
  // VIEW 2: QUIZ + RESULTS
  // ---------------------------
  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (submitted || confirm("Leave quiz? Progress will be lost.")) {
                  router.push("/dashboard");
                }
              }}
              className="text-slate-500 hover:text-indigo-600 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>

            <h1 className="text-xl font-bold text-slate-800 capitalize">
              {topic} Quiz
            </h1>
          </div>

          {!submitted && (
            <div className="text-sm font-medium text-slate-500 bg-white px-3 py-1 rounded-full shadow-sm border border-slate-200">
              {Object.keys(selectedAnswers).length} / {questions.length} Answered
            </div>
          )}
        </div>

        {/* Results Banner */}
        {submitted && result && (
          <div className="mb-8 bg-white border border-indigo-100 rounded-2xl shadow-sm p-6 text-center overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>

            <Trophy className="w-12 h-12 mx-auto text-yellow-500 mb-3" />
            <h2 className="text-2xl font-bold text-slate-800">
              Quiz Completed!
            </h2>
            <p className="text-slate-500 mb-4">Here is how you performed</p>

            <div className="inline-flex items-end justify-center gap-1 mb-6">
              <span className="text-5xl font-black text-indigo-600">
                {result.score}
              </span>
              <span className="text-2xl font-bold text-slate-400 mb-1">
                / {result.total}
              </span>
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => router.push("/quiz")}
                className="px-6 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition-colors"
              >
                Create New
              </button>

              <button
                onClick={() => router.push("/dashboard")}
                className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                <Home className="w-4 h-4" /> Dashboard
              </button>
            </div>
          </div>
        )}

        {/* Questions */}
        <div className="space-y-6">
          {questions.map((q, index) => {
            const selected = selectedAnswers[q.id];
            const isCorrect = selected && selected === q.answer;

            const containerBorder = submitted
              ? isCorrect
                ? "border-green-200 bg-green-50/30"
                : "border-red-200 bg-red-50/30"
              : "border-slate-200 bg-white";

            return (
              <div
                key={q.id}
                className={`p-6 rounded-2xl shadow-sm border transition-all ${containerBorder}`}
              >
                <div className="flex gap-4 mb-4">
                  <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-bold text-sm">
                    {index + 1}
                  </span>
                  <h3 className="font-semibold text-lg text-slate-800 leading-relaxed">
                    {q.question}
                  </h3>
                </div>

                <div className="space-y-3 ml-12">
                  {q.options.map((opt, i) => {
                    let btnClass =
                      "border-slate-200 hover:bg-slate-50 hover:border-indigo-300";

                    if (submitted) {
                      if (opt === q.answer)
                        btnClass =
                          "bg-green-100 border-green-500 text-green-800 font-medium";
                      else if (selected === opt && opt !== q.answer)
                        btnClass =
                          "bg-red-100 border-red-500 text-red-800 font-medium";
                      else btnClass = "border-slate-100 opacity-60";
                    } else {
                      if (selected === opt)
                        btnClass =
                          "bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500 text-indigo-700";
                    }

                    return (
                      <button
                        key={i}
                        onClick={() => handleSelectOption(q.id, opt)}
                        disabled={submitted}
                        className={`w-full text-left p-4 rounded-xl border transition-all relative ${btnClass}`}
                      >
                        <span className="mr-2 font-mono text-xs opacity-50 uppercase">
                          {String.fromCharCode(65 + i)}.
                        </span>
                        {opt}

                        {submitted && opt === q.answer && (
                          <CheckCircle className="absolute right-4 top-4 text-green-600 w-5 h-5" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Submit Button */}
        {!submitted && (
          <div className="mt-10 flex justify-end">
            <button
              onClick={handleSubmitQuiz}
              className="bg-indigo-600 text-white text-lg font-semibold px-8 py-4 rounded-xl shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:scale-[1.02] transition-all active:scale-95"
            >
              Submit Quiz
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
