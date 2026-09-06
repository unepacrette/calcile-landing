import type { NextApiRequest, NextApiResponse } from "next";

type WaitlistResponse =
  | { success: true; alreadySubscribed?: boolean }
  | { success: false; error: string };

// Simple RFC-5322-ish check: good enough to reject obvious garbage without
// rejecting valid addresses Mailchimp itself would accept.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type MailchimpErrorBody = {
  title?: string;
  detail?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<WaitlistResponse>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ success: false, error: "Méthode non autorisée." });
  }

  const { email } = req.body ?? {};

  if (typeof email !== "string" || !EMAIL_REGEX.test(email)) {
    return res.status(400).json({ success: false, error: "Email invalide." });
  }

  const { MAILCHIMP_API_KEY, MAILCHIMP_SERVER_PREFIX, MAILCHIMP_AUDIENCE_ID } =
    process.env;

  if (!MAILCHIMP_API_KEY || !MAILCHIMP_SERVER_PREFIX || !MAILCHIMP_AUDIENCE_ID) {
    console.error("[waitlist] variables d'environnement Mailchimp manquantes");
    return res
      .status(500)
      .json({ success: false, error: "Une erreur est survenue" });
  }

  try {
    const mailchimpResponse = await fetch(
      `https://${MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${MAILCHIMP_AUDIENCE_ID}/members`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:
            "Basic " +
            Buffer.from(`anystring:${MAILCHIMP_API_KEY}`).toString("base64"),
        },
        body: JSON.stringify({ email_address: email, status: "subscribed" }),
      }
    );

    if (mailchimpResponse.status === 200) {
      return res.status(200).json({ success: true });
    }

    const body = (await mailchimpResponse
      .json()
      .catch(() => ({}))) as MailchimpErrorBody;

    if (mailchimpResponse.status === 400 && body.title === "Member Exists") {
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
