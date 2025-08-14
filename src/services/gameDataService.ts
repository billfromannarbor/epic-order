import { Settings, Timeline, EventCardData } from "../types/game";

export async function fetchGameData(settings: Settings): Promise<{ timelines: Timeline[]; events: EventCardData[] }> {
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

    const timelines: Timeline[] = bases.map((b, i) => ({
        id: b.id,
        title: `Timeline ${i + 1}`,
        start: b.start,
        end: b.end
    }));

    const sample: EventCardData[] = [
        {
            id: "e1",
            description: "Kansas–Neb.",
            tooltip: "Kansas–Nebraska Act allows territories to decide on slavery (1854).",
            date: "1854-05-30",
            timelineId: "tl-1",
        },
        {
            id: "e2",
            description: "Dred Scott",
            tooltip: "Supreme Court's Dred Scott decision (1857).",
            date: "1857-03-06",
            timelineId: "tl-1"
        },
        {
            id: "e3",
            description: "Fort Sumter",
            tooltip: "Civil War begins at Fort Sumter (1861).",
            date: "1861-04-12",
            timelineId: "tl-1"
        },
        {
            id: "e4",
            description: "Reconstruction",
            tooltip: "Reconstruction era begins (1865).",
            date: "1865-12-01",
            timelineId: "tl-2"
        },
        {
            id: "e5",
            description: "Transcont.",
            tooltip: "Transcontinental Railroad completed (1869).",
            date: "1869-05-10",
            timelineId: "tl-2"
        },
        {
            id: "e6",
            description: "Crazy Horse",
            tooltip: "Crazy Horse killed while in U.S. custody (1877).",
            date: "1877-09-05",
            timelineId: "tl-2"
        },
        {
            id: "e7",
            description: "Prohibition",
            tooltip: "Temperance grows; early state prohibition laws (1880s).",
            date: "1881-01-01",
            timelineId: "tl-3"
        },
        {
            id: "e8",
            description: "Statue Lib.",
            tooltip: "Statue of Liberty dedicated (1886).",
            date: "1886-10-28",
            timelineId: "tl-3"
        },
        {
            id: "e9",
            description: "Spanish–Am.",
            tooltip: "Spanish–American War (1898).",
            date: "1898-04-21",
            timelineId: "tl-3"
        },
    ];

    const picked = sample
        .sort(() => Math.random() - 0.5)
        .slice(0, total)
        // force a spread across timelines if fewer timelines selected
        .map((e, i) => ({ ...e, timelineId: timelines[i % TL_COUNT].id }))
        .sort(() => Math.random() - 0.5);

    return { timelines, events: picked };
}
