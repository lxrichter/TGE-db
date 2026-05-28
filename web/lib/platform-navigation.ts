import {
  canAccessAdmin,
  canManageUsers,
  canManageVocabularies,
  normalizeUserRole,
  type UserRole,
} from "@/lib/auth/roles";

export type PlatformNavigationGroupId =
  | "intelligence_research"
  | "research_operations"
  | "platform_admin";

export type PlatformAudience =
  | "subscriber"
  | "researcher"
  | "editor"
  | "administrator";

export type PlatformNavigationAccess =
  | "all_internal"
  | "admin_access"
  | "manage_users"
  | "manage_vocabularies";

export type PlatformNavigationItem = {
  key: string;
  label: string;
  commandLabel: string;
  note: string;
  href: string;
  showInHeader?: boolean;
  showInCommand?: boolean;
  access?: PlatformNavigationAccess;
  primaryAudiences: PlatformAudience[];
};

export type PlatformNavigationGroup = {
  id: PlatformNavigationGroupId;
  label: string;
  doctrineLayer: string;
  designIntent: string;
  items: PlatformNavigationItem[];
};

export const platformNavigationGroups: PlatformNavigationGroup[] = [
  {
    id: "intelligence_research",
    label: "Intelligence / Research",
    doctrineLayer: "Intelligence and research workspace",
    designIntent:
      "Default discovery layer for market intelligence, entity work, analysis, and spatial exploration.",
    items: [
      {
        key: "dashboard",
        label: "Dashboard",
        commandLabel: "Open Dashboard",
        note: "Executive geothermal intelligence overview.",
        href: "/",
        showInHeader: true,
        showInCommand: true,
        primaryAudiences: ["subscriber", "editor", "administrator"],
      },
      {
        key: "markets",
        label: "Markets",
        commandLabel: "Open Markets",
        note: "Market intelligence, country worklists, and source-gap signals.",
        href: "/postgres-preview/markets",
        showInHeader: true,
        showInCommand: true,
        primaryAudiences: ["subscriber", "editor", "administrator"],
      },
      {
        key: "analysis",
        label: "Analysis",
        commandLabel: "Open Analysis",
        note: "Cross-database benchmarking and geothermal intelligence analysis.",
        href: "/postgres-preview/analysis",
        showInHeader: true,
        showInCommand: true,
        primaryAudiences: ["subscriber", "editor", "administrator"],
      },
      {
        key: "map",
        label: "Map",
        commandLabel: "Open Map",
        note: "Spatial intelligence for coordinate-confirmed projects and plants.",
        href: "/postgres-preview/map",
        showInHeader: true,
        showInCommand: true,
        primaryAudiences: ["subscriber", "researcher", "editor", "administrator"],
      },
      {
        key: "projects",
        label: "Projects",
        commandLabel: "Open Projects",
        note: "Review and edit the development pipeline.",
        href: "/postgres-preview/projects",
        showInHeader: true,
        showInCommand: true,
        primaryAudiences: ["researcher", "editor", "administrator"],
      },
      {
        key: "plants",
        label: "Plants",
        commandLabel: "Open Plants",
        note: "Review plants, units, direct-use plants, and capacity.",
        href: "/postgres-preview/operating-assets",
        showInHeader: true,
        showInCommand: true,
        primaryAudiences: ["researcher", "editor", "administrator"],
      },
      {
        key: "companies",
        label: "Companies",
        commandLabel: "Open Companies",
        note: "Review companies, roles, ownership, and evidence.",
        href: "/postgres-preview/companies",
        showInHeader: true,
        showInCommand: true,
        primaryAudiences: ["researcher", "editor", "administrator"],
      },
    ],
  },
  {
    id: "research_operations",
    label: "Research Operations",
    doctrineLayer: "Evidence, validation, and review workflow",
    designIntent:
      "Internal governance layer for assigned work, evidence intake, AI-assisted review, and editorial validation.",
    items: [
      {
        key: "research-ops",
        label: "Research Ops",
        commandLabel: "Open Research Ops",
        note: "Queues, missing data, assignments, validation, and review actions.",
        href: "/postgres-preview/research-ops",
        showInHeader: true,
        showInCommand: true,
        primaryAudiences: ["researcher", "editor", "administrator"],
      },
      {
        key: "sources",
        label: "Sources",
        commandLabel: "Open Sources / Documents",
        note: "Manage governed sources and evidence.",
        href: "/sources",
        showInHeader: true,
        showInCommand: true,
        primaryAudiences: ["researcher", "editor", "administrator"],
      },
      {
        key: "article-matches",
        label: "Matches",
        commandLabel: "Review Article Matches",
        note: "Confirm or reject article-to-entity candidates.",
        href: "/sources/matches",
        showInHeader: true,
        showInCommand: true,
        primaryAudiences: ["editor", "administrator"],
      },
      {
        key: "article-facts",
        label: "Facts",
        commandLabel: "Review Article Facts",
        note: "Train and review compact extracted article fact candidates.",
        href: "/sources/facts",
        showInHeader: true,
        showInCommand: true,
        primaryAudiences: ["editor", "administrator"],
      },
      {
        key: "add-source",
        label: "Add Source",
        commandLabel: "Add Source",
        note: "Create a governed source/evidence entry.",
        href: "/sources/new",
        showInCommand: true,
        primaryAudiences: ["researcher", "editor", "administrator"],
      },
      {
        key: "field-suggestions",
        label: "Field Suggestions",
        commandLabel: "Review Field Suggestions",
        note: "Open human-confirmed AI field suggestions in Research Ops.",
        href: "/postgres-preview/research-ops#field-suggestion-review",
        showInCommand: true,
        primaryAudiences: ["editor", "administrator"],
      },
      {
        key: "add-project",
        label: "Add Project",
        commandLabel: "Add Project",
        note: "Create a project pipeline entry.",
        href: "/postgres-preview/projects/new",
        showInCommand: true,
        primaryAudiences: ["researcher", "editor", "administrator"],
      },
      {
        key: "add-plant",
        label: "Add Plant",
        commandLabel: "Add Plant",
        note: "Create a plant, unit, or direct-use plant.",
        href: "/postgres-preview/operating-assets/new",
        showInCommand: true,
        primaryAudiences: ["researcher", "editor", "administrator"],
      },
      {
        key: "add-company",
        label: "Add Company",
        commandLabel: "Add Company",
        note: "Create a company, group, supplier, operator, or investor.",
        href: "/postgres-preview/companies/new",
        showInCommand: true,
        primaryAudiences: ["researcher", "editor", "administrator"],
      },
    ],
  },
  {
    id: "platform_admin",
    label: "Platform / Admin",
    doctrineLayer: "Platform governance and administration",
    designIntent:
      "Operational control layer for cutover readiness, taxonomy, users, permissions, and platform rules.",
    items: [
      {
        key: "command-center",
        label: "Command",
        commandLabel: "Open Command Center",
        note: "Operational navigation across PostgreSQL staging modules.",
        href: "/postgres-preview",
        showInHeader: true,
        showInCommand: true,
        primaryAudiences: ["editor", "administrator"],
      },
      {
        key: "readiness",
        label: "Readiness",
        commandLabel: "Open Replacement Readiness",
        note: "Cutover signals, data quality gates, and migration readiness.",
        href: "/postgres-preview/readiness",
        showInHeader: true,
        showInCommand: true,
        primaryAudiences: ["editor", "administrator"],
      },
      {
        key: "admin",
        label: "Admin",
        commandLabel: "Open Admin",
        note: "Govern users, permissions, and platform controls.",
        href: "/admin",
        showInHeader: true,
        showInCommand: true,
        access: "admin_access",
        primaryAudiences: ["editor", "administrator"],
      },
      {
        key: "design-readiness",
        label: "Design Readiness",
        commandLabel: "Open Design Readiness",
        note: "Review role entry points, semantic color language, and design-phase decisions.",
        href: "/admin#design-readiness",
        showInCommand: true,
        access: "admin_access",
        primaryAudiences: ["editor", "administrator"],
      },
      {
        key: "admin-users",
        label: "Users",
        commandLabel: "Manage Users",
        note: "Create users, assign roles, reset passwords, and deactivate access.",
        href: "/admin/users",
        showInHeader: true,
        showInCommand: true,
        access: "manage_users",
        primaryAudiences: ["administrator"],
      },
      {
        key: "admin-vocabularies",
        label: "Vocabularies",
        commandLabel: "Manage Vocabularies",
        note: "Edit controlled taxonomy labels, ordering, and active terms.",
        href: "/admin/vocabularies",
        showInCommand: true,
        access: "manage_vocabularies",
        primaryAudiences: ["administrator"],
      },
    ],
  },
];

export function canAccessNavigationItem(
  item: PlatformNavigationItem,
  role?: UserRole | string | null
) {
  switch (item.access) {
    case "admin_access":
      return canAccessAdmin(role);
    case "manage_users":
      return canManageUsers(role);
    case "manage_vocabularies":
      return canManageVocabularies(role);
    case "all_internal":
    case undefined:
      return normalizeUserRole(role) !== null;
  }
}

export function getVisiblePlatformNavigationGroups(
  role?: UserRole | string | null,
  options: { target?: "header" | "command" | "all" } = {}
) {
  const target = options.target ?? "all";

  return platformNavigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        const matchesTarget =
          target === "all" ||
          (target === "header" && item.showInHeader) ||
          (target === "command" && item.showInCommand);

        return matchesTarget && canAccessNavigationItem(item, role);
      }),
    }))
    .filter((group) => group.items.length > 0);
}

export function getVisiblePlatformCommandItems(
  role?: UserRole | string | null
) {
  return getVisiblePlatformNavigationGroups(role, { target: "command" }).flatMap(
    (group) =>
      group.items.map((item) => ({
        ...item,
        groupId: group.id,
        groupLabel: group.label,
      }))
  );
}
