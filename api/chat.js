// Vercel Serverless Function — proxies requests to Moonshot/Kimi API
// Environment variable required: MOONSHOT_API_KEY

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  var apiKey = process.env.MOONSHOT_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "MOONSHOT_API_KEY not configured" });
    return;
  }

  try {
    var response = await fetch("https://api.moonshot.cn/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + apiKey,
      },
      body: JSON.stringify(req.body),
    });

    var data = await response.json();

    // Set CORS headers for frontend
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    res.status(response.status).json(data);
  } catch (err) {
    console.error("Kimi API proxy error:", err);
    res.status(502).json({ error: "Failed to reach Kimi API", detail: err.message });
  }
}
