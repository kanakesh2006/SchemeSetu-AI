"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default Leaflet icon paths in case fallback is ever used
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom Tailwind-styled DivIcons for a professional, "no-ai-slop" feel
const createUserIcon = () => {
  if (typeof window === "undefined") return null;
  return L.divIcon({
    className: "custom-user-icon",
    html: `
      <div class="relative flex items-center justify-center w-8 h-8">
        <div class="absolute w-8 h-8 bg-emerald-500 rounded-full opacity-30 animate-ping"></div>
        <div class="absolute w-5 h-5 bg-emerald-500 rounded-full opacity-50"></div>
        <div class="relative w-3.5 h-3.5 bg-emerald-600 rounded-full border-2 border-white shadow-md"></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const createCscIcon = (isSelected) => {
  if (typeof window === "undefined") return null;
  const scaleClass = isSelected ? "scale-125 ring-4 ring-blue-100 border-blue-600 bg-blue-700" : "hover:scale-110 bg-blue-600 border-white";
  return L.divIcon({
    className: "custom-csc-icon",
    html: `
      <div class="flex items-center justify-center w-8 h-8 rounded-full text-white border-2 shadow-md transition-all duration-300 ${scaleClass}">
        <span class="text-xs font-semibold">💻</span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

const createPoIcon = (isSelected) => {
  if (typeof window === "undefined") return null;
  const scaleClass = isSelected ? "scale-125 ring-4 ring-pink-100 border-pink-600 bg-pink-700" : "hover:scale-110 bg-pink-600 border-white";
  return L.divIcon({
    className: "custom-po-icon",
    html: `
      <div class="flex items-center justify-center w-8 h-8 rounded-full text-white border-2 shadow-md transition-all duration-300 ${scaleClass}">
        <span class="text-xs font-semibold">📮</span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

const createPreviewIcon = () => {
  if (typeof window === "undefined") return null;
  return L.divIcon({
    className: "custom-preview-icon",
    html: `
      <div class="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500 text-white border-2 border-white shadow-md animate-bounce">
        <span class="text-xs font-semibold">⭐</span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

// Component to dynamically adjust map center and zoom when coordinates change
function ChangeView({ center, zoom, forceUpdate }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom, {
        animate: true,
        duration: 0.75,
      });
    }
  }, [center, zoom, forceUpdate, map]);
  return null;
}

export default function MapComponent({
  centers = [],
  userCoords = null,
  centerLat,
  centerLng,
  selectedCenterId = null,
  onSelectCenter = () => {},
  previewCenter = null,
}) {
  const defaultCenter = [centerLat || 13.0827, centerLng || 80.2707];
  
  // Calculate map zoom: zoom in closer if a specific center is selected, otherwise fit
  const zoom = selectedCenterId ? 15 : 13;

  // When a center is selected, shift the map center to focus on it
  const activeCenter = selectedCenterId
    ? (() => {
        const found = centers.find((c) => c.center_id === selectedCenterId);
        return found ? [found.latitude, found.longitude] : defaultCenter;
      })()
    : defaultCenter;

  return (
    <div className="w-full h-full min-h-[450px] bg-slate-100 rounded-3xl overflow-hidden shadow-inner border border-gray-200 relative z-10">
      <MapContainer
        center={activeCenter}
        zoom={zoom}
        style={{ width: "100%", height: "100%" }}
        zoomControl={false}
      >
        {/* Custom Leaflet Controls Positioned Neatly */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Dynamic Map Controller */}
        <ChangeView center={activeCenter} zoom={zoom} forceUpdate={selectedCenterId} />

        {/* User GPS Location Marker */}
        {userCoords && userCoords.latitude && userCoords.longitude && (
          <Marker
            position={[userCoords.latitude, userCoords.longitude]}
            icon={createUserIcon()}
          >
            <Popup>
              <div className="p-1 font-sans text-xs">
                <p className="font-bold text-emerald-800 m-0">Your Location</p>
                <p className="text-gray-500 m-0 mt-0.5">GPS Connected</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Assistance Center Markers */}
        {centers.map((center) => {
          const isSelected = selectedCenterId === center.center_id;
          const icon = center.type === "csc" ? createCscIcon(isSelected) : createPoIcon(isSelected);

          return (
            <Marker
              key={center.center_id}
              position={[center.latitude, center.longitude]}
              icon={icon}
              eventHandlers={{
                click: () => onSelectCenter(center),
              }}
            >
              <Popup>
                <div className="p-1.5 font-sans text-xs max-w-[200px]">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                    {center.type === "csc" ? "Common Service Centre" : "India Post Office"}
                  </span>
                  <p className="font-bold text-gray-900 m-0 mb-1">{center.name}</p>
                  <p className="text-gray-600 m-0 leading-relaxed truncate">{center.address}</p>
                  {center.phone_number && (
                    <p className="text-blue-600 m-0 mt-1 font-semibold">📞 {center.phone_number}</p>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Add Center Form Location Preview Marker */}
        {previewCenter && previewCenter.latitude && previewCenter.longitude && (
          <Marker
            position={[previewCenter.latitude, previewCenter.longitude]}
            icon={createPreviewIcon()}
          >
            <Popup>
              <div className="p-1 font-sans text-xs">
                <p className="font-bold text-amber-700 m-0">New Center Preview</p>
                <p className="text-gray-600 m-0 mt-0.5">{previewCenter.name}</p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Modern Sleek Map Legend overlay */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md px-3.5 py-3 rounded-2xl border border-gray-200 shadow-md flex flex-col gap-2 text-[10px] font-semibold text-gray-700 z-[1000]">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block border border-white shadow-sm" />
          <span>Your Location</span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block border border-white shadow-sm" />
          <span>E-Sevai / CSC Center</span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-pink-500 inline-block border border-white shadow-sm" />
          <span>Post Office</span>
        </div>
        {previewCenter && (
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block border border-white shadow-sm animate-pulse" />
            <span>Form Preview Location</span>
          </div>
        )}
      </div>
    </div>
  );
}
