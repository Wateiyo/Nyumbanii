import React, { useState, useEffect } from 'react';
import { Zap, MapPin, Calendar, Clock, AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../firebase';

const PowerOutagesList = ({ userAreas = [] }) => {
  const [outages, setOutages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('relevant'); // 'relevant' or 'all'
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    // Listen for power outages in real-time
    const outagesQuery = query(
      collection(db, 'powerOutages'),
      where('status', 'in', ['scheduled', 'active'])
    );

    const unsubscribe = onSnapshot(outagesQuery, (snapshot) => {
      const outagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sort by scheduledDate in JavaScript (since Firestore orderBy requires an index)
      outagesData.sort((a, b) => {
        const dateA = a.scheduledDate || '';
        const dateB = b.scheduledDate || '';
        return dateA.localeCompare(dateB);
      });

      setOutages(outagesData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching power outages:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter outages based on user's preferred areas
  const filteredOutages = filter === 'relevant'
    ? outages.filter(outage =>
        outage.affectedAreas?.some(area =>
          userAreas.some(userArea =>
            area.toLowerCase().includes(userArea.toLowerCase()) ||
            userArea.toLowerCase().includes(area.toLowerCase())
          )
        )
      )
    : outages;

  // Handle manual refresh of KPLC data
  const handleRefresh = async () => {
    setRefreshing(true);
    setRefreshMessage({ type: '', text: '' });

    try {
      const functions = getFunctions();
      const manualMonitorKPLCTwitter = httpsCallable(functions, 'manualMonitorKPLCTwitter');

      await manualMonitorKPLCTwitter();

      setRefreshMessage({
        type: 'success',
        text: 'Successfully fetched latest updates from Kenya Power Twitter!'
      });

      setTimeout(() => setRefreshMessage({ type: '', text: '' }), 5000);
    } catch (error) {
      console.error('Error refreshing KPLC data:', error);
      setRefreshMessage({
        type: 'error',
        text: 'Failed to fetch updates. Please try again later.'
      });

      setTimeout(() => setRefreshMessage({ type: '', text: '' }), 5000);
    } finally {
      setRefreshing(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date TBA';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return timeString;
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              KPLC Planned Power Maintenance Alerts
            </h3>
          </div>

          <div className="flex gap-2">
            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-3 py-1 rounded-lg text-sm font-medium transition flex items-center gap-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Fetch latest updates from Kenya Power"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Updating...' : 'Refresh'}
            </button>

            {/* Filter Buttons */}
            {userAreas.length > 0 && (
              <>
                <button
                  onClick={() => setFilter('relevant')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                    filter === 'relevant'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  My Areas ({filteredOutages.length})
                </button>
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                    filter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  All ({outages.length})
                </button>
              </>
            )}
          </div>
        </div>

        {/* Refresh Message */}
        {refreshMessage.text && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${
            refreshMessage.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
              : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
          }`}>
            {refreshMessage.text}
          </div>
        )}

        {userAreas.length === 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Tip:</strong> Add your preferred areas in the settings below to receive personalized outage alerts.
            </p>
          </div>
        )}
      </div>

      {/* Outages List */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {filteredOutages.length === 0 ? (
          <div className="p-8 text-center">
            <Zap className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {filter === 'relevant' ? 'No Maintenance in Your Areas' : 'No Scheduled Maintenance'}
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {filter === 'relevant'
                ? 'There are currently no planned power maintenance in your selected areas.'
                : 'There are no scheduled power maintenance at the moment.'
              }
            </p>
          </div>
        ) : (
          filteredOutages.map((outage) => (
            <div key={outage.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
              <div className="flex items-start gap-3">
                {/* Status Indicator */}
                <div className={`mt-1 p-2 rounded-full ${
                  outage.status === 'active'
                    ? 'bg-red-100 dark:bg-red-900/30'
                    : 'bg-yellow-100 dark:bg-yellow-900/30'
                }`}>
                  <AlertTriangle className={`w-4 h-4 ${
                    outage.status === 'active'
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-yellow-600 dark:text-yellow-400'
                  }`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Status Badge */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      outage.status === 'active'
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                        : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
                    }`}>
                      {outage.status === 'active' ? 'ONGOING' : 'SCHEDULED'}
                    </span>
                  </div>

                  {/* Affected Areas */}
                  <div className="mb-2">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5" />
                      <div className="flex flex-wrap gap-1">
                        {outage.affectedAreas?.map((area, idx) => (
                          <span
                            key={idx}
                            className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                              userAreas.some(userArea =>
                                area.toLowerCase().includes(userArea.toLowerCase()) ||
                                userArea.toLowerCase().includes(area.toLowerCase())
                              )
                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-700'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {area}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Date and Time */}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(outage.scheduledDate)}</span>
                    </div>
                    {outage.startTime && outage.endTime && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>
                          {formatTime(outage.startTime)} - {formatTime(outage.endTime)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {outage.description && (
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                      {outage.description}
                    </p>
                  )}

                  {/* Tweet Link */}
                  {outage.tweetUrl && (
                    <a
                      href={outage.tweetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      View original tweet
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {filteredOutages.length > 0 && (
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
            Data from Kenya Power Twitter (@KenyaPower_Care) • Updated in real-time
          </p>
        </div>
      )}
    </div>
  );
};

export default PowerOutagesList;
