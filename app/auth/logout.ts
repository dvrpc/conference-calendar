import { logout } from "~/lib/session.server";

export async function loader({ request }: { request: Request }) {
  return logout(request);
}

export async function action({ request }: { request: Request }) {
  return logout(request);
}
