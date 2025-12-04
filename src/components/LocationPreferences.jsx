import React, { useState, useEffect } from 'react';
import { MapPin, Plus, X, AlertCircle } from 'lucide-react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Common areas in Kenya where KPLC operates
const KENYA_AREAS = [
  // Nairobi & Environs
  'Nairobi CBD', 'Westlands', 'Kilimani', 'Karen', 'Parklands', 'Lavington',
  'Kileleshwa', 'South B', 'South C', 'Embakasi', 'Kasarani', 'Ruaraka',
  'Roysambu', 'Kahawa', 'Kahawa Sukari', 'Kahawa West', 'Zimmerman', 'Githurai',
  'Ruiru', 'Thika', 'Juja', 'Kiambu', 'Kikuyu', 'Ngong', 'Rongai', 'Kitengela',
  'Uthiru', 'Kinoo', 'Regen', 'Muthiga', 'Kawangware', 'Langata', 'Dagoretti',
  'Riruta', 'Satellite', 'Waiyaki Way', 'Banana', 'Kikuyu', 'Nyathuna',
  'Upperhill', 'Kilimani', 'Riverside', 'Spring Valley', 'Loresho', 'Muthaiga',
  'Gigiri', 'Runda', 'Kitisuru', 'Ridgeways', 'Garden Estate', 'Pangani',
  'Eastleigh', 'South B', 'South C', 'Imara Daima', 'Nyayo Estate', 'Buru Buru',
  'Umoja', 'Donholm', 'Kariobangi', 'Komarock', 'Pipeline', 'Tena Estate',
  'Huruma', 'Mathare', 'Ngara', 'Starehe', 'Pumwani', 'Shauri Moyo',

  // Mombasa & Coast
  'Mombasa', 'Nyali', 'Bamburi', 'Shanzu', 'Diani', 'Ukunda', 'Kilifi',
  'Malindi', 'Watamu', 'Voi', 'Taveta', 'Kwale', 'Msambweni', 'Lunga Lunga', 'Shimoni',

  // Kisumu & Western
  'Kisumu', 'Kondele', 'Mamboleo', 'Milimani', 'Kakamega', 'Bungoma',
  'Busia', 'Siaya', 'Homa Bay', 'Kisii', 'Migori',

  // Nakuru & Rift Valley
  'Nakuru', 'Naivasha', 'Gilgil', 'Eldoret', 'Kitale', 'Kapsabet',

  // Central Kenya
  'Nyeri', 'Nanyuki', 'Meru', 'Embu', 'Kerugoya', 'Karatina',

  // Other Major Towns
  'Narok', 'Bomet', 'Kericho', 'Machakos', 'Makueni', 'Garissa'
].sort();

const LocationPreferences = ({ userId }) => {
  const [preferredAreas, setPreferredAreas] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchUserPreferences();
  }, [userId]);

  const fetchUserPreferences = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setPreferredAreas(userData.preferredAreas || []);
      }
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      setMessage({ type: 'error', text: 'Failed to load preferences' });
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async (newAreas) => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', userId), {
        preferredAreas: newAreas,
        updatedAt: new Date().toISOString()
      });
      setMessage({ type: 'success', text: 'Preferences saved successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error saving preferences:', error);
      setMessage({ type: 'error', text: 'Failed to save preferences' });
    } finally {
      setSaving(false);
    }
  };

  const addArea = (area) => {
    if (!preferredAreas.includes(area)) {
      const newAreas = [...preferredAreas, area];
      setPreferredAreas(newAreas);
      savePreferences(newAreas);
      setSearchTerm('');
      setShowDropdown(false);
    }
  };

  const removeArea = (area) => {
    const newAreas = preferredAreas.filter(a => a !== area);
    setPreferredAreas(newAreas);
    savePreferences(newAreas);
  };

  const filteredAreas = KENYA_AREAS.filter(area =>
    area.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !preferredAreas.includes(area)
  );

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          KPLC Power Outage Alerts
        </h3>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Select the areas where you want to receive power outage notifications from Kenya Power.
      </p>

      {/* Message Display */}
      {message.text && (
        <div className={`mb-4 p-3 rounded-lg flex items-start gap-2 ${
          message.type === 'success'
            ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
            : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
        }`}>
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{message.text}</p>
        </div>
      )}

      {/* Selected Areas */}
      {preferredAreas.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Your Selected Areas ({preferredAreas.length})
          </label>
          <div className="flex flex-wrap gap-2">
            {preferredAreas.map(area => (
              <span
                key={area}
                className="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm"
              >
                <MapPin className="w-3 h-3" />
                {area}
                <button
                  onClick={() => removeArea(area)}
                  className="ml-1 hover:text-blue-600 dark:hover:text-blue-300"
                  disabled={saving}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Search and Add Areas */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Add Area
        </label>
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Search for an area (e.g., Westlands, Kilimani...)"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            disabled={saving}
          />
          <Plus className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>

        {/* Dropdown */}
        {showDropdown && filteredAreas.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {filteredAreas.slice(0, 10).map(area => (
              <button
                key={area}
                onClick={() => addArea(area)}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-white text-sm flex items-center gap-2"
                disabled={saving}
              >
                <MapPin className="w-4 h-4 text-gray-400" />
                {area}
              </button>
            ))}
            {filteredAreas.length > 10 && (
              <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                {filteredAreas.length - 10} more areas available...
              </div>
            )}
          </div>
        )}
      </div>

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowDropdown(false)}
        />
      )}

      {/* Info Box */}
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-xs text-blue-800 dark:text-blue-200">
          <strong>Note:</strong> You'll receive notifications when Kenya Power posts about planned outages in your selected areas on their Twitter account.
        </p>
      </div>
    </div>
  );
};

export default LocationPreferences;
