import { MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

export default function GeotagInput({ locationName, onLocationChange }) {
  const [locName, setLocName] = useState(locationName || '');
  const [usingGPS, setUsingGPS] = useState(false);

  useEffect(() => {
    setLocName(locationName || '');
  }, [locationName]);

  const handleGPS = () => {
    if (!navigator.geolocation) return;
    setUsingGPS(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onLocationChange({
          location_name: locName || 'Current Location',
          location_lat: pos.coords.latitude,
          location_lng: pos.coords.longitude,
        });
        setUsingGPS(false);
      },
      () => {
        setUsingGPS(false);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 mb-1">
        <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground font-medium">Location</span>
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="Where was this? (e.g. Paris, France)"
          value={locName}
          onChange={(e) => {
            setLocName(e.target.value);
            onLocationChange({ location_name: e.target.value });
          }}
          className="rounded-xl h-10 text-sm flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleGPS}
          disabled={usingGPS}
          className="rounded-xl h-10 text-xs flex-shrink-0"
        >
          <MapPin className="w-3 h-3 mr-1" />
          {usingGPS ? 'Locating...' : 'Use GPS'}
        </Button>
      </div>
    </div>
  );
}