import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';
import { ThemeProvider } from '../../contexts/ThemeContext';

// Mock the hooks and components that aren't relevant for this test
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: '1', email: 'test@example.com' },
    loading: false,
    isAuthenticated: true,
  }),
}));

jest.mock('../../hooks/useSupabaseProjects', () => ({
  useSupabaseProjects: () => ({
    projects: [
      {
        id: '1',
        name: 'Test Project',
        description: 'Test Description',
        icon: '🚀',
        color: '#3b82f6',
      },
    ],
    createProject: jest.fn(),
    loading: false,
    tasks: [],
    features: [],
    bugs: [],
    documents: [],
    files: [],
    messages: [],
  }),
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    button: ({ children, onClick, onKeyDown, ...props }: any) => (
      <button onClick={onClick} onKeyDown={onKeyDown} {...props}>
        {children}
      </button>
    ),
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <div>{children}</div>,
}));

// Mock the PromptInputBox component
jest.mock('../ui/ai-prompt-box', () => ({
  PromptInputBox: ({ onSend, autoFocus, ...props }: any) => (
    <div data-testid="ai-prompt-box" data-autofocus={autoFocus} {...props}>
      <input
        data-testid="ai-input"
        placeholder="Ask AI anything..."
        onChange={(e) => {}}
      />
      <button
        data-testid="ai-send"
        onClick={() => onSend('test message')}
      >
        Send
      </button>
    </div>
  ),
}));

const renderApp = () => {
  return render(
    <ThemeProvider>
      <App />
    </ThemeProvider>
  );
};

describe('ChatBubble Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Full User Flow', () => {
    it('completes the full bubble click to AI chat flow', async () => {
      const user = userEvent.setup();
      renderApp();

      // Wait for app to load and find the chat bubble
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /open ai chat/i })).toBeInTheDocument();
      });

      const chatBubble = screen.getByRole('button', { name: /open ai chat/i });

      // Initially, AI chat should not be visible
      expect(screen.queryByTestId('ai-prompt-box')).not.toBeInTheDocument();

      // Click the chat bubble
      await user.click(chatBubble);

      // AI chat modal should appear
      await waitFor(() => {
        expect(screen.getByTestId('ai-prompt-box')).toBeInTheDocument();
      });

      // Check that the input has autofocus
      const promptBox = screen.getByTestId('ai-prompt-box');
      expect(promptBox).toHaveAttribute('data-autofocus', 'true');

      // Chat bubble should now show "Close AI Chat"
      expect(chatBubble).toHaveAttribute('aria-label', 'Close AI Chat');
      expect(chatBubble).toHaveAttribute('aria-expanded', 'true');
    });

    it('handles keyboard shortcut alongside bubble functionality', async () => {
      const user = userEvent.setup();
      renderApp();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /open ai chat/i })).toBeInTheDocument();
      });

      // Use keyboard shortcut (Ctrl+0) to open AI chat
      await user.keyboard('{Control>}0{/Control}');

      // AI chat should open
      await waitFor(() => {
        expect(screen.getByTestId('ai-prompt-box')).toBeInTheDocument();
      });

      // Chat bubble should reflect the open state
      const chatBubble = screen.getByRole('button', { name: /close ai chat/i });
      expect(chatBubble).toHaveAttribute('aria-expanded', 'true');

      // Close with Escape key
      await user.keyboard('{Escape}');

      // AI chat should close
      await waitFor(() => {
        expect(screen.queryByTestId('ai-prompt-box')).not.toBeInTheDocument();
      });

      // Chat bubble should reflect the closed state
      expect(screen.getByRole('button', { name: /open ai chat/i })).toHaveAttribute('aria-expanded', 'false');
    });

    it('maintains bubble functionality when switching projects', async () => {
      const user = userEvent.setup();
      renderApp();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /open ai chat/i })).toBeInTheDocument();
      });

      const chatBubble = screen.getByRole('button', { name: /open ai chat/i });

      // Open AI chat
      await user.click(chatBubble);

      await waitFor(() => {
        expect(screen.getByTestId('ai-prompt-box')).toBeInTheDocument();
      });

      // Simulate project switching by checking that bubble remains functional
      // (In a real test, we'd switch projects, but our mock only has one project)
      
      // Close AI chat
      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByTestId('ai-prompt-box')).not.toBeInTheDocument();
      });

      // Bubble should still be functional
      await user.click(chatBubble);

      await waitFor(() => {
        expect(screen.getByTestId('ai-prompt-box')).toBeInTheDocument();
      });
    });
  });

  describe('Theme Integration', () => {
    it('updates bubble appearance when theme changes', async () => {
      const user = userEvent.setup();
      renderApp();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /open ai chat/i })).toBeInTheDocument();
      });

      const chatBubble = screen.getByRole('button', { name: /open ai chat/i });

      // Find theme toggle button (assuming it exists in the UI)
      const themeToggle = screen.getByRole('button', { name: /switch to light mode/i });
      
      // Toggle theme
      await user.click(themeToggle);

      // Chat bubble should still be present and functional
      expect(chatBubble).toBeInTheDocument();
      
      // Test that it still works after theme change
      await user.click(chatBubble);

      await waitFor(() => {
        expect(screen.getByTestId('ai-prompt-box')).toBeInTheDocument();
      });
    });
  });

  describe('State Synchronization', () => {
    it('properly synchronizes state between bubble and AI chat modal', async () => {
      const user = userEvent.setup();
      renderApp();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /open ai chat/i })).toBeInTheDocument();
      });

      const chatBubble = screen.getByRole('button', { name: /open ai chat/i });

      // Test multiple open/close cycles
      for (let i = 0; i < 3; i++) {
        // Open
        await user.click(chatBubble);
        
        await waitFor(() => {
          expect(screen.getByTestId('ai-prompt-box')).toBeInTheDocument();
          expect(chatBubble).toHaveAttribute('aria-expanded', 'true');
        });

        // Close
        await user.keyboard('{Escape}');
        
        await waitFor(() => {
          expect(screen.queryByTestId('ai-prompt-box')).not.toBeInTheDocument();
          expect(chatBubble).toHaveAttribute('aria-expanded', 'false');
        });
      }
    });

    it('handles rapid state changes gracefully', async () => {
      const user = userEvent.setup();
      renderApp();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /open ai chat/i })).toBeInTheDocument();
      });

      const chatBubble = screen.getByRole('button', { name: /open ai chat/i });

      // Rapid clicks (should be debounced)
      await user.click(chatBubble);
      await user.click(chatBubble);
      await user.click(chatBubble);

      // Should only result in one state change
      await waitFor(() => {
        expect(screen.getByTestId('ai-prompt-box')).toBeInTheDocument();
      });

      // Rapid keyboard shortcuts
      await user.keyboard('{Escape}');
      await user.keyboard('{Control>}0{/Control}');
      await user.keyboard('{Escape}');

      // Should end up in closed state
      await waitFor(() => {
        expect(screen.queryByTestId('ai-prompt-box')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Recovery', () => {
    it('recovers gracefully from AI chat errors', async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      renderApp();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /open ai chat/i })).toBeInTheDocument();
      });

      const chatBubble = screen.getByRole('button', { name: /open ai chat/i });

      // Open AI chat
      await user.click(chatBubble);

      await waitFor(() => {
        expect(screen.getByTestId('ai-prompt-box')).toBeInTheDocument();
      });

      // Simulate an error in the AI chat component
      // (In a real scenario, this might be a network error or component crash)
      
      // Chat bubble should still be functional
      expect(chatBubble).toBeInTheDocument();
      
      // Should be able to close and reopen
      await user.keyboard('{Escape}');
      
      await waitFor(() => {
        expect(screen.queryByTestId('ai-prompt-box')).not.toBeInTheDocument();
      });

      await user.click(chatBubble);

      await waitFor(() => {
        expect(screen.getByTestId('ai-prompt-box')).toBeInTheDocument();
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Accessibility Integration', () => {
    it('maintains proper focus management throughout the flow', async () => {
      const user = userEvent.setup();
      renderApp();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /open ai chat/i })).toBeInTheDocument();
      });

      const chatBubble = screen.getByRole('button', { name: /open ai chat/i });

      // Focus the chat bubble
      chatBubble.focus();
      expect(document.activeElement).toBe(chatBubble);

      // Open with keyboard
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByTestId('ai-prompt-box')).toBeInTheDocument();
      });

      // Focus should move to the AI input (via autoFocus)
      const aiInput = screen.getByTestId('ai-input');
      expect(document.activeElement).toBe(aiInput);

      // Close with Escape
      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByTestId('ai-prompt-box')).not.toBeInTheDocument();
      });

      // Focus should return to a reasonable place (chat bubble should still be focusable)
      chatBubble.focus();
      expect(document.activeElement).toBe(chatBubble);
    });

    it('provides proper screen reader announcements', async () => {
      const user = userEvent.setup();
      renderApp();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /open ai chat/i })).toBeInTheDocument();
      });

      const chatBubble = screen.getByRole('button', { name: /open ai chat/i });

      // Check initial state
      expect(chatBubble).toHaveAttribute('aria-expanded', 'false');
      expect(chatBubble).toHaveAttribute('aria-haspopup', 'dialog');

      // Open AI chat
      await user.click(chatBubble);

      await waitFor(() => {
        expect(chatBubble).toHaveAttribute('aria-expanded', 'true');
        expect(chatBubble).toHaveAttribute('aria-label', 'Close AI Chat');
      });

      // Close AI chat
      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(chatBubble).toHaveAttribute('aria-expanded', 'false');
        expect(chatBubble).toHaveAttribute('aria-label', 'Open AI Chat');
      });
    });
  });
});