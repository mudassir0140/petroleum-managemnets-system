// Fuel delivery workflow rules. Pure: no imports, so the tests can load it directly.
// The server checks every status change against these rules before it writes anything.
//
// Stored status -> the stage the users see:
//   pending-driver, pending-supplier  -> Requested
//   accepted                          -> Processing        (supplier accepted)
//   on-the-way                        -> On The Way        (supplier dispatched the truck)
//   arrived                           -> Arrived / Confirmation Pending
//   completed                         -> Completed         (supplier AND pump owner confirmed)
//   driver-rejected, supplier-rejected -> Rejected

export type Actor = "driver" | "supplier" | "owner" | "gps";

export type FlowAction =
  | "driver-accept"
  | "driver-reject"
  | "supplier-accept"
  | "supplier-reject"
  | "supplier-dispatch"
  | "arrive"
  | "supplier-confirm"
  | "owner-confirm";

interface Rule {
  actors: Actor[];
  from: string[];
  to: string;
}

// `arrived` stays put for confirmations: the request completes only after both parties confirm.
export const FLOW_RULES: Record<FlowAction, Rule> = {
  "driver-accept": { actors: ["driver"], from: ["pending-driver"], to: "pending-supplier" },
  "driver-reject": { actors: ["driver"], from: ["pending-driver"], to: "driver-rejected" },
  "supplier-accept": { actors: ["supplier"], from: ["pending-supplier"], to: "accepted" },
  "supplier-reject": { actors: ["supplier"], from: ["pending-supplier"], to: "supplier-rejected" },
  "supplier-dispatch": { actors: ["supplier"], from: ["accepted"], to: "on-the-way" },
  // Arrival comes from the truck's GPS, or from the driver when GPS is not available.
  arrive: { actors: ["gps", "driver"], from: ["on-the-way"], to: "arrived" },
  "supplier-confirm": { actors: ["supplier"], from: ["arrived"], to: "arrived" },
  "owner-confirm": { actors: ["owner"], from: ["arrived"], to: "arrived" },
};

export type TransitionResult = { ok: true; to: string } | { ok: false; status: 403 | 409; error: string };

// Checks who is acting and whether the request can take that step from its current status.
export function checkTransition(status: string, action: FlowAction, actor: Actor): TransitionResult {
  const rule = FLOW_RULES[action];
  if (!rule.actors.includes(actor)) {
    return { ok: false, status: 403, error: "Your account cannot do this step on this request" };
  }
  if (!rule.from.includes(status)) {
    return { ok: false, status: 409, error: `This request is ${status}, so this step is not allowed` };
  }
  return { ok: true, to: rule.to };
}

export interface ConfirmationState {
  supplierConfirmed: boolean;
  ownerConfirmed: boolean;
}

// What a confirmation does: a second confirmation by the same party is a duplicate, and the request
// completes once both parties have confirmed.
export function confirmationOutcome(state: ConfirmationState, who: "supplier" | "owner"): { duplicate: boolean; complete: boolean } {
  const already = who === "supplier" ? state.supplierConfirmed : state.ownerConfirmed;
  const supplierConfirmed = state.supplierConfirmed || who === "supplier";
  const ownerConfirmed = state.ownerConfirmed || who === "owner";
  return { duplicate: already, complete: supplierConfirmed && ownerConfirmed };
}

export type Stage = "requested" | "processing" | "on-the-way" | "arrived" | "completed" | "rejected";

export function requestStage(status: string): Stage | null {
  switch (status) {
    case "pending-driver":
    case "pending-supplier":
    case "sent":
    case "seen":
      return "requested";
    case "accepted":
      return "processing";
    case "on-the-way":
      return "on-the-way";
    case "arrived":
      return "arrived";
    case "completed":
    case "delivered":
      return "completed";
    case "driver-rejected":
    case "supplier-rejected":
    case "rejected":
      return "rejected";
    default:
      return null;
  }
}

export const STAGE_LABELS: Record<Stage, { en: string; ur: string }> = {
  requested: { en: "Requested", ur: "درخواست بھیجی گئی" },
  processing: { en: "Processing", ur: "پروسیسنگ" },
  "on-the-way": { en: "On The Way", ur: "راستے میں" },
  arrived: { en: "Arrived / Confirmation Pending", ur: "پہنچ گیا / تصدیق باقی" },
  completed: { en: "Completed", ur: "مکمل" },
  rejected: { en: "Rejected", ur: "مسترد" },
};

// Statuses of a request whose truck is still committed to it. The truck is Busy while any of these hold.
export const ACTIVE_REQUEST_STATUSES = ["pending-supplier", "accepted", "on-the-way", "arrived"] as const;
// Statuses that hold a truck during the driver's decision too.
export const RESERVING_REQUEST_STATUSES = ["pending-driver", ...ACTIVE_REQUEST_STATUSES] as const;
