"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { normalizePhaseName } from "@/components/ui/PhaseBadge";

type MapPoint = {
  id: string;
  name: string;
  latitude: number | string | null;
  longitude: number | string | null;
  type: "plant" | "project";
  phase?: string | null;
  capacity?: number | null;
  potentialMinMw?: number | null;
  country?: string | null;
};

type RegionOverviewMapProps = {
  region: string;
  points: MapPoint[];
};

type ViewMode = "map" | "satellite";

function toValidNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function popupAccentClass(type: "plant" | "project") {
  return type === "plant"
    ? "tge-map-popup tge-map-popup--plant"
    : "tge-map-popup tge-map-popup--project";
}

function markerColor(type: "plant" | "project") {
  return type === "plant" ? "#64A542" : "#E8A56C";
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
        maxZoom: 16,
      }
    : {
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
        attribution: "Tiles © Esri",
        maxZoom: 13,
      };
}

export default function RegionOverviewMap({
  region,
  points,
}: RegionOverviewMapProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const markerLayerRef = useRef<any>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("map");

  const validPoints = useMemo(
    () =>
      points
        .map((p) => ({
          ...p,
          latitude: toValidNumber(p.latitude),
          longitude: toValidNumber(p.longitude),
        }))
        .filter((p) => p.latitude !== null && p.longitude !== null),
    [points]
  );

  // Create map once
  useEffect(() => {
    if (!mapRef.current || validPoints.length === 0 || mapInstanceRef.current) return;

    let isMounted = true;

    const initMap = async () => {
      const L = await import("leaflet");

      if (!isMounted || !mapRef.current) return;

      const first = validPoints[0];
      const map = L.map(mapRef.current, {
        center: [first.latitude as number, first.longitude as number],
        zoom: 4,
        minZoom: 2,
        maxZoom: 16,
        scrollWheelZoom: true,
      });

      mapInstanceRef.current = map;

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

      const initialTileConfig = getTileConfig(viewMode);
      tileLayerRef.current = L.tileLayer(initialTileConfig.url, {
        attribution: initialTileConfig.attribution,
        maxZoom: initialTileConfig.maxZoom,
      }).addTo(map);

      map.setMaxZoom(initialTileConfig.maxZoom);

      setTimeout(() => map.invalidateSize(), 0);
    };

    initMap();

    return () => {
      isMounted = false;
    };
  }, [validPoints, viewMode]);

  // Swap only basemap on view change. Do NOT refit bounds here.
  useEffect(() => {
    let isMounted = true;

    const updateTileLayer = async () => {
      const map = mapInstanceRef.current;
      if (!map) return;

      const L = await import("leaflet");
      if (!isMounted) return;

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
    };

    updateTileLayer();

    return () => {
      isMounted = false;
    };
  }, [viewMode]);

  // Build markers and fit bounds only when the region points change
  useEffect(() => {
    if (validPoints.length === 0) return;

    let isMounted = true;

    const updateMarkersAndBounds = async () => {
      const L = await import("leaflet");
      if (!isMounted) return;

      const ensureMapReady = async () => {
        let tries = 0;
        while (!mapInstanceRef.current && tries < 20) {
          await new Promise((resolve) => setTimeout(resolve, 50));
          tries += 1;
        }
        return mapInstanceRef.current;
      };

      const map = await ensureMapReady();
      if (!map || !isMounted) return;

      if (markerLayerRef.current) {
        map.removeLayer(markerLayerRef.current);
        markerLayerRef.current = null;
      }

      const layerGroup = L.layerGroup();
      const bounds: [number, number][] = [];

      validPoints.forEach((point) => {
        const lat = point.latitude as number;
        const lng = point.longitude as number;

        bounds.push([lat, lng]);

        const phaseLabel = normalizePopupPhase(point.phase || null, point.type);

        const popupHtml = `
          <div class="tge-map-popup__card">
            <div class="tge-map-popup__header">
              <div class="tge-map-popup__title">
                ${point.name}
              </div>
            </div>

            <div class="tge-map-popup__body">
              ${
                point.country
                  ? `<div class="tge-map-popup__meta">${point.country}</div>`
                  : ""
              }

              <div class="tge-map-popup__type">
                ${point.type === "plant" ? "Plant" : "Project"}
              </div>

              <div class="tge-map-popup__row">
                <span class="tge-map-popup__label">Phase</span>
                ${popupBadgeHtml(phaseLabel)}
              </div>

              ${
                point.type === "plant"
                  ? `
                    <div class="tge-map-popup__metric">
                      <span class="tge-map-popup__label">Installed MW</span>
                      <strong>${formatPopupValue(point.capacity)}</strong>
                    </div>
                  `
                  : `
                    <div class="tge-map-popup__metric">
                      <span class="tge-map-popup__label">Planned MW</span>
                      <strong>${formatPopupValue(point.capacity)}</strong>
                    </div>
                    <div class="tge-map-popup__metric">
                      <span class="tge-map-popup__label">Potential min MW</span>
                      <strong>${formatPopupValue(point.potentialMinMw)}</strong>
                    </div>
                  `
              }
            </div>
          </div>
        `;

        L.circleMarker([lat, lng], {
          radius: 7,
          color: "#ffffff",
          weight: 1.5,
          fillColor: markerColor(point.type),
          fillOpacity: 1,
          pane: point.type === "plant" ? "plantPane" : "projectPane",
        })
          .addTo(layerGroup)
          .bindPopup(popupHtml, {
            className: popupAccentClass(point.type),
          });
      });

      layerGroup.addTo(map);
      markerLayerRef.current = layerGroup;

      if (bounds.length === 1) {
        map.setView(bounds[0], 7);
      } else if (bounds.length > 1) {
        map.fitBounds(bounds, { padding: [30, 30] });
      }

      setTimeout(() => map.invalidateSize(), 0);
    };

    updateMarkersAndBounds();

    return () => {
      isMounted = false;
    };
  }, [validPoints, region]);

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <section className="border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <h2 className="text-xl font-bold text-[#1f2937]">Region Map</h2>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setViewMode("map")}
            className={`border px-3 py-1.5 text-xs font-semibold transition ${
              viewMode === "map"
                ? "border-[#2a2a2a] bg-[#2a2a2a] text-white"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            Map
          </button>

          <button
            type="button"
            onClick={() => setViewMode("satellite")}
            className={`border px-3 py-1.5 text-xs font-semibold transition ${
              viewMode === "satellite"
                ? "border-[#2a2a2a] bg-[#2a2a2a] text-white"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            Satellite
          </button>
        </div>
      </div>

      <div className="p-6">
        {validPoints.length === 0 ? (
          <div className="text-sm text-gray-500">
            No mapped plant or project coordinates available for {region}.
          </div>
        ) : (
          <div
            ref={mapRef}
            className="border border-gray-200"
            style={{ height: "460px", width: "100%" }}
          />
        )}
      </div>
    </section>
  );
}