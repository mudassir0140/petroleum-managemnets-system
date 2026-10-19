// Tests for the Connect rules: requests, answers, chat access and message text. Run with: node --test scripts/connect-rules.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  canAnswer,
  cleanMessage,
  pumpChatAllowed,
  pumpConversationKey,
  relationFor,
  sendBlockReason,
  supplierConversationKey,
} from "../src/lib/connect/rules.ts";

test("a pump cannot send a request to itself", () => {
  assert.equal(sendBlockReason(true, []), "A pump cannot connect to itself");
});

test("no second request while one is pending or the pumps are connected", () => {
  assert.equal(sendBlockReason(false, ["pending"]), "A request is already waiting for an answer");
  assert.equal(sendBlockReason(false, ["accepted"]), "These pumps are already connected");
  assert.equal(sendBlockReason(false, ["rejected"]), null, "a rejected request may be sent again");
  assert.equal(sendBlockReason(false, []), null);
});

test("only the receiving pump can answer a pending request", () => {
  assert.equal(canAnswer("p2", "p2", "pending"), true);
  assert.equal(canAnswer("p2", "p1", "pending"), false, "the sender cannot accept its own request");
  assert.equal(canAnswer("p2", "p2", "accepted"), false, "an answered request cannot be answered again");
});

test("pump chat opens only after acceptance", () => {
  assert.equal(pumpChatAllowed(["accepted"]), true);
  assert.equal(pumpChatAllowed(["pending"]), false);
  assert.equal(pumpChatAllowed(["rejected"]), false);
  assert.equal(pumpChatAllowed([]), false);
});

test("the directory shows the relation from the requests in either direction", () => {
  assert.equal(relationFor(false, false, []), "none");
  assert.equal(relationFor(true, false, ["pending"]), "requested");
  assert.equal(relationFor(false, true, ["pending"]), "incoming");
  assert.equal(relationFor(false, false, ["accepted"]), "connected");
});

test("both pumps share one conversation key, whichever one sends", () => {
  assert.equal(pumpConversationKey("aaa", "bbb"), pumpConversationKey("bbb", "aaa"));
});

test("a supplier conversation is per supplier and pump", () => {
  assert.equal(supplierConversationKey("s1", "p1"), "supplier:s1:p1");
  assert.notEqual(supplierConversationKey("s1", "p1"), supplierConversationKey("s1", "p2"));
});

test("a message is trimmed, must have text, and is at most 1000 characters", () => {
  assert.equal(cleanMessage("  hello  "), "hello");
  assert.equal(cleanMessage("   "), null);
  assert.equal(cleanMessage(""), null);
  assert.equal(cleanMessage("x".repeat(1000)).length, 1000);
  assert.equal(cleanMessage("x".repeat(1001)), null);
  assert.equal(cleanMessage(42), null);
  assert.equal(cleanMessage(undefined), null);
});

import { cleanSearch, escapeRegex } from "../src/lib/connect/rules.ts";

test("a search needs at least two characters after trimming", () => {
  assert.equal(cleanSearch("  ps  "), "ps");
  assert.equal(cleanSearch("p"), null);
  assert.equal(cleanSearch("   "), null);
  assert.equal(cleanSearch(undefined), null);
  assert.equal(cleanSearch("x".repeat(100))?.length, 60);
});

test("search text is escaped so it matches literally", () => {
  const pattern = new RegExp(escapeRegex("a+b (pso)"), "i");
  assert.equal(pattern.test("A+B (PSO) Main"), true);
  assert.equal(pattern.test("aab pso"), false, "the plus sign is not a pattern");
});
