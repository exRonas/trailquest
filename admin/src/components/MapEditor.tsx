import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { AdminCheckpoint, GeoPoint, PathPoint, pickLocalizedText } from '../types';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN ?? '';

export type EditMode = 'waypoint' | 'checkpoint' | 'none';

interface MapEditorProps {
  waypoints: PathPoint[];
  checkpoints: AdminCheckpoint[];
  geometry: GeoPoint[] | null;
  mode: EditMode;
  selectedCheckpoint: number | null;
  onAddWaypoint: (lng: number, lat: number) => void;
  onMoveWaypoint: (index: number, lng: number, lat: number) => void;
  onRemoveWaypoint: (index: number) => void;
  onAddCheckpoint: (lng: number, lat: number) => void;
  onMoveCheckpoint: (index: number, lng: number, lat: number) => void;
  onRemoveCheckpoint: (index: number) => void;
  onSelectCheckpoint: (index: number) => void;
}

const CP_COLORS: Record<string, string> = {
  HISTORICAL: '#6D4C9F',
  DANGER: '#D7443E',
  UPCOMING: '#357DC2',
  INFO: '#2E8E7E',
};

const DEFAULT_CENTER: [number, number] = [76.9674, 52.2873]; // Pavlodar

export function MapEditor(props: MapEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const loadedRef = useRef(false);
  const modeRef = useRef(props.mode);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const propsRef = useRef(props);
  propsRef.current = props;
  modeRef.current = props.mode;

  // Init map once.
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;
    const start =
      props.waypoints[0] != null
        ? ([props.waypoints[0].lng, props.waypoints[0].lat] as [number, number])
        : DEFAULT_CENTER;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: start,
      zoom: 13,
    });
    mapRef.current = map;

    map.on('load', () => {
      map.addSource('route-line', {
        type: 'geojson',
        data: lineFeature(propsRef.current),
      });
      map.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route-line',
        paint: { 'line-color': '#1f6f54', 'line-width': 4 },
        layout: { 'line-cap': 'round', 'line-join': 'round' },
      });
      loadedRef.current = true;
      syncMarkers();
      fitToData();
    });

    map.on('click', (e) => {
      const m = modeRef.current;
      if (m === 'waypoint') {
        propsRef.current.onAddWaypoint(e.lngLat.lng, e.lngLat.lat);
      } else if (m === 'checkpoint') {
        propsRef.current.onAddCheckpoint(e.lngLat.lng, e.lngLat.lat);
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
      loadedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update the line when geometry/waypoints change.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    const src = map.getSource('route-line') as mapboxgl.GeoJSONSource | undefined;
    src?.setData(lineFeature(props));
  }, [props.geometry, props.waypoints]);

  // Re-sync markers when waypoints/checkpoints change.
  useEffect(() => {
    syncMarkers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.waypoints, props.checkpoints, props.selectedCheckpoint]);

  function syncMarkers() {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    props.waypoints.forEach((wp, i) => {
      const el = document.createElement('div');
      el.style.cssText = markerStyle('#1f6f54');
      el.textContent = String(i + 1);
      el.title = 'Right-click to delete this waypoint';
      const marker = new mapboxgl.Marker({ element: el, draggable: true })
        .setLngLat([wp.lng, wp.lat])
        .addTo(map);
      marker.on('dragend', () => {
        const ll = marker.getLngLat();
        propsRef.current.onMoveWaypoint(i, ll.lng, ll.lat);
      });
      el.addEventListener('contextmenu', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        propsRef.current.onRemoveWaypoint(i);
      });
      markersRef.current.push(marker);
    });

    props.checkpoints.forEach((cp, i) => {
      const el = document.createElement('div');
      const selected = props.selectedCheckpoint === i;
      el.style.cssText = markerStyle(CP_COLORS[cp.type] ?? '#2E8E7E', selected);
      el.title = `${pickLocalizedText(cp.name)} — right-click to delete`;
      const marker = new mapboxgl.Marker({ element: el, draggable: true })
        .setLngLat([cp.lng, cp.lat])
        .addTo(map);
      el.addEventListener('click', (ev) => {
        ev.stopPropagation();
        propsRef.current.onSelectCheckpoint(i);
      });
      el.addEventListener('contextmenu', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        propsRef.current.onRemoveCheckpoint(i);
      });
      marker.on('dragend', () => {
        const ll = marker.getLngLat();
        propsRef.current.onMoveCheckpoint(i, ll.lng, ll.lat);
      });
      markersRef.current.push(marker);
    });
  }

  function fitToData() {
    const map = mapRef.current;
    if (!map) return;
    const pts = [
      ...props.waypoints.map((p) => [p.lng, p.lat] as [number, number]),
      ...props.checkpoints.map((p) => [p.lng, p.lat] as [number, number]),
    ];
    if (pts.length < 2) return;
    const bounds = pts.reduce(
      (b, c) => b.extend(c),
      new mapboxgl.LngLatBounds(pts[0], pts[0]),
    );
    map.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 0 });
  }

  return <div className="map" ref={containerRef} />;
}

function lineFeature(p: MapEditorProps): GeoJSON.Feature {
  const coords =
    p.geometry && p.geometry.length > 1
      ? p.geometry.map((g) => [g.lng, g.lat])
      : [...p.waypoints]
          .sort((a, b) => a.sequence - b.sequence)
          .map((w) => [w.lng, w.lat]);
  return {
    type: 'Feature',
    properties: {},
    geometry: { type: 'LineString', coordinates: coords },
  };
}

function markerStyle(color: string, selected = false): string {
  return `
    width: 22px; height: 22px; border-radius: 50%;
    background: ${color}; color: #fff; font-size: 12px; font-weight: 700;
    display: flex; align-items: center; justify-content: center;
    border: 3px solid ${selected ? '#E2703A' : '#fff'};
    box-shadow: 0 1px 4px rgba(0,0,0,0.4); cursor: pointer;
  `;
}
