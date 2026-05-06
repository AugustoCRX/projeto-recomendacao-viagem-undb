import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { Button, Spinner } from '@/components/ui';
import { useTripDetail } from '@/features/trips/hooks/useTripDetail';
import { useGeocode } from '@/features/map/hooks/useGeocode';
import { useOverpassPlaces } from '@/features/map/hooks/useOverpassPlaces';
import { useSavedPlaces } from '@/features/places/hooks/useSavedPlaces';
import { ROUTES } from '@/constants';
// Pontos de interesse vêm da Overpass API (OpenStreetMap), sem mock
import styles from './MapView.module.css';

const USE_BACKEND = import.meta.env.VITE_USE_BACKEND === 'true';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const TYPE_CONFIG = {
  tourist_attraction: { label: '🏛️ Atrações',     color: '#3b82f6' },
  restaurant:         { label: '🍽️ Restaurantes',  color: '#f59e0b' },
  lodging:            { label: '🏨 Hospedagem',     color: '#10b981' },
};
const TYPES = Object.keys(TYPE_CONFIG);

function createIcon(color, selected = false) {
  const size = selected ? 36 : 26;
  const border = selected ? '4px solid #fff' : '3px solid #fff';
  const shadow = selected
    ? `0 0 0 3px ${color}55, 0 4px 12px rgba(0,0,0,0.45)`
    : '0 2px 6px rgba(0,0,0,0.35)';
  return L.divIcon({
    className: '',
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50% 50% 50% 0;
      background:${color};border:${border};
      box-shadow:${shadow};
      transform:rotate(-45deg);
      transition:all 0.2s;
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -(size + 4)],
  });
}

function createDestinationIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:34px;height:34px;border-radius:50%;
      background:#6366f1;border:3px solid #fff;
      box-shadow:0 2px 8px rgba(0,0,0,0.4);
      display:flex;align-items:center;justify-content:center;
      font-size:16px;line-height:1;
    ">📍</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -20],
  });
}

function FlyTo({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords) map.flyTo([coords.lat, coords.lng], 16, { duration: 1 });
  }, [coords?.lat, coords?.lng]);
  return null;
}

export default function MapViewPage() {
  const { id } = useParams();
  const { trip, loading: tripLoading } = useTripDetail(id);
  const { coords, loading: geoLoading, error: geoError } = useGeocode(trip?.destination);
  const { places, loading: placesLoading, error: placesError } = useOverpassPlaces(coords);
  const { isSaved, getSavedId, savePlace, removePlace, pending } = useSavedPlaces(trip?.id);

  const [activeTypes, setActiveTypes] = useState(new Set(TYPES));
  const [selected, setSelected] = useState(null);

  function toggleType(type) {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      next.has(type) ? next.delete(type) : next.add(type);
      return next;
    });
  }

  const allVisible = TYPES.flatMap((t) =>
    activeTypes.has(t) ? (places[t] ?? []) : []
  );

  const totalCount = TYPES.reduce((sum, t) => sum + (places[t]?.length ?? 0), 0);

  if (tripLoading) {
    return (
      <div className={styles.root}>
        <div className={styles.mapPlaceholder}><Spinner /></div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <Button as={Link} to={ROUTES.TRIP_DETAIL.replace(':id', id)} variant="ghost" size="sm">
            ← Voltar
          </Button>
          <h1 className={styles.tripName}>{trip?.name}</h1>
          <p className={styles.destination}>📍 {trip?.destination}</p>
        </div>

        {/* Filtros */}
        <div className={styles.filters}>
          <span className={styles.filtersLabel}>Filtrar por tipo</span>
          {TYPES.map((type) => {
            const cfg = TYPE_CONFIG[type];
            const active = activeTypes.has(type);
            const count = places[type]?.length ?? 0;
            return (
              <button
                key={type}
                className={`${styles.filterBtn} ${active ? styles.filterBtnActive : ''}`}
                style={active ? { borderColor: cfg.color, color: cfg.color } : {}}
                onClick={() => toggleType(type)}
              >
                <span>{cfg.label}</span>
                {count > 0 && (
                  <span className={styles.filterCount} style={active ? { background: cfg.color } : {}}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Lista de lugares */}
        <div className={styles.placesList}>
          {(geoLoading || placesLoading) && (
            <div className={styles.loadingRow}>
              <Spinner />
              <span>{geoLoading ? `Localizando ${trip?.destination}...` : 'Buscando pontos de interesse...'}</span>
            </div>
          )}

          {(geoError || placesError) && !geoLoading && (
            <p className={styles.errorMsg}>{geoError ?? placesError}</p>
          )}

          {!placesLoading && totalCount === 0 && !geoLoading && !geoError && (
            <p className={styles.emptyMsg}>Nenhum ponto encontrado para este destino.</p>
          )}

          {allVisible.map((place) => {
            const cfg = TYPE_CONFIG[place.type];
            const saved = USE_BACKEND && isSaved(place.id);
            const isPending = USE_BACKEND && pending.has(place.id);
            return (
              <div
                key={place.id}
                className={`${styles.placeItem} ${selected?.id === place.id ? styles.placeItemSelected : ''}`}
                onClick={() => setSelected(place)}
              >
                <div className={styles.placeIcon} style={{ background: cfg.color + '20', color: cfg.color }}>
                  {cfg.label.split(' ')[0]}
                </div>
                <div className={styles.placeInfo}>
                  <span className={styles.placeName}>{place.name}</span>
                  {place.address && (
                    <span className={styles.placeAddress}>{place.address}</span>
                  )}
                  {place.openingHours && (
                    <span className={styles.placeHours}>🕐 {place.openingHours}</span>
                  )}
                </div>
                {USE_BACKEND && (
                  <button
                    className={`${styles.saveBtn} ${saved ? styles.saveBtnSaved : ''}`}
                    disabled={isPending}
                    title={saved ? 'Remover dos lugares salvos' : 'Salvar lugar'}
                    onClick={(e) => {
                      e.stopPropagation();
                      saved
                        ? removePlace(getSavedId(place.id))
                        : savePlace({ name: place.name, address: place.address, lat: place.lat, lng: place.lng, category: place.type, placeId: place.id });
                    }}
                  >
                    {isPending ? '…' : saved ? '🔖' : '＋'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </aside>

      {/* Mapa */}
      <div className={styles.mapWrapper}>
        {coords ? (
          <MapContainer
            center={[coords.lat, coords.lng]}
            zoom={14}
            className={styles.map}
            zoomControl={false}
            keepBuffer={1}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              detectRetina={false}
              updateWhenIdle={true}
              updateWhenZooming={false}
            />

            <FlyTo coords={selected} />

            {/* Marcador do destino */}
            <Marker position={[coords.lat, coords.lng]} icon={createDestinationIcon()}>
              <Popup>
                <strong>{trip?.destination}</strong>
                <br />Centro do destino
              </Popup>
            </Marker>

            {/* Marcadores dos pontos de interesse */}
            {allVisible.map((place) => (
              <Marker
                key={place.id}
                position={[place.lat, place.lng]}
                icon={createIcon(TYPE_CONFIG[place.type].color, selected?.id === place.id)}
                eventHandlers={{ click: () => setSelected(place) }}
              >
                <Popup>
                  <strong>{place.name}</strong>
                  {place.address && <><br />{place.address}</>}
                  {place.openingHours && <><br />🕐 {place.openingHours}</>}
                  {place.website && (
                    <>
                      <br />
                      <a href={place.website} target="_blank" rel="noreferrer">Site oficial</a>
                    </>
                  )}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        ) : (
          <div className={styles.mapPlaceholder}>
            {geoLoading ? (
              <>
                <Spinner />
                <p>Localizando {trip?.destination}...</p>
              </>
            ) : geoError ? (
              <p className={styles.errorMsg}>{geoError}</p>
            ) : (
              <p>Aguardando dados da viagem...</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
