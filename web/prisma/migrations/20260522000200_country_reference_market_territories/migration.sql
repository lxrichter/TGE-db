-- Add market geographies and HQ countries found during the first local
-- country-reference dry run. These are tracked as analytical markets in TGE
-- workflows even where they are territories rather than sovereign states.

INSERT INTO countries_reference (country_name, iso3, wb_region, tge_region)
VALUES
  ('Caribbean Netherlands', 'BES', 'Latin America & Caribbean', 'Central America & Caribbean'),
  ('Guadeloupe', 'GLP', 'Latin America & Caribbean', 'Central America & Caribbean'),
  ('La Réunion', 'REU', 'Sub-Saharan Africa', 'Africa'),
  ('Luxembourg', 'LUX', 'Europe & Central Asia', 'Europe'),
  ('Martinique', 'MTQ', 'Latin America & Caribbean', 'Central America & Caribbean'),
  ('Northern Mariana Islands', 'MNP', 'East Asia & Pacific', 'Asia & Pacific'),
  ('St. Kitts & Nevis', 'KNA', 'Latin America & Caribbean', 'Central America & Caribbean'),
  ('St. Lucia', 'LCA', 'Latin America & Caribbean', 'Central America & Caribbean'),
  ('St. Vincent & the Grenadines', 'VCT', 'Latin America & Caribbean', 'Central America & Caribbean')
ON CONFLICT (iso3) DO UPDATE
SET
  country_name = EXCLUDED.country_name,
  wb_region = EXCLUDED.wb_region,
  tge_region = EXCLUDED.tge_region,
  is_active = TRUE,
  updated_at = now();
