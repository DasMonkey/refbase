import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { ResizeResult, formatDuration, getResizeFeedback } from '../lib/resizeUtils';
import { format } from 'date-fns';

interface ResizeFeedbackProps {
  isVisible: boolean;
  resizeResult: ResizeResult | null;
  position: { x: number; y: number };
  resizeType: 'start' | 'end';
}

export const ResizeFeedback: React.FC<ResizeFeedbackProps> = ({
  isVisible,
  resizeResult,
  position,
  resizeType
}) => {
  const { isDark } = useTheme();

  if (!isVisible || !resizeResult) return null;

  const feedback = getResizeFeedback(resizeResult, isDark);
  const Icon = resizeResult.isValid ? CheckCircle : AlertTriangle;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 10 }}
        className="fixed z-50 pointer-events-none"
        style={{
          left: `${position.x + 10}px`,
          top: `${position.y - 10}px`
        }}
      >
        <div
          className="px-3 py-2 rounded-lg shadow-lg border backdrop-blur-sm"
          style={{
            backgroundColor: isDark ? 'rgba(17, 17, 17, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            borderColor: feedback.borderColor,
            color: isDark ? '#ffffff' : '#000000'
          }}
        >
          {/* Header */}
          <div className="flex items-center space-x-2 mb-1">
            <Icon size={14} style={{ color: feedback.borderColor }} />
            <span className="text-xs font-medium">
              {resizeType === 'start' ? 'Adjust Start Date' : 'Adjust End Date'}
            </span>
          </div>

          {/* Date Information */}
          <div className="space-y-1 text-xs">
            <div className="flex items-center space-x-2">
              <Calendar size={12} className="opacity-60" />
              <span>
                {resizeType === 'start' 
                  ? format(resizeResult.newStartDate, 'MMM d, yyyy')
                  : format(resizeResult.newEndDate, 'MMM d, yyyy')
                }
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Clock size={12} className="opacity-60" />
              <span style={{ color: feedback.textColor }}>
                {formatDuration(resizeResult.duration)}
              </span>
            </div>
          </div>

          {/* Error Messages */}
          {!resizeResult.isValid && resizeResult.errors.length > 0 && (
            <div className="mt-2 pt-2 border-t border-opacity-20" style={{ borderColor: feedback.borderColor }}>
              {resizeResult.errors.map((error, index) => (
                <div key={index} className="text-xs" style={{ color: feedback.textColor }}>
                  {error}
                </div>
              ))}
            </div>
          )}

          {/* Success Message */}
          {resizeResult.isValid && (
            <div className="mt-1 text-xs" style={{ color: feedback.textColor }}>
              ✓ Valid resize operation
            </div>
          )}
        </div>

        {/* Arrow pointing to tracker */}
        <div
          className="absolute w-2 h-2 transform rotate-45"
          style={{
            backgroundColor: feedback.borderColor,
            left: '-4px',
            top: '50%',
            marginTop: '-4px'
          }}
        />
      </motion.div>
    </AnimatePresence>
  );
};

interface ResizePreviewOverlayProps {
  isVisible: boolean;
  previewDates: { start: Date; end: Date } | null;
  originalDates: { start: Date; end: Date };
  viewportStartDate: Date;
  pixelsPerDay: number;
  laneIndex: number;
  laneHeight: number;
  isValid: boolean;
}

export const ResizePreviewOverlay: React.FC<ResizePreviewOverlayProps> = ({
  isVisible,
  previewDates,
  originalDates,
  viewportStartDate,
  pixelsPerDay,
  laneIndex,
  laneHeight,
  isValid
}) => {
  const { isDark } = useTheme();

  if (!isVisible || !previewDates) return null;

  // Calculate positions
  const originalLeft = Math.floor((originalDates.start.getTime() - viewportStartDate.getTime()) / (1000 * 60 * 60 * 24)) * pixelsPerDay;
  const originalWidth = Math.ceil((originalDates.end.getTime() - originalDates.start.getTime()) / (1000 * 60 * 60 * 24)) * pixelsPerDay;
  
  const previewLeft = Math.floor((previewDates.start.getTime() - viewportStartDate.getTime()) / (1000 * 60 * 60 * 24)) * pixelsPerDay;
  const previewWidth = Math.ceil((previewDates.end.getTime() - previewDates.start.getTime()) / (1000 * 60 * 60 * 24)) * pixelsPerDay;
  
  const top = laneIndex * (laneHeight + 4) + 4;

  return (
    <div className="absolute pointer-events-none z-40">
      {/* Original tracker ghost */}
      <motion.div
        className="absolute border-2 border-dashed rounded-lg opacity-30"
        style={{
          left: `${originalLeft}px`,
          top: `${top}px`,
          width: `${originalWidth}px`,
          height: `${laneHeight - 8}px`,
          borderColor: isDark ? '#6B7280' : '#9CA3AF'
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
      />

      {/* Preview tracker */}
      <motion.div
        className="absolute border-2 rounded-lg"
        style={{
          left: `${previewLeft}px`,
          top: `${top}px`,
          width: `${previewWidth}px`,
          height: `${laneHeight - 8}px`,
          borderColor: isValid ? '#10B981' : '#EF4444',
          backgroundColor: isValid 
            ? (isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)')
            : (isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)')
        }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {/* Resize indicator */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div 
            className="text-xs font-bold"
            style={{ color: isValid ? '#10B981' : '#EF4444' }}
          >
            {isValid ? '↔' : '✗'}
          </div>
        </div>
      </motion.div>
    </div>
  );
};