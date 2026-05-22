-- Canonical country / region reference foundation.
-- Seeded from country_region_wbregions.xlsx on 2026-05-22.
-- Entity tables keep cached display fields for now, but new saves can link to
-- this canonical geography layer and derive TGE / World Bank regions from it.

CREATE TABLE IF NOT EXISTS countries_reference (
  country_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_name TEXT NOT NULL,
  iso3 CHAR(3) NOT NULL,
  wb_region TEXT NOT NULL,
  tge_region TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT countries_reference_country_name_unique UNIQUE (country_name),
  CONSTRAINT countries_reference_iso3_unique UNIQUE (iso3),
  CONSTRAINT countries_reference_iso3_format CHECK (iso3 ~ '^[A-Z]{3}$'),
  CONSTRAINT countries_reference_tge_region_check CHECK (
    tge_region IN (
      'Europe',
      'North America',
      'Central America & Caribbean',
      'South America',
      'Africa',
      'Middle East',
      'Asia & Pacific'
    )
  ),
  CONSTRAINT countries_reference_wb_region_check CHECK (
    wb_region IN (
      'East Asia & Pacific',
      'South Asia',
      'Europe & Central Asia',
      'Sub-Saharan Africa',
      'Middle East & North Africa',
      'Latin America & Caribbean',
      'North America'
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_countries_reference_tge_region
  ON countries_reference(tge_region);

CREATE INDEX IF NOT EXISTS idx_countries_reference_wb_region
  ON countries_reference(wb_region);

INSERT INTO countries_reference (country_name, iso3, wb_region, tge_region)
VALUES
  ('Afghanistan', 'AFG', 'South Asia', 'Asia & Pacific'),
  ('Albania', 'ALB', 'Europe & Central Asia', 'Europe'),
  ('Algeria', 'DZA', 'Middle East & North Africa', 'Middle East'),
  ('American Samoa', 'ASM', 'East Asia & Pacific', 'Asia & Pacific'),
  ('Andorra', 'AND', 'Europe & Central Asia', 'Europe'),
  ('Angola', 'AGO', 'Sub-Saharan Africa', 'Africa'),
  ('Antigua and Barbuda', 'ATG', 'Latin America & Caribbean', 'Central America & Caribbean'),
  ('Argentina', 'ARG', 'Latin America & Caribbean', 'South America'),
  ('Armenia', 'ARM', 'Europe & Central Asia', 'Europe'),
  ('Aruba', 'ABW', 'Latin America & Caribbean', 'Central America & Caribbean'),
  ('Australia', 'AUS', 'East Asia & Pacific', 'Asia & Pacific'),
  ('Austria', 'AUT', 'Europe & Central Asia', 'Europe'),
  ('Azerbaijan', 'AZE', 'Europe & Central Asia', 'Europe'),
  ('Bahamas', 'BHS', 'Latin America & Caribbean', 'Central America & Caribbean'),
  ('Bahrain', 'BHR', 'Middle East & North Africa', 'Middle East'),
  ('Bangladesh', 'BGD', 'South Asia', 'Asia & Pacific'),
  ('Barbados', 'BRB', 'Latin America & Caribbean', 'Central America & Caribbean'),
  ('Belarus', 'BLR', 'Europe & Central Asia', 'Europe'),
  ('Belgium', 'BEL', 'Europe & Central Asia', 'Europe'),
  ('Belize', 'BLZ', 'Latin America & Caribbean', 'Central America & Caribbean'),
  ('Benin', 'BEN', 'Sub-Saharan Africa', 'Africa'),
  ('Bermuda', 'BMU', 'North America', 'North America'),
  ('Bhutan', 'BTN', 'South Asia', 'Asia & Pacific'),
  ('Bolivia', 'BOL', 'Latin America & Caribbean', 'South America'),
  ('Bosnia and Herzegovina', 'BIH', 'Europe & Central Asia', 'Europe'),
  ('Botswana', 'BWA', 'Sub-Saharan Africa', 'Africa'),
  ('Brazil', 'BRA', 'Latin America & Caribbean', 'South America'),
  ('British Virgin Islands', 'VGB', 'Latin America & Caribbean', 'Central America & Caribbean'),
  ('Brunei Darussalam', 'BRN', 'East Asia & Pacific', 'Asia & Pacific'),
  ('Bulgaria', 'BGR', 'Europe & Central Asia', 'Europe'),
  ('Burkina Faso', 'BFA', 'Sub-Saharan Africa', 'Africa'),
  ('Burundi', 'BDI', 'Sub-Saharan Africa', 'Africa'),
  ('Cabo Verde', 'CPV', 'Sub-Saharan Africa', 'Africa'),
  ('Cambodia', 'KHM', 'East Asia & Pacific', 'Asia & Pacific'),
  ('Cameroon', 'CMR', 'Sub-Saharan Africa', 'Africa'),
  ('Canada', 'CAN', 'North America', 'North America'),
  ('Cayman Islands', 'CYM', 'Latin America & Caribbean', 'Central America & Caribbean'),
  ('Central African Republic', 'CAF', 'Sub-Saharan Africa', 'Africa'),
  ('Chad', 'TCD', 'Sub-Saharan Africa', 'Africa'),
  ('Chile', 'CHL', 'Latin America & Caribbean', 'South America'),
  ('China', 'CHN', 'East Asia & Pacific', 'Asia & Pacific'),
  ('Colombia', 'COL', 'Latin America & Caribbean', 'South America'),
  ('Comoros', 'COM', 'Sub-Saharan Africa', 'Africa'),
  ('Congo (DRC)', 'COD', 'Sub-Saharan Africa', 'Africa'),
  ('Congo, Rep.', 'COG', 'Sub-Saharan Africa', 'Africa'),
  ('Costa Rica', 'CRI', 'Latin America & Caribbean', 'Central America & Caribbean'),
  ('Croatia', 'HRV', 'Europe & Central Asia', 'Europe'),
  ('Czech Republic', 'CZE', 'Europe & Central Asia', 'Europe'),
  ('Denmark', 'DNK', 'Europe & Central Asia', 'Europe'),
  ('Djibouti', 'DJI', 'Middle East & North Africa', 'Africa'),
  ('Dominica', 'DMA', 'Latin America & Caribbean', 'Central America & Caribbean'),
  ('Dominican Republic', 'DOM', 'Latin America & Caribbean', 'Central America & Caribbean'),
  ('Ecuador', 'ECU', 'Latin America & Caribbean', 'South America'),
  ('Egypt', 'EGY', 'Middle East & North Africa', 'Middle East'),
  ('El Salvador', 'SLV', 'Latin America & Caribbean', 'Central America & Caribbean'),
  ('Eritrea', 'ERI', 'Sub-Saharan Africa', 'Africa'),
  ('Estonia', 'EST', 'Europe & Central Asia', 'Europe'),
  ('Ethiopia', 'ETH', 'Sub-Saharan Africa', 'Africa'),
  ('Fiji', 'FJI', 'East Asia & Pacific', 'Asia & Pacific'),
  ('Finland', 'FIN', 'Europe & Central Asia', 'Europe'),
  ('France', 'FRA', 'Europe & Central Asia', 'Europe'),
  ('Georgia', 'GEO', 'Europe & Central Asia', 'Europe'),
  ('Germany', 'DEU', 'Europe & Central Asia', 'Europe'),
  ('Greece', 'GRC', 'Europe & Central Asia', 'Europe'),
  ('Grenada', 'GRD', 'Latin America & Caribbean', 'Central America & Caribbean'),
  ('Guatemala', 'GTM', 'Latin America & Caribbean', 'Central America & Caribbean'),
  ('Honduras', 'HND', 'Latin America & Caribbean', 'Central America & Caribbean'),
  ('Hungary', 'HUN', 'Europe & Central Asia', 'Europe'),
  ('Iceland', 'ISL', 'Europe & Central Asia', 'Europe'),
  ('India', 'IND', 'South Asia', 'Asia & Pacific'),
  ('Indonesia', 'IDN', 'East Asia & Pacific', 'Asia & Pacific'),
  ('Iran', 'IRN', 'Middle East & North Africa', 'Middle East'),
  ('Ireland', 'IRL', 'Europe & Central Asia', 'Europe'),
  ('Italy', 'ITA', 'Europe & Central Asia', 'Europe'),
  ('Japan', 'JPN', 'East Asia & Pacific', 'Asia & Pacific'),
  ('Kenya', 'KEN', 'Sub-Saharan Africa', 'Africa'),
  ('Kyrgyzstan', 'KGZ', 'Europe & Central Asia', 'Asia & Pacific'),
  ('Laos', 'LAO', 'East Asia & Pacific', 'Asia & Pacific'),
  ('Latvia', 'LVA', 'Europe & Central Asia', 'Europe'),
  ('Lithuania', 'LTU', 'Europe & Central Asia', 'Europe'),
  ('Madagascar', 'MDG', 'Sub-Saharan Africa', 'Africa'),
  ('Malaysia', 'MYS', 'East Asia & Pacific', 'Asia & Pacific'),
  ('Mexico', 'MEX', 'Latin America & Caribbean', 'North America'),
  ('Mongolia', 'MNG', 'East Asia & Pacific', 'Asia & Pacific'),
  ('Montserrat', 'MSR', 'Latin America & Caribbean', 'Central America & Caribbean'),
  ('Netherlands', 'NLD', 'Europe & Central Asia', 'Europe'),
  ('New Zealand', 'NZL', 'East Asia & Pacific', 'Asia & Pacific'),
  ('Nicaragua', 'NIC', 'Latin America & Caribbean', 'Central America & Caribbean'),
  ('Panama', 'PAN', 'Latin America & Caribbean', 'Central America & Caribbean'),
  ('Papua New Guinea', 'PNG', 'East Asia & Pacific', 'Asia & Pacific'),
  ('Peru', 'PER', 'Latin America & Caribbean', 'South America'),
  ('Philippines', 'PHL', 'East Asia & Pacific', 'Asia & Pacific'),
  ('Portugal', 'PRT', 'Europe & Central Asia', 'Europe'),
  ('Romania', 'ROU', 'Europe & Central Asia', 'Europe'),
  ('Russia', 'RUS', 'Europe & Central Asia', 'Asia & Pacific'),
  ('Rwanda', 'RWA', 'Sub-Saharan Africa', 'Africa'),
  ('Serbia', 'SRB', 'Europe & Central Asia', 'Europe'),
  ('Singapore', 'SGP', 'East Asia & Pacific', 'Asia & Pacific'),
  ('Slovak Republic', 'SVK', 'Europe & Central Asia', 'Europe'),
  ('Slovenia', 'SVN', 'Europe & Central Asia', 'Europe'),
  ('Solomon Islands', 'SLB', 'East Asia & Pacific', 'Asia & Pacific'),
  ('Somaliland', 'SOM', 'Sub-Saharan Africa', 'Africa'),
  ('South Korea', 'KOR', 'East Asia & Pacific', 'Asia & Pacific'),
  ('Spain', 'ESP', 'Europe & Central Asia', 'Europe'),
  ('Switzerland', 'CHE', 'Europe & Central Asia', 'Europe'),
  ('Taiwan', 'TWN', 'East Asia & Pacific', 'Asia & Pacific'),
  ('Tanzania', 'TZA', 'Sub-Saharan Africa', 'Africa'),
  ('Thailand', 'THA', 'East Asia & Pacific', 'Asia & Pacific'),
  ('Türkiye', 'TUR', 'Europe & Central Asia', 'Middle East'),
  ('Uganda', 'UGA', 'Sub-Saharan Africa', 'Africa'),
  ('United Kingdom', 'GBR', 'Europe & Central Asia', 'Europe'),
  ('United States', 'USA', 'North America', 'North America'),
  ('Vanuatu', 'VUT', 'East Asia & Pacific', 'Asia & Pacific'),
  ('Vietnam', 'VNM', 'East Asia & Pacific', 'Asia & Pacific'),
  ('Zambia', 'ZMB', 'Sub-Saharan Africa', 'Africa'),
  ('Zimbabwe', 'ZWE', 'Sub-Saharan Africa', 'Africa')
ON CONFLICT (iso3) DO UPDATE
SET
  country_name = EXCLUDED.country_name,
  wb_region = EXCLUDED.wb_region,
  tge_region = EXCLUDED.tge_region,
  is_active = TRUE,
  updated_at = now();

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS country_id UUID REFERENCES countries_reference(country_id) ON DELETE SET NULL;

ALTER TABLE operating_assets
  ADD COLUMN IF NOT EXISTS country_id UUID REFERENCES countries_reference(country_id) ON DELETE SET NULL;

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS headquarters_country_id UUID REFERENCES countries_reference(country_id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_projects_country_id
  ON projects(country_id);

CREATE INDEX IF NOT EXISTS idx_operating_assets_country_id
  ON operating_assets(country_id);

CREATE INDEX IF NOT EXISTS idx_companies_headquarters_country_id
  ON companies(headquarters_country_id);
