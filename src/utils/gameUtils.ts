import { EventCardData } from "../types/game";

// Sort events by date in ascending order
export const byDateAsc = (a: EventCardData, b: EventCardData) =>
    new Date(a.date).getTime() - new Date(b.date).getTime();

// Split array into chunks of specified size
export function chunk<T>(arr: T[], size: number): T[][] {
    const res: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
        res.push(arr.slice(i, i + size));
    }
    return res;
}

// Convert ISO date string to year string
export function yearStr(iso: string): string {
    // Accepts year-only strings too
    const d = new Date(iso);
    const y = d.getUTCFullYear();
    return isNaN(y) ? iso : String(y);
}

// Format seconds into MM:SS format
export function formatTime(s: number): string {
    const m = Math.floor(s / 60)
        .toString()
        .padStart(2, "0");
    const ss = (s % 60).toString().padStart(2, "0");
    return `${m}:${ss}`;
}
