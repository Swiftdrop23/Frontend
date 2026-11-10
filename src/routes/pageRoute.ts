import type { ReactElement } from "react";

export interface PageRoute {
  path: string; // relative to the role's base path, e.g. "create-delivery" or "orders/:id"
  element: ReactElement;
}
