function isBlank(value: string | null | undefined) {
  return !value || value.trim() === "";
}

function isValidNumber(value: string | null | undefined) {
  if (isBlank(value)) return true;
  return Number.isFinite(Number(value));
}

function isValidInteger(value: string | null | undefined) {
  if (isBlank(value)) return true;
  return /^-?\d+$/.test(String(value).trim());
}

function isValidYear(value: string | null | undefined) {
  if (isBlank(value)) return true;
  return /^(19|20)\d{2}$/.test(String(value).trim());
}

function isValidCod(value: string | null | undefined) {
  if (isBlank(value)) return true;
  return /^(19|20)\d{2}(-((0[1-9])|(1[0-2])))?$/.test(String(value).trim());
}

function toNumber(value: string | null | undefined) {
  if (isBlank(value)) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toYear(value: string | null | undefined) {
  if (!isValidYear(value)) return null;
  return value ? Number(value.trim()) : null;
}

function codYear(value: string | null | undefined) {
  if (!isValidCod(value) || isBlank(value)) return null;
  return Number(String(value).trim().slice(0, 4));
}

function isValidLatitude(value: string | null | undefined) {
  if (isBlank(value)) return true;
  const n = Number(value);
  return Number.isFinite(n) && n >= -90 && n <= 90;
}

function isValidLongitude(value: string | null | undefined) {
  if (isBlank(value)) return true;
  const n = Number(value);
  return Number.isFinite(n) && n >= -180 && n <= 180;
}

export type PlantValidationInput = {
  plant_name: string;
  country: string;
  project_phase: string;
  start_dev_year: string;
  cod: string;
  potential_min_mw: string;
  potential_max_mw: string;
  installed_capacity_mw: string;
  capacity_running_mw: string;
  gross_production_gwh: string;
  resource_temp_c: string;
  wells_total: string;
  wells_prod_active: string;
  wells_reinj_active: string;
  wells_inactive_standby: string;
  wells_other_exploration: string;
  well_depth_prod_m: string;
  temp_prod_well_c: string;
  flow_rate_ls: string;
  location_x: string;
  location_y: string;
};

export type PlantFieldError = {
  field: string;
  message: string;
};

export function validatePlantForm(
  input: PlantValidationInput
): PlantFieldError[] {
  const errors: PlantFieldError[] = [];

  if (isBlank(input.plant_name)) {
    errors.push({ field: "plant_name", message: "Plant Name is required." });
  }

  if (isBlank(input.country)) {
    errors.push({ field: "country", message: "Country is required." });
  }

  if (isBlank(input.project_phase)) {
    errors.push({ field: "project_phase", message: "Plant Phase is required." });
  }

  if (isBlank(input.installed_capacity_mw)) {
  errors.push({ field: "installed_capacity_mw", message: "Installed Capacity MW is required.",});
  }

  if (!isValidYear(input.start_dev_year)) {
    errors.push({
      field: "start_dev_year",
      message: "Start Development Year must be in YYYY format.",
    });
  }

  if (!isValidCod(input.cod)) {
    errors.push({
      field: "cod",
      message: "COD must be in YYYY or YYYY-MM format.",
    });
  }

  const numericFields: Array<[keyof PlantValidationInput, string, string, boolean]> = [
    ["potential_min_mw", input.potential_min_mw, "Potential Min MW", false],
    ["potential_max_mw", input.potential_max_mw, "Potential Max MW", false],
    ["installed_capacity_mw", input.installed_capacity_mw, "Installed Capacity MW", false],
    ["capacity_running_mw", input.capacity_running_mw, "Capacity Running MW", false],
    ["gross_production_gwh", input.gross_production_gwh, "Gross Production GWh", false],
    ["resource_temp_c", input.resource_temp_c, "Resource Temp C", false],
    ["wells_total", input.wells_total, "Wells Total", true],
    ["wells_prod_active", input.wells_prod_active, "Wells Prod Active", true],
    ["wells_reinj_active", input.wells_reinj_active, "Wells Reinj Active", true],
    ["wells_inactive_standby", input.wells_inactive_standby, "Wells Inactive / Standby", true],
    ["wells_other_exploration", input.wells_other_exploration, "Wells Other / Exploration", true],
    ["well_depth_prod_m", input.well_depth_prod_m, "Well Depth Prod M", false],
    ["temp_prod_well_c", input.temp_prod_well_c, "Temp Prod Well C", false],
    ["flow_rate_ls", input.flow_rate_ls, "Flow Rate L/s", false],
  ];

  for (const [field, value, label, integerOnly] of numericFields) {
    const valid = integerOnly ? isValidInteger(value) : isValidNumber(value);
    if (!valid) {
      errors.push({
        field,
        message: `${label} must be ${integerOnly ? "a whole number" : "a valid number"}.`,
      });
    }
  }

  if (!isValidLatitude(input.location_x)) {
    errors.push({
      field: "location_x",
      message: "Latitude (location_x) must be a number between -90 and 90.",
    });
  }

  if (!isValidLongitude(input.location_y)) {
    errors.push({
      field: "location_y",
      message: "Longitude (location_y) must be a number between -180 and 180.",
    });
  }

  const potentialMin = toNumber(input.potential_min_mw);
  const potentialMax = toNumber(input.potential_max_mw);
  const installed = toNumber(input.installed_capacity_mw);
  const running = toNumber(input.capacity_running_mw);
  const startYear = toYear(input.start_dev_year);
  const codYearValue = codYear(input.cod);

  if (
    potentialMin !== null &&
    potentialMax !== null &&
    potentialMax < potentialMin
  ) {
    errors.push({
      field: "potential_max_mw",
      message: "Potential Max MW must be greater than or equal to Potential Min MW.",
    });
  }

  if (installed !== null && running !== null && running > installed) {
    errors.push({
      field: "capacity_running_mw",
      message: "Capacity Running MW cannot be greater than Installed Capacity MW.",
    });
  }

  if (
    startYear !== null &&
    codYearValue !== null &&
    codYearValue < startYear
  ) {
    errors.push({
      field: "cod",
      message: "COD cannot be earlier than Start Development Year.",
    });
  }

  return errors;
}