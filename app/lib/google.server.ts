import { readFileSync } from "fs";

import type { User } from "./session.server";

import { AVAILABLE_TAGS } from "./constants";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const GOOGLE_REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI || "http://localhost:5173/auth/google/callback";
const SERVICE_ACCOUNT_KEY_PATH = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH || "";

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  location?: string;
  htmlLink?: string;
  extendedProperties?: {
    shared?: {
      tag1?: string;
      tag2?: string;
      tag3?: string;
      tag4?: string;
      committee?: string;
    };
    private?: {
      tag1?: string;
      tag2?: string;
      tag3?: string;
      tag4?: string;
      committee?: string;
    };
  };
  attendees?: { email: string; displayName?: string }[];
}

export interface CalendarEventsResponse {
  events: GoogleCalendarEvent[];
  nextPageToken?: string;
}

export const CALENDARS: Record<string, { id: string; name: string }> = {
  primary: {
    id: "c_defc6948a21212cdb1affa19dd136d1318e311aceaec3422f0abff44cd4e3eab@group.calendar.google.com",
    name: "Main Conference Room",
  },
  partners: {
    id: "c_11f572cbeb2d8a469726e31e5e132cb254b2f3eddc48ec0dbcb4245a99508a25@group.calendar.google.com",
    name: "External Partners",
  },
};

export { AVAILABLE_TAGS };

export function getGoogleAuthURL(): string {
  const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
  const options = {
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/calendar",
    ].join(" "),
    access_type: "offline",
    prompt: "consent",
  };
  const searchParams = new URLSearchParams(options);
  return `${rootUrl}?${searchParams.toString()}`;
}

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
  id_token: string;
}

interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
  verified_email: boolean;
}

interface GoogleIdTokenPayload {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  picture?: string;
  aud: string;
  iss: string;
  ati: number;
  exp: number;
}

async function getTokens(code: string): Promise<GoogleTokenResponse> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: GOOGLE_REDIRECT_URI,
    }),
  });
  return response.json();
}

interface RefreshTokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

export async function refreshAccessToken(
  refreshToken: string
): Promise<RefreshTokenResponse | null> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

function decodeIdToken(idToken: string): GoogleIdTokenPayload {
  const base64Url = idToken.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split("")
      .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join("")
  );
  return JSON.parse(jsonPayload);
}

export async function getGoogleUserFromCode(
  code: string
): Promise<{ user: User; accessToken: string; refreshToken?: string }> {
  const tokens = await getTokens(code);
  const payload = decodeIdToken(tokens.id_token);

  const user: User = {
    id: payload.sub,
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
  };

  return { user, accessToken: tokens.access_token, refreshToken: tokens.refresh_token };
}

export async function getGoogleUser(accessToken: string): Promise<GoogleUserInfo> {
  const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return response.json();
}

export async function fetchCalendarEvents(
  accessToken: string,
  calendarId: string,
  maxResults = 250,
  pageToken?: string,
  timeMin?: string
): Promise<CalendarEventsResponse> {
  const now = timeMin || new Date().toISOString();
  let url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${encodeURIComponent(now)}&maxResults=${maxResults}&singleEvents=true&orderBy=startTime&showDeleted=false`;

  if (pageToken) {
    url += `&pageToken=${encodeURIComponent(pageToken)}`;
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch calendar events: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    events: data.items || [],
    nextPageToken: data.nextPageToken,
  };
}

export async function fetchCalendarEvent(
  accessToken: string,
  calendarId: string,
  eventId: string
): Promise<GoogleCalendarEvent | null> {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      calendarId
    )}/events/${encodeURIComponent(eventId)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error(`Failed to fetch calendar event: ${response.statusText}`);
  }

  return response.json();
}

export interface UpdateEventData {
  summary: string;
  description?: string;
  location?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  tags?: string[];
  committee?: string;
}

export async function updateCalendarEvent(
  accessToken: string,
  calendarId: string,
  eventId: string,
  eventData: UpdateEventData
): Promise<GoogleCalendarEvent> {
  const { tags, committee, ...rest } = eventData;
  const body: Record<string, unknown> = { ...rest };

  const tag1 = tags?.[0] || "";
  const tag2 = tags?.[1] || "";
  const tag3 = tags?.[2] || "";
  const tag4 = tags?.[3] || "";

  body.extendedProperties = {
    private: {
      tag1,
      tag2,
      tag3,
      tag4,
      committee: committee || "",
    },
  };

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      calendarId
    )}/events/${encodeURIComponent(eventId)}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to update calendar event: ${response.statusText}`);
  }

  return response.json();
}

export async function createCalendarEvent(
  accessToken: string,
  calendarId: string,
  eventData: UpdateEventData
): Promise<GoogleCalendarEvent> {
  const { tags, committee, ...rest } = eventData;
  const body: Record<string, unknown> = { ...rest };

  const tag1 = tags?.[0] || "";
  const tag2 = tags?.[1] || "";
  const tag3 = tags?.[2] || "";
  const tag4 = tags?.[3] || "";

  body.extendedProperties = {
    private: {
      tag1,
      tag2,
      tag3,
      tag4,
      committee: committee || "",
    },
  };

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to create calendar event: ${response.statusText}`);
  }

  return response.json();
}

interface ServiceAccountCredentials {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

interface JwtPayload {
  iss: string;
  scope: string;
  aud: string;
  exp: number;
  iat: number;
}

async function base64UrlEncode(data: string): Promise<string> {
  const base64 = Buffer.from(data).toString("base64");
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

async function signJwt(payload: JwtPayload, privateKey: string): Promise<string> {
  const header = await base64UrlEncode(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payloadEncoded = await base64UrlEncode(JSON.stringify(payload));
  const signatureInput = `${header}.${payloadEncoded}`;

  const keyBuffer = Buffer.from(privateKey.replace(/\\n/g, "\n"), "utf8");
  const crypto = await import("crypto");
  const sign = crypto.createSign("RSA-SHA256");
  sign.update(signatureInput);
  const signature = sign.sign(keyBuffer);
  const signatureEncoded = signature
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  return `${signatureInput}.${signatureEncoded}`;
}

export async function getServiceAccountAccessToken(): Promise<string> {
  if (!SERVICE_ACCOUNT_KEY_PATH) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY_PATH environment variable is not set");
  }

  const credentials: ServiceAccountCredentials = JSON.parse(
    readFileSync(SERVICE_ACCOUNT_KEY_PATH, "utf8")
  );

  const now = Math.floor(Date.now() / 1000);
  const jwtPayload: JwtPayload = {
    iss: credentials.client_email,
    scope: "https://www.googleapis.com/auth/calendar.readonly",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const signedJwt = await signJwt(jwtPayload, credentials.private_key);

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: signedJwt,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get service account token: ${error}`);
  }

  const tokenResponse = await response.json();
  return tokenResponse.access_token;
}

export async function fetchCalendarEventsWithServiceAccount(
  calendarId: string,
  maxResults = 1000,
  timeMin?: string,
  timeMax?: string,
  committee?: string,
  tags?: string[]
): Promise<GoogleCalendarEvent[]> {
  const accessToken = await getServiceAccountAccessToken();
  const defaultTimeMin = timeMin || new Date().toISOString();

  const baseUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${encodeURIComponent(defaultTimeMin)}&maxResults=${maxResults}&singleEvents=true&orderBy=startTime&showDeleted=false`;

  const fetchEvents = async (filterUrl: string): Promise<GoogleCalendarEvent[]> => {
    const response = await fetch(filterUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch calendar events: ${response.statusText}`);
    }

    const data = await response.json();
    return data.items || [];
  };

  if (tags && tags.length > 0) {
    const seenEventIds = new Set<string>();
    const allEvents: GoogleCalendarEvent[] = [];

    for (const tag of tags) {
      for (let fieldNum = 1; fieldNum <= 6; fieldNum++) {
        let tagUrl = `${baseUrl}&privateExtendedProperty=tag${fieldNum}%3D${encodeURIComponent(tag)}`;
        if (timeMax) {
          tagUrl += `&timeMax=${encodeURIComponent(timeMax)}`;
        }
        if (committee) {
          tagUrl += `&privateExtendedProperty=committee%3D${encodeURIComponent(committee)}`;
        }
        const events = await fetchEvents(tagUrl);

        for (const event of events) {
          if (!seenEventIds.has(event.id)) {
            seenEventIds.add(event.id);
            allEvents.push(event);
          }
        }
      }
    }

    return allEvents;
  }

  let url = baseUrl;
  if (timeMax) {
    url += `&timeMax=${encodeURIComponent(timeMax)}`;
  }
  if (committee) {
    url += `&privateExtendedProperty=committee%3D${encodeURIComponent(committee)}`;
  }

  return fetchEvents(url);
}
