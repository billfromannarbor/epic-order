import React from "react";
import { Encouragement } from "./Encouragement";
import { Timeline, EventCardData, MarkStatus, ID } from "../types/game";
import { yearStr } from "../utils/gameUtils";

interface ResultsScreenProps {
    score: number;
    perfect: number;
    onPlayAgain: () => void;
    onBack: () => void;
    timelines: Timeline[];
    events: EventCardData[];
    board: Record<string, ID[]>;
    marks: Record<ID, MarkStatus>;
}

export function ResultsScreen({
    score,
    perfect,
    onPlayAgain,
    onBack,
    timelines,
    events,
    board,
    marks
}: ResultsScreenProps) {
    const pct = Math.round((score / perfect) * 100);
    const great = pct >= 90;
    const good = pct >= 60;

    // Create a map for quick event lookup
    const idToCard = Object.fromEntries(events.map((e) => [e.id, e]));

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

            {/* Completed Timelines Review */}
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-xl font-bold">Your Completed Timelines</h3>
                <div className="grid gap-4">
                    {timelines.map((timeline) => {
                        const timelineEvents = board[timeline.id] || [];
                        return (
                            <div key={timeline.id} className="rounded-2xl border bg-slate-50 p-4">
                                <div className="mb-3 flex items-center justify-between">
                                    <div className="font-semibold">{timeline.title}</div>
                                    <div className="text-sm text-slate-600">
                                        {yearStr(timeline.start)} — {yearStr(timeline.end)}
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {timelineEvents.map((eventId) => {
                                        const event = idToCard[eventId];
                                        const mark = marks[eventId] || "none";

                                        const borderColor = {
                                            green: "border-green-600",
                                            yellow: "border-yellow-500",
                                            red: "border-red-600",
                                            none: "border-gray-300"
                                        }[mark];

                                        return (
                                            <div
                                                key={eventId}
                                                className={`rounded-2xl border-2 ${borderColor} bg-white px-3 py-2 text-sm font-semibold shadow-sm`}
                                                title={`${event.tooltip} (${event.date})`}
                                            >
                                                {event.description}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
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
