import GetQuote from "../pages/public/GetQuote";
import TrackParcel from "../pages/public/TrackParcel";
import DemoShop from "../pages/public/DemoShop";
import type { PageRoute } from "./pageRoute";

export const publicRoutes: PageRoute[] = [
  { path: "/get-a-quote", element: <GetQuote /> },
  { path: "/track", element: <TrackParcel /> },
  { path: "/track/:trackingNumber", element: <TrackParcel /> },
  // Member 10: demo online shop that books deliveries through the merchant API.
  { path: "/demo-shop", element: <DemoShop /> },
];
