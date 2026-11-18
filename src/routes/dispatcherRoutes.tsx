import Placeholder from "../components/Placeholder";
import AllParcelsPage from "../pages/dispatcher/AllParcelsPage";
import AssignParcelPage from "../pages/dispatcher/AssignParcelPage";
import CourierDetailPage from "../pages/dispatcher/CourierDetailPage";
import CourierWorkloadsPage from "../pages/dispatcher/CourierWorkloadsPage";
import UnassignedParcelsPage from "../pages/dispatcher/UnassignedParcelsPage";
import { accountRoutes } from "./accountRoutes";
import type { PageRoute } from "./pageRoute";

export const dispatcherRoutes: PageRoute[] = [
  { path: "unassigned-parcels", element: <UnassignedParcelsPage /> },
  {
    path: "unassigned-parcels/:parcelId/assign",
    element: <AssignParcelPage />,
  },
  { path: "courier-workloads", element: <CourierWorkloadsPage /> },
  { path: "courier-workloads/:courierId", element: <CourierDetailPage /> },
  { path: "all-parcels", element: <AllParcelsPage /> },
  { path: "notifications", element: <Placeholder /> },
  ...accountRoutes("DISPATCHER"),
];
