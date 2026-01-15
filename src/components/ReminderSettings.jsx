import React, { useState, useEffect } from 'react';
import { Bell, MessageSquare, Send, Settings, AlertCircle, CheckCircle, Mail, Check } from 'lucide-react';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
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
  const [selectedTenantsForReminder, setSelectedTenantsForReminder] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState('email'); // 'email' or 'message' (in-app)
  const [tenants, setTenants] = useState([]);
  const [sendingManual, setSendingManual] = useState(false);

  useEffect(() => {
    loadSettings();
    loadTenants();
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
    if (selectedTenantsForReminder.length === 0) {
      alert('Please select at least one tenant');
      return;
    }

    setSendingManual(true);
    let successCount = 0;
    let failCount = 0;

    try {
      // Get landlord info for in-app messages
      const landlordDoc = await getDoc(doc(db, 'users', landlordId));
      const landlordName = landlordDoc.exists() ? (landlordDoc.data().displayName || landlordDoc.data().name || 'Landlord') : 'Landlord';

      for (const tenantId of selectedTenantsForReminder) {
        const tenant = tenants.find(t => t.id === tenantId);
        if (!tenant) continue;

        // Generate message based on tone
        const message = settings.messageType === 'friendly'
          ? `Hi ${tenant.name}! Just a friendly reminder that your rent is due soon. Amount: KES ${(tenant.monthlyRent || 0).toLocaleString()}. Thank you!`
          : `Dear ${tenant.name}, this is a reminder that your rent payment of KES ${(tenant.monthlyRent || 0).toLocaleString()} is due soon. Please ensure timely payment. Thank you.`;

        try {
          if (selectedChannel === 'message') {
            // Send in-app message to tenant's messages dashboard
            const conversationId = [landlordId, tenant.userId || tenantId].sort().join('_');

            // Create message document
            await addDoc(collection(db, 'messages'), {
              conversationId: conversationId,
              senderId: landlordId,
              senderName: landlordName,
              senderRole: 'landlord',
              recipientId: tenant.userId || tenantId,
              recipientName: tenant.name,
              recipientRole: 'tenant',
              text: message,
              timestamp: serverTimestamp(),
              read: false,
              propertyName: tenant.propertyName || '',
              unit: tenant.unit || '',
              participants: [landlordId, tenant.userId || tenantId]
            });

            // Create notification for tenant
            await addDoc(collection(db, 'notifications'), {
              userId: tenant.userId || tenantId,
              type: 'message',
              title: 'Rent Reminder from Landlord',
              message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
              read: false,
              timestamp: serverTimestamp(),
              senderId: landlordId,
              senderName: landlordName,
              senderRole: 'landlord',
              conversationId: conversationId
            });

            successCount++;
          } else if (selectedChannel === 'email') {
            // Send via Cloud Function (email only for now)
            const sendRentReminder = httpsCallable(functions, 'sendRentReminder');
            await sendRentReminder({
              landlordId: landlordId,
              tenantId: tenant.id,
              tenantName: tenant.name,
              tenantEmail: tenant.email,
              tenantPhone: tenant.phone,
              channel: 'email',
              message: message,
              rentAmount: tenant.monthlyRent || 0,
              dueDate: tenant.rentDueDay || settings.defaultRentDueDay
            });
            successCount++;
          }
        } catch (error) {
          console.error(`Error sending to ${tenant.name}:`, error);
          failCount++;
        }
      }

      if (successCount > 0) {
        const channelName = selectedChannel === 'email' ? 'Email' : 'In-App Message';
        alert(`Reminders sent successfully to ${successCount} tenant(s) via ${channelName}!${failCount > 0 ? ` ${failCount} failed.` : ''}`);
        setShowManualReminder(false);
        setSelectedTenantsForReminder([]);
        setSelectedChannel('email');
      } else {
        alert('Failed to send reminders. Please try again.');
      }
    } catch (error) {
      console.error('Error sending reminders:', error);
      alert('Failed to send reminders: ' + error.message);
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
                Automated email reminders and in-app messaging
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

      {/* Reminder Best Practices */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Reminder Best Practices
        </h3>
        <div className="space-y-4">
          {/* Tip 1 */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
              1
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                Send Reminders Early
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                We recommend sending reminders 7, 3, and 1 day before rent is due. This gives tenants enough time to prepare and reduces late payments.
              </p>
            </div>
          </div>

          {/* Tip 2 */}
          <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
              2
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                Use In-App Messages for Quick Reminders
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                In-app messages appear instantly in your tenant's dashboard and send them a notification. Perfect for urgent reminders or follow-ups.
              </p>
            </div>
          </div>

          {/* Tip 3 */}
          <div className="flex items-start gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
              3
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                Keep Messages Professional and Friendly
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                A friendly tone maintains positive relationships while still being clear about payment expectations. Avoid aggressive language.
              </p>
            </div>
          </div>

          {/* Tip 4 */}
          <div className="flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
            <div className="flex-shrink-0 w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
              4
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                Automate to Save Time
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Enable automated reminders above to save hours each month. The system will send reminders automatically based on your schedule.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Reminder Modal with Channel Selection */}
      {showManualReminder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 my-auto">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Send Rent Reminder
            </h3>

            <div className="space-y-5">
              {/* Select Tenants (Multi-select with checkboxes) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Select Tenant(s)
                </label>
                <div className="max-h-40 sm:max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-2 sm:p-3 space-y-1 sm:space-y-2">
                  <label className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedTenantsForReminder.length === tenants.length && tenants.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTenantsForReminder(tenants.map(t => t.id));
                        } else {
                          setSelectedTenantsForReminder([]);
                        }
                      }}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="font-semibold text-gray-900 dark:text-white">
                      Select All ({tenants.length} tenants)
                    </span>
                  </label>
                  {tenants.map(tenant => (
                    <label key={tenant.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedTenantsForReminder.includes(tenant.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTenantsForReminder([...selectedTenantsForReminder, tenant.id]);
                          } else {
                            setSelectedTenantsForReminder(selectedTenantsForReminder.filter(id => id !== tenant.id));
                          }
                        }}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-gray-900 dark:text-white">
                        {tenant.name} - {tenant.unit || tenant.propertyName}
                      </span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {selectedTenantsForReminder.length} tenant(s) selected
                </p>
              </div>

              {/* Message Preview */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Message Preview
                </label>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm text-gray-900 dark:text-white">
                  {settings.messageType === 'friendly'
                    ? "Hi [Name]! Just a friendly reminder that your rent is due soon. Thank you!"
                    : "Dear [Name], this is a reminder that your rent payment is due soon. Please ensure timely payment."}
                </div>
              </div>

              {/* Channel Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Choose Channel
                </label>
                <div className="space-y-3">
                  {/* Email Option */}
                  <div
                    onClick={() => setSelectedChannel('email')}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition ${
                      selectedChannel === 'email'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-blue-600" />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">Email</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Free • Reliable delivery</div>
                        </div>
                      </div>
                      {selectedChannel === 'email' && (
                        <Check className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                  </div>

                  {/* Send Message (In-App) Option */}
                  <div
                    onClick={() => setSelectedChannel('message')}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition ${
                      selectedChannel === 'message'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-purple-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="w-5 h-5 text-purple-600" />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">Send Message (In-App)</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Free • Sent to tenant's messages dashboard</div>
                        </div>
                      </div>
                      {selectedChannel === 'message' && (
                        <Check className="w-5 h-5 text-purple-600" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowManualReminder(false);
                    setSelectedTenantsForReminder([]);
                    setSelectedChannel('email');
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendManualReminder}
                  disabled={sendingManual || selectedTenantsForReminder.length === 0}
                  className="flex-1 px-4 py-2.5 bg-blue-900 hover:bg-blue-800 disabled:bg-gray-400 text-white rounded-lg transition-all flex items-center justify-center gap-2 font-medium"
                >
                  {sendingManual ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span className="hidden sm:inline">Sending...</span>
                      <span className="sm:hidden">Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span className="hidden sm:inline">Send via {selectedChannel === 'email' ? 'Email' : 'In-App Message'}</span>
                      <span className="sm:hidden">Send {selectedChannel === 'email' ? 'Email' : 'Message'}</span>
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
