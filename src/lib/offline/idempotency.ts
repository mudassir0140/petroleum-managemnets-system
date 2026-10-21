// Server side of the offline queue: a change sent again with the same Idempotency-Key is saved once.
//
// The first request with a key runs the route and keeps its answer. A repeat of that key gets the kept answer and
// the route does not run again, so a retry after a dropped connection cannot write a second record. A request that
// is still running answers 503 so the device retries later. A failed run (thrown error or 5xx) is not kept, so the
// retry runs the route again.
//
// Pure: the store and the rule for which answers are kept are passed in, so the tests run without MongoDB. The MongoDB
// store is in with-idempotency.ts.

export const IDEMPOTENCY_HEADER = "Idempotency-Key";
export const KEY_PATTERN = /^[A-Za-z0-9-]{8,64}$/;
// A claim older than this with no answer is taken over, so a crashed request does not block its retries forever.
export const STALE_CLAIM_MS = 2 * 60_000;

export interface SavedAnswer {
  status: number;
  contentType: string;
  body: string;
}

export type Claim =
  | { state: "claimed" }
  | { state: "done"; answer: SavedAnswer }
  | { state: "running" };

export interface AnswerStore {
  // Records that this request is running. Returns "claimed" if this call owns the key, the kept answer if one exists,
  // or "running" if another request holds the key.
  claim(id: string, now: number): Promise<Claim>;
  complete(id: string, answer: SavedAnswer): Promise<void>;
  release(id: string): Promise<void>;
}

function replay(answer: SavedAnswer): Response {
  return new Response(answer.body, {
    status: answer.status,
    headers: { "Content-Type": answer.contentType, "Idempotent-Replayed": "true" },
  });
}

// Wraps a route handler. A request without a valid key runs the handler as before.
export function idempotent<Req extends Request, Ctx>(
  store: AnswerStore,
  handler: (request: Req, context: Ctx) => Promise<Response>,
  isFinalAnswer: (status: number) => boolean
): (request: Req, context: Ctx) => Promise<Response> {
  return async (request, context) => {
    const key = request.headers.get(IDEMPOTENCY_HEADER);
    if (!key || !KEY_PATTERN.test(key)) return handler(request, context);

    const id = `${new URL(request.url).pathname}|${key}`;
    const claim = await store.claim(id, Date.now());
    if (claim.state === "done") return replay(claim.answer);
    if (claim.state === "running") {
      return new Response(JSON.stringify({ error: "This change is still being saved. It will be sent again." }), {
        status: 503,
        headers: { "Content-Type": "application/json", "Retry-After": "5" },
      });
    }

    let response: Response;
    try {
      response = await handler(request, context);
    } catch (error) {
      await store.release(id);
      throw error;
    }

    const answer: SavedAnswer = {
      status: response.status,
      contentType: response.headers.get("Content-Type") ?? "application/json",
      body: await response.text(),
    };
    // Only a final answer is kept (see isFinalAnswer in rules.ts). A "sign in" or "try again" answer is not kept, so the
    // same key runs again once the account has signed in or the server is free.
    if (isFinalAnswer(answer.status)) await store.complete(id, answer);
    else await store.release(id);

    return new Response(answer.body, { status: answer.status, headers: { "Content-Type": answer.contentType } });
  };
}
