import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { EventCardData, MarkStatus, FlashStatus } from "../types/game";

interface SortableEventCardProps {
    card: EventCardData;
    mark: MarkStatus; // after Finish (single-player)
    flash: FlashStatus; // during multiplayer feedback
    disabled?: boolean;
}

export function SortableEventCard({ card, mark, flash, disabled }: SortableEventCardProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id });

    const style: React.CSSProperties = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
    };

    const borderByStatus: Record<MarkStatus, string> = {
        none: "border-gray-300",
        green: "border-green-600",
        yellow: "border-yellow-500",
        red: "border-red-600",
    };

    const flashRing =
        flash === "yellow"
            ? "ring-4 ring-yellow-300"
            : flash === "red"
                ? "ring-4 ring-red-300"
                : flash === "green"
                    ? "ring-4 ring-green-300"
                    : "";

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="select-none">
            <div
                title={card.tooltip}
                className={`w-full rounded-2xl border ${borderByStatus[mark]} bg-white shadow-sm px-3 py-2 text-center text-sm font-semibold hover:shadow-md ${disabled ? "opacity-50" : "cursor-grab active:cursor-grabbing"
                    } ${flashRing}`}
            >
                {card.description}
            </div>
        </div>
    );
}
