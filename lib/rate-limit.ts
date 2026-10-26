import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { NextApiRequest } from "next";

// Rate limiting for POST /api/waitlist (audit finding M-4). Every call to
// that endpoint costs a server-side Mailchimp API request with our key plus
// a serverless invocation, so the endpoint must be bounded. Vercel
// serverless gives each invocation a fresh memory space, so an in-memory
// limiter (like the API's default memory:// slowapi storage) would be
// useless here — the counters must live outside the function, in Upstash
// Redis (HTTP API, shared across all instances and regions).
//
// 5 requests / minute / client IP, mirroring the auth tier of the API's
// RATE_LIMITING_STRATEGY.md: a human signing up once (or retrying a typo a
// couple of times) is never throttled, while a script is capped at 5
// Mailchimp writes per minute per IP.
//
// Fail-open by design: a missing config or an Upstash outage degrades to no
// limiting (the pre-fix behavior, logged loudly) rather than taking the
// waitlist signup form down.

export function getClientIp(req: NextApiRequest): string {
  // Vercel sets x-forwarded-for to the client's public IP and overwrites any
  // client-supplied value to prevent IP spoofing (vercel.com/docs/headers/
  // request-headers) — unlike the Railway API, no distrust needed here. The
  // first entry is taken defensively in case a proxy chain ever appears.
  const forwarded = req.headers["x-forwarded-for"];
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return (raw ?? "").split(",")[0].trim();
}

// Collapses an IPv6 address to its /64 network address — the JS equivalent
// of the API rate limiter's ip_network(f"{ip}/64", strict=False)
// .network_address — so one IPv6 client can't mint fresh buckets by rotating
// addresses within the /64 its ISP actually assigns it. IPv4 (and
// IPv4-mapped IPv6) stays per-address; anything unrecognized is used as-is
// (one bounded bucket per distinct value).
export function normalizeIpKey(ip: string): string {
  const value = ip.trim();
  if (!value) return value;

  const v4Mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i.exec(value);
  if (v4Mapped) return v4Mapped[1];

  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(value)) return value;
  if (!value.includes(":")) return value;

  const halves = value.split("::");
  if (halves.length > 2) return value;

  // Parses one side of "::" into canonical lowercase hextets, expanding a
  // trailing IPv4-embedded group (2001:db8::203.0.113.7) into two hextets.
  // Returns null on anything malformed.
  const parseGroups = (part: string): string[] | null => {
    if (!part) return [];
    const out: string[] = [];
    const groups = part.split(":");
    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];
      if (group.includes(".")) {
        if (i !== groups.length - 1) return null;
        const octets = group.split(".");
        if (
          octets.length !== 4 ||
          octets.some((octet) => !/^\d{1,3}$/.test(octet) || Number(octet) > 255)
        ) {
          return null;
        }
        out.push(
          ((Number(octets[0]) << 8) | Number(octets[1])).toString(16),
          ((Number(octets[2]) << 8) | Number(octets[3])).toString(16)
        );
      } else {
        if (!/^[0-9a-f]{1,4}$/i.test(group)) return null;
        out.push(Number.parseInt(group, 16).toString(16));
      }
    }
    return out;
  };

  const head = parseGroups(halves[0]);
  const tail = halves.length === 2 ? parseGroups(halves[1]) : [];
  if (head === null || tail === null) return value;
  if (head.length + tail.length > 8) return value;
  if (halves.length === 1 && head.length !== 8) return value;

  const groups = [
    ...head,
    ...Array<string>(8 - head.length - tail.length).fill("0"),
    ...tail,
  ];

  // Mask to the /64 (the last 64 bits carry no identity at ISP-allocation
  // granularity), then compress per RFC 5952 — longest run of zero groups
  // becomes "::", first run wins on ties — the same string Python's
  // str(IPv6Address) produces for the network address.
  for (let i = 4; i < 8; i++) groups[i] = "0";

  let bestStart = -1;
  let bestLength = 0;
  let i = 0;
  while (i < groups.length) {
    if (groups[i] !== "0") {
      i++;
      continue;
    }
    let j = i;
    while (j < groups.length && groups[j] === "0") j++;
    if (j - i > bestLength) {
      bestStart = i;
      bestLength = j - i;
    }
    i = j;
  }
  const headPart = groups.slice(0, bestStart).join(":");
  const tailPart = groups.slice(bestStart + bestLength).join(":");
  return headPart + "::" + tailPart;
}

export function createWaitlistLimiter(): (key: string) => Promise<boolean> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.error(
      "[waitlist] UPSTASH_REDIS_REST_URL/TOKEN manquants — rate limiting inactif (fail-open)"
    );
    return async () => true;
  }

  const ratelimit = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(5, "1 m"),
    prefix: "calcile_waitlist",
    analytics: false,
  });

  return async (key) => {
    try {
      const { success } = await ratelimit.limit(key);
      return success;
    } catch (error) {
      console.error("[waitlist] erreur du rate limiter (fail-open) :", error);
      return true;
    }
  };
}
