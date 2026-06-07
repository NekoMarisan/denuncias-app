import React from 'react';
import { GoogleMap, useLoadScript, Polyline } from '@react-google-maps/api';

const mapContainerStyle = { width: '100%', height: '400px' };
const center = { lat: -17.393, lng: -66.157 };

const MapComponent = ({ routeData }) => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY, // Tu clave de Google Maps
  });

  if (loadError) return <div>Error cargando el mapa</div>;
  if (!isLoaded) return <div>Cargando mapa...</div>;

  // Convierte la respuesta de ORS (GeoJSON) a un array de {lat, lng}
  const polylinePath = routeData?.geometry?.coordinates?.map(coord => ({
    lat: coord[1],
    lng: coord[0],
  })) || [];

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={center}
      zoom={13}
    >
      {polylinePath.length > 0 && (
        <Polyline
          path={polylinePath}
          options={{ strokeColor: '#2563eb', strokeWeight: 5 }}
        />
      )}
    </GoogleMap>
  );
};

export default MapComponent;