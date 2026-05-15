import { isBlank, isValidPercentage } from "./shared";

type CompanyRelationshipValidationInput = {
  currentCompanyId: string;
  relatedCompanyId: string;
  relationshipType: string;
  ownershipPercentage: string;
};

export function validateCompanyRelationshipForm(
  input: CompanyRelationshipValidationInput
): string[] {
  const errors: string[] = [];

  if (isBlank(input.relatedCompanyId)) {
    errors.push("Please select a related company.");
  }

  if (input.currentCompanyId && input.relatedCompanyId === input.currentCompanyId) {
    errors.push("A company cannot be related to itself.");
  }

  if (isBlank(input.relationshipType)) {
    errors.push("Please select a relationship type.");
  }

  if (!isValidPercentage(input.ownershipPercentage)) {
    errors.push("Ownership % must be a number between 0 and 100.");
  }

  return errors;
}