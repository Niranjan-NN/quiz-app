"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, CheckCircle, XCircle, RotateCcw } from "lucide-react";

type Question = {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
  selected_answer: string | null;
  is_correct: boolean;
};

export default function AttemptDetailPage() {
  const router = useRouter();
  const params = useParams();
  const attemptId = params.attemptId as string;

  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  async function loadAttempt() {
    try {
      const res = await apiRequest(`/quiz/attempt/${attemptId}/`, "GET");
      setData(res);
    } catch (err: any) {
      setError(err.message || "Failed to load attempt details");
    }
  }

  useEffect(() => {
    loadAttempt();
  }, []);

  
  function handleRetakeSameQuestions() {
    if (!data) return;

    const payload = {
      topic: data.topic,
      difficulty: data.difficulty,
      questions: data.questions.map((q: Question) => ({
        id: q.id,
        question: q.question,
        options: q.options,
        answer: q.correct_answer, // quiz page expects `answer`
      })),
    };

    localStorage.setItem("retake_quiz_data", JSON.stringify(payload));

    // open quiz page in retake mode
    router.push("/quiz?mode=retake");
  }

  if (error) {
    return (
      <div className="min-h-screen p-6 bg-slate-50">
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 text-slate-600 mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <p className="text-red-600 font-semibold">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen p-6 bg-slate-50">
        <p className="text-slate-500">Loading attempt details...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-slate-50">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 text-slate-600 mb-6 hover:text-indigo-600"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <div className="bg-white p-6 rounded-2xl shadow-sm border mb-6">
          <h1 className="text-2xl font-bold text-slate-800 capitalize">
            {data.topic} ({data.difficulty})
          </h1>

          <p className="text-slate-500 text-sm mt-1">
            Attempted on: {new Date(data.completed_at).toLocaleString()}
          </p>

          <p className="mt-4 text-xl font-bold text-indigo-600">
            Score: {data.score} / {data.total}
          </p>

          
          <button
            onClick={handleRetakeSameQuestions}
            className="mt-5 w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 transition"
          >
            <RotateCcw className="w-4 h-4" />
            Retake Same Questions
          </button>
        </div>

        <div className="space-y-5">
          {data.questions.map((q: Question, index: number) => (
            <div key={q.id} className="bg-white p-6 rounded-2xl border shadow-sm">
              <h2 className="font-semibold text-slate-800 mb-4">
                {index + 1}. {q.question}
              </h2>

              <div className="space-y-2">
                {q.options.map((opt, i) => {
                  let style =
                    "border border-slate-200 p-3 rounded-xl w-full text-left";

                  if (opt === q.correct_answer) {
                    style += " bg-green-50 border-green-400";
                  } else if (opt === q.selected_answer && !q.is_correct) {
                    style += " bg-red-50 border-red-400";
                  }

                  return (
                    <div key={i} className={style}>
                      {String.fromCharCode(65 + i)}) {opt}
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 flex items-center gap-2">
                {q.is_correct ? (
                  <>
                    <CheckCircle className="text-green-600 w-5 h-5" />
                    <p className="text-green-700 font-semibold">Correct</p>
                  </>
                ) : (
                  <>
                    <XCircle className="text-red-600 w-5 h-5" />
                    <p className="text-red-700 font-semibold">Wrong</p>
                  </>
                )}
              </div>

              <p className="mt-2 text-sm text-slate-600">
                Your Answer:{" "}
                <span className="font-semibold">
                  {q.selected_answer || "Not Answered"}
                </span>
              </p>

              <p className="text-sm text-slate-600">
                Correct Answer:{" "}
                <span className="font-semibold">{q.correct_answer}</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
