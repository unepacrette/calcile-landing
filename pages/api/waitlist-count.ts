import type { NextApiRequest, NextApiResponse } from "next";

type WaitlistCountResponse = { count: number | null };

// Same auth scheme as pages/api/waitlist.ts -- kept local rather than
// shared, this file's only dependency on Mailchimp.
function basicAuthHeader(apiKey: string): string {
  return "Basic " + Buffer.from(`anystring:${apiKey}`).toString("base64");
}

// The real, live count of the Mailchimp waitlist audience -- never a
// fabricated or hardcoded number. See COMPETITIVE_ANALYSIS.md's trust-bar
// item: any Calcile-specific stat shown on the marketing page must be
// real, not invented, and this is the one that's genuinely available
// today without waiting for a full product launch.
//
// Always responds 200 with either a real number or null -- never an
// error status for the frontend to handle specially. A trust signal that
// can't be verified right now (Mailchimp down, config missing) should
// just not render, not show a stale/guessed number or an error state.
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<WaitlistCountResponse>
) {
  const { MAILCHIMP_API_KEY, MAILCHIMP_SERVER_PREFIX, MAILCHIMP_AUDIENCE_ID } =
    process.env;

  if (!MAILCHIMP_API_KEY || !MAILCHIMP_SERVER_PREFIX || !MAILCHIMP_AUDIENCE_ID) {
    console.error("[waitlist-count] variables d'environnement Mailchimp manquantes");
    return res.status(200).json({ count: null });
  }

  try {
    const response = await fetch(
      `https://${MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${MAILCHIMP_AUDIENCE_ID}` +
        "?fields=stats.member_count",
      { headers: { Authorization: basicAuthHeader(MAILCHIMP_API_KEY) } }
    );

    if (!response.ok) {
      console.error("[waitlist-count] erreur Mailchimp :", response.status);
      return res.status(200).json({ count: null });
    }

    const body = (await response.json()) as { stats?: { member_count?: number } };
    const count = body.stats?.member_count;

    if (typeof count !== "number") {
      console.error("[waitlist-count] réponse Mailchimp inattendue :", body);
      return res.status(200).json({ count: null });
    }

    // Short cache: a trust-signal counter doesn't need to hit Mailchimp
    // on every single page view. 5 minutes balances "genuinely live"
    // against not calling their API on every visitor for a number that
    // moves slowly at this stage.
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=300, stale-while-revalidate=600"
    );
    return res.status(200).json({ count });
  } catch (error) {
    console.error("[waitlist-count] échec de l'appel à Mailchimp :", error);
    return res.status(200).json({ count: null });
  }
}
