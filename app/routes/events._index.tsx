import { useState, useEffect, useRef } from "react";
import { redirect, useFetcher, Link } from "react-router";

import { AVAILABLE_COMMITTEES } from "~/lib/constants";
import { fetchCalendarEvents, refreshAccessToken } from "~/lib/google.server";
import { getUser, requireDvrpcEmail, updateAccessToken } from "~/lib/session.server";

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  location?: string;
  htmlLink?: string;
  extendedProperties?: {
    private?: {
      tag1?: string;
      tag2?: string;
      tag3?: string;
      tag4?: string;
      committee?: string;
    };
  };
}

export async function loader({ request }: { request: Request }) {
  await requireDvrpcEmail(request);
  const user = await getUser(request);

  if (!user?.accessToken) {
    throw redirect("/login");
  }

  const calendars = [
    {
      id: "c_defc6948a21212cdb1affa19dd136d1318e311aceaec3422f0abff44cd4e3eab@group.calendar.google.com",
      name: "Main Conference Room",
      color: "#0078ae",
    },
    {
      id: "c_11f572cbeb2d8a469726e31e5e132cb254b2f3eddc48ec0dbcb4245a99508a25@group.calendar.google.com",
      name: "External Partners",
      color: "#34a853",
    },
  ];

  const url = new URL(request.url);
  const calendarId = url.searchParams.get("calendarId") || calendars[0].id;
  const pageToken = url.searchParams.get("pageToken") || undefined;
  const startDate = url.searchParams.get("startDate") || undefined;

  let eventsResult: { events: CalendarEvent[]; nextPageToken?: string };
  try {
    eventsResult = await fetchCalendarEvents(
      user.accessToken,
      calendarId,
      20,
      pageToken,
      startDate
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized") && user.refreshToken) {
      const newTokens = await refreshAccessToken(user.refreshToken);
      if (newTokens) {
        const headers = new Headers();
        headers.set("Set-Cookie", await updateAccessToken(request, newTokens.access_token));
        eventsResult = await fetchCalendarEvents(
          newTokens.access_token,
          calendarId,
          20,
          pageToken,
          startDate
        );
        return new Response(
          JSON.stringify({
            calendars,
            events: eventsResult.events,
            nextPageToken: eventsResult.nextPageToken,
            selectedCalendarId: calendarId,
            startDate,
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              ...Object.fromEntries(headers),
            },
          }
        );
      }
    }
    return new Response(JSON.stringify({ error: "session_expired" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  return {
    calendars,
    events: eventsResult.events,
    nextPageToken: eventsResult.nextPageToken,
    selectedCalendarId: calendarId,
    startDate,
  };
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("T")[0].split("-");
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const monthIndex = parseInt(month, 10) - 1;
  return `${months[monthIndex]} ${parseInt(day, 10)}, ${year}`;
}

function formatTime(dateStr: string): string {
  const timePart = dateStr.split("T")[1];
  if (!timePart) return "";
  const [hours, minutes] = timePart.split(":");
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

function extractUrlFromHtml(html: string): string | null {
  if (!html) return null;
  const match = html.match(/href="([^"]+)"/);
  return match ? match[1] : null;
}

export default function Dashboard({
  loaderData,
}: {
  loaderData: {
    calendars: { id: string; name: string; color: string }[];
    events: CalendarEvent[];
    nextPageToken?: string;
    selectedCalendarId: string;
    startDate?: string;
  };
}) {
  const {
    calendars,
    events: initialEvents,
    nextPageToken,
    selectedCalendarId,
    startDate,
  } = loaderData;
  const fetcher = useFetcher<{
    events: CalendarEvent[];
    nextPageToken?: string;
    startDate?: string;
  }>();
  const [selectedCalendar, setSelectedCalendar] = useState(selectedCalendarId);
  const [goToDate, setGoToDate] = useState(startDate || "");
  const [committedDate, setCommittedDate] = useState(startDate || "");
  const isInitialRender = useRef(true);

  useEffect(() => {
    setGoToDate(startDate || "");
    setCommittedDate(startDate || "");
  }, [startDate]);

  const events = fetcher.data?.events ?? initialEvents;
  const hasMore = fetcher.data?.nextPageToken ?? nextPageToken;
  const isLoading = fetcher.state === "loading";

  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }
    const params = new URLSearchParams();
    params.set("calendarId", selectedCalendar);
    if (committedDate) {
      params.set("startDate", committedDate);
    }
    void fetcher.load(`/?index&${params.toString()}`);
  }, [selectedCalendar, committedDate]);

  useEffect(() => {
    if (fetcher.data && typeof fetcher.data === "object") {
      const data = fetcher.data as Record<string, unknown>;
      if ("redirect" in data && typeof data.redirect === "string") {
        window.location.href = data.redirect;
        return;
      }
      if ("error" in data && data.error === "session_expired") {
        window.location.href = "/login?error=session_expired";
        return;
      }
      if ("error" in data) {
        console.error("Fetcher error:", data.error);
      }
    }
  }, [fetcher.data]);

  const loadMore = () => {
    const nextToken = fetcher.data?.nextPageToken ?? nextPageToken;
    if (nextToken) {
      void fetcher.load(
        `/?index&calendarId=${encodeURIComponent(selectedCalendar)}&pageToken=${encodeURIComponent(nextToken)}`
      );
    }
  };

  return (
    <div>
      <title>Dashboard - Conference Calendar Admin</title>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-heading text-2xl font-bold text-gray-900 dark:text-white">
          Upcoming Events
        </h2>
        <div className="flex items-center gap-4">
          {isLoading && (
            <svg
              className="h-4 w-4 animate-spin text-gray-500 dark:text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          )}
          <label
            htmlFor="calendar-select"
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Calendar:
          </label>
          <select
            id="calendar-select"
            value={selectedCalendar}
            onChange={(e) => setSelectedCalendar(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            {calendars.map((cal) => (
              <option key={cal.id} value={cal.id}>
                {cal.name}
              </option>
            ))}
          </select>
          <Link
            to={`/new?calendarId=${encodeURIComponent(selectedCalendar)}`}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            Create Event
          </Link>
        </div>
      </div>

      <div className="mb-6 flex items-center gap-4">
        <label htmlFor="goToDate" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Go to date:
        </label>
        <input
          type="date"
          id="goToDate"
          value={goToDate}
          onChange={(e) => setGoToDate(e.target.value)}
          onBlur={(e) => {
            if (e.target.value && e.target.value !== committedDate) {
              setCommittedDate(e.target.value);
              isInitialRender.current = true;
              const params = new URLSearchParams();
              params.set("calendarId", selectedCalendar);
              params.set("startDate", e.target.value);
              void fetcher.load(`/?index&${params.toString()}`);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              isInitialRender.current = true;
              setCommittedDate(goToDate || "");
              const params = new URLSearchParams();
              params.set("calendarId", selectedCalendar);
              if (goToDate) {
                params.set("startDate", goToDate);
              }
              void fetcher.load(`/?index&${params.toString()}`);
            }
          }}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
        {committedDate && (
          <button
            type="button"
            onClick={() => {
              setGoToDate("");
              setCommittedDate("");
              isInitialRender.current = true;
              void fetcher.load(`/?index&calendarId=${encodeURIComponent(selectedCalendar)}`);
            }}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Clear
          </button>
        )}
      </div>

      {events.length === 0 && !isLoading ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-900">
          <p className="text-gray-500 dark:text-gray-400">No upcoming events found.</p>
        </div>
      ) : (
        <div>
          <div className="space-y-4">
            {events.map((event) => {
              const startDate = event.start.dateTime || event.start.date;
              const endDate = event.end.dateTime || event.end.date;
              const isAllDay = !event.start.dateTime && !!event.start.date;
              const isMultiDay =
                event.start.date && event.end.date && event.start.date !== event.end.date;

              return (
                <div
                  key={event.id}
                  className="rounded-lg border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-2 text-sm font-bold text-gray-600 dark:text-gray-300">
                        {isAllDay ? (
                          <>
                            {formatDate(startDate!)}
                            {isMultiDay && ` - ${formatDate(endDate!)}`}
                          </>
                        ) : isMultiDay ? (
                          <>
                            {formatDate(startDate!)} - {formatDate(endDate!)}
                          </>
                        ) : (
                          <>
                            {formatDate(startDate!)} {formatTime(startDate!)} -{" "}
                            {formatTime(endDate!)}
                          </>
                        )}
                      </div>
                      <Link
                        to={`/${event.id}?calendarId=${encodeURIComponent(selectedCalendar)}`}
                        className="font-heading text-xl font-semibold text-gray-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
                      >
                        {event.summary}
                      </Link>
                      {event.description &&
                        (() => {
                          const url = extractUrlFromHtml(event.description);
                          if (url) {
                            return (
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-1 block text-sm text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                              >
                                {url}
                              </a>
                            );
                          }
                          return null;
                        })()}
                      {event.location && (
                        <div className="mt-2 flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          <span>{event.location}</span>
                        </div>
                      )}
                      <div className="mt-2 flex flex-wrap gap-1">
                        {((ext) => {
                          const committeeCode = ext?.private?.committee;
                          const committee = AVAILABLE_COMMITTEES.find(
                            (c) => c.code === committeeCode
                          );
                          return committee ? (
                            <span className="inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                              {committee.name}
                            </span>
                          ) : null;
                        })(event.extendedProperties)}
                        {((ext) => {
                          const tags = [
                            ext?.private?.tag1,
                            ext?.private?.tag2,
                            ext?.private?.tag3,
                            ext?.private?.tag4,
                          ].filter((t) => t && t.trim()) as string[];
                          return tags.length > 0 ? (
                            <>
                              {tags.map((tag: string) => (
                                <span
                                  key={tag}
                                  className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                                >
                                  {tag}
                                </span>
                              ))}
                            </>
                          ) : null;
                        })(event.extendedProperties)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {hasMore && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={loadMore}
                disabled={isLoading}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                {isLoading ? "Loading..." : "Load More Events"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
