import GetQuote from "../pages/public/GetQuote";
import TrackParcel from "../pages/public/TrackParcel";
import type { PageRoute } from "./pageRoute";

export const publicRoutes: PageRoute[] = [
  { path: "/get-a-quote", element: <GetQuote /> },
  { path: "/track", element: <TrackParcel /> },
  { path: "/track/:trackingNumber", element: <TrackParcel /> },
];
