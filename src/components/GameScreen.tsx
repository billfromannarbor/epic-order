import React, { useMemo } from "react";
import { DragEndEvent, DndContext } from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";
import { motion, AnimatePresence } from "framer-motion";
import { Timeline, EventCardData, MarkStatus, FlashStatus, ID } from "../types/game";
import { SortableEventCard } from "./SortableEventCard";
import { yearStr } from "../utils/gameUtils";

interface GameScreenProps {
    timelines: Timeline[];
    events: EventCardData[];
    board: Record<string, ID[]>;
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
}

export function GameScreen({
    timelines,
    events,
    board,
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
}: GameScreenProps) {
    const idToCard = useMemo(() => Object.fromEntries(events.map((e) => [e.id, e])), [events]);

    return (
        <div className="grid gap-6">
            {/* HUD */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white p-4 shadow-sm">
                {numberOfPlayers === 1 ? (
                    <div className="text-sm">
                        <span className="font-semibold">Timer:</span> {formatTime(elapsed)}
                    </div>
                ) : (
                    <div className="text-sm flex items-center gap-4">
                        <div>
                            <span className="font-semibold">Player:</span> {currentPlayer}
                        </div>
                        <div>
                            <span className="font-semibold">Time Left:</span> {turnRemaining}s
                        </div>
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
                                <div className="text-xs text-slate-600">
                                    {yearStr(tl.start)} — {yearStr(tl.end)}
                                </div>
                            </div>

                            <SortableContext items={board[tl.id] ?? []}>
                                <div className="flex min-h-[92px] flex-wrap items-stretch gap-2 rounded-xl border border-dashed bg-slate-50 p-3">
                                    {(board[tl.id] ?? []).map((id) => (
                                        <SortableEventCard
                                            key={id}
                                            card={idToCard[id]}
                                            mark={marks[id] ?? "none"}
                                            flash={flash[id] ?? "idle"}
                                        />
                                    ))}
                                    {/* Empty slots visual */}
                                    {Array.from({ length: perTimelineLimit - (board[tl.id]?.length ?? 0) }).map((_, i) => (
                                        <div
                                            key={`slot-${tl.id}-${i}`}
                                            className="h-[44px] w-[120px] rounded-xl border border-dashed border-slate-300 bg-white/40"
                                        />
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
                                <SortableEventCard
                                    key={id}
                                    card={idToCard[id]}
                                    mark={marks[id] ?? "none"}
                                    flash={flash[id] ?? "idle"}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </div>
            </DndContext>

            {/* Controls */}
            <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600">
                    {allPlaced ? "All events placed." : "Drag cards to timelines."}
                </div>
                {numberOfPlayers === 1 && allPlaced && (
                    <button
                        onClick={onFinish}
                        className="rounded-2xl bg-emerald-600 px-5 py-2 text-white shadow hover:bg-emerald-700"
                    >
                        Finish
                    </button>
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
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            className="rounded-2xl bg-white px-10 py-6 text-3xl font-extrabold"
                        >
                            {readyText}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// Helper function for formatting time
function formatTime(s: number): string {
    const m = Math.floor(s / 60)
        .toString()
        .padStart(2, "0");
    const ss = (s % 60).toString().padStart(2, "0");
    return `${m}:${ss}`;
}
