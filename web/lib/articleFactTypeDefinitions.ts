export type ArticleFactTypeDefinition = {
  code: string;
  label: string;
  purpose: string;
  reviewQuestion: string;
  accept: string[];
  reject: string[];
};

export const ARTICLE_FACT_TYPE_DEFINITIONS: ArticleFactTypeDefinition[] = [
  {
    code: "capacity_signal",
    label: "Capacity Signal",
    purpose:
      "Identifies geothermal capacity values that may support project, plant, direct-use, or market records.",
    reviewQuestion:
      "Is this number a geothermal capacity/output value that could become structured data?",
    accept: [
      "planned or installed MWe for a project or plant",
      "thermal MWth or heat/cooling output for direct-use records",
      "capacity values tied to a named project, asset, country, or company",
    ],
    reject: [
      "money amounts, parcel counts, acreage, tariffs, or lease prices",
      "general market totals not tied to a useful candidate field",
      "ambiguous MW values where power vs thermal meaning cannot be inferred",
    ],
  },
  {
    code: "cod_year_signal",
    label: "COD / Timing Signal",
    purpose:
      "Finds years that may support commissioning, planned operation, or startup timing fields.",
    reviewQuestion:
      "Is this year tied to commissioning, COD, operation, startup, or a credible planned operating date?",
    accept: [
      "actual COD or commissioning year",
      "planned COD, expected operation, or startup year",
      "operating timeline tied to a named project or facility",
    ],
    reject: [
      "article publication year, conference year, or company history year",
      "policy, funding, or tender years that do not indicate operation timing",
      "generic future years without a clear project/asset timing claim",
    ],
  },
  {
    code: "public_funding_grant_amount_signal",
    label: "Public Funding / Grant Amount",
    purpose:
      "Separates public-sector support from private financing and commercial contract values.",
    reviewQuestion:
      "Is this money amount public funding, a grant, subsidy, incentive, or government/EU support?",
    accept: [
      "government grants, subsidies, public funding, or state support",
      "EU funds, incentive programmes, or public financing awards",
      "public support tied to geothermal projects, research, drilling, or market development",
    ],
    reject: [
      "private company financing rounds or equity raises",
      "contract award values or equipment supply deals",
      "lease-sale proceeds, license awards, tariffs, or revenue numbers",
    ],
  },
  {
    code: "financing_investment_amount_signal",
    label: "Financing / Investment Amount",
    purpose:
      "Captures private capital raises and investment financing separately from public grants.",
    reviewQuestion:
      "Is this money amount private financing, investment, equity funding, or a company capital raise?",
    accept: [
      "company raises or financing rounds",
      "private investment, equity financing, venture funding, or expansion capital",
      "financing linked to a company, project portfolio, or development programme",
    ],
    reject: [
      "government grants, subsidies, or public incentive programmes",
      "contract awards, equipment orders, drilling contracts, or EPC values",
      "license/lease-sale proceeds or general market values",
    ],
  },
  {
    code: "debt_loan_amount_signal",
    label: "Debt / Loan Amount",
    purpose:
      "Captures repayable financing structures separately from grants and equity investment.",
    reviewQuestion:
      "Is this money amount a loan, debt financing, credit facility, or similar repayable finance?",
    accept: [
      "loans, debt financing, or credit facilities",
      "development bank loans or repayable project finance",
      "credit lines tied to geothermal development, drilling, or infrastructure",
    ],
    reject: [
      "grants, subsidies, or non-repayable public support",
      "equity raises, venture rounds, or general private investment",
      "contract values, lease-sale proceeds, or tariffs",
    ],
  },
  {
    code: "contract_award_amount_signal",
    label: "Contract Award Amount",
    purpose:
      "Captures commercial contract values without mixing them into funding or investment.",
    reviewQuestion:
      "Is this money amount the value of an awarded contract, supply deal, drilling contract, or EPC package?",
    accept: [
      "equipment supply contracts, drilling contracts, EPC contracts, or service contracts",
      "commercial awards tied to a supplier, contractor, project, or plant",
      "contract values that support company role or project procurement intelligence",
    ],
    reject: [
      "company financing rounds or investment raises",
      "public grant or subsidy amounts",
      "license/lease-sale proceeds, tariffs, revenue, or market totals",
    ],
  },
  {
    code: "license_lease_sale_amount_signal",
    label: "License / Lease-Sale Amount",
    purpose:
      "Captures money values from licenses, permits, lease sales, or concession awards.",
    reviewQuestion:
      "Is this money amount tied to a geothermal license, permit, lease sale, concession, or parcel award?",
    accept: [
      "lease-sale proceeds or parcel award values",
      "license or permit award values",
      "concession-related money signals tied to geothermal rights or acreage",
    ],
    reject: [
      "project financing, equity raises, or public grants",
      "contract values or equipment/service orders",
      "tariffs, revenue, market totals, or capacity values",
    ],
  },
  {
    code: "funding_amount_signal",
    label: "Funding Amount Fallback",
    purpose:
      "Legacy fallback for broad money signals that are useful but not yet safely classified.",
    reviewQuestion:
      "Is this money amount useful, but too ambiguous to classify as grant, investment, loan, contract, or license/lease-sale?",
    accept: [
      "clear geothermal funding or financing language with insufficient subtype context",
      "useful money signals that should remain reviewable instead of being discarded",
    ],
    reject: [
      "money values that clearly belong to a more specific fact type",
      "tariffs, revenue, event costs, general market values, or capacity values",
      "ambiguous money values with no geothermal intelligence use",
    ],
  },
  {
    code: "direct_use_category_signal",
    label: "Direct-Use Category Signal",
    purpose:
      "Detects article signals for geothermal heating, cooling, district energy, industrial heat, agriculture, and heat pumps.",
    reviewQuestion:
      "Does this article meaningfully indicate a direct-use category for a project, facility, company, or market?",
    accept: [
      "district heating/cooling, greenhouses, industrial heat, residential/commercial heat, or heat pump assisted use",
      "direct-use category tied to a named project, market, company, or facility",
    ],
    reject: [
      "generic sector wording without article-specific relevance",
      "power-only geothermal articles with incidental heat/cooling wording",
      "non-geothermal heating/cooling context",
    ],
  },
  {
    code: "activity_status_signal",
    label: "Activity / Status Signal",
    purpose:
      "Captures compact activity signals such as construction, drilling, policy, funding, license, contract, or proposal events.",
    reviewQuestion:
      "Does this signal identify a useful project, market, company, or policy activity state?",
    accept: [
      "construction starts, drilling activity, PPA/offtake, policy/tariff, proposal/call, license, funding, financing, or contract activity",
      "activity that can help validate lifecycle, market momentum, company role, or Research Ops queues",
    ],
    reject: [
      "generic news wording without operational meaning",
      "events, jobs, or corporate announcements unrelated to geothermal project/market intelligence",
      "signals that duplicate a better, more specific candidate without adding review value",
    ],
  },
  {
    code: "country_signal",
    label: "Country Signal",
    purpose:
      "Supports country/market association and related-news review without directly changing country fields.",
    reviewQuestion:
      "Is this country signal useful for linking the article to a market or filtering related news?",
    accept: [
      "country clearly tied to the article topic, project, company activity, or policy context",
      "country signals useful for market pages or article-to-country matching",
    ],
    reject: [
      "country only appears in unrelated boilerplate, event listings, or company address context",
      "country mention is incidental and not useful for market intelligence",
    ],
  },
  {
    code: "entity_signal",
    label: "Entity Signal",
    purpose:
      "Captures entity-like article signals for later matching to projects, plants/facilities, companies, and countries.",
    reviewQuestion:
      "Is this detected entity signal useful for article-to-record matching or related-news discovery?",
    accept: [
      "named companies, projects, facilities, fields, or markets central to the article",
      "aliases or terms that should improve future matching rules",
    ],
    reject: [
      "generic geothermal terms, organizations, or locations not useful as entity matches",
      "signals that are too broad, duplicated, or unrelated to record linking",
    ],
  },
];

export function getArticleFactTypeDefinition(code: string | undefined) {
  if (!code) {
    return null;
  }

  return (
    ARTICLE_FACT_TYPE_DEFINITIONS.find((definition) => definition.code === code) ||
    null
  );
}
