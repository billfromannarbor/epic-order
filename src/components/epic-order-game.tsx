"use client";
import React, { useState } from "react";
import { useSensor, useSensors, PointerSensor } from "@dnd-kit/core";
import { Settings } from "../types/game";
import { useGameLogic } from "../hooks/useGameLogic";
import { SetupScreen } from "./SetupScreen";
import { GameScreen } from "./GameScreen";
import { ResultsScreen } from "./ResultsScreen";
import { Toast } from "./Toast";

export default function EpicOrderGame() {
  // --- Settings ---
  const [settings, setSettings] = useState<Settings>({
    numberOfPlayers: 1,
    youngestPlayer: "Under 13",
    numberOfTimelines: 1,
    numberOfEventsPerTimeline: 3,
    topic: "American History",
    perTurnSeconds: 20,
  });

  const sensors = useSensors(useSensor(PointerSensor));

  const {
    step,
    timelines,
    events,
    board,
    marks,
    flash,
    readyText,
    numberOfPlayers,
    elapsed,
    turnRemaining,
    currentPlayer,
    perTimelineLimit,
    allPlaced,
    singleScore,
    perfectScore,
    idToCard,
    startGame,
    onDragEnd,
    finishSinglePlayer,
    resetToSetup,
  } = useGameLogic(settings);

  // Toast state
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Wrapper for onDragEnd to handle toast messages
  const handleDragEnd = (e: any) => {
    const result = onDragEnd(e);
    if (result?.error) {
      setToastMsg(result.error);
      setTimeout(() => setToastMsg(null), 1200);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold">Epic Order — Put history in its place</h1>
          <span className="text-sm opacity-70">Prototype</span>
        </header>

        {step === "setup" && (
          <SetupScreen settings={settings} setSettings={setSettings} onStart={startGame} />
        )}

        {step === "playing" && (
          <GameScreen
            timelines={timelines}
            events={events}
            board={board}
            onDragEnd={handleDragEnd}
            marks={marks}
            flash={flash}
            sensors={sensors}
            perTimelineLimit={perTimelineLimit}
            readyText={readyText}
            numberOfPlayers={numberOfPlayers}
            elapsed={elapsed}
            turnRemaining={turnRemaining}
            currentPlayer={currentPlayer}
            onFinish={finishSinglePlayer}
            allPlaced={allPlaced}
          />
        )}

        {step === "results" && (
          <ResultsScreen
            score={singleScore}
            perfect={perfectScore}
            onPlayAgain={startGame}
            onBack={resetToSetup}
          />
        )}
      </div>

      {/* Global toast */}
      <Toast message={toastMsg} />
    </div>
  );
}
