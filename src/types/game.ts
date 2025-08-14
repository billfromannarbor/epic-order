export type PlayerAge = "Under 13" | "13-17" | "18 and older";

export type Topic =
    | "American History"
    | "European History"
    | "Indian History"
    | "Middle Eastern History"
    | "Chinese History"
    | "African History"
    | "Ancient History";

export type ID = string;

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
export type MarkStatus = "none" | "green" | "yellow" | "red"; // correct / right TL wrong order / wrong TL

// Flash feedback during multiplayer turn
export type FlashStatus = "idle" | "yellow" | "red" | "green";

export const TOPICS: Topic[] = [
    "American History",
    "European History",
    "Indian History",
    "Middle Eastern History",
    "Chinese History",
    "African History",
    "Ancient History",
];
