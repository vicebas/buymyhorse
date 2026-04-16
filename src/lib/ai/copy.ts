export type CopyGenerationEntityType = "barn" | "horse";
export type CopyGenerationTargetField = "bio" | "description";
export type CopyGenerationScope =
  | "barn-onboarding"
  | "barn-settings"
  | "horse-create"
  | "horse-edit";

export type CopyGenerationMode = "create" | "edit";

export type CopyGenerationRequest = {
  entityType: CopyGenerationEntityType;
  targetField: CopyGenerationTargetField;
  scope: CopyGenerationScope;
  mode: CopyGenerationMode;
  horseId?: string | null;
  context: Record<string, string>;
};

export type CopyGenerationProvider = {
  generateText(input: { system: string; prompt: string }): Promise<string>;
};

function compactContext(context: Record<string, string>) {
  return Object.entries(context)
    .map(([key, value]) => [key, value.trim()] as const)
    .filter(([, value]) => Boolean(value))
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");
}

function getBarnBioPrompt(input: CopyGenerationRequest) {
  const existingDraft = input.context.bio?.trim();
  const contextBlock = compactContext({
    displayName: input.context.displayName || "",
    headline: input.context.headline || "",
    location: input.context.location || "",
    website: input.context.website || "",
    existingBio: existingDraft || "",
    mode: input.mode,
  });

  return {
    system:
      "You write polished English marketplace copy for horse sales barns. Keep the tone professional, credible, concise, and grounded in supplied information only. Never invent achievements, specialties, facilities, or history.",
    prompt: [
      "Write a short English barn story for a public barn frontpage.",
      "Return only the final copy with no title, bullets, or quotation marks.",
      "Aim for 90 to 160 words in one or two short paragraphs.",
      existingDraft
        ? "Use the existing draft as source material and improve clarity, rhythm, and polish while preserving grounded facts."
        : "No existing draft is present, so create fresh copy from the provided facts.",
      "If information is sparse, keep the language elegant but generic. Do not add unverifiable specifics.",
      "Context:",
      contextBlock || "No context provided.",
    ].join("\n\n"),
  };
}

function getHorseDescriptionPrompt(input: CopyGenerationRequest) {
  const existingDraft = input.context.description?.trim();
  const contextBlock = compactContext({
    name: input.context.name || "",
    breed: input.context.breed || "",
    age: input.context.age || "",
    discipline: input.context.discipline || "",
    level: input.context.level || "",
    height: input.context.height || "",
    gender: input.context.gender || "",
    location: input.context.location || "",
    price: input.context.price || "",
    keyDetails: input.context.keyDetails || "",
    existingDescription: existingDraft || "",
    mode: input.mode,
  });

  return {
    system:
      "You write polished English buyer-facing horse listing copy. Keep the tone professional, persuasive, concise, and factual. Use only supplied details and existing draft material. Do not invent training level, show record, temperament specifics, or veterinary claims.",
    prompt: [
      "Write an English horse description for a public sale listing.",
      "Return only the final copy with no title, bullets, or quotation marks.",
      "Aim for 110 to 190 words in one or two short paragraphs.",
      existingDraft
        ? "Refine and strengthen the existing draft while keeping it grounded in the supplied facts."
        : "Create fresh listing copy from the provided facts.",
      "Use key details when relevant, but do not simply restate them as a list.",
      "If information is limited, keep the description useful and elegant without inventing specifics.",
      "Context:",
      contextBlock || "No context provided.",
    ].join("\n\n"),
  };
}

function getPromptBundle(input: CopyGenerationRequest) {
  if (input.entityType === "barn" && input.targetField === "bio") {
    return getBarnBioPrompt(input);
  }

  if (input.entityType === "horse" && input.targetField === "description") {
    return getHorseDescriptionPrompt(input);
  }

  throw new Error("Unsupported AI copy target.");
}

export async function generateCopyDraft(
  provider: CopyGenerationProvider,
  input: CopyGenerationRequest
) {
  const bundle = getPromptBundle(input);
  const text = await provider.generateText(bundle);
  return text.trim();
}
