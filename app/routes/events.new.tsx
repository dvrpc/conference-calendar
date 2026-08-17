import { useState } from "react";
import { redirect, Link } from "react-router";

import { TagsInput } from "~/components/tags-input";
import { UrlField } from "~/components/url-field";
import { AVAILABLE_COMMITTEES } from "~/lib/constants";
import { CALENDARS, createCalendarEvent } from "~/lib/google.server";
import { requireDvrpcEmail, getAccessToken } from "~/lib/session.server";

import type { Route } from "./+types/events.new";

const TIME_OPTIONS = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
  "21:30",
  "22:00",
  "22:30",
  "23:00",
  "23:30",
  "00:00",
  "00:30",
  "01:00",
  "01:30",
  "02:00",
  "02:30",
  "03:00",
  "03:30",
  "04:00",
  "04:30",
  "05:00",
  "05:30",
  "06:00",
  "06:30",
  "07:00",
  "07:30",
];

export async function loader({ request }: Route.LoaderArgs) {
  await requireDvrpcEmail(request);
  const accessToken = await getAccessToken(request);

  if (!accessToken) {
    throw redirect("/login");
  }

  return { calendars: CALENDARS };
}

export async function action({ request }: Route.ActionArgs) {
  await requireDvrpcEmail(request);
  const accessToken = await getAccessToken(request);

  if (!accessToken) {
    throw redirect("/login");
  }

  const formData = await request.formData();
  const calendarId = formData.get("calendarId") as string;
  const summary = formData.get("summary") as string;
  const url = formData.get("description") as string;
  const location = formData.get("location") as string;
  const startDate = formData.get("startDate") as string;
  const startTime = (formData.get("startTime") as string) || "";
  const endDate = formData.get("endDate") as string;
  const endTime = (formData.get("endTime") as string) || "";
  const isAllDay = formData.get("allDay") === "on";
  const tagsParam = formData.get("tags") as string;
  const tags = tagsParam ? tagsParam.split(",").filter((t) => t.trim()) : [];
  const committee = formData.get("committee") as string;

  const description = url ? `<a href="${url}">${url}</a>` : undefined;

  const eventData = {
    summary,
    description,
    location: location || undefined,
    start: isAllDay ? { date: startDate } : { dateTime: `${startDate}T${startTime}:00` },
    end: isAllDay ? { date: endDate } : { dateTime: `${endDate}T${endTime}:00` },
    tags: tags.length > 0 ? tags : undefined,
    committee: committee || undefined,
  };

  await createCalendarEvent(accessToken, calendarId, eventData);

  return redirect(`/?calendarId=${encodeURIComponent(calendarId)}`);
}

export default function CreateEvent({
  loaderData,
}: {
  loaderData: { calendars: typeof CALENDARS };
}) {
  const { calendars } = loaderData;

  const [allDay, setAllDay] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [summary, setSummary] = useState("");
  const [selectedCommittee, setSelectedCommittee] = useState("");
  const [calendarId, setCalendarId] = useState(calendars.primary?.id || "");

  const handleCommitteeChange = (code: string) => {
    setSelectedCommittee(code);
    if (!summary && code) {
      const committee = AVAILABLE_COMMITTEES.find((c) => c.code === code);
      if (committee) {
        setSummary(committee.name);
      }
    }
  };

  const handleStartDateChange = (newStartDate: string) => {
    setStartDate(newStartDate);
    if (!endDate) {
      setEndDate(newStartDate);
    }
  };

  const handleEndDateChange = (newEndDate: string) => {
    setEndDate(newEndDate);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <title>Create Event - Conference Calendar Admin</title>
      <div className="mb-6">
        <Link
          to="/"
          className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          &larr; Back to events
        </Link>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h1 className="font-heading mb-6 text-2xl font-bold text-gray-900 dark:text-white">
          Create Event
        </h1>

        <form method="post">
          <input type="hidden" name="calendarId" value={calendarId} />

          <div className="space-y-4">
            <div>
              <label
                htmlFor="calendarId"
                className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Calendar
              </label>
              <select
                id="calendarId"
                name="calendarIdSelect"
                value={calendarId}
                onChange={(e) => setCalendarId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                {Object.values(calendars).map((cal) => (
                  <option key={cal.id} value={cal.id}>
                    {cal.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="committee"
                className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Committee
              </label>
              <select
                id="committee"
                name="committee"
                value={selectedCommittee}
                onChange={(e) => handleCommitteeChange(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                <option value="">Select a committee...</option>
                {AVAILABLE_COMMITTEES.map((committee) => (
                  <option key={committee.code} value={committee.code}>
                    {committee.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="summary"
                className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Event Title
              </label>
              <input
                type="text"
                id="summary"
                name="summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                URL
              </label>
              <UrlField name="description" defaultValue="" />
            </div>

            <div>
              <label
                htmlFor="location"
                className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Location
              </label>
              <input
                type="text"
                id="location"
                name="location"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  name="allDay"
                  checked={allDay}
                  onChange={(e) => setAllDay(e.target.checked)}
                  className="rounded border-gray-300"
                />
                All day event
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="startDate"
                  className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Start Date
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="startTime"
                  className={`mb-1 block text-sm font-medium ${allDay ? "text-gray-400 dark:text-gray-500" : "text-gray-700 dark:text-gray-300"}`}
                >
                  Start Time
                </label>
                <select
                  id="startTime"
                  name="startTime"
                  defaultValue="09:00"
                  disabled={allDay}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
                  {TIME_OPTIONS.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="endDate"
                  className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  End Date
                </label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={endDate}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="endTime"
                  className={`mb-1 block text-sm font-medium ${allDay ? "text-gray-400 dark:text-gray-500" : "text-gray-700 dark:text-gray-300"}`}
                >
                  End Time
                </label>
                <select
                  id="endTime"
                  name="endTime"
                  defaultValue="17:00"
                  disabled={allDay}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
                  {TIME_OPTIONS.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tags
              </label>
              <TagsInput name="tags" />
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
            >
              Create Event
            </button>
            <Link
              to="/"
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
