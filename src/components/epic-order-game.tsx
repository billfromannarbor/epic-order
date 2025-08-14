"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion, AnimatePresence } from "framer-motion";

/*************************
 * EPIC ORDER — SINGLE FILE STARTER
 * ------------------------------------------------------------
 * Drop this component into app/page.tsx and render <EpicOrderGame/>.
 * Requires: @dnd-kit/core @dnd-kit/sortable framer-motion
 * TailwindCSS styles assumed. Remove classes if not using Tailwind.
 *************************/

// ---------------- Types & Constants ----------------
export type PlayerAge = "Under 13" | "13-17" | "18 and older";
export type Topic =
  | "American History"
  | "European History"
  | "Indian History"
  | "Middle Eastern History"
  | "Chinese History"
  | "African History"
  | "Ancient History";

type ID = string;

export interface Settings {
  numberOfPlayers: number; // 1+ supported
  youngestPlayer: PlayerAge;
  numberOfTimelines: 1 | 2 | 3;
  numberOfEventsPerTimeline: 3 | 5 | 7;
  topic: Topic;
  perTurnSeconds: number; // only used when players > 1
}

export interface Timeline {
  id: ID;
  title: string; // e.g., "Timeline 1"
  start: string; // ISO date or year string
  end: string; // ISO date or year string
}

export interface EventCardData {
  id: ID;
  description: string; // short (1-2 words)
  tooltip: string; // detailed description
  date: string; // ISO
  timelineId: ID; // the CORRECT timeline id
}

// Visual status after single-player Finish
type MarkStatus = "none" | "green" | "yellow" | "red"; // correct / right TL wrong order / wrong TL

// Flash feedback during multiplayer turn
type FlashStatus = "idle" | "yellow" | "red" | "green";

const TOPICS: Topic[] = [
  "American History",
  "European History",
  "Indian History",
  "Middle Eastern History",
  "Chinese History",
  "African History",
  "Ancient History",
];

// ---------------- Utility helpers ----------------
const byDateAsc = (a: EventCardData, b: EventCardData) => new Date(a.date).getTime() - new Date(b.date).getTime();

function chunk<T>(arr: T[], size: number): T[][] {
  const res: T[][] = [];
  for (let i = 0; i < arr.length; i += size) res.push(arr.slice(i, i + size));
  return res;
}

function yearStr(iso: string) {
  // Accepts year-only strings too
  const d = new Date(iso);
  const y = d.getUTCFullYear();
  return isNaN(y) ? iso : String(y);
}

// ---------------- Mock / Data fetch ----------------
async function fetchGameData(settings: Settings): Promise<{ timelines: Timeline[]; events: EventCardData[] }> {
  // Attempt to use user's existing API: /api/generate-game
  try {
    const res = await fetch("/api/generate-game", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        numberOfTimelines: settings.numberOfTimelines,
        numberOfEventsPerTimeline: settings.numberOfEventsPerTimeline,
        topic: settings.topic,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.timelines) && Array.isArray(data?.events)) {
        return { timelines: data.timelines, events: data.events };
      }
    }
  } catch (e) {
    // fall through to mock
  }

  // Fallback mock data — 1850-1900 American History (3 timelines example)
  const TL_COUNT = settings.numberOfTimelines;
  const PER_TL = settings.numberOfEventsPerTimeline;
  const total = TL_COUNT * PER_TL;
  const bases = [
    { id: "tl-1", start: "1850-01-01", end: "1865-12-31" },
    { id: "tl-2", start: "1866-01-01", end: "1885-12-31" },
    { id: "tl-3", start: "1886-01-01", end: "1900-12-31" },
  ].slice(0, TL_COUNT);
  const timelines: Timeline[] = bases.map((b, i) => ({ id: b.id, title: `Timeline ${i + 1}`, start: b.start, end: b.end }));

  const sample: EventCardData[] = [
    {
      id: "e1",
      description: "Kansas–Neb.",
      tooltip: "Kansas–Nebraska Act allows territories to decide on slavery (1854).",
      date: "1854-05-30",
      timelineId: "tl-1",
    },
    { id: "e2", description: "Dred Scott", tooltip: "Supreme Court's Dred Scott decision (1857).", date: "1857-03-06", timelineId: "tl-1" },
    { id: "e3", description: "Fort Sumter", tooltip: "Civil War begins at Fort Sumter (1861).", date: "1861-04-12", timelineId: "tl-1" },
    { id: "e4", description: "Reconstruction", tooltip: "Reconstruction era begins (1865).", date: "1865-12-01", timelineId: "tl-2" },
    { id: "e5", description: "Transcont.", tooltip: "Transcontinental Railroad completed (1869).", date: "1869-05-10", timelineId: "tl-2" },
    { id: "e6", description: "Crazy Horse", tooltip: "Crazy Horse killed while in U.S. custody (1877).", date: "1877-09-05", timelineId: "tl-2" },
    { id: "e7", description: "Prohibition", tooltip: "Temperance grows; early state prohibition laws (1880s).", date: "1881-01-01", timelineId: "tl-3" },
    { id: "e8", description: "Statue Lib.", tooltip: "Statue of Liberty dedicated (1886).", date: "1886-10-28", timelineId: "tl-3" },
    { id: "e9", description: "Spanish–Am.", tooltip: "Spanish–American War (1898).", date: "1898-04-21", timelineId: "tl-3" },
  ];
  const picked = sample
    .sort(() => Math.random() - 0.5)
    .slice(0, total)
    // force a spread across timelines if fewer timelines selected
    .map((e, i) => ({ ...e, timelineId: timelines[i % TL_COUNT].id }))
    .sort(() => Math.random() - 0.5);

  return { timelines, events: picked };
}

// ---------------- Sortable Item ----------------
function SortableEventCard(props: {
  card: EventCardData;
  mark: MarkStatus; // after Finish (single-player)
  flash: FlashStatus; // during multiplayer feedback
  disabled?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.card.id });
  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
  };

  const borderByStatus: Record<MarkStatus, string> = {
    none: "border-gray-300",
    green: "border-green-600",
    yellow: "border-yellow-500",
    red: "border-red-600",
  };

  const flashRing =
    props.flash === "yellow"
      ? "ring-4 ring-yellow-300"
      : props.flash === "red"
      ? "ring-4 ring-red-300"
      : props.flash === "green"
      ? "ring-4 ring-green-300"
      : "";

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={`select-none`}>
      <div
        title={props.card.tooltip}
        className={`w-full rounded-2xl border ${borderByStatus[props.mark]} bg-white shadow-sm px-3 py-2 text-center text-sm font-semibold hover:shadow-md ${
          props.disabled ? "opacity-50" : "cursor-grab active:cursor-grabbing"
        } ${flashRing}`}
      >
        {props.card.description}
      </div>
    </div>
  );
}

// ---------------- Main Component ----------------
export default function EpicOrderGame() {
  // UI step: "setup" | "playing" | "results"
  const [step, setStep] = useState<"setup" | "playing" | "results">("setup");

  // --- Settings ---
  const [settings, setSettings] = useState<Settings>({
    numberOfPlayers: 1,
    youngestPlayer: "Under 13",
    numberOfTimelines: 1,
    numberOfEventsPerTimeline: 3,
    topic: "American History",
    perTurnSeconds: 20,
  });

  // --- Data ---
  const [timelines, setTimelines] = useState<Timeline[]>([]);
  const [events, setEvents] = useState<EventCardData[]>([]);

  // Board state: mapping containerId -> event IDs array
  // containers: "stockpile" and each timeline.id
  const [board, setBoard] = useState<Record<string, ID[]>>({ stockpile: [] });

  // Single-player finish markings
  const [marks, setMarks] = useState<Record<ID, MarkStatus>>({});

  // Multiplayer: current player & scores
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [scores, setScores] = useState<number[]>([]);
  const [flash, setFlash] = useState<Record<ID, FlashStatus>>({});

  // Timing
  const [readyText, setReadyText] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0); // single-player elapsed seconds
  const [turnRemaining, setTurnRemaining] = useState(settings.perTurnSeconds); // multiplayer countdown
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const sensors = useSensors(useSensor(PointerSensor));

  // Derived
  const perTimelineLimit = settings.numberOfEventsPerTimeline;
  const totalEvents = settings.numberOfTimelines * settings.numberOfEventsPerTimeline;
  const allPlaced = useMemo(() => (board.stockpile?.length ?? 0) === 0 && timelines.every((t) => (board[t.id]?.length ?? 0) > 0), [board, timelines]);

  // ---------------- Game lifecycle ----------------
  async function startGame() {
    setStep("playing");
    setMarks({});
    setFlash({});
    setScores(Array.from({ length: settings.numberOfPlayers }, () => 0));
    setCurrentPlayer(1);
    setElapsed(0);
    setTurnRemaining(settings.perTurnSeconds);

    const { timelines: tls, events: evs } = await fetchGameData(settings);
    // Ensure total events matches settings
    let picked = evs;
    if (evs.length !== totalEvents) {
      if (evs.length > totalEvents) picked = evs.slice(0, totalEvents);
      else {
        // pad by duplicating with different ids (mock safety)
        const needed = totalEvents - evs.length;
        picked = evs.concat(
          evs.slice(0, needed).map((e, i) => ({ ...e, id: `${e.id}-x${i + 1}` }))
        );
      }
    }

    // Shuffle stockpile
    picked = [...picked].sort(() => Math.random() - 0.5);

    setTimelines(tls);
    setEvents(picked);
    setBoard({ stockpile: picked.map((e) => e.id), ...Object.fromEntries(tls.map((t) => [t.id, []])) });

    // Show READY overlay
    if (settings.numberOfPlayers === 1) {
      setReadyText("READY");
      setTimeout(() => {
        setReadyText(null);
        startSingleTimer();
      }, 1000);
    } else {
      setReadyText(`READY Player 1`);
      setTimeout(() => {
        setReadyText(null);
        startTurnTimer();
      }, 1000);
    }
  }

  function startSingleTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
  }

  function stopTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }

  function startTurnTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    setTurnRemaining(settings.perTurnSeconds);
    timerRef.current = setInterval(() => {
      setTurnRemaining((r) => {
        if (r <= 1) {
          clearInterval(timerRef.current!);
          nextPlayer();
          return settings.perTurnSeconds;
        }
        return r - 1;
      });
    }, 1000);
  }

  function nextPlayer() {
    // READY overlay then start timer
    const next = ((currentPlayer - 1 + 1) % settings.numberOfPlayers) + 1;
    setCurrentPlayer(next);
    setReadyText(`READY Player ${next}`);
    setTimeout(() => {
      setReadyText(null);
      startTurnTimer();
    }, 1000);
  }

  useEffect(() => {
    return () => stopTimer();
  }, []);

  // ---------------- Drag & Drop ----------------
  function moveBetweenContainers(sourceId: string, destId: string, itemId: ID, destIndex: number) {
    setBoard((prev) => {
      const from = prev[sourceId] ?? [];
      const to = prev[destId] ?? [];
      const fromIdx = from.indexOf(itemId);
      if (fromIdx === -1) return prev;
      const newFrom = [...from];
      newFrom.splice(fromIdx, 1);
      const newTo = [...to];
      newTo.splice(destIndex, 0, itemId);
      return { ...prev, [sourceId]: newFrom, [destId]: newTo };
    });
  }

  function reorderInside(containerId: string, fromIndex: number, toIndex: number) {
    setBoard((prev) => ({ ...prev, [containerId]: arrayMove(prev[containerId], fromIndex, toIndex) }));
  }

  // Helper to locate item and container
  function findContainerOf(itemId: ID): string | null {
    for (const key of Object.keys(board)) if (board[key].includes(itemId)) return key;
    return null;
  }

  function containerIndexOf(containerId: string, itemId: ID) {
    return (board[containerId] ?? []).indexOf(itemId);
  }

  // Validate capacity
  function wouldOverflow(timelineId: string) {
    return (board[timelineId]?.length ?? 0) >= perTimelineLimit;
  }

  // Multiplayer correctness check when dropping to a timeline
  function isCorrectDropForMultiplayer(timelineId: string, itemId: ID, insertIndex: number): { correct: boolean; reason: FlashStatus } {
    const card = events.find((e) => e.id === itemId)!;
    if (card.timelineId !== timelineId) return { correct: false, reason: "red" };
    // Check order relative to already placed in this timeline
    const tlCards = (board[timelineId] ?? []).map((id) => events.find((e) => e.id === id)!).sort(byDateAsc);
    // After insertion, the placed set becomes:
    const placedAfter = [...(board[timelineId] ?? [])];
    placedAfter.splice(insertIndex, 0, itemId);
    const placedObjs = placedAfter.map((id) => events.find((e) => e.id === id)!).sort((a, b) => byDateAsc(a, b));
    // The correct order for the subset equals sorted-by-date of those specific events.
    // Now check whether the user's proposed order (by their indices) equals the sorted order.
    const proposedOrderObjs = placedAfter.map((id) => events.find((e) => e.id === id)!);
    const correctIds = placedObjs.map((o) => o.id).join(",");
    const proposedIds = proposedOrderObjs.map((o) => o.id).join(",");
    const ok = correctIds === proposedIds;
    return { correct: ok, reason: ok ? "green" : "yellow" };
  }

  const idToCard = useMemo(() => Object.fromEntries(events.map((e) => [e.id, e])), [events]);

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over) return; // dropped outside
    const activeId = String(active.id);
    const overId = String(over.id);

    const fromContainer = findContainerOf(activeId);
    if (!fromContainer) return;

    // Determine destination container & index
    const allContainers = ["stockpile", ...timelines.map((t) => t.id)];
    const overIsContainer = allContainers.includes(overId);
    let destContainer = overIsContainer ? overId : findContainerOf(overId);
    if (!destContainer) return;

    const fromIndex = containerIndexOf(fromContainer, activeId);

    // Compute dest index
    let destIndex = (board[destContainer] ?? []).indexOf(overId);
    if (overIsContainer) destIndex = (board[destContainer] ?? []).length; // append to container
    if (destIndex < 0) destIndex = (board[destContainer] ?? []).length;

    // Capacity guard for timelines
    const droppingToTimeline = destContainer !== "stockpile";
    if (droppingToTimeline && wouldOverflow(destContainer)) {
      // bounce back with toast-like message
      toast("Timeline is full.");
      return; // no state change (auto reverts visually by not committing)
    }

    // Single-player: free move; scoring happens on Finish
    if (settings.numberOfPlayers === 1) {
      if (fromContainer === destContainer) {
        reorderInside(destContainer, fromIndex, destIndex);
      } else {
        moveBetweenContainers(fromContainer, destContainer, activeId, destIndex);
      }
      return;
    }

    // Multiplayer: immediate evaluation
    if (destContainer === "stockpile") {
      // Always allowed to drop back into stockpile
      if (fromContainer !== destContainer) moveBetweenContainers(fromContainer, destContainer, activeId, destIndex);
      else reorderInside(destContainer, fromIndex, destIndex);
      return;
    }

    const { correct, reason } = isCorrectDropForMultiplayer(destContainer, activeId, destIndex);

    if (correct) {
      // Commit move, +1 score, flash green
      if (fromContainer === destContainer) reorderInside(destContainer, fromIndex, destIndex);
      else moveBetweenContainers(fromContainer, destContainer, activeId, destIndex);
      setFlash((f) => ({ ...f, [activeId]: "green" }));
      setTimeout(() => setFlash((f) => ({ ...f, [activeId]: "idle" })), 600);
      setScores((sc) => sc.map((v, idx) => (idx === currentPlayer - 1 ? v + 1 : v)));
    } else {
      // Do NOT commit move. Flash and revert (no state change already reverts)
      setFlash((f) => ({ ...f, [activeId]: reason }));
      setTimeout(() => setFlash((f) => ({ ...f, [activeId]: "idle" })), 800);
    }

    // End of turn
    if (timerRef.current) clearInterval(timerRef.current);
    nextPlayer();
  }

  // ---------------- Single-player Finish / Scoring ----------------
  function finishSinglePlayer() {
    stopTimer();
    // Evaluate marks
    const newMarks: Record<ID, MarkStatus> = {};

    for (const tl of timelines) {
      const placedIds = board[tl.id] ?? [];
      const placedCards = placedIds.map((id) => idToCard[id]);
      const correctOrder = [...placedCards].sort(byDateAsc).map((c) => c.id);
      placedCards.forEach((card, idx) => {
        if (card.timelineId !== tl.id) newMarks[card.id] = "red";
        else if (placedIds[idx] === correctOrder[idx]) newMarks[card.id] = "green";
        else newMarks[card.id] = "yellow";
      });
    }
    // Anything still in stockpile is implicitly wrong timeline
    for (const id of board.stockpile ?? []) newMarks[id] = "red";

    setMarks(newMarks);
    setStep("results");
  }

  const singleScore = useMemo(() => {
    if (step !== "results") return 0;
    let score = 0;
    for (const id of Object.keys(marks)) {
      if (marks[id] === "green") score += 2;
      else if (marks[id] === "yellow") score += 1;
    }
    return score;
  }, [marks, step]);

  const perfectScore = totalEvents * 2;

  // ---------------- UI helpers ----------------
  function toast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 1200);
  }
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  function resetToSetup() {
    stopTimer();
    setStep("setup");
    setBoard({ stockpile: [] });
    setEvents([]);
    setMarks({});
    setFlash({});
    setElapsed(0);
    setTurnRemaining(settings.perTurnSeconds);
  }

  // ---------------- Render ----------------
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
            setBoard={setBoard}
            onDragEnd={onDragEnd}
            marks={marks}
            flash={flash}
            sensors={sensors}
            perTimelineLimit={perTimelineLimit}
            readyText={readyText}
            numberOfPlayers={settings.numberOfPlayers}
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
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black text-white px-4 py-2 text-sm shadow-lg"
          >
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------- Setup Screen ----------------
function SetupScreen({
  settings,
  setSettings,
  onStart,
}: {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  onStart: () => void;
}) {
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
            {(["Under 13", "13-17", "18 and older"] as PlayerAge[]).map((age) => (
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

function DirectionsCard() {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm text-sm leading-relaxed">
      <h3 className="mb-2 text-lg font-bold">Directions (summary)</h3>
      <ul className="list-disc pl-6 space-y-1">
        <li>Choose players, age range, timelines, events per timeline, and a topic. Press <em>Start Game</em>.</li>
        <li>Drag events from the stockpile to timelines. Oldest goes left; newest right.</li>
        <li>Each timeline has a capacity. If full, the card bounces back with a message.</li>
        <li>Single player: press <em>Finish</em> when all cards are placed to score (green/yellow/red).</li>
        <li>Multiple players: place correctly on your turn to score instantly; wrong drops bounce back.</li>
      </ul>
    </div>
  );
}

// ---------------- Game Screen ----------------
function GameScreen({
  timelines,
  events,
  board,
  setBoard,
  onDragEnd,
  marks,
  flash,
  sensors,
  perTimelineLimit,
  readyText,
  numberOfPlayers,
  elapsed,
  turnRemaining,
  currentPlayer,
  onFinish,
  allPlaced,
}: {
  timelines: Timeline[];
  events: EventCardData[];
  board: Record<string, ID[]>;
  setBoard: React.Dispatch<React.SetStateAction<Record<string, ID[]>>>;
  onDragEnd: (e: DragEndEvent) => void;
  marks: Record<ID, MarkStatus>;
  flash: Record<ID, FlashStatus>;
  sensors: any;
  perTimelineLimit: number;
  readyText: string | null;
  numberOfPlayers: number;
  elapsed: number;
  turnRemaining: number;
  currentPlayer: number;
  onFinish: () => void;
  allPlaced: boolean;
}) {
  const idToCard = useMemo(() => Object.fromEntries(events.map((e) => [e.id, e])), [events]);

  return (
    <div className="grid gap-6">
      {/* HUD */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white p-4 shadow-sm">
        {numberOfPlayers === 1 ? (
          <div className="text-sm"><span className="font-semibold">Timer:</span> {formatTime(elapsed)}</div>
        ) : (
          <div className="text-sm flex items-center gap-4">
            <div><span className="font-semibold">Player:</span> {currentPlayer}</div>
            <div><span className="font-semibold">Time Left:</span> {turnRemaining}s</div>
          </div>
        )}
        <div className="text-sm opacity-70">Capacity per timeline: {perTimelineLimit}</div>
      </div>

      {/* Timelines */}
      <DndContext onDragEnd={onDragEnd} sensors={sensors}>
        <div className="grid gap-4">
          {timelines.map((tl) => (
            <div key={tl.id} className="rounded-2xl border bg-white p-3 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <div className="font-semibold">{tl.title}</div>
                <div className="text-xs text-slate-600">{yearStr(tl.start)} — {yearStr(tl.end)}</div>
              </div>

              <SortableContext items={board[tl.id] ?? []}>
                <div className="flex min-h-[92px] flex-wrap items-stretch gap-2 rounded-xl border border-dashed bg-slate-50 p-3">
                  {(board[tl.id] ?? []).map((id) => (
                    <SortableEventCard key={id} card={idToCard[id]} mark={marks[id] ?? "none"} flash={flash[id] ?? "idle"} />
                  ))}
                  {/* Empty slots visual */}
                  {Array.from({ length: perTimelineLimit - (board[tl.id]?.length ?? 0) }).map((_, i) => (
                    <div key={`slot-${tl.id}-${i}`} className="h-[44px] w-[120px] rounded-xl border border-dashed border-slate-300 bg-white/40" />
                  ))}
                </div>
              </SortableContext>
            </div>
          ))}
        </div>

        {/* Stockpile */}
        <div className="rounded-2xl border bg-white p-3 shadow-sm">
          <div className="mb-2 text-sm font-semibold">Stockpile</div>
          <SortableContext items={board.stockpile ?? []}>
            <div className="flex flex-wrap gap-2 rounded-xl border border-dashed bg-slate-50 p-3">
              {(board.stockpile ?? []).map((id) => (
                <SortableEventCard key={id} card={idToCard[id]} mark={marks[id] ?? "none"} flash={flash[id] ?? "idle"} />
              ))}
            </div>
          </SortableContext>
        </div>
      </DndContext>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-600">{allPlaced ? "All events placed." : "Drag cards to timelines."}</div>
        {numberOfPlayers === 1 && allPlaced && (
          <button onClick={onFinish} className="rounded-2xl bg-emerald-600 px-5 py-2 text-white shadow hover:bg-emerald-700">Finish</button>
        )}
      </div>

      {/* READY overlay */}
      <AnimatePresence>
        {readyText && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-black/50"
          >
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="rounded-2xl bg-white px-10 py-6 text-3xl font-extrabold">
              {readyText}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------- Results Screen (single-player) ----------------
function ResultsScreen({ score, perfect, onPlayAgain, onBack }: { score: number; perfect: number; onPlayAgain: () => void; onBack: () => void }) {
  const pct = Math.round((score / perfect) * 100);
  const great = pct >= 90;
  const good = pct >= 60;

  return (
    <div className="grid gap-6">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="mb-2 text-2xl font-bold">Score</h2>
        <div className="text-lg">{score} / {perfect} ({pct}%)</div>
        <div className="mt-2 text-sm text-slate-700">Green = correct timeline & order (2 pts). Yellow = correct timeline, wrong order (1 pt). Red = wrong timeline (0 pts).</div>
      </div>

      <Encouragement show confetti={great} variant={great ? "great" : good ? "good" : "keep"} />

      <div className="flex gap-3">
        <button onClick={onPlayAgain} className="rounded-2xl bg-blue-600 px-6 py-3 font-semibold text-white shadow hover:bg-blue-700">Play Again</button>
        <button onClick={onBack} className="rounded-2xl border px-6 py-3 font-semibold hover:bg-white">Back to Setup</button>
      </div>
    </div>
  );
}

// ---------------- Tiny demo animation ----------------
function DemoAnimation() {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="mb-2 text-sm font-semibold">Gameplay preview</div>
      <div className="relative h-28 overflow-hidden rounded-xl border bg-slate-50">
        <motion.div className="absolute left-2 top-2 rounded-xl border bg-white px-3 py-1 text-xs font-semibold" initial={{ x: 0 }} animate={{ x: [0, 220, 440] }} transition={{ repeat: Infinity, duration: 6 }}>
          Event ➜
        </motion.div>
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2">
          <div className="h-10 flex-1 rounded-xl border border-dashed" />
          <div className="h-10 flex-1 rounded-xl border border-dashed" />
          <div className="h-10 flex-1 rounded-xl border border-dashed" />
        </div>
      </div>
    </div>
  );
}

// ---------------- Encouragement ----------------
function Encouragement({ show, confetti, variant }: { show: boolean; confetti?: boolean; variant: "great" | "good" | "keep" }) {
  if (!show) return null;
  const msg = variant === "great" ? "Phenomenal!" : variant === "good" ? "Nice work!" : "Keep going!";
  return (
    <div className="relative overflow-hidden rounded-2xl border bg-white p-6 shadow-sm">
      <div className="text-center text-2xl font-extrabold">{msg}</div>
      <div className="mt-2 text-center text-sm opacity-70">Thanks for playing. Want another round?</div>
      <AnimatePresence>
        {confetti && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pointer-events-none absolute inset-0">
            {Array.from({ length: 40 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute h-2 w-2 rounded"
                style={{ left: `${(i * 97) % 100}%`, top: -8 }}
                initial={{ y: -10, scale: 0.8, rotate: 0 }}
                animate={{ y: [0, 260], rotate: [0, 360] }}
                transition={{ duration: 1.8 + (i % 10) * 0.12, repeat: Infinity, delay: (i % 10) * 0.08 }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------- Helpers ----------------
function formatTime(s: number) {
  const m = Math.floor(s / 60)
    .toString()
    .padStart(2, "0");
  const ss = (s % 60).toString().padStart(2, "0");
  return `${m}:${ss}`;
}
