import { request } from "./http";

export interface UnassignedParcel {
  id: number;
  trackingNumber: string;
  senderName: string;
  receiverName: string;
  receiverAddress: string;
  routeSummary: string;
  weightLabel: string;
  zoneLabel: string;
  status: string;
  createdAt: string;
}

export interface CourierWorkload {
  courierId: number;
  courierName: string;
  activeCount: number;
  maxCapacity: number;
  pickedUpCount: number;
  inTransitCount: number;
  outForDeliveryCount: number;
  deliveredTodayCount: number;
  failedTodayCount: number;
}

export interface AssignedParcelItem {
  assignmentId: number;
  parcelId: number;
  trackingNumber: string;
  receiverAddress: string;
  routeSummary: string;
  status: string;
  assignedAt: string;
}

export interface CourierDetail {
  courierId: number;
  courierName: string;
  activeCount: number;
  deliveredTodayCount: number;
  failedTodayCount: number;
  parcels: AssignedParcelItem[];
}

export interface DispatcherParcel {
  id: number;
  trackingNumber: string;
  senderName: string;
  receiverName: string;
  receiverAddress: string;
  routeSummary: string;
  status: string;
  assignedCourierId: number | null;
  assignedCourierName: string | null;
  createdAt: string;
}

export interface AssignmentResult {
  assignmentId: number;
  parcelId: number;
  trackingNumber: string;
  courierId: number;
  courierName: string;
  assignedAt: string;
  reassigned: boolean;
}

export async function getUnassignedParcels(): Promise<UnassignedParcel[]> {
  return (await request(
    "GET",
    "/dispatcher/unassigned-parcels",
  )) as UnassignedParcel[];
}

export async function getCourierWorkloads(): Promise<CourierWorkload[]> {
  return (await request("GET", "/dispatcher/workloads")) as CourierWorkload[];
}

export async function getCourierDetail(
  courierId: number,
): Promise<CourierDetail> {
  return (await request(
    "GET",
    `/dispatcher/couriers/${courierId}`,
  )) as CourierDetail;
}

export async function getAllDispatcherParcels(
  query = "",
  status = "ALL",
): Promise<DispatcherParcel[]> {
  const params = new URLSearchParams();
  if (query.trim()) params.set("query", query.trim());
  if (status && status !== "ALL") params.set("status", status);
  const qs = params.toString();
  return (await request(
    "GET",
    `/dispatcher/parcels${qs ? `?${qs}` : ""}`,
  )) as DispatcherParcel[];
}

export async function assignParcel(
  parcelId: number,
  courierId: number,
  reason?: string,
): Promise<AssignmentResult> {
  return (await request("POST", "/dispatcher/assignments", {
    parcelId,
    courierId,
    reason: reason || null,
  })) as AssignmentResult;
}

export async function reassignParcel(
  parcelId: number,
  courierId: number,
  reason?: string,
): Promise<AssignmentResult> {
  return (await request("PUT", `/dispatcher/assignments/${parcelId}/reassign`, {
    parcelId,
    courierId,
    reason: reason || null,
  })) as AssignmentResult;
}
