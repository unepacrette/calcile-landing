import { test } from "node:test";
import assert from "node:assert/strict";
import type { NextApiRequest, NextApiResponse } from "next";
import { createWaitlistHandler } from "../pages/api/waitlist.ts";

process.env.MAILCHIMP_API_KEY = "test-key";
process.env.MAILCHIMP_SERVER_PREFIX = "us1";
process.env.MAILCHIMP_AUDIENCE_ID = "aud123";

type FetchCall = { url: string; init?: RequestInit };

function createMockRes() {
  const headers: Record<string, string | string[]> = {};
  const res = {
    statusCode: 0,
    body: undefined as unknown,
    headers,
    setHeader(name: string, value: string | string[]) {
      headers[name.toLowerCase()] = value;
      return res;
    },
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(payload: unknown) {
      res.body = payload;
      return res;
    },
  };
  return res;
}

function createMockReq(overrides: {
  method?: string;
  body?: unknown;
  headers?: Record<string, string | string[]>;
}): NextApiRequest {
  return {
    method: overrides.method ?? "POST",
    headers: overrides.headers ?? { "x-forwarded-for": "203.0.113.7" },
    body: overrides.body ?? { email: "ada@example.com", tier: "Student" },
  } as unknown as NextApiRequest;
}

function mailchimpResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response;
}

function createFetchMock(
  responder: (url: string, init?: RequestInit) => Response
): { fetchFn: typeof fetch; calls: FetchCall[] } {
  const calls: FetchCall[] = [];
  const fetchFn = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, init });
    return responder(url, init);
  }) as unknown as typeof fetch;
  return { fetchFn, calls };
}

const allowAll = async () => true;
const denyAll = async () => false;

async function runHandler(options: {
  req?: NextApiRequest;
  limit?: (key: string) => Promise<boolean>;
  responder?: (url: string, init?: RequestInit) => Response;
}) {
  const { fetchFn, calls } = createFetchMock(
    options.responder ?? (() => mailchimpResponse(200, {}))
  );
  const res = createMockRes();
  const handler = createWaitlistHandler({
    limit: options.limit ?? allowAll,
    fetchFn,
  });
  await handler(
    options.req ?? createMockReq({}),
    res as unknown as NextApiResponse
  );
  return { res, calls };
}

test("rejects non-POST methods with 405", async () => {
  const { res, calls } = await runHandler({
    req: createMockReq({ method: "GET" }),
  });
  assert.equal(res.statusCode, 405);
  assert.deepEqual(res.headers["allow"], ["POST"]);
  assert.equal(calls.length, 0);
});

test("rejects an invalid email with 400 and never calls Mailchimp", async () => {
  const { res, calls } = await runHandler({
    req: createMockReq({ body: { email: "not-an-email" } }),
  });
  assert.equal(res.statusCode, 400);
  assert.equal(calls.length, 0);
});

test("returns 429 with Retry-After when rate limited, without calling Mailchimp", async () => {
  const { res, calls } = await runHandler({ limit: denyAll });
  assert.equal(res.statusCode, 429);
  assert.equal(res.headers["retry-after"], "60");
  assert.deepEqual(res.body, {
    success: false,
    error: "Trop de requêtes, réessayez dans une minute.",
  });
  assert.equal(calls.length, 0);
});

test("rate limit key: first x-forwarded-for entry, IPv6 collapsed to /64", async () => {
  const keys: string[] = [];
  const limit = async (key: string) => {
    keys.push(key);
    return true;
  };
  await runHandler({
    limit,
    req: createMockReq({
      headers: {
        "x-forwarded-for": "2001:DB8:ABCD:EF01:1234:5678:9ABC:DEF0, 10.0.0.1",
      },
    }),
  });
  assert.deepEqual(keys, ["2001:db8:abcd:ef01::"]);
});

test("rate limit key: plain IPv4 passes through unchanged", async () => {
  const keys: string[] = [];
  const limit = async (key: string) => {
    keys.push(key);
    return true;
  };
  await runHandler({
    limit,
    req: createMockReq({
      headers: { "x-forwarded-for": "203.0.113.7, 10.0.0.1" },
    }),
  });
  assert.deepEqual(keys, ["203.0.113.7"]);
});

test("subscribes a new member and tags the selected tier", async () => {
  const { res, calls } = await runHandler({
    responder: (url) =>
      url.includes("/tags") ? mailchimpResponse(204, {}) : mailchimpResponse(200, {}),
  });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { success: true });
  assert.equal(calls.length, 2);
  assert.match(
    calls[0].url,
    /us1\.api\.mailchimp\.com\/3\.0\/lists\/aud123\/members$/
  );
  const subscribeBody = JSON.parse(String(calls[0].init?.body));
  assert.deepEqual(subscribeBody, {
    email_address: "ada@example.com",
    status: "subscribed",
  });
  assert.match(calls[1].url, /\/members\/[a-f0-9]{32}\/tags$/);
  const tagBody = JSON.parse(String(calls[1].init?.body));
  assert.deepEqual(tagBody, { tags: [{ name: "Students", status: "active" }] });
});

test("ignores an unknown tier (no tagging call)", async () => {
  const { res, calls } = await runHandler({
    req: createMockReq({ body: { email: "ada@example.com", tier: "Bogus" } }),
  });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { success: true });
  assert.equal(calls.length, 1);
});

test("L-1: a duplicate signup is indistinguishable from a fresh one", async () => {
  const { res } = await runHandler({
    responder: (url) =>
      url.includes("/tags")
        ? mailchimpResponse(204, {})
        : mailchimpResponse(400, {
            title: "Member Exists",
            detail: "ada@example.com is already a list member",
          }),
  });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { success: true });
  assert.ok(!("alreadySubscribed" in (res.body as object)));
});

test("the duplicate-signup log line carries no PII (no raw email)", async () => {
  const logged: unknown[][] = [];
  const originalInfo = console.info;
  console.info = (...args: unknown[]) => {
    logged.push(args);
  };
  try {
    const { res } = await runHandler({
      responder: (url) =>
        url.includes("/tags")
          ? mailchimpResponse(204, {})
          : mailchimpResponse(400, {
              title: "Member Exists",
              detail: "ada@example.com is already a list member",
            }),
    });
    assert.equal(res.statusCode, 200);
  } finally {
    console.info = originalInfo;
  }
  assert.equal(logged.length, 1);
  const line = logged[0].map((arg) => String(arg)).join(" ");
  assert.ok(!line.includes("ada@example.com"));
  assert.ok(line.includes("Students"));
});

test("returns a generic 500 when Mailchimp fails", async () => {
  const { res } = await runHandler({
    responder: () => mailchimpResponse(500, { title: "Internal Server Error" }),
  });
  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, {
    success: false,
    error: "Une erreur est survenue",
  });
});

test("returns 500 when the Mailchimp env vars are missing", async () => {
  const saved = {
    MAILCHIMP_API_KEY: process.env.MAILCHIMP_API_KEY,
    MAILCHIMP_SERVER_PREFIX: process.env.MAILCHIMP_SERVER_PREFIX,
    MAILCHIMP_AUDIENCE_ID: process.env.MAILCHIMP_AUDIENCE_ID,
  };
  delete process.env.MAILCHIMP_API_KEY;
  delete process.env.MAILCHIMP_SERVER_PREFIX;
  delete process.env.MAILCHIMP_AUDIENCE_ID;
  try {
    const { res, calls } = await runHandler({});
    assert.equal(res.statusCode, 500);
    assert.equal(calls.length, 0);
  } finally {
    process.env.MAILCHIMP_API_KEY = saved.MAILCHIMP_API_KEY;
    process.env.MAILCHIMP_SERVER_PREFIX = saved.MAILCHIMP_SERVER_PREFIX;
    process.env.MAILCHIMP_AUDIENCE_ID = saved.MAILCHIMP_AUDIENCE_ID;
  }
});
