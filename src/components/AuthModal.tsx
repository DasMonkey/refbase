import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Mail, Lock, User, Eye, EyeOff, Github, Chrome } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTheme } from '../contexts/ThemeContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { isDark } = useTheme();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (isSignUp) {
      if (!formData.fullName) {
        newErrors.fullName = 'Full name is required';
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName,
            }
          }
        });

        if (error) throw error;

        if (data.user && !data.session) {
          // Email confirmation required
          setErrors({ general: 'Please check your email and click the confirmation link to complete registration.' });
        } else {
          onSuccess();
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;
        onSuccess();
      }
    } catch (error: any) {
      setErrors({ general: error.message || 'An error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialAuth = async (provider: 'github' | 'google') => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `https://refbase.dev`
        }
      });
      if (error) throw error;
    } catch (error: any) {
      setErrors({ general: error.message || 'Social authentication failed' });
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      fullName: ''
    });
    setErrors({});
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    resetForm();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl w-full max-w-md shadow-2xl`}
      >
        {/* Header */}
        <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
          <h2 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>
          <button
            onClick={onClose}
            className={`p-2 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} rounded-lg transition-colors`}
          >
            <X size={20} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className={`text-center ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
            {isSignUp 
              ? 'Join thousands of engineering teams building better products'
              : 'Sign in to your Refbase account'
            }
          </p>

          {/* Social Auth */}
          <div className="space-y-3 mb-6">
            <button
              onClick={() => handleSocialAuth('github')}
              disabled={isLoading}
              className={`w-full flex items-center justify-center px-4 py-3 border ${
                isDark ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50'
              } rounded-lg transition-colors disabled:opacity-50`}
            >
              <Github size={20} className="mr-3" />
              <span className={isDark ? 'text-white' : 'text-gray-900'}>
                Continue with GitHub
              </span>
            </button>
            <button
              onClick={() => handleSocialAuth('google')}
              disabled={isLoading}
              className={`w-full flex items-center justify-center px-4 py-3 border ${
                isDark ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50'
              } rounded-lg transition-colors disabled:opacity-50`}
            >
              <Chrome size={20} className="mr-3" />
              <span className={isDark ? 'text-white' : 'text-gray-900'}>
                Continue with Google
              </span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className={`absolute inset-0 flex items-center`}>
              <div className={`w-full border-t ${isDark ? 'border-gray-600' : 'border-gray-300'}`} />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className={`px-2 ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-500'}`}>
                Or continue with email
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Full Name
                </label>
                <div className="relative">
                  <User size={16} className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className={`w-full pl-10 pr-3 py-3 border ${
                      errors.fullName 
                        ? 'border-red-500' 
                        : isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white'
                    } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    placeholder="Enter your full name"
                  />
                </div>
                {errors.fullName && (
                  <p className="mt-1 text-sm text-red-500">{errors.fullName}</p>
                )}
              </div>
            )}

            <div>
              <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                Email Address
              </label>
              <div className="relative">
                <Mail size={16} className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full pl-10 pr-3 py-3 border ${
                    errors.email 
                      ? 'border-red-500' 
                      : isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white'
                  } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="Enter your email"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            <div>
              <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                Password
              </label>
              <div className="relative">
                <Lock size={16} className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`w-full pl-10 pr-10 py-3 border ${
                    errors.password 
                      ? 'border-red-500' 
                      : isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white'
                  } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${isDark ? 'text-gray-500 hover:text-gray-400' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password}</p>
              )}
            </div>

            {isSignUp && (
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock size={16} className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className={`w-full pl-10 pr-3 py-3 border ${
                      errors.confirmPassword 
                        ? 'border-red-500' 
                        : isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white'
                    } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    placeholder="Confirm your password"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>
                )}
              </div>
            )}

            {errors.general && (
              <div className={`p-3 rounded-lg ${isDark ? 'bg-red-900/20 border border-red-800/50' : 'bg-red-50 border border-red-200'}`}>
                <p className={`text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>{errors.general}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  {isSignUp ? 'Creating Account...' : 'Signing In...'}
                </div>
              ) : (
                isSignUp ? 'Create Account' : 'Sign In'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                onClick={toggleMode}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </div>

          {!isSignUp && (
            <div className="mt-4 text-center">
              <button className="text-sm text-blue-600 hover:text-blue-700">
                Forgot your password?
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};