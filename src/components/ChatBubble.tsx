import React, { useEffect, useState, useCallback, useRef, memo } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface ChatBubbleProps {
  onClick: () => void;
  isAiChatOpen: boolean;
  className?: string;
}

interface ThemeStyles {
  background: string;
  hoverBackground: string;
  shadow: string;
  hoverShadow: string;
  iconColor: string;
  focusRing: string;
}

interface ResponsiveState {
  isMobile: boolean;
  isVisible: boolean;
}

const ChatBubbleComponent: React.FC<ChatBubbleProps> = ({ 
  onClick, 
  isAiChatOpen, 
  className 
}) => {
  const { isDark } = useTheme();
  const [responsiveState, setResponsiveState] = useState<ResponsiveState>({
    isMobile: false,
    isVisible: true
  });
  const lastClickTime = useRef<number>(0);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced click handler to prevent rapid successive clicks
  const handleClick = useCallback(() => {
    const now = Date.now();
    const timeSinceLastClick = now - lastClickTime.current;
    
    // Prevent clicks that are too rapid (less than 300ms apart)
    if (timeSinceLastClick < 300) {
      return;
    }
    
    lastClickTime.current = now;
    
    // Clear any existing timeout
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }
    
    // Debounce the actual click handler
    clickTimeoutRef.current = setTimeout(() => {
      try {
        onClick();
      } catch (error) {
        console.warn('ChatBubble: Error in onClick handler:', error);
      }
    }, 50);
  }, [onClick]);

  // Optimized responsive positioning logic with debounced resize handling
  useEffect(() => {
    const checkScreenSize = () => {
      try {
        const width = window.innerWidth;
        const newState: ResponsiveState = {
          isMobile: width < 768,
          isVisible: width >= 480
        };
        
        setResponsiveState(prevState => {
          // Only update if state actually changed to prevent unnecessary re-renders
          if (prevState.isMobile !== newState.isMobile || prevState.isVisible !== newState.isVisible) {
            return newState;
          }
          return prevState;
        });
      } catch (error) {
        console.warn('ChatBubble: Error checking screen size:', error);
        // Fallback to desktop view
        setResponsiveState({ isMobile: false, isVisible: true });
      }
    };

    const debouncedResize = () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      resizeTimeoutRef.current = setTimeout(checkScreenSize, 100);
    };

    checkScreenSize();
    window.addEventListener('resize', debouncedResize, { passive: true });
    
    return () => {
      window.removeEventListener('resize', debouncedResize);
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, []);

  // Memoized theme-aware color schemes with active states
  const themeStyles: Record<'dark' | 'light', ThemeStyles> = React.useMemo(() => ({
    dark: {
      background: isAiChatOpen 
        ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
        : 'linear-gradient(135deg, #4b5563 0%, #374151 100%)',
      hoverBackground: isAiChatOpen
        ? 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)'
        : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
      shadow: isAiChatOpen
        ? '0 10px 25px rgba(59, 130, 246, 0.4)'
        : '0 10px 25px rgba(0, 0, 0, 0.3)',
      hoverShadow: isAiChatOpen
        ? '0 15px 35px rgba(59, 130, 246, 0.5)'
        : '0 15px 35px rgba(0, 0, 0, 0.4)',
      iconColor: '#ffffff',
      focusRing: isAiChatOpen ? '#3b82f6' : '#6b7280'
    },
    light: {
      background: isAiChatOpen
        ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
        : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
      hoverBackground: isAiChatOpen
        ? 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)'
        : 'linear-gradient(135deg, #374151 0%, #1f2937 100%)',
      shadow: isAiChatOpen
        ? '0 10px 25px rgba(59, 130, 246, 0.3)'
        : '0 10px 25px rgba(0, 0, 0, 0.15)',
      hoverShadow: isAiChatOpen
        ? '0 15px 35px rgba(59, 130, 246, 0.4)'
        : '0 15px 35px rgba(0, 0, 0, 0.25)',
      iconColor: '#ffffff',
      focusRing: isAiChatOpen ? '#3b82f6' : '#4b5563'
    }
  }), [isAiChatOpen]);

  const currentTheme: ThemeStyles = React.useMemo(() => 
    isDark ? themeStyles.dark : themeStyles.light, 
    [isDark, themeStyles]
  );

  // Handle keyboard navigation with error handling
  const handleKeyDown = (event: React.KeyboardEvent) => {
    try {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleClick();
      }
    } catch (error) {
      console.warn('ChatBubble: Error in keyboard handler:', error);
    }
  };

  // Memoized responsive positioning classes and icon size
  const { positionClasses, iconSize, minSize } = React.useMemo(() => {
    const isMobile = responsiveState.isMobile;
    return {
      positionClasses: isMobile 
        ? 'fixed bottom-4 right-4 w-12 h-12' 
        : 'fixed bottom-6 right-6 w-14 h-14',
      iconSize: isMobile ? 20 : 24,
      minSize: isMobile ? '48px' : '56px'
    };
  }, [responsiveState.isMobile]);

  // Don't render if not visible (very small screens)
  if (!responsiveState.isVisible) {
    return null;
  }

  return (
    <motion.button
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`
        ${positionClasses}
        rounded-full 
        flex items-center justify-center
        z-50
        focus:outline-none focus:ring-2 focus:ring-offset-2
        focus:ring-opacity-50
        ${isDark ? 'focus:ring-gray-400' : 'focus:ring-gray-600'}
        ${className || ''}
      `}
      style={{
        background: currentTheme.background,
        boxShadow: currentTheme.shadow,
        minWidth: minSize, // Ensure minimum touch target
        minHeight: minSize
      }}
      whileHover={{
        scale: 1.05,
        background: currentTheme.hoverBackground,
        boxShadow: currentTheme.hoverShadow,
        transition: { duration: 0.2, ease: "easeOut" }
      }}
      whileTap={{
        scale: 0.95,
        transition: { duration: 0.1, ease: "easeInOut" }
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ 
        scale: 1, 
        opacity: 1,
        background: currentTheme.background,
        boxShadow: currentTheme.shadow
      }}
      transition={{ 
        type: "spring", 
        stiffness: 260, 
        damping: 20,
        delay: 0.1,
        background: { duration: 0.3, ease: "easeInOut" },
        boxShadow: { duration: 0.3, ease: "easeInOut" }
      }}
      aria-label={isAiChatOpen ? "Close AI Chat" : "Open AI Chat"}
      aria-expanded={isAiChatOpen}
      aria-haspopup="dialog"
      title={isAiChatOpen ? "Close AI Chat" : "Ask AI anything about your project"}
      role="button"
      tabIndex={0}
    >
      <motion.div
        whileHover={{ 
          rotate: 15,
          transition: { duration: 0.2, ease: "easeOut" }
        }}
        whileTap={{ 
          rotate: -5,
          transition: { duration: 0.1, ease: "easeInOut" }
        }}
        animate={{
          rotate: isAiChatOpen ? [0, 5, -5, 0] : 0,
          scale: isAiChatOpen ? [1, 1.1, 1] : 1
        }}
        transition={{
          rotate: isAiChatOpen ? { 
            duration: 0.6, 
            ease: "easeInOut",
            repeat: Infinity,
            repeatDelay: 2
          } : { duration: 0.3 },
          scale: isAiChatOpen ? { 
            duration: 0.6, 
            ease: "easeInOut",
            repeat: Infinity,
            repeatDelay: 2
          } : { duration: 0.3 }
        }}
        aria-hidden="true" // Hide decorative icon from screen readers
      >
        <MessageCircle 
          size={iconSize} 
          color={currentTheme.iconColor}
        />
      </motion.div>
    </motion.button>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const ChatBubble = memo(ChatBubbleComponent, (prevProps, nextProps) => {
  // Custom comparison function for optimal re-rendering
  return (
    prevProps.isAiChatOpen === nextProps.isAiChatOpen &&
    prevProps.className === nextProps.className &&
    prevProps.onClick === nextProps.onClick
  );
});