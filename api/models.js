export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  var apiKey = process.env.MOONSHOT_API_KEY;
  if (!apiKey) { res.status(500).json({ error: "MOONSHOT_API_KEY not configured" }); return; }
  try {
    var response = await fetch("https://api.moonshot.cn/v1/models", {
      headers: { "Authorization": "Bearer " + apiKey }
    });
    var data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
}
