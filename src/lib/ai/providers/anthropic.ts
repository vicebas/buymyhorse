import type { CopyGenerationProvider } from "@/lib/ai/copy";

const DEFAULT_ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-6";

export class AnthropicCopyGenerationProvider implements CopyGenerationProvider {
  constructor(
    private readonly apiKey: string,
    private readonly model = DEFAULT_ANTHROPIC_MODEL
  ) {}

  async generateText(input: { system: string; prompt: string }) {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 500,
        system: input.system,
        messages: [
          {
            role: "user",
            content: input.prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(detail || "Anthropic request failed.");
    }

    const data = (await response.json()) as {
      content?: Array<{ type?: string; text?: string }>;
    };

    const text = data.content
      ?.filter((item) => item.type === "text" && typeof item.text === "string")
      .map((item) => item.text?.trim() || "")
      .filter(Boolean)
      .join("\n\n");

    if (!text) {
      throw new Error("Anthropic returned an empty response.");
    }

    return text;
  }
}

export function getAnthropicCopyGenerationProvider() {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error("Missing ANTHROPIC_API_KEY.");
  }

  return new AnthropicCopyGenerationProvider(apiKey);
}
