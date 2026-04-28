export async function requestGroqInsights({ summary, prompt, apiKey = process.env.GROQ_API_KEY }) {
  if (!apiKey) {
    return {
      status: 500,
      body: { error: "Missing GROQ_API_KEY on the server" },
    };
  }

  if (!summary || !prompt) {
    return {
      status: 400,
      body: { error: "Missing prompt payload" },
    };
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content:
              "You are a concise personal finance advisor. Always respond with valid JSON arrays only. No markdown, no explanation outside the JSON.",
          },
          { role: "user", content: `${prompt}\n\n${summary}` },
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return {
        status: response.status,
        body: {
          error: data?.error?.message || `Groq request failed with HTTP ${response.status}`,
        },
      };
    }

    return {
      status: 200,
      body: { insights: data.choices?.[0]?.message?.content || "" },
    };
  } catch (error) {
    return {
      status: 500,
      body: {
        error: error instanceof Error ? error.message : "Unexpected server error",
      },
    };
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const result = await requestGroqInsights(req.body ?? {});
  return res.status(result.status).json(result.body);
}
