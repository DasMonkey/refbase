import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatBubble } from '../ChatBubble';
import { ThemeProvider } from '../../contexts/ThemeContext';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    button: ({ children, onClick, onKeyDown, ...props }: any) => (
      <button onClick={onClick} onKeyDown={onKeyDown} {...props}>
        {children}
      </button>
    ),
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

// Mock window.innerWidth for responsive tests
const mockInnerWidth = (width: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  window.dispatchEvent(new Event('resize'));
};

const renderWithTheme = (component: React.ReactElement, isDark = true) => {
  // Mock the theme context
  const MockThemeProvider = ({ children }: { children: React.ReactNode }) => (
    <div data-testid="theme-provider">{children}</div>
  );
  
  // Mock useTheme hook
  jest.doMock('../../contexts/ThemeContext', () => ({
    useTheme: () => ({ isDark }),
    ThemeProvider: MockThemeProvider,
  }));

  return render(
    <MockThemeProvider>
      {component}
    </MockThemeProvider>
  );
};

describe('ChatBubble Component', () => {
  const mockOnClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockInnerWidth(1024); // Default to desktop
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('renders correctly with default props', () => {
      renderWithTheme(
        <ChatBubble onClick={mockOnClick} isAiChatOpen={false} />
      );
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-label', 'Open AI Chat');
    });

    it('renders with custom className', () => {
      renderWithTheme(
        <ChatBubble 
          onClick={mockOnClick} 
          isAiChatOpen={false} 
          className="custom-class" 
        />
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('updates aria-label when chat is open', () => {
      renderWithTheme(
        <ChatBubble onClick={mockOnClick} isAiChatOpen={true} />
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Close AI Chat');
      expect(button).toHaveAttribute('aria-expanded', 'true');
    });

    it('has proper accessibility attributes', () => {
      renderWithTheme(
        <ChatBubble onClick={mockOnClick} isAiChatOpen={false} />
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('role', 'button');
      expect(button).toHaveAttribute('tabIndex', '0');
      expect(button).toHaveAttribute('aria-haspopup', 'dialog');
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('Click Handling', () => {
    it('calls onClick when button is clicked', async () => {
      const user = userEvent.setup();
      renderWithTheme(
        <ChatBubble onClick={mockOnClick} isAiChatOpen={false} />
      );
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('prevents rapid successive clicks', async () => {
      const user = userEvent.setup();
      renderWithTheme(
        <ChatBubble onClick={mockOnClick} isAiChatOpen={false} />
      );
      
      const button = screen.getByRole('button');
      
      // Rapid clicks
      await user.click(button);
      await user.click(button);
      await user.click(button);
      
      // Should only register one click due to debouncing
      await waitFor(() => {
        expect(mockOnClick).toHaveBeenCalledTimes(1);
      });
    });

    it('handles onClick errors gracefully', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const errorOnClick = jest.fn(() => {
        throw new Error('Test error');
      });
      
      const user = userEvent.setup();
      renderWithTheme(
        <ChatBubble onClick={errorOnClick} isAiChatOpen={false} />
      );
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      await waitFor(() => {
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          'ChatBubble: Error in onClick handler:',
          expect.any(Error)
        );
      });
      
      consoleWarnSpy.mockRestore();
    });
  });

  describe('Keyboard Navigation', () => {
    it('responds to Enter key', async () => {
      const user = userEvent.setup();
      renderWithTheme(
        <ChatBubble onClick={mockOnClick} isAiChatOpen={false} />
      );
      
      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard('{Enter}');
      
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('responds to Space key', async () => {
      const user = userEvent.setup();
      renderWithTheme(
        <ChatBubble onClick={mockOnClick} isAiChatOpen={false} />
      );
      
      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard(' ');
      
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('ignores other keys', async () => {
      const user = userEvent.setup();
      renderWithTheme(
        <ChatBubble onClick={mockOnClick} isAiChatOpen={false} />
      );
      
      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard('{Escape}');
      await user.keyboard('a');
      
      expect(mockOnClick).not.toHaveBeenCalled();
    });
  });

  describe('Responsive Behavior', () => {
    it('adapts to mobile screen size', () => {
      mockInnerWidth(600); // Mobile width
      
      renderWithTheme(
        <ChatBubble onClick={mockOnClick} isAiChatOpen={false} />
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-12', 'h-12', 'bottom-4', 'right-4');
    });

    it('uses desktop size for larger screens', () => {
      mockInnerWidth(1024); // Desktop width
      
      renderWithTheme(
        <ChatBubble onClick={mockOnClick} isAiChatOpen={false} />
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-14', 'h-14', 'bottom-6', 'right-6');
    });

    it('hides on very small screens', () => {
      mockInnerWidth(400); // Very small width
      
      const { container } = renderWithTheme(
        <ChatBubble onClick={mockOnClick} isAiChatOpen={false} />
      );
      
      expect(container.firstChild).toBeNull();
    });

    it('handles resize events', () => {
      renderWithTheme(
        <ChatBubble onClick={mockOnClick} isAiChatOpen={false} />
      );
      
      // Start with desktop
      expect(screen.getByRole('button')).toHaveClass('w-14', 'h-14');
      
      // Resize to mobile
      mockInnerWidth(600);
      
      // Should update to mobile classes
      expect(screen.getByRole('button')).toHaveClass('w-12', 'h-12');
    });
  });

  describe('Theme Integration', () => {
    it('applies dark theme styles', () => {
      renderWithTheme(
        <ChatBubble onClick={mockOnClick} isAiChatOpen={false} />,
        true // isDark = true
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus:ring-gray-400');
    });

    it('applies light theme styles', () => {
      renderWithTheme(
        <ChatBubble onClick={mockOnClick} isAiChatOpen={false} />,
        false // isDark = false
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus:ring-gray-600');
    });
  });

  describe('Active State', () => {
    it('shows different title when chat is open', () => {
      renderWithTheme(
        <ChatBubble onClick={mockOnClick} isAiChatOpen={true} />
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('title', 'Close AI Chat');
    });

    it('shows default title when chat is closed', () => {
      renderWithTheme(
        <ChatBubble onClick={mockOnClick} isAiChatOpen={false} />
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('title', 'Ask AI anything about your project');
    });
  });

  describe('Error Handling', () => {
    it('handles screen size check errors gracefully', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // Mock window.innerWidth to throw an error
      Object.defineProperty(window, 'innerWidth', {
        get: () => {
          throw new Error('Test error');
        }
      });
      
      renderWithTheme(
        <ChatBubble onClick={mockOnClick} isAiChatOpen={false} />
      );
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'ChatBubble: Error checking screen size:',
        expect.any(Error)
      );
      
      // Should still render with fallback values
      expect(screen.getByRole('button')).toBeInTheDocument();
      
      consoleWarnSpy.mockRestore();
    });

    it('handles keyboard event errors gracefully', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      renderWithTheme(
        <ChatBubble onClick={mockOnClick} isAiChatOpen={false} />
      );
      
      const button = screen.getByRole('button');
      
      // Mock preventDefault to throw an error
      const mockEvent = {
        key: 'Enter',
        preventDefault: jest.fn(() => {
          throw new Error('Test error');
        })
      };
      
      fireEvent.keyDown(button, mockEvent);
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'ChatBubble: Error in keyboard handler:',
        expect.any(Error)
      );
      
      consoleWarnSpy.mockRestore();
    });
  });
});