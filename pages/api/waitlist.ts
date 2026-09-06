import type { NextApiRequest, NextApiResponse } from "next";

type WaitlistResponse = {
  ok: boolean;
  message: string;
};

// TODO: connecter au formulaire d'inscription Mailchimp une fois l'embed
// code récupéré. Pour l'instant, cette route ne fait que valider et logger
// l'email côté serveur (aucun envoi réel).
export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<WaitlistResponse>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res
      .status(405)
      .json({ ok: false, message: "Méthode non autorisée." });
  }

  const { email } = req.body ?? {};

  if (typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({ ok: false, message: "Email invalide." });
  }

  // Placeholder: remplacer par un appel à l'API Mailchimp (ou un webhook)
  // une fois l'embed code / API key récupérés.
  console.log("[waitlist] nouvelle inscription :", email);

  return res.status(200).json({ ok: true, message: "Inscription reçue." });
}
