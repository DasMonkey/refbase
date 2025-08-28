import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  Download, 
  Trash2,
  Mail,
  Phone,
  MapPin,
  Camera,
  Save,
  Key,
  Code2
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { ApiStorageTab } from './ApiStorageTab';
import { ApiKeyManagementTab } from './ApiKeyManagementTab';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const settingsTabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'privacy', label: 'Privacy & Security', icon: Shield },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'language', label: 'Language & Region', icon: Globe },
  { id: 'developer', label: 'API Keys', icon: Code2 },
  { id: 'api-storage', label: 'API Storage', icon: Key },
  { id: 'data', label: 'Data & Storage', icon: Download },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { isDark, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const [hasChanges, setHasChanges] = useState(false);

  // User profile state
  const [userProfile, setUserProfile] = useState({
    name: localStorage.getItem('userName') || 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    bio: 'Product Manager passionate about building great user experiences.',
    avatar: '',
  });

  // Notification settings
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    taskReminders: true,
    bugUpdates: true,
    projectUpdates: true,
    weeklyDigest: false,
    marketingEmails: false,
  });

  // Privacy settings
  const [privacy, setPrivacy] = useState({
    profileVisibility: 'team',
    activityStatus: true,
    dataSharing: false,
    analyticsOptOut: false,
    twoFactorAuth: false,
  });

  // Language settings
  const [language, setLanguage] = useState({
    language: 'en',
    timezone: 'America/Los_Angeles',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
  });

  const handleSaveProfile = () => {
    localStorage.setItem('userName', userProfile.name);
    setHasChanges(false);
    // In a real app, this would make an API call
  };

  const handleProfileChange = (field: string, value: string) => {
    setUserProfile(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleExportData = () => {
    // In a real app, this would trigger a data export
    alert('Data export will be sent to your email within 24 hours.');
  };

  const handleDeleteAccount = () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      // In a real app, this would delete the account
      alert('Account deletion initiated. You will receive a confirmation email.');
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className={`w-20 h-20 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} flex items-center justify-center`}>
                  {userProfile.avatar ? (
                    <img src={userProfile.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <User size={32} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
                  )}
                </div>
                <button className="absolute bottom-0 right-0 p-1 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors">
                  <Camera size={12} />
                </button>
              </div>
              <div>
                <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Profile Picture</h3>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Upload a photo to personalize your account</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={userProfile.name}
                  onChange={(e) => handleProfileChange('name', e.target.value)}
                  className={`w-full p-3 border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-200 bg-white'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={16} className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                  <input
                    type="email"
                    value={userProfile.email}
                    onChange={(e) => handleProfileChange('email', e.target.value)}
                    className={`w-full pl-10 pr-3 py-3 border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-200 bg-white'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Phone Number
                </label>
                <div className="relative">
                  <Phone size={16} className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                  <input
                    type="tel"
                    value={userProfile.phone}
                    onChange={(e) => handleProfileChange('phone', e.target.value)}
                    className={`w-full pl-10 pr-3 py-3 border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-200 bg-white'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Location
                </label>
                <div className="relative">
                  <MapPin size={16} className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                  <input
                    type="text"
                    value={userProfile.location}
                    onChange={(e) => handleProfileChange('location', e.target.value)}
                    className={`w-full pl-10 pr-3 py-3 border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-200 bg-white'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                Bio
              </label>
              <textarea
                value={userProfile.bio}
                onChange={(e) => handleProfileChange('bio', e.target.value)}
                rows={3}
                className={`w-full p-3 border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-200 bg-white'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="Tell us about yourself..."
              />
            </div>

            {hasChanges && (
              <div className="flex justify-end">
                <button
                  onClick={handleSaveProfile}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Save size={16} className="mr-2" />
                  Save Changes
                </button>
              </div>
            )}
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>Email Notifications</h3>
              <div className="space-y-4">
                {Object.entries({
                  emailNotifications: 'Email notifications',
                  taskReminders: 'Task reminders',
                  bugUpdates: 'Bug status updates',
                  projectUpdates: 'Project updates',
                  weeklyDigest: 'Weekly digest',
                  marketingEmails: 'Marketing emails',
                }).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{label}</p>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {key === 'weeklyDigest' ? 'Get a summary of your week' : 
                         key === 'marketingEmails' ? 'Product updates and tips' :
                         `Receive ${label.toLowerCase()}`}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications[key as keyof typeof notifications]}
                        onChange={(e) => setNotifications(prev => ({ ...prev, [key]: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>Push Notifications</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Browser notifications</p>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Get notified in your browser</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.pushNotifications}
                    onChange={(e) => setNotifications(prev => ({ ...prev, pushNotifications: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-6">
            <div>
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>Profile Visibility</h3>
              <div className="space-y-3">
                {[
                  { value: 'public', label: 'Public', desc: 'Anyone can see your profile' },
                  { value: 'team', label: 'Team only', desc: 'Only team members can see your profile' },
                  { value: 'private', label: 'Private', desc: 'Only you can see your profile' },
                ].map((option) => (
                  <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="profileVisibility"
                      value={option.value}
                      checked={privacy.profileVisibility === option.value}
                      onChange={(e) => setPrivacy(prev => ({ ...prev, profileVisibility: e.target.value }))}
                      className="text-blue-600"
                    />
                    <div>
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{option.label}</p>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{option.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {Object.entries({
                activityStatus: 'Show activity status',
                dataSharing: 'Share usage data',
                analyticsOptOut: 'Opt out of analytics',
                twoFactorAuth: 'Two-factor authentication',
              }).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{label}</p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {key === 'activityStatus' ? 'Let others see when you\'re online' :
                       key === 'dataSharing' ? 'Help improve our service' :
                       key === 'analyticsOptOut' ? 'Disable usage tracking' :
                       'Add extra security to your account'}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={privacy[key as keyof typeof privacy] as boolean}
                      onChange={(e) => setPrivacy(prev => ({ ...prev, [key]: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-6">
            <div>
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>Theme</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Dark mode</p>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Switch between light and dark themes</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDark}
                    onChange={toggleTheme}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            <div>
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>Sidebar</h3>
              <div className="space-y-3">
                {[
                  { value: 'expanded', label: 'Always expanded', desc: 'Keep sidebar open by default' },
                  { value: 'collapsed', label: 'Always collapsed', desc: 'Keep sidebar minimized by default' },
                  { value: 'auto', label: 'Auto', desc: 'Remember last state' },
                ].map((option) => (
                  <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="sidebarMode"
                      value={option.value}
                      defaultChecked={option.value === 'auto'}
                      className="text-blue-600"
                    />
                    <div>
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{option.label}</p>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{option.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 'language':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Language
                </label>
                <select
                  value={language.language}
                  onChange={(e) => setLanguage(prev => ({ ...prev, language: e.target.value }))}
                  className={`w-full p-3 border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-200 bg-white'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                  <option value="ja">日本語</option>
                  <option value="zh">中文</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Timezone
                </label>
                <select
                  value={language.timezone}
                  onChange={(e) => setLanguage(prev => ({ ...prev, timezone: e.target.value }))}
                  className={`w-full p-3 border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-200 bg-white'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                >
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="Europe/London">London (GMT)</option>
                  <option value="Europe/Paris">Paris (CET)</option>
                  <option value="Asia/Tokyo">Tokyo (JST)</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Date Format
                </label>
                <select
                  value={language.dateFormat}
                  onChange={(e) => setLanguage(prev => ({ ...prev, dateFormat: e.target.value }))}
                  className={`w-full p-3 border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-200 bg-white'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                >
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Time Format
                </label>
                <select
                  value={language.timeFormat}
                  onChange={(e) => setLanguage(prev => ({ ...prev, timeFormat: e.target.value }))}
                  className={`w-full p-3 border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-200 bg-white'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                >
                  <option value="12h">12-hour (AM/PM)</option>
                  <option value="24h">24-hour</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 'developer':
        return <ApiKeyManagementTab isDark={isDark} />;

      case 'api-storage':
        return <ApiStorageTab isDark={isDark} />;

      case 'data':
        return (
          <div className="space-y-6">
            <div>
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>Data Management</h3>
              <div className="space-y-4">
                <div className={`p-4 border ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'} rounded-lg`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Export your data</p>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Download all your projects, tasks, and documents</p>
                    </div>
                    <button
                      onClick={handleExportData}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Download size={16} className="mr-2" />
                      Export
                    </button>
                  </div>
                </div>

                <div className={`p-4 border ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'} rounded-lg`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Storage usage</p>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>2.3 GB of 10 GB used</p>
                    </div>
                    <div className="w-32">
                      <div className={`w-full ${isDark ? 'bg-gray-600' : 'bg-gray-200'} rounded-full h-2`}>
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: '23%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className={`text-lg font-semibold text-red-600 mb-4`}>Danger Zone</h3>
              <div className={`p-4 border border-red-200 ${isDark ? 'bg-red-900/10' : 'bg-red-50'} rounded-lg`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Delete account</p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Permanently delete your account and all data</p>
                  </div>
                  <button
                    onClick={handleDeleteAccount}
                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Trash2 size={16} className="mr-2" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden shadow-2xl`}
      >
        {/* Header */}
        <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
          <h2 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Settings</h2>
          <button
            onClick={onClose}
            className={`p-2 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} rounded-lg transition-colors`}
          >
            <X size={20} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
          </button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Sidebar */}
          <div className={`w-64 ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'} border-r`}>
            <nav className="p-4 space-y-2">
              {settingsTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors text-left ${
                      activeTab === tab.id
                        ? `${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'}`
                        : `${isDark ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'}`
                    }`}
                  >
                    <Icon size={18} />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
              >
                {renderTabContent()}
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};