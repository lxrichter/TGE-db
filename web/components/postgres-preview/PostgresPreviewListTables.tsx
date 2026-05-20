import Link from "next/link";
import { formatCount, formatMw } from "@/lib/format";
import type {
  PostgresPreviewCompany,
  PostgresPreviewOperatingAsset,
  PostgresPreviewProject,
} from "@/lib/postgres-preview";

type HeaderAction = {
  href: string;
  label: string;
  variant?: "primary" | "secondary";
};

export type PreviewTableDensity = "comfortable" | "compact";

export type PreviewTablePagination = {
  basePath: string;
  page: number;
  pageSize: number;
  total: number;
  density: PreviewTableDensity;
  query?: Record<string, string | undefined>;
};

export type PreviewFilterOption = {
  value: string;
  label: string;
};

export type PreviewFilterSelect = {
  name: string;
  label: string;
  value?: string;
  placeholder: string;
  options: PreviewFilterOption[];
};

export type PreviewQuickView = {
  label: string;
  description: string;
  query: Record<string, string | undefined>;
};

export const DEFAULT_PREVIEW_PAGE_SIZE = 100;

export const PREVIEW_PAGE_SIZE_OPTIONS = [50, 100, 250];

export function parsePreviewListPage(value: string | undefined) {
  const parsed = Number(value || "1");

  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return Math.floor(parsed);
}

export function parsePreviewListPageSize(value: string | undefined) {
  const parsed = Number(value || DEFAULT_PREVIEW_PAGE_SIZE);

  if (!PREVIEW_PAGE_SIZE_OPTIONS.includes(parsed)) {
    return DEFAULT_PREVIEW_PAGE_SIZE;
  }

  return parsed;
}

export function parsePreviewTableDensity(
  value: string | undefined
): PreviewTableDensity {
  return value === "compact" ? "compact" : "comfortable";
}

export function formatPreviewFilterLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\bmw\b/gi, "MW")
    .replace(/\bmwe\b/gi, "MWe")
    .replace(/\bmwth\b/gi, "MWth")
    .replace(/\bcod\b/gi, "COD");
}

export function previewFilterOptions(values: string[]): PreviewFilterOption[] {
  return values.map((value) => ({
    value,
    label: formatPreviewFilterLabel(value),
  }));
}

function EmptyValue() {
  return <span className="text-gray-400">-</span>;
}

function MetricValue({
  value,
  suffix,
}: {
  value: number | null;
  suffix: string;
}) {
  if (value === null || value === undefined) {
    return <EmptyValue />;
  }

  return (
    <span>
      {formatMw(value)} {suffix}
    </span>
  );
}

function StatusBadge({ value }: { value: string | null }) {
  return (
    <span className="inline-flex h-7 items-center border border-gray-200 bg-[#f7f7f7] px-2 text-xs font-semibold text-gray-700">
      {value || "unknown"}
    </span>
  );
}

type RowIssueTone = "critical" | "important" | "workflow" | "useful";

type RowIssue = {
  label: string;
  tone: RowIssueTone;
  missingFilter?: string;
};

const rowIssueToneClass: Record<RowIssueTone, string> = {
  critical: "border-red-200 bg-red-50 text-red-700",
  important: "border-amber-200 bg-amber-50 text-amber-700",
  workflow: "border-sky-200 bg-sky-50 text-sky-700",
  useful: "border-gray-200 bg-gray-50 text-gray-600",
};

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim());
}

function isUnknownCode(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase();
  return !normalized || normalized === "unknown";
}

function hasAnyNumber(values: Array<number | null | undefined>) {
  return values.some((value) => value !== null && value !== undefined);
}

function appendPersistentIssueBadges(
  issues: RowIssue[],
  openIssueCount: number,
  criticalIssueCount: number
) {
  const persistentIssues: RowIssue[] = [];

  if (criticalIssueCount > 0) {
    persistentIssues.push({
      label: `${formatCount(criticalIssueCount)} critical issue${
        criticalIssueCount === 1 ? "" : "s"
      }`,
      tone: "critical",
    });
  }

  const nonCriticalIssueCount = Math.max(0, openIssueCount - criticalIssueCount);

  if (nonCriticalIssueCount > 0) {
    persistentIssues.push({
      label: `${formatCount(nonCriticalIssueCount)} research issue${
        nonCriticalIssueCount === 1 ? "" : "s"
      }`,
      tone: "workflow",
    });
  }

  issues.unshift(...persistentIssues);
}

function IssueBadges({
  issues,
  pagination,
}: {
  issues: RowIssue[];
  pagination?: PreviewTablePagination;
}) {
  if (issues.length === 0) {
    return (
      <span className="inline-flex h-7 items-center border border-emerald-200 bg-emerald-50 px-2 text-xs font-semibold text-emerald-700">
        No key gaps
      </span>
    );
  }

  const visibleIssues = issues.slice(0, 4);
  const remainingCount = issues.length - visibleIssues.length;

  return (
    <div className="flex flex-wrap gap-1.5">
      {visibleIssues.map((issue) => {
        const className = `inline-flex h-7 items-center border px-2 text-xs font-semibold ${rowIssueToneClass[issue.tone]}`;

        if (pagination && issue.missingFilter) {
          return (
            <Link
              key={`${issue.tone}-${issue.label}`}
              className={`${className} hover:border-[#8dc63f] hover:text-[#4f7f1f]`}
              href={quickViewHref({
                basePath: pagination.basePath,
                density: pagination.density,
                pageSize: pagination.pageSize,
                query: {
                  ...(pagination.query || {}),
                  missing: issue.missingFilter,
                },
              })}
            >
              {issue.label}
            </Link>
          );
        }

        return (
          <span key={`${issue.tone}-${issue.label}`} className={className}>
            {issue.label}
          </span>
        );
      })}
      {remainingCount > 0 ? (
        <span className="inline-flex h-7 items-center border border-gray-200 bg-white px-2 text-xs font-semibold text-gray-500">
          +{formatCount(remainingCount)}
        </span>
      ) : null}
    </div>
  );
}

function projectRowIssues(project: PostgresPreviewProject): RowIssue[] {
  const issues: RowIssue[] = [];

  if (!hasText(project.country)) {
    issues.push({
      label: "No country",
      tone: "critical",
      missingFilter: "country",
    });
  }

  if (isUnknownCode(project.primary_use_type_code)) {
    issues.push({
      label: "No use type",
      tone: "critical",
      missingFilter: "use_type",
    });
  }

  if (isUnknownCode(project.lifecycle_phase_code)) {
    issues.push({
      label: "No phase",
      tone: "critical",
      missingFilter: "status",
    });
  }

  if (project.source_count === 0) {
    issues.push({
      label: "No source",
      tone: "critical",
      missingFilter: "source",
    });
  }

  if (project.company_link_count === 0) {
    issues.push({
      label: "No company",
      tone: "important",
      missingFilter: "company_link",
    });
  }

  if (project.latitude === null || project.longitude === null) {
    issues.push({
      label: "No coordinates",
      tone: "important",
      missingFilter: "coordinates",
    });
  }

  if (
    !hasAnyNumber([
      project.potential_min_mwe,
      project.potential_max_mwe,
      project.electric_capacity_mwe,
      project.thermal_capacity_mwth,
      project.annual_power_generation_gwhe,
      project.annual_heat_supply_gwhth,
      project.annual_cooling_supply_gwhc,
    ])
  ) {
    issues.push({
      label: "No capacity",
      tone: "important",
      missingFilter: "capacity",
    });
  }

  appendPersistentIssueBadges(
    issues,
    project.open_issue_count,
    project.critical_issue_count
  );

  return issues;
}

function operatingAssetRowIssues(
  asset: PostgresPreviewOperatingAsset
): RowIssue[] {
  const issues: RowIssue[] = [];

  if (!hasText(asset.country)) {
    issues.push({
      label: "No country",
      tone: "critical",
      missingFilter: "country",
    });
  }

  if (isUnknownCode(asset.primary_use_type_code)) {
    issues.push({
      label: "No use type",
      tone: "critical",
      missingFilter: "use_type",
    });
  }

  if (isUnknownCode(asset.lifecycle_phase_code)) {
    issues.push({
      label: "No status",
      tone: "critical",
      missingFilter: "status",
    });
  }

  if (asset.source_count === 0) {
    issues.push({
      label: "No source",
      tone: "critical",
      missingFilter: "source",
    });
  }

  if (asset.company_link_count === 0) {
    issues.push({
      label: "No company",
      tone: "important",
      missingFilter: "company_link",
    });
  }

  if (asset.latitude === null || asset.longitude === null) {
    issues.push({
      label: "No coordinates",
      tone: "important",
      missingFilter: "coordinates",
    });
  }

  if (
    !hasAnyNumber([
      asset.electric_capacity_mwe,
      asset.electric_capacity_running_mwe,
      asset.thermal_capacity_mwth,
      asset.annual_power_generation_gwhe,
      asset.annual_heat_supply_gwhth,
      asset.annual_cooling_supply_gwhc,
    ])
  ) {
    issues.push({
      label: "No capacity",
      tone: "important",
      missingFilter: "capacity",
    });
  }

  if (asset.cod_year === null) {
    issues.push({ label: "No COD", tone: "important", missingFilter: "cod" });
  }

  appendPersistentIssueBadges(
    issues,
    asset.open_issue_count,
    asset.critical_issue_count
  );

  return issues;
}

function companyRowIssues(company: PostgresPreviewCompany): RowIssue[] {
  const issues: RowIssue[] = [];
  const activityLinkCount =
    company.project_link_count + company.operating_asset_link_count;

  if (!hasText(company.company_type_primary_code)) {
    issues.push({
      label: "No primary type",
      tone: "critical",
      missingFilter: "primary_type",
    });
  }

  if (company.source_count === 0) {
    issues.push({
      label: "No source",
      tone: "critical",
      missingFilter: "source",
    });
  }

  if (activityLinkCount === 0) {
    issues.push({
      label: "No activity link",
      tone: "important",
      missingFilter: "activity_link",
    });
  }

  if (!hasText(company.headquarters_country)) {
    issues.push({
      label: "No HQ country",
      tone: "important",
      missingFilter: "country",
    });
  }

  if (!hasText(company.website_url)) {
    issues.push({
      label: "No website",
      tone: "useful",
      missingFilter: "website",
    });
  }

  appendPersistentIssueBadges(
    issues,
    company.open_issue_count,
    company.critical_issue_count
  );

  return issues;
}

function previewTableHref(
  pagination: PreviewTablePagination,
  updates: Partial<Pick<PreviewTablePagination, "page" | "pageSize" | "density">>
) {
  const next = {
    page: pagination.page,
    pageSize: pagination.pageSize,
    density: pagination.density,
    ...updates,
  };
  const params = new URLSearchParams();
  Object.entries(pagination.query || {}).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  if (next.page > 1) {
    params.set("page", String(next.page));
  }

  if (next.pageSize !== DEFAULT_PREVIEW_PAGE_SIZE) {
    params.set("pageSize", String(next.pageSize));
  }

  if (next.density !== "comfortable") {
    params.set("density", next.density);
  }

  const query = params.toString();
  return query ? `${pagination.basePath}?${query}` : pagination.basePath;
}

function cleanQuery(query: Record<string, string | undefined>): Record<string, string> {
  const cleaned: Record<string, string> = {};

  Object.entries(query).forEach(([key, value]) => {
    if (value) {
      cleaned[key] = value;
    }
  });

  return cleaned;
}

export function previewQueryHref(
  basePath: string,
  query: Record<string, string | undefined>
) {
  const params = new URLSearchParams();

  Object.entries(cleanQuery(query)).forEach(([key, value]) => {
    params.set(key, value);
  });

  const queryString = params.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
}

function quickViewHref({
  basePath,
  pageSize,
  density,
  query,
}: {
  basePath: string;
  pageSize: number;
  density: PreviewTableDensity;
  query: Record<string, string | undefined>;
}) {
  const params = new URLSearchParams();

  Object.entries(cleanQuery(query)).forEach(([key, value]) => {
    params.set(key, value);
  });

  if (pageSize !== DEFAULT_PREVIEW_PAGE_SIZE) {
    params.set("pageSize", String(pageSize));
  }

  if (density !== "comfortable") {
    params.set("density", density);
  }

  const queryString = params.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
}

function filterStateHref({
  basePath,
  pageSize,
  density,
  query,
}: {
  basePath: string;
  pageSize: number;
  density: PreviewTableDensity;
  query: Record<string, string | undefined>;
}) {
  return quickViewHref({
    basePath,
    pageSize,
    density,
    query,
  });
}

function isQuickViewActive({
  currentQuery,
  viewQuery,
}: {
  currentQuery: Record<string, string | undefined>;
  viewQuery: Record<string, string | undefined>;
}) {
  const current = cleanQuery(currentQuery);
  const view = cleanQuery(viewQuery);
  const currentEntries = Object.entries(current);
  const viewEntries = Object.entries(view);

  if (currentEntries.length !== viewEntries.length) {
    return false;
  }

  return viewEntries.every(([key, value]) => current[key] === value);
}

export function PostgresPreviewQuickViews({
  basePath,
  pageSize,
  density,
  currentQuery,
  views,
}: {
  basePath: string;
  pageSize: number;
  density: PreviewTableDensity;
  currentQuery: Record<string, string | undefined>;
  views: PreviewQuickView[];
}) {
  return (
    <section className="border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-5 py-4">
        <h2 className="text-lg font-bold text-[#1f2937]">
          Quick Operational Views
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
          Reusable filter presets for common research and data-quality work.
          These are static MVP views; user/team saved views can build on this
          pattern later.
        </p>
      </div>
      <div className="grid gap-3 px-5 py-5 md:grid-cols-2 xl:grid-cols-4">
        {views.map((view) => {
          const active = isQuickViewActive({
            currentQuery,
            viewQuery: view.query,
          });

          return (
            <Link
              key={view.label}
              className={`border px-4 py-4 text-left ${
                active
                  ? "border-[#8dc63f] bg-[#f3f8ec]"
                  : "border-gray-200 bg-white hover:border-[#8dc63f] hover:bg-[#fbfff7]"
              }`}
              href={quickViewHref({
                basePath,
                density,
                pageSize,
                query: view.query,
              })}
            >
              <div
                className={`text-sm font-bold ${
                  active ? "text-[#4f7f1f]" : "text-[#1f2937]"
                }`}
              >
                {view.label}
              </div>
              <div className="mt-2 text-xs leading-5 text-gray-500">
                {view.description}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function PostgresPreviewListFilters({
  basePath,
  search,
  selects,
  pageSize,
  density,
}: {
  basePath: string;
  search?: string;
  selects: PreviewFilterSelect[];
  pageSize: number;
  density: PreviewTableDensity;
}) {
  const currentQuery = {
    search,
    ...Object.fromEntries(selects.map((select) => [select.name, select.value])),
  };
  const activeFilters = [
    ...(search
      ? [
          {
            key: "search",
            label: "Search",
            value: search,
            href: filterStateHref({
              basePath,
              pageSize,
              density,
              query: { ...currentQuery, search: undefined },
            }),
          },
        ]
      : []),
    ...selects
      .filter((select) => Boolean(select.value))
      .map((select) => {
        const selectedOption = select.options.find(
          (option) => option.value === select.value
        );

        return {
          key: select.name,
          label: select.label,
          value: selectedOption?.label || formatPreviewFilterLabel(select.value || ""),
          href: filterStateHref({
            basePath,
            pageSize,
            density,
            query: { ...currentQuery, [select.name]: undefined },
          }),
        };
      }),
  ];
  const activeCount = activeFilters.length;

  return (
    <section className="border border-gray-200 bg-white">
      <form
        action={basePath}
        className="grid gap-4 px-5 py-5 lg:grid-cols-[minmax(220px,1.4fr)_repeat(4,minmax(150px,1fr))_auto]"
      >
        {pageSize !== DEFAULT_PREVIEW_PAGE_SIZE ? (
          <input name="pageSize" type="hidden" value={pageSize} />
        ) : null}
        {density !== "comfortable" ? (
          <input name="density" type="hidden" value={density} />
        ) : null}
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            Search
          </span>
          <input
            className="mt-2 h-10 w-full border border-gray-300 bg-white px-3 text-sm text-[#1f2937] outline-none focus:border-[#8dc63f]"
            defaultValue={search || ""}
            name="search"
            placeholder="Name, ID, country, group..."
          />
        </label>
        {selects.map((select) => (
          <label key={select.name} className="block">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              {select.label}
            </span>
            <select
              className="mt-2 h-10 w-full border border-gray-300 bg-white px-3 text-sm text-[#1f2937] outline-none focus:border-[#8dc63f]"
              defaultValue={select.value || ""}
              name={select.name}
            >
              <option value="">{select.placeholder}</option>
              {select.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ))}
        <div className="flex items-end gap-2">
          <button
            className="inline-flex h-10 items-center justify-center border border-[#8dc63f] bg-[#8dc63f] px-4 text-sm font-semibold text-white hover:bg-[#78ad35]"
            type="submit"
          >
            Apply
          </button>
          <Link
            className="inline-flex h-10 items-center justify-center border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
            href={basePath}
          >
            Reset
          </Link>
        </div>
      </form>
      <div className="border-t border-gray-200 px-5 py-3">
        {activeCount > 0 ? (
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex min-h-8 items-center border border-gray-200 bg-[#f7f7f7] px-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                {formatCount(activeCount)} active filter
                {activeCount === 1 ? "" : "s"}
              </span>
              {activeFilters.map((filter) => (
                <Link
                  key={filter.key}
                  href={filter.href}
                  className="inline-flex min-h-8 items-center border border-[#d7e8bf] bg-[#f5faef] px-3 text-xs font-semibold text-[#4f7f1f] hover:border-[#8dc63f]"
                >
                  <span className="text-gray-500">{filter.label}:</span>
                  <span className="ml-1">{filter.value}</span>
                  <span className="ml-2 text-gray-400">x</span>
                </Link>
              ))}
            </div>
            <Link
              className="inline-flex h-8 items-center justify-center border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
              href={filterStateHref({
                basePath,
                pageSize,
                density,
                query: {},
              })}
            >
              Clear Filters
            </Link>
          </div>
        ) : (
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            No active filters
          </div>
        )}
      </div>
    </section>
  );
}

function rangeLabel(pagination: PreviewTablePagination, count: number) {
  if (pagination.total === 0) {
    return "No records";
  }

  if (count === 0) {
    return `No records on page ${formatCount(pagination.page)} of ${formatCount(
      pagination.total
    )} total records`;
  }

  const start = (pagination.page - 1) * pagination.pageSize + 1;
  const end = Math.min(start + count - 1, pagination.total);

  return `Showing ${formatCount(start)}-${formatCount(end)} of ${formatCount(
    pagination.total
  )} records`;
}

function PaginationControls({
  pagination,
  count,
}: {
  pagination: PreviewTablePagination;
  count: number;
}) {
  const isFirstPage = pagination.page <= 1;
  const isLastPage = pagination.page * pagination.pageSize >= pagination.total;

  return (
    <div className="flex flex-col gap-3 border-t border-gray-200 px-5 py-4 text-sm text-gray-600 lg:flex-row lg:items-center lg:justify-between">
      <div>{rangeLabel(pagination, count)}</div>
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex h-9 items-center border border-gray-200 bg-[#f7f7f7] px-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Density
        </span>
        <Link
          href={previewTableHref(pagination, {
            density: "comfortable",
            page: 1,
          })}
          className={`inline-flex h-9 items-center border px-3 text-xs font-semibold ${
            pagination.density === "comfortable"
              ? "border-[#8dc63f] bg-[#f3f8ec] text-[#4f7f1f]"
              : "border-gray-300 bg-white text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
          }`}
        >
          Comfortable
        </Link>
        <Link
          href={previewTableHref(pagination, { density: "compact", page: 1 })}
          className={`inline-flex h-9 items-center border px-3 text-xs font-semibold ${
            pagination.density === "compact"
              ? "border-[#8dc63f] bg-[#f3f8ec] text-[#4f7f1f]"
              : "border-gray-300 bg-white text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
          }`}
        >
          Compact
        </Link>
        <span className="inline-flex h-9 items-center border border-gray-200 bg-[#f7f7f7] px-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Rows
        </span>
        {PREVIEW_PAGE_SIZE_OPTIONS.map((pageSize) => (
          <Link
            key={pageSize}
            href={previewTableHref(pagination, { pageSize, page: 1 })}
            className={`inline-flex h-9 items-center border px-3 text-xs font-semibold ${
              pagination.pageSize === pageSize
                ? "border-[#8dc63f] bg-[#f3f8ec] text-[#4f7f1f]"
                : "border-gray-300 bg-white text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
            }`}
          >
            {pageSize}
          </Link>
        ))}
        <Link
          href={previewTableHref(pagination, {
            page: Math.max(pagination.page - 1, 1),
          })}
          aria-disabled={isFirstPage}
          className={`inline-flex h-9 items-center border px-3 text-sm font-semibold ${
            isFirstPage
              ? "pointer-events-none border-gray-200 bg-gray-50 text-gray-400"
              : "border-gray-300 bg-white text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
          }`}
        >
          Previous
        </Link>
        <span className="inline-flex h-9 items-center border border-gray-200 px-3 text-sm font-semibold text-gray-500">
          Page {formatCount(pagination.page)}
        </span>
        <Link
          href={previewTableHref(pagination, { page: pagination.page + 1 })}
          aria-disabled={isLastPage}
          className={`inline-flex h-9 items-center border px-3 text-sm font-semibold ${
            isLastPage
              ? "pointer-events-none border-gray-200 bg-gray-50 text-gray-400"
              : "border-gray-300 bg-white text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
          }`}
        >
          Next
        </Link>
      </div>
    </div>
  );
}

function tableCellClass(density: PreviewTableDensity) {
  return density === "compact" ? "px-4 py-2" : "px-5 py-4";
}

function tableHeadClass(density: PreviewTableDensity) {
  return density === "compact" ? "px-4 py-2" : "px-5 py-3";
}

function SectionHeader({
  title,
  count,
  total,
  pagination,
}: {
  title: string;
  count: number;
  total?: number;
  pagination?: PreviewTablePagination;
}) {
  const countLabel =
    pagination
      ? rangeLabel(pagination, count)
      : total && total > count
      ? `Showing ${formatCount(count)} of ${formatCount(total)} records`
      : `${formatCount(count)} records`;

  return (
    <div className="flex flex-col gap-2 border-b border-gray-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
      <h2 className="text-lg font-bold text-[#1f2937]">{title}</h2>
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {countLabel}
      </span>
    </div>
  );
}

export function PostgresPreviewSetupNotice({ error }: { error: string }) {
  return (
    <section className="border border-amber-200 bg-amber-50 px-5 py-5">
      <h2 className="text-lg font-bold text-amber-900">PostgreSQL Not Connected</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-amber-900">
        This preview reads from the Railway PostgreSQL database. Run the app
        through Railway variables or set `DATABASE_PUBLIC_URL` / `DATABASE_URL`
        locally.
      </p>
      <pre className="mt-4 overflow-x-auto bg-white px-4 py-3 text-xs text-gray-700">
        railway run --service Postgres -- npm --prefix web run dev
      </pre>
      <p className="mt-3 text-xs text-amber-900">Error: {error}</p>
    </section>
  );
}

export function PostgresPreviewListHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions: HeaderAction[];
}) {
  return (
    <section className="border border-gray-200 bg-white">
      <div className="border-l-4 border-l-[#8dc63f] px-8 py-8">
        <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#8dc63f]">
          {eyebrow}
        </p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-[#1f2937]">
              {title}
            </h1>
            <p className="mt-4 max-w-4xl text-base leading-7 text-gray-600">
              {description}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {actions.map((action) => {
              const isPrimary = action.variant === "primary";

              return (
                <Link
                  key={`${action.href}-${action.label}`}
                  className={
                    isPrimary
                      ? "inline-flex h-10 items-center justify-center border border-[#8dc63f] bg-white px-4 text-sm font-semibold text-[#4f7f1f] hover:bg-[#f3f8ec]"
                      : "inline-flex h-10 items-center justify-center border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:border-[#8dc63f] hover:text-[#4f7f1f]"
                  }
                  href={action.href}
                >
                  {action.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export function ProjectsPreviewTable({
  projects,
  total,
  pagination,
}: {
  projects: PostgresPreviewProject[];
  total?: number;
  pagination?: PreviewTablePagination;
}) {
  const density = pagination?.density ?? "comfortable";
  const cellClass = tableCellClass(density);
  const headClass = tableHeadClass(density);

  return (
    <section className="border border-gray-200 bg-white">
      <SectionHeader
        title="Projects"
        count={projects.length}
        total={total}
        pagination={pagination}
      />
      <div className="overflow-x-auto">
        <table className="min-w-[1180px] table-fixed text-left text-sm">
          <thead className="bg-[#f7f7f7] text-[11px] uppercase tracking-wide text-gray-500">
            <tr>
              <th className={`w-[24%] ${headClass} font-semibold`}>Name</th>
              <th className={`w-[10%] ${headClass} font-semibold`}>Use</th>
              <th className={`w-[12%] ${headClass} font-semibold`}>Phase</th>
              <th className={`w-[14%] ${headClass} font-semibold`}>Location</th>
              <th className={`w-[10%] ${headClass} font-semibold`}>Power</th>
              <th className={`w-[10%] ${headClass} font-semibold`}>Thermal</th>
              <th className={`w-[10%] ${headClass} font-semibold`}>Review</th>
              <th className={`w-[20%] ${headClass} font-semibold`}>Issues</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {projects.map((project) => {
              const issues = projectRowIssues(project);

              return (
                <tr key={project.project_id} className="align-top">
                  <td className={cellClass}>
                    <Link
                      href={`/postgres-preview/projects/${project.project_id}`}
                      className="font-semibold text-[#1f2937] hover:text-[#4f7f1f] hover:underline"
                    >
                      {project.project_name}
                    </Link>
                    <div className="mt-1 text-xs text-gray-500">
                      {project.legacy_project_id || "new-postgres-record"}
                    </div>
                  </td>
                  <td className={`${cellClass} text-gray-700`}>
                    {project.primary_use_type_code}
                  </td>
                  <td className={`${cellClass} text-gray-700`}>
                    {project.lifecycle_phase_code}
                  </td>
                  <td className={`${cellClass} text-gray-700`}>
                    {project.country || <EmptyValue />}
                    <div className="mt-1 text-xs text-gray-500">
                      {project.region || <EmptyValue />}
                    </div>
                  </td>
                  <td className={`${cellClass} text-gray-700`}>
                    <MetricValue
                      value={project.electric_capacity_mwe}
                      suffix="MWe"
                    />
                  </td>
                  <td className={`${cellClass} text-gray-700`}>
                    <MetricValue
                      value={project.thermal_capacity_mwth}
                      suffix="MWth"
                    />
                  </td>
                  <td className={cellClass}>
                    <StatusBadge value={project.review_status_code} />
                  </td>
                  <td className={cellClass}>
                    <IssueBadges issues={issues} pagination={pagination} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {pagination ? (
        <PaginationControls count={projects.length} pagination={pagination} />
      ) : null}
    </section>
  );
}

export function OperatingAssetsPreviewTable({
  operatingAssets,
  total,
  pagination,
}: {
  operatingAssets: PostgresPreviewOperatingAsset[];
  total?: number;
  pagination?: PreviewTablePagination;
}) {
  const density = pagination?.density ?? "comfortable";
  const cellClass = tableCellClass(density);
  const headClass = tableHeadClass(density);

  return (
    <section className="border border-gray-200 bg-white">
      <SectionHeader
        title="Plants / Facilities"
        count={operatingAssets.length}
        total={total}
        pagination={pagination}
      />
      <div className="overflow-x-auto">
        <table className="min-w-[1180px] table-fixed text-left text-sm">
          <thead className="bg-[#f7f7f7] text-[11px] uppercase tracking-wide text-gray-500">
            <tr>
              <th className={`w-[24%] ${headClass} font-semibold`}>Name</th>
              <th className={`w-[10%] ${headClass} font-semibold`}>Use</th>
              <th className={`w-[12%] ${headClass} font-semibold`}>Status</th>
              <th className={`w-[14%] ${headClass} font-semibold`}>Location</th>
              <th className={`w-[10%] ${headClass} font-semibold`}>Installed</th>
              <th className={`w-[10%] ${headClass} font-semibold`}>Running</th>
              <th className={`w-[10%] ${headClass} font-semibold`}>Review</th>
              <th className={`w-[20%] ${headClass} font-semibold`}>Issues</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {operatingAssets.map((asset) => {
              const issues = operatingAssetRowIssues(asset);

              return (
                <tr key={asset.operating_asset_id} className="align-top">
                  <td className={cellClass}>
                    <Link
                      href={`/postgres-preview/operating-assets/${asset.operating_asset_id}`}
                      className="font-semibold text-[#1f2937] hover:text-[#4f7f1f] hover:underline"
                    >
                      {asset.asset_name}
                    </Link>
                    <div className="mt-1 text-xs text-gray-500">
                      {asset.legacy_plant_id || "new-postgres-record"}
                    </div>
                  </td>
                  <td className={`${cellClass} text-gray-700`}>
                    {asset.primary_use_type_code}
                  </td>
                  <td className={`${cellClass} text-gray-700`}>
                    {asset.lifecycle_phase_code}
                  </td>
                  <td className={`${cellClass} text-gray-700`}>
                    {asset.country || <EmptyValue />}
                    <div className="mt-1 text-xs text-gray-500">
                      {asset.region || <EmptyValue />}
                    </div>
                  </td>
                  <td className={`${cellClass} text-gray-700`}>
                    <MetricValue
                      value={asset.electric_capacity_mwe}
                      suffix="MWe"
                    />
                  </td>
                  <td className={`${cellClass} text-gray-700`}>
                    <MetricValue
                      value={asset.electric_capacity_running_mwe}
                      suffix="MWe"
                    />
                  </td>
                  <td className={cellClass}>
                    <StatusBadge value={asset.review_status_code} />
                  </td>
                  <td className={cellClass}>
                    <IssueBadges issues={issues} pagination={pagination} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {pagination ? (
        <PaginationControls
          count={operatingAssets.length}
          pagination={pagination}
        />
      ) : null}
    </section>
  );
}

export function CompaniesPreviewTable({
  companies,
  total,
  pagination,
}: {
  companies: PostgresPreviewCompany[];
  total?: number;
  pagination?: PreviewTablePagination;
}) {
  const density = pagination?.density ?? "comfortable";
  const cellClass = tableCellClass(density);
  const headClass = tableHeadClass(density);

  return (
    <section className="border border-gray-200 bg-white">
      <SectionHeader
        title="Companies"
        count={companies.length}
        total={total}
        pagination={pagination}
      />
      <div className="overflow-x-auto">
        <table className="min-w-[1040px] table-fixed text-left text-sm">
          <thead className="bg-[#f7f7f7] text-[11px] uppercase tracking-wide text-gray-500">
            <tr>
              <th className={`w-[28%] ${headClass} font-semibold`}>Name</th>
              <th className={`w-[16%] ${headClass} font-semibold`}>Type</th>
              <th className={`w-[14%] ${headClass} font-semibold`}>HQ</th>
              <th className={`w-[16%] ${headClass} font-semibold`}>Focus</th>
              <th className={`w-[10%] ${headClass} font-semibold`}>Review</th>
              <th className={`w-[20%] ${headClass} font-semibold`}>Issues</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {companies.map((company) => {
              const issues = companyRowIssues(company);

              return (
                <tr key={company.company_id} className="align-top">
                  <td className={cellClass}>
                    <Link
                      href={`/postgres-preview/companies/${company.company_id}`}
                      className="font-semibold text-[#1f2937] hover:text-[#4f7f1f] hover:underline"
                    >
                      {company.company_name}
                    </Link>
                    <div className="mt-1 text-xs text-gray-500">
                      {company.legacy_company_id || "new-postgres-record"}
                    </div>
                  </td>
                  <td className={`${cellClass} text-gray-700`}>
                    {company.company_type_primary_code || <EmptyValue />}
                    <div className="mt-1 text-xs text-gray-500">
                      {company.entity_type_code || <EmptyValue />}
                    </div>
                  </td>
                  <td className={`${cellClass} text-gray-700`}>
                    {company.headquarters_country || <EmptyValue />}
                  </td>
                  <td className={`${cellClass} text-gray-700`}>
                    {company.geothermal_focus || <EmptyValue />}
                  </td>
                  <td className={cellClass}>
                    <StatusBadge value={company.review_status_code} />
                  </td>
                  <td className={cellClass}>
                    <IssueBadges issues={issues} pagination={pagination} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {pagination ? (
        <PaginationControls count={companies.length} pagination={pagination} />
      ) : null}
    </section>
  );
}
