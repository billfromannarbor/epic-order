import { useEffect, useMemo, useRef, useState } from "react";
import { DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { Settings, Timeline, EventCardData, MarkStatus, FlashStatus, ID } from "../types/game";
import { byDateAsc } from "../utils/gameUtils";
import { fetchGameData } from "../services/gameDataService";

export function useGameLogic(settings: Settings) {
  // UI step: "setup" | "playing" | "results"
  const [step, setStep] = useState<"setup" | "playing" | "results">("setup");

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

  // Derived
  const perTimelineLimit = settings.numberOfEventsPerTimeline;
  const totalEvents = settings.numberOfTimelines * settings.numberOfEventsPerTimeline;
  const allPlaced = useMemo(
    () => (board.stockpile?.length ?? 0) === 0 && timelines.every((t) => (board[t.id]?.length ?? 0) > 0),
    [board, timelines]
  );

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
      return { error: "Timeline is full." }; // no state change (auto reverts visually by not committing)
    }

    // Single-player: free move; scoring happens on Finish
    if (settings.numberOfPlayers === 1) {
      if (fromContainer === destContainer) {
        reorderInside(destContainer, fromIndex, destIndex);
      } else {
        moveBetweenContainers(fromContainer, destContainer, activeId, destIndex);
      }
      return { success: true };
    }

    // Multiplayer: immediate evaluation
    if (destContainer === "stockpile") {
      // Always allowed to drop back into stockpile
      if (fromContainer !== destContainer) moveBetweenContainers(fromContainer, destContainer, activeId, destIndex);
      else reorderInside(destContainer, fromIndex, destIndex);
      return { success: true };
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
    return { success: correct };
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

  return {
    // State
    step,
    timelines,
    events,
    board,
    marks,
    flash,
    readyText,
    numberOfPlayers: settings.numberOfPlayers,
    elapsed,
    turnRemaining,
    currentPlayer,
    perTimelineLimit,
    allPlaced,
    singleScore,
    perfectScore,
    idToCard,
    
    // Actions
    startGame,
    onDragEnd,
    finishSinglePlayer,
    resetToSetup,
  };
}
