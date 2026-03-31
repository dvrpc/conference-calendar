import { createCookieSessionStorage, redirect } from "react-router";

const ALLOWED_DOMAIN = "dvrpc.org";

export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  accessToken?: string;
  refreshToken?: string;
}

const sessionSecret = process.env.SESSION_SECRET || "default-secret-change-in-production";

const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "_session",
    sameSite: "lax",
    path: "/",
    httpOnly: true,
    secrets: [sessionSecret],
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
  },
});

export async function getSession(request: Request) {
  const cookie = request.headers.get("Cookie");
  return sessionStorage.getSession(cookie);
}

export async function getUser(request: Request): Promise<User | null> {
  const session = await getSession(request);
  const user = session.get("user");
  return user || null;
}

export async function getAccessToken(request: Request): Promise<string | null> {
  const user = await getUser(request);
  return user?.accessToken || null;
}

export async function clearAccessToken(request: Request): Promise<string> {
  const session = await getSession(request);
  const user = session.get("user");
  if (user) {
    user.accessToken = undefined;
    session.set("user", user);
  }
  return sessionStorage.commitSession(session);
}

export async function updateAccessToken(request: Request, accessToken: string): Promise<string> {
  const session = await getSession(request);
  const user = session.get("user");
  if (user) {
    user.accessToken = accessToken;
    session.set("user", user);
  }
  return sessionStorage.commitSession(session);
}

export async function requireUser(
  request: Request,
  redirectTo: string = new URL(request.url).pathname
): Promise<User> {
  const user = await getUser(request);
  if (!user) {
    const searchParams = new URLSearchParams([["redirectTo", redirectTo]]);
    throw redirect(`/login?${searchParams}`);
  }
  return user;
}

export async function requireDvrpcEmail(request: Request): Promise<User> {
  const user = await requireUser(request);
  const emailDomain = user.email.split("@")[1];
  if (emailDomain?.toLowerCase() !== ALLOWED_DOMAIN) {
    throw redirect("/login?error=domain");
  }
  return user;
}

export async function createUserSession(
  user: User,
  redirectTo: string,
  accessToken?: string,
  refreshToken?: string
) {
  const session = await sessionStorage.getSession();
  session.set("user", { ...user, accessToken, refreshToken });
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await sessionStorage.commitSession(session),
    },
  });
}

export async function logout(request: Request) {
  const session = await getSession(request);
  return redirect("/login", {
    headers: {
      "Set-Cookie": await sessionStorage.destroySession(session),
    },
  });
}
