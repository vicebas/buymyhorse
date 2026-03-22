export const DOCUMENT_CATEGORIES = [
  "XRAYS",
  "PPE",
  "VET_REPORTS",
  "CONTRACTS",
  "PASSPORT",
  "COMPETITION_RECORDS",
  "CARE",
  "OTHER",
] as const;

export type DocumentCategoryValue = (typeof DOCUMENT_CATEGORIES)[number];

export const DOCUMENT_CATEGORY_OPTIONS: Array<{
  value: DocumentCategoryValue;
  label: string;
}> = [
  { value: "XRAYS", label: "X-Rays" },
  { value: "PPE", label: "PPE" },
  { value: "VET_REPORTS", label: "Vet Reports" },
  { value: "CONTRACTS", label: "Contracts" },
  { value: "PASSPORT", label: "Passport" },
  { value: "COMPETITION_RECORDS", label: "Competition Records" },
  { value: "CARE", label: "Care" },
  { value: "OTHER", label: "Other" },
];

const DOCUMENT_CATEGORY_LABELS = new Map(
  DOCUMENT_CATEGORY_OPTIONS.map((option) => [option.value, option.label] as const)
);

export function isDocumentCategory(value: string): value is DocumentCategoryValue {
  return DOCUMENT_CATEGORIES.includes(value as DocumentCategoryValue);
}

export function formatDocumentCategory(category: string) {
  return DOCUMENT_CATEGORY_LABELS.get(category as DocumentCategoryValue) ?? category.replaceAll("_", " ");
}
