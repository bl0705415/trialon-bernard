import { PROTOCOL_FIELDS } from "../constants/protocolFields";

const LITELLM_BASE  = "PASTE YOUR VALUE";
const LITELLM_KEY   = "PASTE YOUR VALUE";
const LITELLM_MODEL = "PASTE YOUR VALUE";

export async function extractFieldsWithGPT(rawText) {
  const fieldList = PROTOCOL_FIELDS.map(f => `  "${f.id}": "${f.label}"`).join(",\n");

  const prompt = `You are a clinical trial data extraction assistant. Extract ONLY these exact 50 fields from the protocol text. Return a valid JSON object only — no markdown, no explanation, just raw JSON. Use empty string "" for any field not found.

Fields:
{
${fieldList}
}

Protocol text:
${rawText.substring(0, 14000)}`;

  const res = await fetch(`${LITELLM_BASE}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${LITELLM_KEY}`
    },
    body: JSON.stringify({
      model: LITELLM_MODEL,
      max_tokens: 3000,
      temperature: 0,
      messages: [{ role: "user", content: prompt }]
    })
  });

  if (!res.ok) throw new Error(`LiteLLM error: ${res.status}`);

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || "";
  const clean = content.replace(/```json|```/g, "").trim();

  return JSON.parse(clean);
}