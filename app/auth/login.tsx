export function meta() {
  return [{ title: "Login - Conference Calendar Admin" }];
}

export default function LoginPage({
  loaderData,
}: {
  loaderData: { error: string | null; googleAuthUrl: string };
}) {
  const { error, googleAuthUrl } = loaderData;

  let errorMessage = "";
  if (error === "domain") {
    errorMessage = "Please use your dvrpc.org email address to sign in.";
  } else if (error === "session_expired") {
    errorMessage = "Your session has expired. Please sign in again to continue.";
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg dark:bg-gray-900">
        <h1 className="font-heading mb-2 text-center text-3xl font-bold text-gray-900 dark:text-white">
          Conference Calendar Admin
        </h1>
        <p className="mb-8 text-center text-gray-600 dark:text-gray-400">
          Sign in to manage conference events
        </p>

        {errorMessage && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {errorMessage}
          </div>
        )}

        <a
          href={googleAuthUrl}
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Sign in with Google
        </a>

        <p className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
          Only @dvrpc.org email addresses are allowed.
        </p>
      </div>
    </main>
  );
}

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const error = url.searchParams.get("error");
  const redirectTo = url.searchParams.get("redirectTo") || "/";

  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
  const GOOGLE_REDIRECT_URI =
    process.env.GOOGLE_REDIRECT_URI || "http://localhost:5173/auth/google/callback";

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
    state: redirectTo,
  };
  const googleAuthUrl = `${rootUrl}?${new URLSearchParams(options).toString()}`;

  return { error, googleAuthUrl };
}
