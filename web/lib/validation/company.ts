import { isBlank, isValidDateLike, isValidNonNegativeNumber } from "./shared";

type CompanyValidationInput = {
  company_name: string;
  company_type_primary: string;
  company_type_secondary: string[];
  group_reporting_weight: string;
  date_created: string;
};

type FieldError = {
  field: string;
  message: string;
};

export function validateCompanyForm(input: CompanyValidationInput): FieldError[] {
  const errors: FieldError[] = [];

  if (isBlank(input.company_name)) {
    errors.push({ field: "company_name", message: "Company Name is required." });
  }

  if (isBlank(input.company_type_primary)) {
    errors.push({
      field: "company_type_primary",
      message: "Primary Type is required.",
    });
  }

  const secondary = input.company_type_secondary.filter((x) => x.trim() !== "");
  const uniqueSecondary = new Set(secondary);

  if (secondary.length > 3) {
    errors.push({
      field: "company_type_secondary",
      message: "Maximum 3 secondary types allowed.",
    });
  }

  if (uniqueSecondary.size !== secondary.length) {
    errors.push({
      field: "company_type_secondary",
      message: "Secondary types cannot contain duplicates.",
    });
  }

  if (
    input.company_type_primary.trim() &&
    secondary.includes(input.company_type_primary.trim())
  ) {
    errors.push({
      field: "company_type_secondary",
      message: "Secondary types cannot include the primary type.",
    });
  }

  const reportingWeight = Number(input.group_reporting_weight);

  if (
    input.group_reporting_weight.trim() === "" ||
    Number.isNaN(reportingWeight) ||
    reportingWeight < 0 ||
    reportingWeight > 1
  ) {
    errors.push({
      field: "group_reporting_weight",
      message: "Reporting Weight must be between 0 and 1.",
    });
  }

  if (!isValidDateLike(input.date_created)) {
    errors.push({
      field: "date_created",
      message: "Date must be YYYY-MM-DD.",
    });
  }

  return errors;
}