"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { LayerGroup, Map as LeafletMap, TileLayer } from "leaflet";
import { normalizePhaseName } from "@/components/ui/PhaseBadge";

type GroupedMarker = {
  group_name: string;
  representative_id: string;
  country: string | null;
  region?: string | null;
  latitude: number;
  longitude: number;
  record_count: number;
  total_capacity_mw: number | null;
  potential_min_mw?: number | null;
  phase?: string | null;
  type: "plant" | "project";
};

type MapApiResponse = {
  plants: GroupedMarker[];
  projects: GroupedMarker[];
  error?: string;
};

type ViewMode = "map" | "satellite";

function MapFilterGroup({
  title,
  note,
  children,
  defaultOpen = true,
}: {
  title: string;
  note?: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details
      className="border-t border-[var(--tge-governance-neutral-border)] pt-2"
      open={defaultOpen}
    >
      <summary className="cursor-pointer list-none text-[11px] font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)] marker:hidden">
        {title}
        {note ? (
          <span className="ml-2 normal-case tracking-normal text-[var(--tge-governance-muted-text)]">
            {note}
          </span>
        ) : null}
      </summary>
      <div className="mt-1.5">{children}</div>
    </details>
  );
}

function FutureFilterRow({
  label,
  values,
}: {
  label: string;
  values: string[];
}) {
  return (
    <div className="border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-2.5 py-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]">
          {label}
        </span>
        <span className="border border-[var(--tge-governance-muted-border)] bg-[var(--tge-surface-card)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]">
          Planned
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {values.map((value) => (
          <span
            key={value}
            className="inline-flex min-h-6 items-center border border-[var(--tge-governance-muted-border)] bg-[var(--tge-surface-card)] px-2 text-[11px] font-semibold text-[var(--tge-governance-muted-text)]"
          >
            {value}
          </span>
        ))}
      </div>
    </div>
  );
}

function cssToken(name: string, fallback: string) {
  if (typeof window === "undefined") {
    return fallback;
  }

  return (
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() ||
    fallback
  );
}

function markerColor(type: "plant" | "project") {
  return type === "project"
    ? cssToken("--tge-map-marker-project", "#e8a56c")
    : cssToken("--tge-map-marker-plant", "#64a542");
}

function popupAccentClass(type: "plant" | "project") {
  return type === "plant"
    ? "tge-map-popup tge-map-popup--plant"
    : "tge-map-popup tge-map-popup--project";
}

function normalizePopupPhase(value: string | null, type: "plant" | "project") {
  const normalized = normalizePhaseName(value);

  if (type === "plant") {
    if (normalized === "Construction") return "Construction";
    if (normalized === "Exploration") return "Exploration";
    if (normalized === "Prospect") return "Prospect";
    if (normalized === "Cancelled") return "Cancelled";
    if (normalized === "Stalled") return "Stalled";
    if (normalized === "TBD") return "TBD";
    if (normalized === "NA") return "NA";
    return "Operating";
  }

  return normalized;
}

function formatPopupValue(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "NA";
  }
  return Number(value).toLocaleString();
}

function popupPhaseBadgeStyle(phase: string) {
  const normalized = phase.toLowerCase();

  let style =
    "display:inline-flex;align-items:center;justify-content:center;white-space:nowrap;padding:4px 12px;font-size:11px;font-weight:600;line-height:1;border:1px solid transparent;";

  if (normalized.includes("prospect")) {
    style +=
      "background:var(--tge-lifecycle-prospect-bg);border-color:var(--tge-lifecycle-prospect-border);color:var(--tge-lifecycle-prospect-text);";
  } else if (normalized.includes("exploration")) {
    style +=
      "background:var(--tge-lifecycle-exploration-bg);border-color:var(--tge-lifecycle-exploration-border);color:var(--tge-lifecycle-exploration-text);";
  } else if (normalized.includes("pre-feasibility")) {
    style +=
      "background:var(--tge-lifecycle-pre-feasibility-bg);border-color:var(--tge-lifecycle-pre-feasibility-border);color:var(--tge-lifecycle-pre-feasibility-text);";
  } else if (normalized.includes("feasibility")) {
    style +=
      "background:var(--tge-lifecycle-feasibility-bg);border-color:var(--tge-lifecycle-feasibility-border);color:var(--tge-lifecycle-feasibility-text);";
  } else if (normalized.includes("construction")) {
    style +=
      "background:var(--tge-lifecycle-construction-bg);border-color:var(--tge-lifecycle-construction-border);color:var(--tge-lifecycle-construction-text);";
  } else if (normalized.includes("operating")) {
    style +=
      "background:var(--tge-lifecycle-operating-bg);border-color:var(--tge-lifecycle-operating-border);color:var(--tge-lifecycle-operating-text);";
  } else if (normalized.includes("stalled")) {
    style +=
      "background:var(--tge-governance-attention-bg);border-color:var(--tge-governance-attention-border);color:var(--tge-governance-attention-text);";
  } else if (normalized.includes("cancelled")) {
    style +=
      "background:var(--tge-lifecycle-cancelled-bg);border-color:var(--tge-lifecycle-cancelled-border);color:var(--tge-lifecycle-cancelled-text);";
  } else if (normalized.includes("tbd")) {
    style +=
      "background:var(--tge-governance-muted-bg);border-color:var(--tge-governance-muted-border);color:var(--tge-governance-muted-text);";
  } else {
    style +=
      "background:var(--tge-governance-neutral-bg);border-color:var(--tge-governance-neutral-border);color:var(--tge-governance-neutral-text);";
  }

  return style;
}

function popupBadgeHtml(phase: string) {
  return `<span style="${popupPhaseBadgeStyle(phase)}">${phase}</span>`;
}

function getTileConfig(viewMode: ViewMode) {
  return viewMode === "satellite"
    ? {
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        attribution: "Tiles © Esri",
        maxZoom: 17,
      }
    : {
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
        attribution: "Tiles © Esri",
        maxZoom: 13,
      };
}

export default function GroupedMap({
  apiPath = "/api/map",
  allCountriesLabel = "All Countries",
  countryFilterLabel = "Country",
  detailPathMode = "legacy",
  regionFilterLabel = "Region",
}: {
  apiPath?: string;
  allCountriesLabel?: string;
  countryFilterLabel?: string;
  detailPathMode?: "legacy" | "postgres-preview";
  regionFilterLabel?: string;
}) {
  const [data, setData] = useState<MapApiResponse>({ plants: [], projects: [] });
  const [showPlants, setShowPlants] = useState(true);
  const [showProjects, setShowProjects] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("map");
  const [countryFilter, setCountryFilter] = useState(allCountriesLabel);
  const [regionFilter, setRegionFilter] = useState("All Regions");
  const [isExpandedMap, setIsExpandedMap] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(true);

  const mapRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<LeafletMap | null>(null);
  const tileLayerRef = useRef<TileLayer | null>(null);
  const markerLayerRef = useRef<LayerGroup | null>(null);
  const hasFittedBoundsRef = useRef(false);

  useEffect(() => {
    fetch(apiPath)
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Map API failed: ${res.status} ${text}`);
        }
        return res.json();
      })
      .then((json: MapApiResponse) => {
        setData({
          plants: Array.isArray(json.plants) ? json.plants : [],
          projects: Array.isArray(json.projects) ? json.projects : [],
          error: json.error,
        });
      })
      .catch((error) => {
        console.error("Failed to load map data:", error);
        setData({ plants: [], projects: [] });
      });
  }, [apiPath]);

  const allMarkers = useMemo(
    () => [...data.plants, ...data.projects],
    [data.plants, data.projects]
  );

  const countryOptions = useMemo(() => {
    const countries = Array.from(
      new Set(
        allMarkers
          .map((item) => (item.country || "").trim())
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

    return [allCountriesLabel, ...countries];
  }, [allCountriesLabel, allMarkers]);

  const regionOptions = useMemo(() => {
    const regions = Array.from(
      new Set(
        allMarkers
          .map((item) => (item.region || "").trim())
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

    return ["All Regions", ...regions];
  }, [allMarkers]);

  const visibleMarkers = useMemo(() => {
    let items: GroupedMarker[] = [];

    if (showPlants) items.push(...data.plants);
    if (showProjects) items.push(...data.projects);

    if (countryFilter !== allCountriesLabel) {
      items = items.filter(
        (item) => (item.country || "").trim() === countryFilter
      );
    }

    if (regionFilter !== "All Regions") {
      items = items.filter(
        (item) => (item.region || "").trim() === regionFilter
      );
    }

    return items;
  }, [
    allCountriesLabel,
    data,
    showPlants,
    showProjects,
    countryFilter,
    regionFilter,
  ]);

  // Initialize map once
  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      if (!mapRef.current || leafletMapRef.current) return;

      const L = await import("leaflet");
      if (cancelled || !mapRef.current) return;

      const map = L.map(mapRef.current, {
        center: [18, 10],
        zoom: 2,
        minZoom: 2,
        maxZoom: 17,
        scrollWheelZoom: true,
      });

      leafletMapRef.current = map;

      if (!map.getPane("projectPane")) {
        map.createPane("projectPane");
        map.getPane("projectPane")!.style.zIndex = "650";
      }

      if (!map.getPane("plantPane")) {
        map.createPane("plantPane");
        map.getPane("plantPane")!.style.zIndex = "660";
      }

      if (map.getPane("popupPane")) {
        map.getPane("popupPane")!.style.zIndex = "700";
      }

      const tileConfig = getTileConfig(viewMode);
      tileLayerRef.current = L.tileLayer(tileConfig.url, {
        attribution: tileConfig.attribution,
        maxZoom: tileConfig.maxZoom,
      }).addTo(map);

      map.setMaxZoom(tileConfig.maxZoom);

      setTimeout(() => map.invalidateSize(), 0);
    }

    initMap();

    return () => {
      cancelled = true;
    };
  }, [viewMode]);

  // Swap only tile layer when view mode changes
  useEffect(() => {
    let cancelled = false;

    async function updateTileLayer() {
      const map = leafletMapRef.current;
      if (!map) return;

      const L = await import("leaflet");
      if (cancelled) return;

      const tileConfig = getTileConfig(viewMode);

      if (tileLayerRef.current) {
        map.removeLayer(tileLayerRef.current);
        tileLayerRef.current = null;
      }

      tileLayerRef.current = L.tileLayer(tileConfig.url, {
        attribution: tileConfig.attribution,
        maxZoom: tileConfig.maxZoom,
      }).addTo(map);

      map.setMaxZoom(tileConfig.maxZoom);
    }

    updateTileLayer();

    return () => {
      cancelled = true;
    };
  }, [viewMode]);

  // Update markers and fit bounds only when visible markers change
  useEffect(() => {
    let cancelled = false;

    async function updateMarkers() {
      const map = leafletMapRef.current;
      if (!map) return;

      const L = await import("leaflet");
      if (cancelled) return;

      if (markerLayerRef.current) {
        map.removeLayer(markerLayerRef.current);
        markerLayerRef.current = null;
      }

      const layerGroup = L.layerGroup();
      const bounds: [number, number][] = [];

      visibleMarkers.forEach((item) => {
        if (
          item.latitude === null ||
          item.longitude === null ||
          Number.isNaN(Number(item.latitude)) ||
          Number.isNaN(Number(item.longitude))
        ) {
          return;
        }

        const lat = Number(item.latitude);
        const lng = Number(item.longitude);

        const circle = L.circleMarker([lat, lng], {
          radius: 6,
          color: cssToken("--tge-map-marker-stroke", "#ffffff"),
          weight: 1.5,
          fillColor: markerColor(item.type),
          fillOpacity: 1,
          pane: item.type === "plant" ? "plantPane" : "projectPane",
        });

        const link =
          detailPathMode === "postgres-preview"
            ? item.type === "plant"
              ? `/postgres-preview/operating-assets/${item.representative_id}`
              : `/postgres-preview/projects/${item.representative_id}`
            : item.type === "plant"
              ? `/plants/${item.representative_id}`
              : `/projects/${item.representative_id}`;

        const phaseLabel = normalizePopupPhase(item.phase || null, item.type);

        const popupHtml = `
          <div class="tge-map-popup__card">
            <div class="tge-map-popup__header">
              <div class="tge-map-popup__title">
                ${item.group_name ?? "NA"}
              </div>
            </div>

            <div class="tge-map-popup__body">
              <div class="tge-map-popup__meta">
                ${item.country ?? "NA"}
              </div>

              <div class="tge-map-popup__type">
                ${item.type === "plant" ? "Plant" : "Project"}
              </div>

              <div class="tge-map-popup__row">
                <span class="tge-map-popup__label">Phase</span>
                ${popupBadgeHtml(phaseLabel)}
              </div>

              ${
                item.type === "plant"
                  ? `
                    <div class="tge-map-popup__metric">
                      <span class="tge-map-popup__label">Installed MWe</span>
                      <strong>${formatPopupValue(item.total_capacity_mw)}</strong>
                    </div>
                  `
                  : `
                    <div class="tge-map-popup__metric">
                      <span class="tge-map-popup__label">Planned MWe</span>
                      <strong>${formatPopupValue(item.total_capacity_mw)}</strong>
                    </div>
                    <div class="tge-map-popup__metric">
                      <span class="tge-map-popup__label">Potential min MWe</span>
                      <strong>${formatPopupValue(item.potential_min_mw)}</strong>
                    </div>
                  `
              }

              <div class="tge-map-popup__linkwrap">
                <a href="${link}" class="tge-map-popup__link">
                  Open ${item.type} record
                </a>
              </div>
            </div>
          </div>
        `;

        circle.bindPopup(popupHtml, {
          className: popupAccentClass(item.type),
        });

        circle.addTo(layerGroup);
        bounds.push([lat, lng]);
      });

      layerGroup.addTo(map);
      markerLayerRef.current = layerGroup;

      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [40, 40] });

        if (bounds.length === 1) {
          map.setZoom(viewMode === "satellite" ? 10 : 6);
        }

        hasFittedBoundsRef.current = true;
      }

      setTimeout(() => map.invalidateSize(), 0);
    }

    updateMarkers();

    return () => {
      cancelled = true;
    };
  }, [detailPathMode, viewMode, visibleMarkers]);

  useEffect(() => {
    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    setTimeout(() => leafletMapRef.current?.invalidateSize(), 0);
  }, [isExpandedMap, showFilterPanel]);

  const mapHeightClass = isExpandedMap
    ? "h-[700px] min-h-[640px] w-full sm:h-[800px] xl:h-[calc(100vh-6rem)]"
    : "h-[620px] w-full sm:h-[760px]";
  const filterPanelVisible = showFilterPanel;
  const filterPanelClass = isExpandedMap
    ? "pointer-events-auto absolute left-4 right-4 top-16 max-h-[calc(100%-5rem)] overflow-y-auto border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] shadow-xl sm:left-6 sm:right-auto sm:top-6 sm:max-h-[calc(100%-3rem)] sm:w-[288px]"
    : "pointer-events-auto absolute left-4 right-4 top-16 max-h-[calc(100%-5rem)] overflow-y-auto border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] shadow-xl sm:left-6 sm:right-auto sm:top-6 sm:max-h-[calc(100%-3rem)] sm:w-[260px]";

  return (
    <div className="relative border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)]">
      <div ref={mapRef} className={mapHeightClass} />

      <div className="pointer-events-none absolute inset-0 z-[1000]">
        <div className="pointer-events-auto absolute right-4 top-4 flex flex-wrap justify-end gap-2 sm:right-6 sm:top-6">
          <button
            type="button"
            onClick={() => {
              const nextExpandedState = !isExpandedMap;
              setIsExpandedMap(nextExpandedState);
              setShowFilterPanel(!nextExpandedState);
            }}
            className="border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-3 py-1.5 text-xs font-semibold text-[var(--tge-governance-neutral-text)] shadow-sm hover:border-[var(--tge-brand-green)] hover:text-[var(--tge-brand-green-dark)]"
          >
            {isExpandedMap ? "Standard Mode" : "Expanded Map"}
          </button>
          <button
            type="button"
            onClick={() => setShowFilterPanel((current) => !current)}
            className="border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-3 py-1.5 text-xs font-semibold text-[var(--tge-governance-neutral-text)] shadow-sm hover:border-[var(--tge-brand-green)] hover:text-[var(--tge-brand-green-dark)]"
          >
            {showFilterPanel ? "Hide Filters" : "Show Filters"}
          </button>
        </div>

        {filterPanelVisible ? (
          <div className={filterPanelClass}>
          <div className="border-b border-[var(--tge-governance-neutral-border)] bg-[var(--tge-governance-neutral-bg)] px-3 py-2.5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--tge-text-primary)]">
                  Spatial Filters
                </h2>
                <p className="mt-1 text-[11px] leading-4 text-[var(--tge-governance-muted-text)]">
                  Filter coordinate-confirmed projects and plants.
                </p>
              </div>
              {isExpandedMap ? (
                <button
                  type="button"
                  onClick={() => setShowFilterPanel(false)}
                  className="shrink-0 border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)] hover:border-[var(--tge-brand-green)] hover:text-[var(--tge-brand-green-dark)]"
                >
                  Hide
                </button>
              ) : null}
            </div>
          </div>

          <div className="space-y-2 px-3 py-2.5">
            <MapFilterGroup note="visible markers" title="Layers">
              <div className="space-y-1.5 text-sm">
                <label className="flex items-center justify-between border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-2.5 py-1.5">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={showPlants}
                      onChange={(e) => setShowPlants(e.target.checked)}
                    />
                    <span>Plants</span>
                  </div>
                  <span className="font-semibold text-[var(--tge-map-marker-plant)]">
                    {data.plants.length}
                  </span>
                </label>

                <label className="flex items-center justify-between border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-subtle)] px-2.5 py-1.5">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={showProjects}
                      onChange={(e) => setShowProjects(e.target.checked)}
                    />
                    <span>Projects</span>
                  </div>
                  <span className="font-semibold text-[var(--tge-map-marker-project)]">
                    {data.projects.length}
                  </span>
                </label>
              </div>
            </MapFilterGroup>

            <MapFilterGroup note="market scope" title="Geography">
              <div className="space-y-1.5">
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]">
                    {countryFilterLabel}
                  </span>
                  <select
                    value={countryFilter}
                    onChange={(e) => setCountryFilter(e.target.value)}
                    className="mt-1 w-full border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--tge-brand-green)]"
                  >
                    {countryOptions.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--tge-governance-muted-text)]">
                    {regionFilterLabel}
                  </span>
                  <select
                    value={regionFilter}
                    onChange={(e) => setRegionFilter(e.target.value)}
                    className="mt-1 w-full border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--tge-brand-green)]"
                  >
                    {regionOptions.map((region) => (
                      <option key={region} value={region}>
                        {region}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </MapFilterGroup>

            <MapFilterGroup
              defaultOpen={false}
              note="future overlays"
              title="Intelligence Filters"
            >
              <div className="space-y-1.5">
                <FutureFilterRow
                  label="Use Category"
                  values={["Power", "Heat", "Hybrid", "Minerals"]}
                />
                <FutureFilterRow
                  label="Lifecycle / Status"
                  values={["Exploration", "Construction", "Operating"]}
                />
                <FutureFilterRow
                  label="Technology"
                  values={["Binary", "Flash", "EGS / AGS"]}
                />
              </div>
            </MapFilterGroup>

            <MapFilterGroup note="base layer" title="Basemap">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setViewMode("map")}
                  className={`flex-1 border px-3 py-1.5 text-xs font-semibold ${
                    viewMode === "map"
                      ? "border-[var(--tge-brand-dark)] bg-[var(--tge-brand-dark)] text-[var(--tge-surface-card)]"
                      : "border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] text-[var(--tge-governance-neutral-text)]"
                  }`}
                >
                  Terrain
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode("satellite")}
                  className={`flex-1 border px-3 py-1.5 text-xs font-semibold ${
                    viewMode === "satellite"
                      ? "border-[var(--tge-brand-dark)] bg-[var(--tge-brand-dark)] text-[var(--tge-surface-card)]"
                      : "border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)] text-[var(--tge-governance-neutral-text)]"
                  }`}
                >
                  Satellite
                </button>
              </div>
            </MapFilterGroup>

            <MapFilterGroup defaultOpen={false} title="Map Notes">
              <div className="space-y-2 text-xs text-[var(--tge-text-secondary)]">
                <p>
                  One marker per <strong>Plant Group</strong> or{" "}
                  <strong>Project Group</strong>. Coordinates use average group
                  locations.
                </p>
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-3 w-3"
                    style={{ backgroundColor: "var(--tge-map-marker-plant)" }}
                  />
                  <span>Plants</span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-3 w-3"
                    style={{ backgroundColor: "var(--tge-map-marker-project)" }}
                  />
                  <span>Projects</span>
                </div>
              </div>
            </MapFilterGroup>
          </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
