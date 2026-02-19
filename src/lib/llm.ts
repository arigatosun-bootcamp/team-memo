const LLM_PROVIDER = process.env.LLM_PROVIDER || "openai";

type LLMResponse = {
  content: string;
  model: string;
};

export async function generateSummary(text: string): Promise<LLMResponse> {
  if (LLM_PROVIDER === "anthropic") {
    return callAnthropic(text);
  }
  return callOpenAI(text);
}

async function callOpenAI(text: string): Promise<LLMResponse> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "あなたは文章を簡潔に要約するアシスタントです。日本語で3行以内で要約してください。",
        },
        { role: "user", content: text },
      ],
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return {
    content: data.choices[0].message.content,
    model: data.model,
  };
}

async function callAnthropic(text: string): Promise<LLMResponse> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 500,
      system:
        "あなたは文章を簡潔に要約するアシスタントです。日本語で3行以内で要約してください。",
      messages: [{ role: "user", content: text }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.status}`);
  }

  const data = await response.json();
  return {
    content: data.content[0].text,
    model: data.model,
  };
}
