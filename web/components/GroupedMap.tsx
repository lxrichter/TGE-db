"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

function markerColor(type: "plant" | "project") {
  return type === "project" ? "#E8A56C" : "#64A542";
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
    style += "background:#94a3b8;border-color:#94a3b8;color:#ffffff;";
  } else if (normalized.includes("exploration")) {
    style += "background:#f59e0b;border-color:#f59e0b;color:#ffffff;";
  } else if (normalized.includes("pre-feasibility")) {
    style += "background:#84cc16;border-color:#84cc16;color:#ffffff;";
  } else if (normalized.includes("feasibility")) {
    style += "background:#3b82f6;border-color:#3b82f6;color:#ffffff;";
  } else if (normalized.includes("construction")) {
    style += "background:#14b8a6;border-color:#14b8a6;color:#ffffff;";
  } else if (normalized.includes("operating")) {
    style += "background:#8dc63f;border-color:#8dc63f;color:#ffffff;";
  } else if (normalized.includes("stalled")) {
    style += "background:#f97316;border-color:#f97316;color:#ffffff;";
  } else if (normalized.includes("cancelled")) {
    style += "background:#dc2626;border-color:#dc2626;color:#ffffff;";
  } else if (normalized.includes("tbd")) {
    style += "background:#f1f5f9;border-color:#e2e8f0;color:#475569;";
  } else {
    style += "background:#e2e8f0;border-color:#cbd5e1;color:#475569;";
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
}: {
  apiPath?: string;
}) {
  const [data, setData] = useState<MapApiResponse>({ plants: [], projects: [] });
  const [showPlants, setShowPlants] = useState(true);
  const [showProjects, setShowProjects] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("map");
  const [countryFilter, setCountryFilter] = useState("All Countries");
  const [regionFilter, setRegionFilter] = useState("All Regions");

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

    return ["All Countries", ...countries];
  }, [allMarkers]);

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

    if (countryFilter !== "All Countries") {
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
  }, [data, showPlants, showProjects, countryFilter, regionFilter]);

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
          color: "#ffffff",
          weight: 1.5,
          fillColor: markerColor(item.type),
          fillOpacity: 1,
          pane: item.type === "plant" ? "plantPane" : "projectPane",
        });

        const link =
          item.type === "plant"
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
                      <span class="tge-map-popup__label">Installed MW</span>
                      <strong>${formatPopupValue(item.total_capacity_mw)}</strong>
                    </div>
                  `
                  : `
                    <div class="tge-map-popup__metric">
                      <span class="tge-map-popup__label">Planned MW</span>
                      <strong>${formatPopupValue(item.total_capacity_mw)}</strong>
                    </div>
                    <div class="tge-map-popup__metric">
                      <span class="tge-map-popup__label">Potential min MW</span>
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
  }, [viewMode, visibleMarkers]);

  useEffect(() => {
    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative border border-gray-200 bg-white">
      <div ref={mapRef} className="h-[720px] w-full" />

      <div className="pointer-events-none absolute inset-0 z-[1000]">
        <div className="pointer-events-auto absolute left-6 top-6 w-[300px] border border-gray-200 bg-white shadow-xl">
          <div className="border-b border-gray-200 bg-[#f7f7f7] px-4 py-3">
            <h2 className="text-sm font-bold uppercase tracking-wide text-[#1f2937]">
              Map Filters
            </h2>
          </div>

          <div className="space-y-4 px-4 py-4">
            <div className="space-y-2 text-sm">
              <label className="flex items-center justify-between border border-gray-200 bg-[#fafafa] px-3 py-2">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={showPlants}
                    onChange={(e) => setShowPlants(e.target.checked)}
                  />
                  <span>Power Plants / Groups</span>
                </div>
                <span className="font-semibold text-[#64A542]">
                  {data.plants.length}
                </span>
              </label>

              <label className="flex items-center justify-between border border-gray-200 bg-[#fafafa] px-3 py-2">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={showProjects}
                    onChange={(e) => setShowProjects(e.target.checked)}
                  />
                  <span>Power Projects / Groups</span>
                </div>
                <span className="font-semibold text-[#E8A56C]">
                  {data.projects.length}
                </span>
              </label>
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Country
              </label>
              <select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className="mt-1 w-full border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#8dc63f]"
              >
                {countryOptions.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Region
              </label>
              <select
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                className="mt-1 w-full border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#8dc63f]"
              >
                {regionOptions.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Map View
              </div>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setViewMode("map")}
                  className={`border px-3 py-2 text-xs font-semibold ${
                    viewMode === "map"
                      ? "border-[#2a2a2a] bg-[#2a2a2a] text-white"
                      : "border-gray-300 bg-white text-gray-700"
                  }`}
                >
                  Terrain
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode("satellite")}
                  className={`border px-3 py-2 text-xs font-semibold ${
                    viewMode === "satellite"
                      ? "border-[#2a2a2a] bg-[#2a2a2a] text-white"
                      : "border-gray-300 bg-white text-gray-700"
                  }`}
                >
                  Satellite
                </button>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-3 text-xs text-gray-600">
              <p>
                One marker per <strong>Plant Group</strong> or{" "}
                <strong>Project Group</strong>.
              </p>
              <p className="mt-2">
                Coordinates use the average location of grouped records.
              </p>
            </div>

            <div className="border-t border-gray-200 pt-3 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3"
                  style={{ backgroundColor: "#64A542" }}
                />
                <span>Plants</span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3"
                  style={{ backgroundColor: "#E8A56C" }}
                />
                <span>Projects</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
