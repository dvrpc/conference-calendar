import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  layout("routes/events.tsx", [
    index("routes/events._index.tsx"),
    route("new", "routes/events.new.tsx"),
    route(":eventId", "routes/events.$eventId.tsx"),
  ]),
  route("api", "routes/api.tsx"),
  route("login", "auth/login.tsx"),
  route("auth/google/callback", "auth/google/callback.ts"),
  route("logout", "auth/logout.ts"),
] satisfies RouteConfig;
