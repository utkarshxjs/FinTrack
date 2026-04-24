export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { spendingData } = req.body;
  
  // This pulls your key securely from Vercel's environment variables
  const API_KEY = process.env.GEMINI_API_KEY; 
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

  const prompt = `
    You are a financial assistant for the FinTrack app. 
    Here is the user's spending summary for this month by category: ${JSON.stringify(spendingData)}. 
    Write a short, 3-sentence summary for their dashboard. 
    1. Acknowledge their biggest expense category.
    2. Point out an area where they might be able to save money.
    3. End with a brief, encouraging financial tip. 
    Keep the tone friendly and direct. Do not use markdown.
  `;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();

    if (data.candidates && data.candidates.length > 0) {
      const insightText = data.candidates[0].content.parts[0].text;
      return res.status(200).json({ insight: insightText });
    } else {
      return res.status(500).json({ error: "Failed to parse AI response" });
    }
  } catch (error) {
    return res.status(500).json({ error: "Server error connecting to AI" });
  }
}