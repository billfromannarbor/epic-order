import React from "react";
import { Encouragement } from "./Encouragement";

interface ResultsScreenProps {
    score: number;
    perfect: number;
    onPlayAgain: () => void;
    onBack: () => void;
}

export function ResultsScreen({ score, perfect, onPlayAgain, onBack }: ResultsScreenProps) {
    const pct = Math.round((score / perfect) * 100);
    const great = pct >= 90;
    const good = pct >= 60;

    return (
        <div className="grid gap-6">
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <h2 className="mb-2 text-2xl font-bold">Score</h2>
                <div className="text-lg">
                    {score} / {perfect} ({pct}%)
                </div>
                <div className="mt-2 text-sm text-slate-700">
                    Green = correct timeline & order (2 pts). Yellow = correct timeline, wrong order (1 pt). Red = wrong timeline (0 pts).
                </div>
            </div>

            <Encouragement show confetti={great} variant={great ? "great" : good ? "good" : "keep"} />

            <div className="flex gap-3">
                <button
                    onClick={onPlayAgain}
                    className="rounded-2xl bg-blue-600 px-6 py-3 font-semibold text-white shadow hover:bg-blue-700"
                >
                    Play Again
                </button>
                <button
                    onClick={onBack}
                    className="rounded-2xl border px-6 py-3 font-semibold hover:bg-white"
                >
                    Back to Setup
                </button>
            </div>
        </div>
    );
}
