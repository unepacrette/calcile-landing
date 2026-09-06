import { createHash } from "crypto";
import type { NextApiRequest, NextApiResponse } from "next";
import { API_URL } from "@/lib/api";

type WaitlistResponse =
  | { success: true; alreadySubscribed?: boolean }
  | { success: false; error: string };

// Simple RFC-5322-ish check: good enough to reject obvious garbage without
// rejecting valid addresses Mailchimp itself would accept.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Maps a pricing card's tier name to the (pre-existing, plural) Mailchimp
// tag. Any tier not listed here is ignored silently.
const TIER_TAG_MAP: Record<string, string> = {
  Student: "Students",
  Prof: "Profs",
  Lab: "Labs",
};

type MailchimpErrorBody = {
  title?: string;
  detail?: string;
};

type MailchimpConfig = {
  serverPrefix: string;
  audienceId: string;
  apiKey: string;
};

function basicAuthHeader(apiKey: string): string {
  return "Basic " + Buffer.from(`anystring:${apiKey}`).toString("base64");
}

// Provisions a beta account for `email` via calcile-api (idempotent: a
// second call for the same email is a safe no-op). Best-effort only: the
// waitlist signup has already succeeded by the time this runs, so any
// failure here is logged server-side and swallowed — it must never affect
// the client response.
async function provisionBetaAccount(email: string): Promise<void> {
  const internalSecret = process.env.INTERNAL_INVITE_SECRET;

  if (!internalSecret) {
    console.error(
      "[waitlist] INTERNAL_INVITE_SECRET manquant, provisioning ignoré"
    );
    return;
  }

  try {
    const response = await fetch(`${API_URL}/api/auth/invite`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Secret": internalSecret,
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.error(
        "[waitlist] échec du provisioning de compte :",
        response.status,
        body
      );
    }
  } catch (error) {
    console.error(
      "[waitlist] erreur réseau lors du provisioning de compte :",
      error
    );
  }
}

// Tags a subscriber by tier. Best-effort only: the waitlist signup has
// already succeeded by the time this runs, so any failure here is logged
// server-side and swallowed — it must never affect the client response.
async function tagSubscriberByTier(
  email: string,
  tagName: string,
  config: MailchimpConfig
): Promise<void> {
  const subscriberHash = createHash("md5")
    .update(email.toLowerCase())
    .digest("hex");

  try {
    const response = await fetch(
      `https://${config.serverPrefix}.api.mailchimp.com/3.0/lists/${config.audienceId}/members/${subscriberHash}/tags`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: basicAuthHeader(config.apiKey),
        },
        body: JSON.stringify({ tags: [{ name: tagName, status: "active" }] }),
      }
    );

    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as MailchimpErrorBody;
      console.error("[waitlist] échec du tagging Mailchimp :", response.status, body);
    }
  } catch (error) {
    console.error("[waitlist] erreur réseau lors du tagging Mailchimp :", error);
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<WaitlistResponse>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ success: false, error: "Méthode non autorisée." });
  }

  const { email, tier } = req.body ?? {};

  if (typeof email !== "string" || !EMAIL_REGEX.test(email)) {
    return res.status(400).json({ success: false, error: "Email invalide." });
  }

  // Unknown/invalid tier values are ignored rather than rejected: tagging
  // is a bonus on top of the signup, not a requirement.
  const tagName = typeof tier === "string" ? TIER_TAG_MAP[tier] : undefined;

  const { MAILCHIMP_API_KEY, MAILCHIMP_SERVER_PREFIX, MAILCHIMP_AUDIENCE_ID } =
    process.env;

  if (!MAILCHIMP_API_KEY || !MAILCHIMP_SERVER_PREFIX || !MAILCHIMP_AUDIENCE_ID) {
    console.error("[waitlist] variables d'environnement Mailchimp manquantes");
    return res
      .status(500)
      .json({ success: false, error: "Une erreur est survenue" });
  }

  const mailchimpConfig: MailchimpConfig = {
    serverPrefix: MAILCHIMP_SERVER_PREFIX,
    audienceId: MAILCHIMP_AUDIENCE_ID,
    apiKey: MAILCHIMP_API_KEY,
  };

  try {
    const mailchimpResponse = await fetch(
      `https://${MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${MAILCHIMP_AUDIENCE_ID}/members`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: basicAuthHeader(MAILCHIMP_API_KEY),
        },
        body: JSON.stringify({ email_address: email, status: "subscribed" }),
      }
    );

    if (mailchimpResponse.status === 200) {
      if (tagName) {
        await tagSubscriberByTier(email, tagName, mailchimpConfig);
      }
      await provisionBetaAccount(email);
      return res.status(200).json({ success: true });
    }

    const body = (await mailchimpResponse
      .json()
      .catch(() => ({}))) as MailchimpErrorBody;

    if (mailchimpResponse.status === 400 && body.title === "Member Exists") {
      if (tagName) {
        await tagSubscriberByTier(email, tagName, mailchimpConfig);
      }
      await provisionBetaAccount(email);
      return res.status(200).json({ success: true, alreadySubscribed: true });
    }

    // Détail Mailchimp loggé côté serveur uniquement — jamais exposé au client.
    console.error(
      "[waitlist] erreur Mailchimp :",
      mailchimpResponse.status,
      body
    );
    return res.status(500).json({ success: false, error: "Une erreur est survenue" });
  } catch (error) {
    console.error("[waitlist] échec de l'appel à Mailchimp :", error);
    return res.status(500).json({ success: false, error: "Une erreur est survenue" });
  }
}
