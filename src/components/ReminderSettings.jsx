import React, { useState, useEffect } from 'react';
import { Bell, MessageSquare, Send, Clock, Settings, AlertCircle, CheckCircle } from 'lucide-react';
import { doc, getDoc, updateDoc, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db, functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';

const ReminderSettings = ({ landlordId }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    enabled: false,
    reminderDays: [7, 3, 1],
    defaultRentDueDay: 5,
    messageType: 'friendly',
    overdueReminderInterval: 3
  });
  const [showManualReminder, setShowManualReminder] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [manualMessage, setManualMessage] = useState('');
  const [tenants, setTenants] = useState([]);
  const [smsLogs, setSmsLogs] = useState([]);
  const [sendingManual, setSendingManual] = useState(false);

  useEffect(() => {
    loadSettings();
    loadTenants();
    loadRecentLogs();
  }, [landlordId]);

  const loadSettings = async () => {
    try {
      const settingsDoc = await getDoc(doc(db, 'landlordSettings', landlordId));
      if (settingsDoc.exists() && settingsDoc.data().reminderSettings) {
        setSettings(settingsDoc.data().reminderSettings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTenants = async () => {
    try {
      const tenantsQuery = query(
        collection(db, 'tenants'),
        where('landlordId', '==', landlordId),
        where('status', '==', 'active')
      );
      const tenantsSnapshot = await getDocs(tenantsQuery);
      const tenantsData = tenantsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTenants(tenantsData);
    } catch (error) {
      console.error('Error loading tenants:', error);
    }
  };

  const loadRecentLogs = async () => {
    try {
      const logsQuery = query(
        collection(db, 'smsLog'),
        where('landlordId', '==', landlordId),
        orderBy('sentAt', 'desc'),
        limit(10)
      );
      const logsSnapshot = await getDocs(logsQuery);
      const logsData = logsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSmsLogs(logsData);
    } catch (error) {
      console.error('Error loading logs:', error);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'landlordSettings', landlordId), {
        reminderSettings: settings,
        updatedAt: new Date()
      });
      alert('Reminder settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSendManualReminder = async () => {
    if (!selectedTenant || !manualMessage.trim()) {
      alert('Please select a tenant and enter a message');
      return;
    }

    setSendingManual(true);
    try {
      const sendManualReminder = httpsCallable(functions, 'sendManualReminder');
      const result = await sendManualReminder({
        tenantId: selectedTenant,
        message: manualMessage
      });

      if (result.data.success) {
        alert('Reminder sent successfully!');
        setShowManualReminder(false);
        setSelectedTenant(null);
        setManualMessage('');
        loadRecentLogs();
      }
    } catch (error) {
      console.error('Error sending reminder:', error);
      alert('Failed to send reminder: ' + error.message);
    } finally {
      setSendingManual(false);
    }
  };

  const toggleReminderDay = (day) => {
    setSettings(prev => ({
      ...prev,
      reminderDays: prev.reminderDays.includes(day)
        ? prev.reminderDays.filter(d => d !== day)
        : [...prev.reminderDays, day].sort((a, b) => b - a)
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <Bell className="w-6 h-6 text-blue-900 dark:text-blue-100" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Rent Reminders
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Automated SMS/WhatsApp reminders via Africa's Talking
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowManualReminder(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
          >
            <Send className="w-4 h-4" />
            Send Manual Reminder
          </button>
        </div>

        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg mb-6">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">Enable Automated Reminders</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Send automatic rent reminders to tenants
              </p>
            </div>
          </div>
          <button
            onClick={() => setSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.enabled ? 'bg-green-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Reminder Days */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Send reminders (days before rent is due)
          </label>
          <div className="flex flex-wrap gap-3">
            {[14, 10, 7, 5, 3, 1].map(day => (
              <button
                key={day}
                onClick={() => toggleReminderDay(day)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  settings.reminderDays.includes(day)
                    ? 'bg-blue-900 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300'
                }`}
              >
                {day} {day === 1 ? 'day' : 'days'}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Selected: {settings.reminderDays.length === 0 ? 'None' : settings.reminderDays.sort((a, b) => b - a).join(', ') + ' days before'}
          </p>
        </div>

        {/* Default Rent Due Day */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Default Rent Due Day (of the month)
          </label>
          <select
            value={settings.defaultRentDueDay}
            onChange={(e) => setSettings(prev => ({ ...prev, defaultRentDueDay: parseInt(e.target.value) }))}
            className="w-full md:w-64 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
              <option key={day} value={day}>
                Day {day} of every month
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            This is the default. You can set custom due dates per tenant.
          </p>
        </div>

        {/* Message Type */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Message Tone
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setSettings(prev => ({ ...prev, messageType: 'friendly' }))}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                settings.messageType === 'friendly'
                  ? 'border-blue-900 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-500'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-5 h-5 text-blue-900" />
                <span className="font-semibold text-gray-900 dark:text-white">Friendly</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                "Hi [Name]! Just a friendly reminder that your rent is due in 3 days..."
              </p>
            </button>

            <button
              onClick={() => setSettings(prev => ({ ...prev, messageType: 'formal' }))}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                settings.messageType === 'formal'
                  ? 'border-blue-900 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-500'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-blue-900" />
                <span className="font-semibold text-gray-900 dark:text-white">Formal</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                "Dear [Name], this is a reminder that your rent is due in 3 days..."
              </p>
            </button>
          </div>
        </div>

        {/* Overdue Reminder Interval */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Overdue Reminder Frequency
          </label>
          <select
            value={settings.overdueReminderInterval}
            onChange={(e) => setSettings(prev => ({ ...prev, overdueReminderInterval: parseInt(e.target.value) }))}
            className="w-full md:w-64 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value={1}>Every day</option>
            <option value={2}>Every 2 days</option>
            <option value={3}>Every 3 days</option>
            <option value={5}>Every 5 days</option>
            <option value={7}>Every week</option>
          </select>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            How often to remind tenants after rent becomes overdue
          </p>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="bg-blue-900 hover:bg-blue-800 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Save Settings
              </>
            )}
          </button>
        </div>
      </div>

      {/* Recent SMS Logs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Recent SMS Activity
        </h3>
        {smsLogs.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400 text-center py-8">
            No SMS activity yet
          </p>
        ) : (
          <div className="space-y-3">
            {smsLogs.map(log => (
              <div
                key={log.id}
                className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {log.tenantName}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      log.type === 'rent_reminder' ? 'bg-blue-100 text-blue-800' :
                      log.type === 'overdue_reminder' ? 'bg-red-100 text-red-800' :
                      log.type === 'payment_confirmation' ? 'bg-green-100 text-green-800' :
                      'bg-gray-200 text-gray-800'
                    }`}>
                      {log.type.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    {log.message}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {log.sentAt?.toDate().toLocaleString() || 'Recently'}
                  </p>
                </div>
                <div className={`ml-4 ${log.success ? 'text-green-600' : 'text-red-600'}`}>
                  {log.success ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <AlertCircle className="w-5 h-5" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manual Reminder Modal */}
      {showManualReminder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Send Manual Reminder
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Select Tenant
                </label>
                <select
                  value={selectedTenant || ''}
                  onChange={(e) => setSelectedTenant(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a tenant...</option>
                  {tenants.map(tenant => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name} - {tenant.propertyName} {tenant.unit}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Message
                </label>
                <textarea
                  value={manualMessage}
                  onChange={(e) => setManualMessage(e.target.value)}
                  rows={4}
                  maxLength={160}
                  placeholder="Enter your reminder message (max 160 characters)"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {manualMessage.length}/160 characters
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowManualReminder(false);
                    setSelectedTenant(null);
                    setManualMessage('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendManualReminder}
                  disabled={sendingManual || !selectedTenant || !manualMessage.trim()}
                  className="flex-1 px-4 py-2 bg-blue-900 hover:bg-blue-800 disabled:bg-gray-400 text-white rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  {sendingManual ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send SMS
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReminderSettings;
