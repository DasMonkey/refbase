/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TaskCard } from '../components/TasksTab';
import { Task } from '../types';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

// Mock react-icons
jest.mock('react-icons/fi', () => ({
  FiEdit2: () => <span data-testid="edit-icon">Edit</span>,
  FiCheck: () => <span data-testid="check-icon">Check</span>,
  FiX: () => <span data-testid="x-icon">X</span>,
}));

const mockTask: Task = {
  id: 'test-task-1',
  projectId: 'test-project',
  title: 'Test Task Title',
  description: 'Test description',
  status: 'todo',
  priority: 'medium',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockHandleDragStart = jest.fn();
const mockOnUpdateTask = jest.fn();

const defaultProps = {
  ...mockTask,
  handleDragStart: mockHandleDragStart,
  onUpdateTask: mockOnUpdateTask,
};

describe('TaskCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders task title correctly', () => {
    render(<TaskCard {...defaultProps} />);
    expect(screen.getByText('Test Task Title')).toBeInTheDocument();
  });

  it('shows edit button on hover', () => {
    render(<TaskCard {...defaultProps} />);
    const editButton = screen.getByLabelText(/edit task/i);
    expect(editButton).toBeInTheDocument();
  });

  it('enters edit mode when edit button is clicked', () => {
    render(<TaskCard {...defaultProps} />);
    const editButton = screen.getByLabelText(/edit task/i);
    
    fireEvent.click(editButton);
    
    expect(screen.getByDisplayValue('Test Task Title')).toBeInTheDocument();
    expect(screen.getByTestId('check-icon')).toBeInTheDocument();
    expect(screen.getByTestId('x-icon')).toBeInTheDocument();
  });

  it('saves changes when save button is clicked', async () => {
    render(<TaskCard {...defaultProps} />);
    const editButton = screen.getByLabelText(/edit task/i);
    
    fireEvent.click(editButton);
    
    const textarea = screen.getByDisplayValue('Test Task Title');
    fireEvent.change(textarea, { target: { value: 'Updated Task Title' } });
    
    const saveButton = screen.getByLabelText(/save changes/i);
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(mockOnUpdateTask).toHaveBeenCalledWith('test-task-1', 'Updated Task Title');
    });
  });

  it('cancels editing when cancel button is clicked', () => {
    render(<TaskCard {...defaultProps} />);
    const editButton = screen.getByLabelText(/edit task/i);
    
    fireEvent.click(editButton);
    
    const textarea = screen.getByDisplayValue('Test Task Title');
    fireEvent.change(textarea, { target: { value: 'Updated Task Title' } });
    
    const cancelButton = screen.getByLabelText(/cancel editing/i);
    fireEvent.click(cancelButton);
    
    expect(screen.getByText('Test Task Title')).toBeInTheDocument();
    expect(mockOnUpdateTask).not.toHaveBeenCalled();
  });

  it('saves changes when Ctrl+Enter is pressed', async () => {
    render(<TaskCard {...defaultProps} />);
    const editButton = screen.getByLabelText(/edit task/i);
    
    fireEvent.click(editButton);
    
    const textarea = screen.getByDisplayValue('Test Task Title');
    fireEvent.change(textarea, { target: { value: 'Updated Task Title' } });
    
    fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true });
    
    await waitFor(() => {
      expect(mockOnUpdateTask).toHaveBeenCalledWith('test-task-1', 'Updated Task Title');
    });
  });

  it('cancels editing when Escape is pressed', () => {
    render(<TaskCard {...defaultProps} />);
    const editButton = screen.getByLabelText(/edit task/i);
    
    fireEvent.click(editButton);
    
    const textarea = screen.getByDisplayValue('Test Task Title');
    fireEvent.change(textarea, { target: { value: 'Updated Task Title' } });
    
    fireEvent.keyDown(textarea, { key: 'Escape' });
    
    expect(screen.getByText('Test Task Title')).toBeInTheDocument();
    expect(mockOnUpdateTask).not.toHaveBeenCalled();
  });

  it('does not save empty text', () => {
    render(<TaskCard {...defaultProps} />);
    const editButton = screen.getByLabelText(/edit task/i);
    
    fireEvent.click(editButton);
    
    const textarea = screen.getByDisplayValue('Test Task Title');
    fireEvent.change(textarea, { target: { value: '   ' } }); // Only whitespace
    
    const saveButton = screen.getByLabelText(/save changes/i);
    fireEvent.click(saveButton);
    
    expect(mockOnUpdateTask).not.toHaveBeenCalled();
  });

  it('does not save when text is unchanged', () => {
    render(<TaskCard {...defaultProps} />);
    const editButton = screen.getByLabelText(/edit task/i);
    
    fireEvent.click(editButton);
    
    const saveButton = screen.getByLabelText(/save changes/i);
    fireEvent.click(saveButton);
    
    expect(mockOnUpdateTask).not.toHaveBeenCalled();
  });

  it('prevents drag when in edit mode', () => {
    render(<TaskCard {...defaultProps} />);
    const editButton = screen.getByLabelText(/edit task/i);
    
    fireEvent.click(editButton);
    
    const card = screen.getByText('Test Task Title').closest('div');
    const dragEvent = new Event('dragstart', { bubbles: true });
    Object.defineProperty(dragEvent, 'preventDefault', {
      value: jest.fn(),
    });
    
    fireEvent(card!, dragEvent);
    
    expect(mockHandleDragStart).not.toHaveBeenCalled();
  });

  it('handles multi-line text correctly', () => {
    const multiLineTask = {
      ...mockTask,
      title: 'Line 1\nLine 2\nLine 3',
    };
    
    render(<TaskCard {...multiLineTask} handleDragStart={mockHandleDragStart} onUpdateTask={mockOnUpdateTask} />);
    
    expect(screen.getByText('Line 1\nLine 2\nLine 3')).toBeInTheDocument();
  });

  it('auto-resizes textarea in edit mode', () => {
    render(<TaskCard {...defaultProps} />);
    const editButton = screen.getByLabelText(/edit task/i);
    
    fireEvent.click(editButton);
    
    const textarea = screen.getByDisplayValue('Test Task Title') as HTMLTextAreaElement;
    
    // Mock scrollHeight
    Object.defineProperty(textarea, 'scrollHeight', {
      value: 100,
      writable: true,
    });
    
    fireEvent.change(textarea, { target: { value: 'Very long text that should cause the textarea to resize automatically' } });
    
    expect(textarea.style.height).toBe('100px');
  });

  it('supports keyboard navigation for edit button', () => {
    render(<TaskCard {...defaultProps} />);
    const editButton = screen.getByLabelText(/edit task/i);
    
    fireEvent.keyDown(editButton, { key: 'Enter' });
    
    expect(screen.getByDisplayValue('Test Task Title')).toBeInTheDocument();
  });

  it('supports keyboard navigation for save and cancel buttons', async () => {
    render(<TaskCard {...defaultProps} />);
    const editButton = screen.getByLabelText(/edit task/i);
    
    fireEvent.click(editButton);
    
    const textarea = screen.getByDisplayValue('Test Task Title');
    fireEvent.change(textarea, { target: { value: 'Updated Task Title' } });
    
    const saveButton = screen.getByLabelText(/save changes/i);
    fireEvent.keyDown(saveButton, { key: 'Enter' });
    
    await waitFor(() => {
      expect(mockOnUpdateTask).toHaveBeenCalledWith('test-task-1', 'Updated Task Title');
    });
  });
});