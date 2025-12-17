export const config = {
  api: {
    bodyParser: false, // avoid default parsing for future flexibility
  },
};

import multiparty from "multiparty";

const SERVICEM8_API_KEY = process.env.SERVICEM8_API_KEY;
const SM8_BASE = "https://api.servicem8.com/api_1.0";

// Utility: Parse form fields (supports POSTed form fields)
function parseForm(req) {
  return new Promise((resolve, reject) => {
    const form = new multiparty.Form();
    form.parse(req, (err, fields) => {
      if (err) reject(err);
      else {
        const result = {};
        for (const key in fields) {
          if (fields.hasOwnProperty(key)) {
            result[key] = fields[key][0];
          }
        }
        resolve(result);
      }
    });
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const fields = await parseForm(req);
    const { jobUUID } = fields;

    if (!jobUUID) {
      return res.status(400).json({ error: "Missing jobUUID" });
    }

    // Use your fixed message here:
    const fixedMessage = "Customer signature was captured and attached via web portal.";

    const noteResp = await fetch(`${SM8_BASE}/note.json`, {
      method: "POST",
      headers: {
        "X-Api-Key": SERVICEM8_API_KEY,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        related_object: "job",
        note: fixedMessage,
        uuid: jobUUID,
      }),
    });

    const noteRespText = await noteResp.text();
    if (!noteResp.ok) {
      return res.status(noteResp.status).json({ error: `Note failed: ${noteRespText}` });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Function error:", err);
    return res.status(500).json({ error: "Internal error: " + err.toString() });
  }
}