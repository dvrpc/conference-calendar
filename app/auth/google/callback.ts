import { redirect } from "react-router";

import { getGoogleUserFromCode } from "~/lib/google.server";
import { createUserSession } from "~/lib/session.server";

const ALLOWED_DOMAIN = "dvrpc.org";

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const redirectTo = url.searchParams.get("state") || "/";

  if (error || !code) {
    return redirect("/login?error=oauth");
  }

  try {
    const { user, accessToken, refreshToken } = await getGoogleUserFromCode(code);
    const emailDomain = user.email.split("@")[1];

    if (emailDomain?.toLowerCase() !== ALLOWED_DOMAIN) {
      return redirect("/login?error=domain");
    }

    return createUserSession(user, redirectTo, accessToken, refreshToken);
  } catch (err) {
    console.error("Google OAuth error:", err);
    return redirect("/login?error=oauth");
  }
}
