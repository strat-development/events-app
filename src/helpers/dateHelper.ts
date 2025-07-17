import { EventData } from "@/types/types";

export const checkIsEventPast = (event: EventData) => {
    const eventDate = new Date(event.starts_at || "");
    const today = new Date();

    return eventDate < today
}