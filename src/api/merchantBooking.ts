import { request, isMock, wait } from "./http";
import type { MerchantOrder } from "./merchant";

// Member 10: the merchant books the delivery for an order that came in from their shop.
export type BookableOrder = MerchantOrder & { parcelId?: number | null };

export async function bookMerchantOrder(id: number): Promise<BookableOrder> {
  if (!isMock) return request<BookableOrder>("POST", `/v1/merchant/dashboard/orders/${id}/book`);
  await wait(200);
  return { id, status: "CREATED", parcelId: id } as unknown as BookableOrder;
}

/** An order is booked once it has a parcel (older orders may still say PENDING while already booked). */
export const isBooked = (o: BookableOrder): boolean => o.parcelId != null || o.status !== "PENDING";

/** Status to show: a booked order that still says PENDING is shown as booked (CREATED). */
export const shownStatus = (o: BookableOrder): BookableOrder["status"] =>
  (o.status === "PENDING" && o.parcelId != null ? ("CREATED" as BookableOrder["status"]) : o.status);
