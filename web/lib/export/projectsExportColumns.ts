export type ExportColumn = {
  key: string;
  label: string;
  defaultSelected?: boolean;
};

export const PROJECT_EXPORT_COLUMNS: ExportColumn[] = [
  { key: "project_id", label: "Project ID", defaultSelected: true },
  { key: "project_name", label: "Project Name", defaultSelected: true },
  { key: "project_group", label: "Project Group", defaultSelected: true },
  { key: "other_name", label: "Other Name" },

  { key: "owner_operator", label: "Owner / Operator", defaultSelected: true },
  { key: "developer", label: "Developer", defaultSelected: true },

  { key: "location_text", label: "Location" },
  { key: "country", label: "Country", defaultSelected: true },
  { key: "region", label: "Region", defaultSelected: true },
  { key: "wb_region", label: "WB Region" },

  { key: "potential_min_mw", label: "Potential Min (MW)" },
  { key: "potential_max_mw", label: "Potential Max (MW)" },
  { key: "planned_capacity_mw", label: "Planned Capacity (MW)", defaultSelected: true },
  { key: "planned_capacity_running_mw", label: "Planned Capacity Running (MW)", defaultSelected: true },
  { key: "gross_production_gwh", label: "Gross Production (GWh)" },

  { key: "start_dev_year", label: "Start of Development" },
  { key: "planned_cod", label: "Planned COD" },

  { key: "resource_type", label: "Resource Type", defaultSelected: true },
  { key: "resource_temp_c", label: "Resource Temperature (C)" },
  { key: "project_phase", label: "Project Phase", defaultSelected: true },
  { key: "phase_historical", label: "T: Phase (historical)" },
  { key: "field_name", label: "Field Name" },

  { key: "wells_total", label: "Wells Total" },
  { key: "wells_prod_active", label: "Wells Production Active" },
  { key: "wells_reinj_active", label: "Wells Reinjection Active" },
  { key: "wells_inactive_standby", label: "Wells Inactive / Standby" },
  { key: "wells_other_exploration", label: "Wells Other / Exploration" },
  { key: "well_depth_prod_m", label: "Well Depth Production (m)" },
  { key: "temp_prod_well_c", label: "Temperature of Production Well (C)" },
  { key: "flow_rate_ls", label: "Flow Rate per Well (l/s)" },

  { key: "number_of_unit", label: "Number of Units" },
  { key: "plant_technology", label: "Plant Technology", defaultSelected: true },
  { key: "turbine_supplier", label: "Turbine Supplier" },
  { key: "epc_suppliers", label: "EPC / Suppliers" },
  { key: "investor", label: "Investor" },

  { key: "ppa_usd_kwh", label: "PPA (USD/kWh)" },
  { key: "total_investment_cost", label: "Total Investment Cost" },

  { key: "notes", label: "Notes" },
  { key: "location_x", label: "Location X" },
  { key: "location_y", label: "Location Y" },
  { key: "website_information", label: "Website / Information" },

  { key: "date_created", label: "Date Created" },
  { key: "date_edited", label: "Date Edited", defaultSelected: true },
  { key: "edited_description", label: "Edited Description" },
  { key: "research_status", label: "Research Status", defaultSelected: true },
  { key: "review_status", label: "Review Status", defaultSelected: true },

  { key: "promoted_at", label: "Promoted At" },
  { key: "is_promoted_to_plant", label: "Is Promoted to Plant" },
  { key: "promoted_plant_id", label: "Promoted Plant ID" },
];