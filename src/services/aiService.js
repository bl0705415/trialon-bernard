import { PROTOCOL_FIELDS } from "../constants/protocolFields";

const LITELLM_BASE = "https://litellm-01.oit.duke.edu";
const LITELLM_KEY = "sk-nC6KVrXD65MVLvso4sXsKA";
const LITELLM_MODEL = "GPT 4.1";

export async function extractFieldsWithGPT(rawText) {
  const fieldList = PROTOCOL_FIELDS.map(f => `  "${ f.id }": "${ f.label }"`).join(",\n");

  const prompt = `You are a clinical trial data extraction assistant. Extract ONLY these exact 50 fields from the protocol text. Return a valid JSON object only — no markdown, no explanation, just raw JSON. Use empty string "" for any field not found.

Fields:
{
${ fieldList }
}

Protocol text:
${ rawText.substring(0, 14000) }`;

  const res = await fetch(`${ LITELLM_BASE }/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${ LITELLM_KEY }`
    },
    body: JSON.stringify({
      model: LITELLM_MODEL,
      max_tokens: 3000,
      temperature: 0,
      messages: [{ role: "user", content: prompt }]
    })
  });

  if (!res.ok) throw new Error(`LiteLLM error: ${ res.status }`);

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || "";
  const clean = content.replace(/```json|```/g, "").trim();

  return JSON.parse(clean);
}


export async function generateDocumentContent(extracted) {
  const prompt = `
You are a clinical regulatory writer.

Using the structured study data below, generate the following sections:

1. Lay Summary (2-3 sentences, simple language)
2. Risk Description (clear explanation of risks)
3. Subject Compensation Summary (clear explanation)

Write professionally and clearly for regulatory documents.

Return JSON only:
{
  "lay_summary": "...",
  "risk_description": "...",
  "compensation_summary": "..."
}

Study Data:
${JSON.stringify(extracted, null, 2)}
`;

  const res = await fetch(`${LITELLM_BASE}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${LITELLM_KEY}`
    },
    body: JSON.stringify({
      model: LITELLM_MODEL,
      max_tokens: 1200,
      temperature: 0.3,
      messages: [{ role: "user", content: prompt }]
    })
  });

  if (!res.ok) throw new Error(`LiteLLM error: ${res.status}`);

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || "";
  const clean = content.replace(/```json|```/g, "").trim();

  return JSON.parse(clean);
}