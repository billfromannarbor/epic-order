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
    } catch {
        // fall through to mock
    }

    // Generate proper mock data based on settings
    const TL_COUNT = settings.numberOfTimelines;
    const PER_TL = settings.numberOfEventsPerTimeline;
    const total = TL_COUNT * PER_TL;

    // Step 1: Select historical events first
    const selectedEvents = selectHistoricalEvents(settings.topic, total);

    // Step 2: Create timelines based on the natural clustering of event dates
    const timelines = createTimelinesFromEvents(selectedEvents, TL_COUNT);

    // Step 3: Assign events to timelines and create EventCardData
    const events = assignEventsToTimelines(selectedEvents, timelines);

    // Shuffle all events so they appear in random order in the stockpile
    const shuffledEvents = [...events].sort(() => Math.random() - 0.5);

    return { timelines, events: shuffledEvents };
}

// Step 1: Select historical events based on topic
function selectHistoricalEvents(topic: string, totalEvents: number): Array<{ short: string; full: string; date: string }> {
    const topicEvents: Record<string, Array<{ short: string; full: string; date: string }>> = {
        "American History": [
            { short: "Revolution", full: "American Revolutionary War begins", date: "1775-04-19" },
            { short: "Constitution", full: "U.S. Constitution ratified", date: "1788-06-21" },
            { short: "Louisiana", full: "Louisiana Purchase expands U.S. territory", date: "1803-04-30" },
            { short: "Civil War", full: "American Civil War begins", date: "1861-04-12" },
            { short: "Reconstruction", full: "Reconstruction era begins", date: "1865-05-29" },
            { short: "Industrial", full: "Industrial Revolution in America", date: "1876-07-04" },
            { short: "Progressive", full: "Progressive Era reforms", date: "1901-09-14" },
            { short: "WWI", full: "United States enters World War I", date: "1917-04-06" },
            { short: "Great Depression", full: "Great Depression begins", date: "1929-10-29" },
            { short: "New Deal", full: "New Deal programs begin", date: "1933-03-09" },
            { short: "WWII", full: "United States enters World War II", date: "1941-12-07" },
            { short: "Cold War", full: "Cold War begins", date: "1947-03-12" },
            { short: "Civil Rights", full: "Civil Rights Movement", date: "1954-05-17" },
            { short: "Space Race", full: "Space Race begins", date: "1957-10-04" },
            { short: "Vietnam", full: "Vietnam War escalates", date: "1965-03-08" },
            { short: "Watergate", full: "Watergate scandal", date: "1972-06-17" },
            { short: "Reagan Era", full: "Reagan presidency begins", date: "1981-01-20" },
            { short: "Internet", full: "World Wide Web launched", date: "1991-08-06" },
            { short: "9/11", full: "September 11 attacks", date: "2001-09-11" },
            { short: "Great Recession", full: "Great Recession begins", date: "2007-12-01" },
            { short: "Obama", full: "Barack Obama becomes first African American president", date: "2009-01-20" },
            { short: "Pandemic", full: "COVID-19 pandemic declared", date: "2020-03-11" }
        ],
        "European History": [
            { short: "French Rev", full: "French Revolution begins", date: "1789-07-14" },
            { short: "Napoleon", full: "Napoleonic Wars begin", date: "1803-05-18" },
            { short: "Industrial Rev", full: "Industrial Revolution in Europe", date: "1769-01-05" },
            { short: "Unification", full: "German unification", date: "1871-01-18" },
            { short: "WWI", full: "World War I begins", date: "1914-08-04" },
            { short: "Russian Rev", full: "Russian Revolution", date: "1917-11-07" },
            { short: "WWII", full: "World War II in Europe begins", date: "1939-09-01" },
            { short: "Cold War", full: "Cold War in Europe", date: "1947-06-05" },
            { short: "EU", full: "European Union formed", date: "1993-11-01" },
            { short: "Euro", full: "Euro currency introduced", date: "1999-01-01" }
        ],
        "Ancient History": [
            { short: "Pyramids", full: "Great Pyramids of Giza built", date: "-2560-01-01" },
            { short: "Hammurabi", full: "Code of Hammurabi", date: "-1750-01-01" },
            { short: "Troy", full: "Trojan War", date: "-1200-01-01" },
            { short: "Olympics", full: "First Olympic Games", date: "-776-07-01" },
            { short: "Rome", full: "Rome founded", date: "-753-04-21" },
            { short: "Persian Wars", full: "Persian Wars begin", date: "-499-01-01" },
            { short: "Alexander", full: "Alexander the Great begins conquest", date: "-336-10-01" },
            { short: "Caesar", full: "Julius Caesar crosses Rubicon", date: "-49-01-10" },
            { short: "Augustus", full: "Augustus becomes first Roman emperor", date: "-27-01-16" },
            { short: "Jesus", full: "Birth of Jesus Christ", date: "-4-12-25" }
        ]
    };

    const availableEvents = topicEvents[topic] || topicEvents["American History"];

    // Shuffle and select the required number of events
    const shuffled = [...availableEvents].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, totalEvents);
}

// Step 2: Create timelines based on event date clustering
function createTimelinesFromEvents(events: Array<{ short: string; full: string; date: string }>, timelineCount: number): Timeline[] {
    // Convert dates to years for clustering
    const eventYears = events.map(event => parseInt(event.date.split('-')[0]));
    const sortedYears = [...eventYears].sort((a, b) => a - b);

    // Simple clustering: divide the year range into timelineCount segments
    const minYear = sortedYears[0];
    const maxYear = sortedYears[sortedYears.length - 1];
    const yearRange = maxYear - minYear;
    const segmentSize = Math.ceil(yearRange / timelineCount);

    const timelines: Timeline[] = [];

    for (let i = 0; i < timelineCount; i++) {
        const startYear = minYear + (i * segmentSize);
        const endYear = Math.min(startYear + segmentSize - 1, maxYear);

        timelines.push({
            id: `tl-${i + 1}`,
            title: `Timeline ${i + 1}`,
            start: `${startYear}-01-01`,
            end: `${endYear}-12-31`
        });
    }

    return timelines;
}

// Step 3: Assign events to timelines
function assignEventsToTimelines(events: Array<{ short: string; full: string; date: string }>, timelines: Timeline[]): EventCardData[] {
    const eventCards: EventCardData[] = [];

    events.forEach((event, index) => {
        const eventYear = parseInt(event.date.split('-')[0]);

        // Find which timeline this event belongs to
        let assignedTimelineId = timelines[0].id; // fallback
        for (const timeline of timelines) {
            const startYear = parseInt(timeline.start.split('-')[0]);
            const endYear = parseInt(timeline.end.split('-')[0]);

            if (eventYear >= startYear && eventYear <= endYear) {
                assignedTimelineId = timeline.id;
                break;
            }
        }

        eventCards.push({
            id: `e${index + 1}`,
            description: event.short,
            tooltip: event.full,
            date: event.date,
            timelineId: assignedTimelineId,
        });
    });

    return eventCards;
}
