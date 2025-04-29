import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Save, Plus, X } from 'lucide-react';
import { Database } from '../types/supabase';

type UserSettings = Database['public']['Tables']['user_settings']['Row'];

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [reminderDays, setReminderDays] = useState<number[]>([3, 7, 14]);
  const [newReminderDay, setNewReminderDay] = useState<string>('');
  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) return;
        
        setUserId(user.id);
        
        const { data, error } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
          
        if (error) {
          throw error;
        }
        
        if (data) {
          setSettings(data);
          setReminderDays(data.reminder_days || [3, 7, 14]);
          setCompanyName(data.company_name || '');
          setCompanyAddress(data.company_address || '');
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        toast.error('Error loading settings');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId) return;
    
    try {
      setSaving(true);
      
      const settingsData = {
        user_id: userId,
        reminder_days: reminderDays,
        company_name: companyName,
        company_address: companyAddress,
      };
      
      let error;
      
      if (settings) {
        // Update existing settings
        const { error: updateError } = await supabase
          .from('user_settings')
          .update(settingsData)
          .eq('id', settings.id);
          
        error = updateError;
      } else {
        // Create new settings
        const { error: insertError } = await supabase
          .from('user_settings')
          .insert(settingsData);
          
        error = insertError;
      }
      
      if (error) throw error;
      
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const handleAddReminderDay = () => {
    const day = parseInt(newReminderDay);
    if (isNaN(day) || day <= 0) {
      toast.error('Please enter a valid number of days');
      return;
    }
    
    if (reminderDays.includes(day)) {
      toast.error('This reminder is already set');
      return;
    }
    
    setReminderDays([...reminderDays, day].sort((a, b) => a - b));
    setNewReminderDay('');
  };

  const handleRemoveReminderDay = (day: number) => {
    setReminderDays(reminderDays.filter(d => d !== day));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <form onSubmit={handleSaveSettings}>
          <div className="border-b border-gray-200 px-6 py-5">
            <h3 className="text-lg font-medium text-gray-900">Company Information</h3>
            <p className="mt-1 text-sm text-gray-500">
              This information will appear on your invoices.
            </p>
          </div>

          <div className="px-6 py-5 space-y-6">
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                Company Name
              </label>
              <input
                type="text"
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="mt-1 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label htmlFor="companyAddress" className="block text-sm font-medium text-gray-700">
                Company Address
              </label>
              <textarea
                id="companyAddress"
                rows={3}
                value={companyAddress}
                onChange={(e) => setCompanyAddress(e.target.value)}
                className="mt-1 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Company Logo
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                    >
                      <span>Upload a file</span>
                      <input id="file-upload" name="file-upload" type="file" className="sr-only" />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Logo upload will be available in the next update.
              </p>
            </div>
          </div>

          <div className="border-t border-b border-gray-200 px-6 py-5">
            <h3 className="text-lg font-medium text-gray-900">Reminder Settings</h3>
            <p className="mt-1 text-sm text-gray-500">
              Configure when to send payment reminders after the due date.
            </p>
          </div>

          <div className="px-6 py-5 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reminder Schedule (Days after due date)
              </label>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {reminderDays.map((day) => (
                  <div key={day} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {day} {day === 1 ? 'day' : 'days'}
                    <button
                      type="button"
                      onClick={() => handleRemoveReminderDay(day)}
                      className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-600 focus:outline-none"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                
                {reminderDays.length === 0 && (
                  <p className="text-sm text-gray-500">No reminders configured yet.</p>
                )}
              </div>
              
              <div className="sm:flex sm:items-center">
                <div className="w-full sm:max-w-xs">
                  <label htmlFor="newReminderDay" className="sr-only">
                    Add reminder days
                  </label>
                  <input
                    type="number"
                    id="newReminderDay"
                    placeholder="Enter days (e.g. 3)"
                    min="1"
                    value={newReminderDay}
                    onChange={(e) => setNewReminderDay(e.target.value)}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddReminderDay}
                  className="mt-3 sm:mt-0 sm:ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Reminder
                </button>
              </div>
            </div>
          </div>

          <div className="px-6 py-5 bg-gray-50 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;