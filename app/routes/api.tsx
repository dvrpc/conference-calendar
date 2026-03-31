import { AVAILABLE_COMMITTEES, AVAILABLE_TAGS } from "~/lib/constants";
import {
  CALENDARS,
  fetchCalendarEventsWithServiceAccount,
  type GoogleCalendarEvent,
} from "~/lib/google.server";

interface LoaderArgs {
  request: Request;
}

export async function loader({ request }: LoaderArgs) {
  const url = new URL(request.url);
  const calendar = url.searchParams.get("calendar") || "primary";
  const maxResults = parseInt(url.searchParams.get("maxResults") || "1000", 10);
  const timeMin = url.searchParams.get("timeMin") || undefined;
  const timeMax = url.searchParams.get("timeMax") || undefined;
  const committee = url.searchParams.get("committee") || undefined;
  const tagsParam = url.searchParams.get("tags");
  const tags = tagsParam
    ? tagsParam
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0)
    : undefined;

  const validCalendars = ["primary", "partners", "combined"];
  if (!validCalendars.includes(calendar)) {
    return Response.json(
      {
        success: false,
        error: `Invalid calendar parameter. Valid values are: ${validCalendars.join(", ")}`,
        availableCommittees: AVAILABLE_COMMITTEES,
        availableTags: AVAILABLE_TAGS,
      },
      { status: 400 }
    );
  }

  const calendarsToFetch: string[] =
    calendar === "combined"
      ? [CALENDARS.primary.id, CALENDARS.partners.id]
      : [CALENDARS[calendar].id];

  try {
    const allEvents: GoogleCalendarEvent[] = [];

    for (const calId of calendarsToFetch) {
      const events = await fetchCalendarEventsWithServiceAccount(
        calId,
        maxResults,
        timeMin,
        timeMax,
        committee,
        tags
      );
      allEvents.push(...events);
    }

    allEvents.sort((a, b) => {
      const aDate = a.start.dateTime || a.start.date || "";
      const bDate = b.start.dateTime || b.start.date || "";
      return aDate.localeCompare(bDate);
    });

    return Response.json({
      success: true,
      calendar: calendar,
      events: allEvents,
      filters: {
        committee: committee || null,
        tags: tags || null,
      },
      availableCommittees: AVAILABLE_COMMITTEES,
      availableTags: AVAILABLE_TAGS,
    });
  } catch (error) {
    console.error("API Error:", error);
    return Response.json({ success: false, error: "Failed to fetch events" }, { status: 500 });
  }
}
