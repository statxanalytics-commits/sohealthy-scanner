export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { image, mimeType } = req.body;
    if (!image || !mimeType) return res.status(400).json({ error: "Missing image or mimeType" });

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-opus-4-5",
        max_tokens: 1000,
        system: `You are a professional nutritionist. Analyze the food image and return ONLY valid JSON, no markdown, no explanation, no backticks:
{"total":{"calories":0,"protein":0,"carbs":0,"fat":0,"fiber":0,"sugar":0},"items":[{"name":"Emri shqip","portion":"Xg","calories":0,"protein":0,"carbs":0,"fat":0,"fiber":0,"sugar":0}]}
All numbers must be integers. Food names must be in Albanian language.`,
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mimeType, data: image } },
            { type: "text", text: "Analyze this plate and return JSON." }
          ]
        }]
      })
    });

    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });

    const text = data.content.map(c => c.text || "").join("").replace(/```json|```/g, "").trim();
    const result = JSON.parse(text);
    return res.status(200).json(result);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
