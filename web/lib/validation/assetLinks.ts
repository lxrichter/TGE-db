import { isBlank, isValidPercentage } from "./shared";

type AssetLinkValidationInput = {
  assetLabel: "project" | "plant";
  assetId: string;
  role: string;
  ownershipShare: string;
};

function normalizeRole(value: string) {
  return value
    .toLowerCase()
    .replace(/[/_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function roleRequiresOwnershipShare(role: string) {
  const normalized = normalizeRole(role);

  return (
    normalized.includes("owner") ||
    normalized.includes("developer") ||
    normalized.includes("investor") ||
    normalized.includes("finance") ||
    normalized.includes("shareholder") ||
    normalized.includes("resource partner")
  );
}

export function validateAssetLinkForm(input: AssetLinkValidationInput): string[] {
  const errors: string[] = [];

  if (isBlank(input.assetId)) {
    errors.push(`Please select a ${input.assetLabel}.`);
  }

  if (isBlank(input.role)) {
    errors.push(`Please select a role for the ${input.assetLabel} link.`);
  }

  if (!isValidPercentage(input.ownershipShare)) {
    errors.push("Ownership Share must be a number between 0 and 100.");
  }

  if (
    !isBlank(input.role) &&
    roleRequiresOwnershipShare(input.role) &&
    isBlank(input.ownershipShare)
  ) {
    errors.push(
      "Ownership Share is required for owner, developer, investor, finance, or resource partner roles."
    );
  }

  return errors;
}

export function validateAssetLinkPayload(input: AssetLinkValidationInput): string | null {
  const errors = validateAssetLinkForm(input);
  return errors.length > 0 ? errors[0] : null;
}