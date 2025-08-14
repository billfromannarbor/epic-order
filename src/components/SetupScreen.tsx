import React, { useState } from "react";
import { Settings, TOPICS, PlayerAge, Topic } from "../types/game";
import { DirectionsCard } from "./DirectionsCard";
import { DemoAnimation } from "./DemoAnimation";

interface SetupScreenProps {
    settings: Settings;
    setSettings: React.Dispatch<React.SetStateAction<Settings>>;
    onStart: () => void;
}

export function SetupScreen({ settings, setSettings, onStart }: SetupScreenProps) {
    const [showDirections, setShowDirections] = useState(false);

    return (
        <div className="grid gap-6">
            <div className="flex flex-wrap items-center gap-3">
                <button
                    onClick={() => setShowDirections((s) => !s)}
                    className="rounded-full border px-4 py-2 text-sm hover:bg-white"
                >
                    {showDirections ? "Hide directions" : "Show directions"}
                </button>
            </div>

            {showDirections && <DirectionsCard />}

            <div className="grid gap-4 rounded-2xl border bg-white p-4 shadow-sm">
                <div className="grid gap-2">
                    <label className="font-semibold">How many players</label>
                    <input
                        type="number"
                        min={1}
                        max={8}
                        value={settings.numberOfPlayers}
                        onChange={(e) =>
                            setSettings((s) => ({ ...s, numberOfPlayers: Math.max(1, Math.min(8, Number(e.target.value) || 1)) }))
                        }
                        className="w-28 rounded-lg border px-3 py-2"
                    />
                </div>

                <div className="grid gap-2">
                    <label className="font-semibold">Which best describes the youngest player?</label>
                    <select
                        value={settings.youngestPlayer}
                        onChange={(e) => setSettings((s) => ({ ...s, youngestPlayer: e.target.value as PlayerAge }))}
                        className="max-w-xs rounded-lg border px-3 py-2"
                    >
                        {(["Under 13", "13-17", "18 and older"] as const).map((age) => (
                            <option key={age} value={age}>
                                {age}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="grid gap-2">
                    <label className="font-semibold">Number of timelines</label>
                    <div className="flex gap-2">
                        {[1, 2, 3].map((n) => (
                            <RadioPill key={n} checked={settings.numberOfTimelines === n} onChange={() => setSettings((s) => ({ ...s, numberOfTimelines: n as 1 | 2 | 3 }))}>
                                {n}
                            </RadioPill>
                        ))}
                    </div>
                </div>

                <div className="grid gap-2">
                    <label className="font-semibold">Number of events per timeline</label>
                    <div className="flex gap-2">
                        {[3, 5, 7].map((n) => (
                            <RadioPill
                                key={n}
                                checked={settings.numberOfEventsPerTimeline === (n as 3 | 5 | 7)}
                                onChange={() => setSettings((s) => ({ ...s, numberOfEventsPerTimeline: n as 3 | 5 | 7 }))}
                            >
                                {n}
                            </RadioPill>
                        ))}
                    </div>
                </div>

                <div className="grid gap-2">
                    <label className="font-semibold">Choose topic</label>
                    <select
                        value={settings.topic}
                        onChange={(e) => setSettings((s) => ({ ...s, topic: e.target.value as Topic }))}
                        className="max-w-md rounded-lg border px-3 py-2"
                    >
                        {TOPICS.map((t) => (
                            <option key={t} value={t}>
                                {t}
                            </option>
                        ))}
                    </select>
                </div>

                {settings.numberOfPlayers > 1 && (
                    <div className="grid gap-2">
                        <label className="font-semibold">Seconds per turn (multiplayer)</label>
                        <input
                            type="number"
                            min={5}
                            max={120}
                            value={settings.perTurnSeconds}
                            onChange={(e) => setSettings((s) => ({ ...s, perTurnSeconds: Math.max(5, Math.min(120, Number(e.target.value) || 20)) }))}
                            className="w-28 rounded-lg border px-3 py-2"
                        />
                    </div>
                )}
            </div>

            <div>
                <button onClick={onStart} className="rounded-2xl bg-blue-600 px-6 py-3 font-semibold text-white shadow hover:bg-blue-700">
                    Start Game
                </button>
            </div>

            {/* Tiny autoplay animation to visualize gameplay */}
            <DemoAnimation />
        </div>
    );
}

function RadioPill({ children, checked, onChange }: { children: React.ReactNode; checked: boolean; onChange: () => void }) {
    return (
        <label className="cursor-pointer">
            <input type="radio" hidden checked={checked} onChange={onChange} />
            <span className={`select-none rounded-full border px-4 py-2 text-sm font-medium ${checked ? "bg-blue-600 text-white" : "bg-white"}`}>{children}</span>
        </label>
    );
}
