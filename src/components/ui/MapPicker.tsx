import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapPickerProps {
  onLocationSelect: (lat: number, lng: number, address?: string) => void;
  initialPosition?: [number, number];
  height?: string;
}

interface LocationMarkerProps {
  position: [number, number] | null;
  onPositionChange: (lat: number, lng: number) => void;
}

const LocationMarker: React.FC<LocationMarkerProps> = ({ position, onPositionChange }) => {
  const map = useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      onPositionChange(lat, lng);
    },
  });

  useEffect(() => {
    if (position) {
      map.flyTo(position, map.getZoom());
    }
  }, [position, map]);

  return position === null ? null : <Marker position={position} />;
};

const MapPicker: React.FC<MapPickerProps> = ({ 
  onLocationSelect, 
  initialPosition = [40.7128, -74.0060], // Default to New York
  height = '300px' 
}) => {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setPosition([latitude, longitude]);
          onLocationSelect(latitude, longitude);
        },
        (error) => {
          console.warn('Geolocation error:', error);
          // Fallback to initial position
          setPosition(initialPosition);
          onLocationSelect(initialPosition[0], initialPosition[1]);
        }
      );
    } else {
      // Fallback to initial position
      setPosition(initialPosition);
      onLocationSelect(initialPosition[0], initialPosition[1]);
    }
  }, [initialPosition, onLocationSelect]);

  const handlePositionChange = async (lat: number, lng: number) => {
    setPosition([lat, lng]);
    setIsLoading(true);

    try {
      // Reverse geocoding using OpenStreetMap Nominatim API (free)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      
      if (response.ok) {
        const data = await response.json();
        const address = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        onLocationSelect(lat, lng, address);
      } else {
        onLocationSelect(lat, lng);
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      onLocationSelect(lat, lng);
    } finally {
      setIsLoading(false);
    }
  };

  if (!position) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-100 rounded-md border-2 border-dashed border-gray-300"
        style={{ height }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <MapContainer
        center={position}
        zoom={13}
        style={{ height, width: '100%' }}
        className="rounded-md border border-gray-300"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker 
          position={position} 
          onPositionChange={handlePositionChange}
        />
      </MapContainer>
      
      {isLoading && (
        <div className="absolute top-2 right-2 bg-white rounded-md shadow-md px-3 py-1">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-xs text-gray-600">Getting address...</span>
          </div>
        </div>
      )}
      
      <div className="mt-2 text-xs text-gray-600">
        <p>📍 Click on the map to select the incident location</p>
        {position && (
          <p className="mt-1">
            Selected: {position[0].toFixed(6)}, {position[1].toFixed(6)}
          </p>
        )}
      </div>
    </div>
  );
};

export default MapPicker;
