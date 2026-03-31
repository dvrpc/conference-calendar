import { Form, Link, Outlet } from "react-router";

import { getUser } from "~/lib/session.server";

export async function loader({ request }: { request: Request }) {
  const user = await getUser(request);
  return { user };
}

export default function EventsLayout({
  loaderData,
}: {
  loaderData: {
    user: { id: string; email: string; name: string; picture?: string } | null;
  };
}) {
  const { user } = loaderData;

  if (!user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg dark:bg-gray-900">
          <h1 className="font-heading mb-2 text-center text-3xl font-bold text-gray-900 dark:text-white">
            Conference Calendar Admin
          </h1>
          <p className="mb-8 text-center text-gray-600 dark:text-gray-400">
            Sign in to manage conference events
          </p>
          <Link
            to="/login"
            className="flex w-full items-center justify-center gap-3 rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </Link>
          <p className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
            Only @dvrpc.org email addresses are allowed.
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="border-b border-gray-200 bg-white px-4 py-4 dark:border-gray-700 dark:bg-gray-900">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-white">
            Conference Calendar Admin
          </h1>
          <div className="flex items-center gap-4">
            {user.picture && (
              <img src={user.picture} alt={user.name} className="h-10 w-10 rounded-full" />
            )}
            <div className="text-right">
              <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
            </div>
            <Form method="post" action="/logout">
              <button
                type="submit"
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Sign out
              </button>
            </Form>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
