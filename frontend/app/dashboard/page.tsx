"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Plus, Clock, Target, History, RotateCcw } from "lucide-react";

type Attempt = {
  attempt_id: string;
  quiz_id: string;
  topic: string;
  difficulty: string;
  score: number;
  total: number;
  completed_at: string;
};

export default function DashboardPage() {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  async function loadHistory() {
    try {
      const data = await apiRequest("/quiz/history/", "GET");
      setAttempts(data.attempts || []);
    } catch (err: any) {
      setError(err.message || "Failed to load history");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  const getScoreColor = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    if (percentage >= 80) return "text-green-600 bg-green-50 border-green-200";
    if (percentage >= 50) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "hard":
        return "bg-red-100 text-red-700";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-green-100 text-green-700";
    }
  };

  
  const handleRetake = (a: Attempt) => {
    const params = new URLSearchParams({
      topic: a.topic,
      difficulty: a.difficulty,
      numQuestions: String(a.total),
    });

    router.push(`/quiz?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
            <p className="text-slate-500 mt-1">
              Track your progress and challenge yourself.
            </p>
          </div>

          <button
            onClick={() => router.push("/quiz")}
            className="group flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 active:bg-indigo-800 transition-all shadow-lg hover:shadow-indigo-200"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
            <span className="font-semibold">New Quiz</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-6">
            {error}
          </div>
        )}

        <div className="flex items-center gap-2 mb-6">
          <History className="text-slate-400 w-5 h-5" />
          <h2 className="text-xl font-bold text-slate-700">Recent Attempts</h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-40 bg-white rounded-xl shadow-sm animate-pulse"
              ></div>
            ))}
          </div>
        ) : attempts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="text-slate-400 w-8 h-8" />
            </div>
            <p className="text-slate-600 font-medium">No attempts yet.</p>
            <p className="text-slate-400 text-sm mt-1">
              Generate your first quiz to get started!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {attempts.map((a) => (
              <div
                key={a.attempt_id}
                className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden hover:border-indigo-200"
              >
                {/* Card Click (View Details) */}
                <div
                  onClick={() => router.push(`/dashboard/attempt/${a.attempt_id}`)}
                  className="cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span
                        className={`text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide ${getDifficultyColor(
                          a.difficulty
                        )}`}
                      >
                        {a.difficulty}
                      </span>
                      <h3 className="text-lg font-bold text-slate-800 mt-2 capitalize">
                        {a.topic}
                      </h3>
                    </div>

                    <div
                      className={`flex flex-col items-center justify-center w-12 h-12 rounded-lg border ${getScoreColor(
                        a.score,
                        a.total
                      )}`}
                    >
                      <span className="text-sm font-bold">{a.score}</span>
                      <span className="text-[10px] opacity-80">/ {a.total}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-slate-400 text-xs mt-4 pt-4 border-t border-slate-50">
                    <Clock className="w-3 h-3" />
                    {new Date(a.completed_at).toLocaleDateString()} at{" "}
                    {new Date(a.completed_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>

                  <p className="text-xs text-indigo-600 mt-3 font-semibold">
                    Click to view details →
                  </p>
                </div>


              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
