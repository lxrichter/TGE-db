"use client";

import { useEffect, useRef, useState } from "react";
import { normalizePhaseName } from "@/components/ui/PhaseBadge";

type DetailMapProps = {
  title?: string;
  latitude?: number | null;
  longitude?: number | null;
  type?: "plant" | "project";
  phase?: string | null;
  zoom?: number;
  className?: string;
};

type ViewMode = "map" | "satellite";

function markerColor(type: "plant" | "project") {
  return type === "plant" ? "#64A542" : "#E8A56C";
}

function popupAccentClass(type: "plant" | "project") {
  return type === "plant"
    ? "tge-map-popup tge-map-popup--plant"
    : "tge-map-popup tge-map-popup--project";
}

function popupPhaseBadgeClass(value: string | null) {
  const normalized = normalizePhaseName(value).toLowerCase();

  let classes =
    "display:inline-flex;align-items:center;justify-content:center;white-space:nowrap;padding:4px 12px;font-size:11px;font-weight:600;line-height:1;border:1px solid transparent;";

  if (normalized.includes("prospect")) {
    classes += "background:#94a3b8;border-color:#94a3b8;color:#ffffff;";
  } else if (normalized.includes("exploration")) {
    classes += "background:#f59e0b;border-color:#f59e0b;color:#ffffff;";
  } else if (normalized.includes("pre-feasibility")) {
    classes += "background:#84cc16;border-color:#84cc16;color:#ffffff;";
  } else if (normalized.includes("feasibility")) {
    classes += "background:#3b82f6;border-color:#3b82f6;color:#ffffff;";
  } else if (normalized.includes("construction")) {
    classes += "background:#14b8a6;border-color:#14b8a6;color:#ffffff;";
  } else if (normalized.includes("operating")) {
    classes += "background:#8dc63f;border-color:#8dc63f;color:#ffffff;";
  } else if (normalized.includes("stalled")) {
    classes += "background:#f97316;border-color:#f97316;color:#ffffff;";
  } else if (normalized.includes("tbd")) {
    classes += "background:#f1f5f9;border-color:#e2e8f0;color:#475569;";
  } else if (normalized.includes("cancelled")) {
    classes += "background:#dc2626;border-color:#dc2626;color:#ffffff;";
  } else {
    classes += "background:#e2e8f0;border-color:#cbd5e1;color:#475569;";
  }

  return classes;
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
        maxZoom: 14,
      };
}

export default function DetailMap({
  title = "Location",
  latitude,
  longitude,
  type = "project",
  phase = null,
  zoom = 8,
  className = "h-[320px] w-full",
}: DetailMapProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const [viewMode, setViewMode] = useState<ViewMode>("map");

  const hasCoordinates =
    latitude !== null &&
    latitude !== undefined &&
    longitude !== null &&
    longitude !== undefined;

  // Create map once, set view for this record, and draw marker.
  // IMPORTANT: no viewMode dependency here.
  useEffect(() => {
    if (!hasCoordinates || !mapRef.current) return;

    let isMounted = true;

    const loadMap = async () => {
      const L = await import("leaflet");

      if (!isMounted || !mapRef.current) return;

      const lat = Number(latitude);
      const lng = Number(longitude);

      if (Number.isNaN(lat) || Number.isNaN(lng)) return;

      if (!mapInstanceRef.current) {
        mapInstanceRef.current = L.map(mapRef.current, {
          center: [lat, lng],
          zoom,
          minZoom: 3,
          maxZoom: 17,
          scrollWheelZoom: true,
        });

        const initialTileConfig = getTileConfig(viewMode);
        tileLayerRef.current = L.tileLayer(initialTileConfig.url, {
          attribution: initialTileConfig.attribution,
          maxZoom: initialTileConfig.maxZoom,
        }).addTo(mapInstanceRef.current);

        mapInstanceRef.current.setMaxZoom(initialTileConfig.maxZoom);
      }

      const map = mapInstanceRef.current;
      map.setView([lat, lng], zoom);

      if (markerRef.current) {
        map.removeLayer(markerRef.current);
        markerRef.current = null;
      }

      const popupHtml = `
        <div class="tge-map-popup__card">
          <div class="tge-map-popup__header">
            <div class="tge-map-popup__title">
              ${title}
            </div>
          </div>

          <div class="tge-map-popup__body" style="display:flex;flex-direction:column;gap:8px;">
            <div class="tge-map-popup__type">
              ${type === "plant" ? "Plant" : "Project"}
            </div>
            ${
              phase
                ? `<div><span style="${popupPhaseBadgeClass(phase)}">${normalizePhaseName(
                    phase
                  )}</span></div>`
                : ""
            }
          </div>
        </div>
      `;

      markerRef.current = L.circleMarker([lat, lng], {
        radius: 7,
        color: "#ffffff",
        weight: 1.5,
        fillColor: markerColor(type),
        fillOpacity: 1,
      })
        .addTo(map)
        .bindPopup(popupHtml, {
          className: popupAccentClass(type),
        });

      setTimeout(() => {
        map.invalidateSize();
      }, 0);
    };

    loadMap();

    return () => {
      isMounted = false;
    };
  }, [hasCoordinates, latitude, longitude, zoom, title, type, phase]);

  // Swap only the basemap when toggling Map / Satellite.
  // This keeps the current zoom and position.
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

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  if (!hasCoordinates) {
    return (
      <div className="border border-gray-200 bg-white">
        <div className="flex min-h-[220px] items-center justify-center px-6 py-8 text-sm text-gray-500">
          No coordinates available.
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div ref={mapRef} className={`border border-gray-200 ${className}`} />

      <div className="flex justify-end gap-2 border-x border-b border-gray-200 bg-white px-3 py-2">
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
  );
}