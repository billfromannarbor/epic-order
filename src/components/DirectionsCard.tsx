import React from "react";

export function DirectionsCard() {
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
