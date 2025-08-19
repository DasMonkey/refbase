import React, { useState, useRef, useEffect, DragEvent, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, CheckSquare, Clock, User, Calendar, Flag, MoreVertical, Kanban, List, X, Edit3, Trash2, Save } from 'lucide-react';
import { FiPlus, FiTrash } from 'react-icons/fi';
import { FaFire } from 'react-icons/fa';
import { Project, Task } from '../types';
import { useSupabaseProjects } from '../hooks/useSupabaseProjects';
import { useTheme } from '../contexts/ThemeContext';

// Utility function for className concatenation
const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(" ");

interface TasksTabProps {
  project: Project;
}

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800',
  top: 'bg-purple-100 text-purple-800',
};

const statusColumns = [
  { 
    id: 'todo', 
    label: 'To Do', 
    lightColor: 'bg-red-100', 
    darkColor: 'bg-red-900/30',
    cardLightColor: 'bg-yellow-200',
    cardDarkColor: 'bg-yellow-600'
  },
  { 
    id: 'in-progress', 
    label: 'In Progress', 
    lightColor: 'bg-blue-100', 
    darkColor: 'bg-blue-900/30',
    cardLightColor: 'bg-blue-200',
    cardDarkColor: 'bg-blue-600'
  },
  { 
    id: 'fix-later', 
    label: 'Fix Later', 
    lightColor: 'bg-orange-100', 
    darkColor: 'bg-orange-900/30',
    cardLightColor: 'bg-orange-200',
    cardDarkColor: 'bg-orange-600'
  },
  { 
    id: 'done', 
    label: 'Done', 
    lightColor: 'bg-green-100', 
    darkColor: 'bg-green-900/30',
    cardLightColor: 'bg-green-200',
    cardDarkColor: 'bg-green-600'
  },
];

// New Kanban-style Task Card Component
interface TaskCardProps {
  task: Task;
  isDark: boolean;
  showDropdown: string | null;
  onTaskClick: (task: Task) => void;
  onDropdownToggle: (taskId: string, e: React.MouseEvent) => void;
  onEditFromDropdown: (task: Task, e: React.MouseEvent) => void;
  onDeleteFromDropdown: (taskId: string, e: React.MouseEvent) => void;
  handleDragStart: (e: React.DragEvent, task: Task) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  isDark, 
  showDropdown,
  onTaskClick,
  onDropdownToggle,
  onEditFromDropdown,
  onDeleteFromDropdown,
  handleDragStart
}) => {
  const statusColumn = statusColumns.find(col => col.id === task.status);
  const cardBgColor = isDark 
    ? statusColumn?.cardDarkColor || 'bg-gray-700'
    : statusColumn?.cardLightColor || 'bg-yellow-200';

  return (
    <>
      <DropIndicator beforeId={task.id} column={task.status} />
      <motion.div
        layout
        layoutId={task.id}
        draggable="true"
                 onDragStart={(e: React.DragEvent) => handleDragStart(e, task)}
        onClick={() => onTaskClick(task)}
        className={cn(
          "cursor-grab rounded-sm p-4 active:cursor-grabbing transition-all hover:shadow-lg transform hover:rotate-1",
          cardBgColor,
          isDark ? "border border-gray-600" : "border border-gray-300"
        )}
        style={{
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div className="flex items-start justify-between mb-3">
          <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'} flex-1`}>{task.title}</h4>
          <div className="relative">
            <button 
              data-dropdown
              onClick={(e) => {
                e.stopPropagation();
                onDropdownToggle(task.id, e);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              className={`${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'} p-1 rounded hover:bg-gray-200/20`}
            >
              <MoreVertical size={16} />
            </button>
            
            {/* Dropdown Menu */}
            {showDropdown === task.id && (
              <div className={`absolute right-0 top-8 ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} border rounded-lg shadow-lg z-50 min-w-[120px]`}>
                <button
                  onClick={(e) => onEditFromDropdown(task, e)}
                  className={`w-full flex items-center px-3 py-2 text-sm ${isDark ? 'text-gray-200 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-50'} transition-colors`}
                >
                  <Edit3 size={14} className="mr-2" />
                  Edit
                </button>
                <button
                  onClick={(e) => onDeleteFromDropdown(task.id, e)}
                  className={`w-full flex items-center px-3 py-2 text-sm text-red-600 ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-50'} transition-colors`}
                >
                  <Trash2 size={14} className="mr-2" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
        
        {task.description && (
          <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-3`}>{task.description}</p>
        )}
        
        <div className="flex items-center justify-between">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[task.priority]}`}>
            {task.priority}
          </span>
          
          <div className={`flex items-center space-x-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {task.dueDate && (
              <div className="flex items-center space-x-1">
                <Calendar size={12} />
                <span>{new Date(task.dueDate).toLocaleDateString()}</span>
              </div>
            )}
            {task.assignee && (
              <div className="flex items-center space-x-1">
                <User size={12} />
                <span>{task.assignee}</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
};

// Drop Indicator Component for visual feedback during drag
interface DropIndicatorProps {
  beforeId: string | null;
  column: string;
}

const DropIndicator: React.FC<DropIndicatorProps> = ({ beforeId, column }) => {
  return (
    <div
      data-before={beforeId || "-1"}
      data-column={column}
      className="my-0.5 h-0.5 w-full bg-violet-400 opacity-0"
    />
  );
};

// Kanban Column Component with HTML5 Drag & Drop
interface KanbanColumnProps {
  title: string;
  headingColor: string;
  cards: Task[];
  column: string;
  setCards: React.Dispatch<React.SetStateAction<Task[]>>;
  isDark: boolean;
  showDropdown: string | null;
  onTaskClick: (task: Task) => void;
  onDropdownToggle: (taskId: string, e: React.MouseEvent) => void;
  onEditFromDropdown: (task: Task, e: React.MouseEvent) => void;
  onDeleteFromDropdown: (taskId: string, e: React.MouseEvent) => void;
}

const TaskColumn: React.FC<TaskColumnProps> = ({
  column,
  tasks,
  isDark,
  showDropdown,
  isHighlighted,
  hiddenTaskId,
  onTaskClick,
  onDropdownToggle,
  onEditFromDropdown,
  onDeleteFromDropdown,
  onDragStart
}) => {
  return (
    <div className="flex flex-col h-full">
      <div className={`p-3 rounded-lg mb-4`} style={{ backgroundColor: isDark ? '#1f2937' : '#f3f4f6' }}>
        <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{column.label}</h3>
        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {tasks.length} task{tasks.length !== 1 ? 's' : ''}
        </span>
      </div>
      
      <div 
        data-column-id={column.id}
        className={`flex-1 min-h-[400px] p-3 rounded-lg border-2 border-dashed transition-all ${
          isHighlighted
            ? `${isDark ? 'border-blue-400 bg-blue-500/10 scale-[1.02]' : 'border-blue-400 bg-blue-50 scale-[1.02]'}`
            : `${isDark ? 'border-gray-600 bg-gray-800/50' : 'border-gray-300 bg-gray-50'}`
        }`}
      >
        <div className="space-y-3">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isDark={isDark}
              showDropdown={showDropdown}
              onTaskClick={onTaskClick}
              onDropdownToggle={onDropdownToggle}
              onEditFromDropdown={onEditFromDropdown}
              onDeleteFromDropdown={onDeleteFromDropdown}
              handleDragStart={handleDragStart}
            />
          ))}
        </div>
        
        {tasks.length === 0 && (
          <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <Clock size={24} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No tasks in {column.label.toLowerCase()}</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Flying Task Animation Component
interface FlyingTaskProps {
  task: Task;
  isDark: boolean;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  targetStatus: Task['status'];
  onComplete: () => void;
}

const FlyingTask: React.FC<FlyingTaskProps> = ({ task, isDark, startX, startY, endX, endY, targetStatus, onComplete }) => {
  // Use target status colors for the flying animation
  const targetColumn = statusColumns.find(col => col.id === targetStatus);
  const cardBgColor = isDark 
    ? targetColumn?.cardDarkColor || 'bg-gray-700'
    : targetColumn?.cardLightColor || 'bg-yellow-200';

  return (
    <motion.div
      initial={{
        position: 'fixed',
        left: startX,
        top: startY,
        zIndex: 1000,
        scale: 1.1,
        rotate: 5,
      }}
      animate={{
        left: endX,
        top: endY,
        scale: 1,
        rotate: 0,
      }}
      transition={{
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94], // Smoother easing
        type: "spring",
        damping: 25,
        stiffness: 120
      }}
      onAnimationComplete={onComplete}
      className={`${cardBgColor} p-4 rounded-sm shadow-2xl pointer-events-none w-64`}
      style={{
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3), 0 8px 16px rgba(0, 0, 0, 0.15)',
      }}
    >
      <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'} mb-2`}>{task.title}</h4>
      {task.description && (
        <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2 line-clamp-2`}>{task.description}</p>
      )}
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[task.priority]} inline-block`}>
        {task.priority}
      </span>
    </motion.div>
  );
};

// Dragging Preview Component
interface DragPreviewProps {
  task: Task;
  isDark: boolean;
  x: number;
  y: number;
}

const DragPreview: React.FC<DragPreviewProps> = ({ task, isDark, x, y }) => {
  const statusColumn = statusColumns.find(col => col.id === task.status);
  const cardBgColor = isDark 
    ? statusColumn?.cardDarkColor || 'bg-gray-700'
    : statusColumn?.cardLightColor || 'bg-yellow-200';

  return (
    <div
      className={`${cardBgColor} p-4 rounded-sm shadow-2xl pointer-events-none w-64 fixed z-50 transform rotate-2`}
      style={{
        left: x - 128, // center the preview
        top: y - 32,
        boxShadow: '0 15px 30px rgba(0, 0, 0, 0.25), 0 6px 12px rgba(0, 0, 0, 0.15)',
      }}
    >
      <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'} mb-2`}>{task.title}</h4>
      {task.description && (
        <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2 line-clamp-2`}>{task.description}</p>
      )}
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[task.priority]} inline-block`}>
        {task.priority}
      </span>
    </div>
  );
};

export const TasksTab: React.FC<TasksTabProps> = ({ project }) => {
  const { tasks, createTask, updateTask, deleteTask } = useSupabaseProjects();
  const { isDark } = useTheme();
  
  // UI State
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [editTaskData, setEditTaskData] = useState<Partial<Task>>({});
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Task['priority']>('medium');
  const [showDropdown, setShowDropdown] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  
  // Kanban drag state
  const [cards, setCards] = useState<Task[]>([]);

  const projectTasks = tasks.filter(t => t.projectId === project.id);
  
  // Update cards when tasks change
  useEffect(() => {
    setCards(projectTasks);
  }, [projectTasks]);

  // Mouse event handlers for custom drag
  useEffect(() => {
    let animationFrameId: number;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && draggedTask) {
        // Use requestAnimationFrame for smoother updates
        cancelAnimationFrame(animationFrameId);
        animationFrameId = requestAnimationFrame(() => {
          setMousePosition({ x: e.clientX, y: e.clientY });
          
          // Check what column we're over
          const element = document.elementFromPoint(e.clientX, e.clientY);
          const column = element?.closest('[data-column-id]');
          const columnId = column?.getAttribute('data-column-id');
          
          setHighlightedColumn(columnId || null);
        });
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (isDragging && draggedTask) {
        // Find drop target
        const element = document.elementFromPoint(e.clientX, e.clientY);
        const column = element?.closest('[data-column-id]');
        const columnId = column?.getAttribute('data-column-id') as Task['status'];
        
                if (columnId && columnId !== draggedTask.status) {
          // Start flying animation
          const targetColumn = document.querySelector(`[data-column-id="${columnId}"]`);
          if (targetColumn) {
            const targetRect = targetColumn.getBoundingClientRect();
            
            // Calculate where the card will actually appear in the target column
            const columnTasks = projectTasks.filter(task => task.status === columnId);
            const cardHeight = 120; // Approximate card height including margin
            const headerHeight = 80; // Column header height
            const padding = 12; // Column padding
            
            // Position should be at the end of the existing tasks
            const finalY = targetRect.top + headerHeight + padding + (columnTasks.length * cardHeight);
            
            setFlyingTask({
              task: draggedTask,
              startX: mousePosition.x - 128,
              startY: mousePosition.y - 32,
              endX: targetRect.left + padding,
              endY: finalY,
              targetStatus: columnId,
            });
            
            setHiddenTaskId(draggedTask.id);
          }
        }
        
        // Reset drag state
        setIsDragging(false);
        setDraggedTask(null);
        setHighlightedColumn(null);
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'grabbing';
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isDragging, draggedTask, mousePosition]);

  const handleCreateTask = () => {
    if (newTaskTitle.trim()) {
      createTask(project.id, newTaskTitle, newTaskDescription, newTaskPriority);
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskPriority('medium');
      setShowCreateModal(false);
    }
  };

  const handleStatusChange = (taskId: string, newStatus: Task['status']) => {
    updateTask(taskId, { status: newStatus });
  };

  const handleTaskClick = (task: Task) => {
    if (!isDragging) {
    setSelectedTask(task);
    setEditTaskData(task);
    setIsEditingTask(false);
    setShowDropdown(null);
    }
  };

  const handleEditTask = (task?: Task) => {
    if (task) {
      setSelectedTask(task);
      setEditTaskData(task);
    }
    setIsEditingTask(true);
    setShowDropdown(null);
  };

  const handleSaveTask = () => {
    if (selectedTask && editTaskData.title?.trim()) {
      updateTask(selectedTask.id, editTaskData);
      setSelectedTask({ ...selectedTask, ...editTaskData });
      setIsEditingTask(false);
    }
  };

  const handleDeleteTask = (taskId?: string) => {
    const idToDelete = taskId || selectedTask?.id;
    if (idToDelete) {
      deleteTask(idToDelete);
      if (selectedTask?.id === idToDelete) {
        setSelectedTask(null);
        setIsEditingTask(false);
      }
      setShowDeleteConfirm(null);
      setShowDropdown(null);
    }
  };

  const handleCloseModal = () => {
    setSelectedTask(null);
    setIsEditingTask(false);
    setEditTaskData({});
  };

  const handleDropdownToggle = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDropdown(showDropdown === taskId ? null : taskId);
  };

  const handleEditFromDropdown = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    handleEditTask(task);
  };

  const handleDeleteFromDropdown = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(taskId);
    setShowDropdown(null);
  };

  const confirmDelete = (taskId: string) => {
    handleDeleteTask(taskId);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(null);
  };

  const handleDragStart = (task: Task, e: React.MouseEvent) => {
    setDraggedTask(task);
    setIsDragging(true);
    setMousePosition({ x: e.clientX, y: e.clientY });
    setDragStartPosition({ x: e.clientX, y: e.clientY });
    setShowDropdown(null);
  };

  const handleFlyingComplete = () => {
    if (flyingTask) {
      // Update the task status to the target status
      handleStatusChange(flyingTask.task.id, flyingTask.targetStatus);
    }
    
    // Clean up
    setFlyingTask(null);
    setHiddenTaskId(null);
    setHighlightedColumn(null);
  };
        
        return (
    <div className="flex flex-col h-full" onClick={() => setShowDropdown(null)}>
      {/* Flying Task Animation */}
      <AnimatePresence>
        {flyingTask && (
                      <FlyingTask
              task={flyingTask.task}
              isDark={isDark}
              startX={flyingTask.startX}
              startY={flyingTask.startY}
              endX={flyingTask.endX}
              endY={flyingTask.endY}
              targetStatus={flyingTask.targetStatus}
              onComplete={handleFlyingComplete}
            />
        )}
      </AnimatePresence>

      {/* Drag Preview */}
      {isDragging && draggedTask && (
        <DragPreview
          task={draggedTask}
          isDark={isDark}
          x={mousePosition.x}
          y={mousePosition.y}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Tasks</h2>
          <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('kanban')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'kanban'
                  ? (isDark ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600')
                  : (isDark ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100')
              }`}
            >
              <Kanban size={20} />
              </button>
              <button
                onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? (isDark ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600')
                  : (isDark ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100')
              }`}
            >
              <List size={20} />
              </button>
            </div>
        </div>
            <button
              onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
          <Plus size={20} />
          <span>Add Task</span>
            </button>
      </div>

      {/* Task Board */}
      {viewMode === 'kanban' && (
        <div className="flex-1 grid grid-cols-4 gap-6 overflow-hidden">
                {statusColumns.map((column) => {
            const columnTasks = projectTasks.filter(task => task.status === column.id);
                  return (
              <TaskColumn
                key={column.id}
                column={column}
                tasks={columnTasks}
                isDark={isDark}
                showDropdown={showDropdown}
                isHighlighted={highlightedColumn === column.id}
                hiddenTaskId={hiddenTaskId}
                onTaskClick={handleTaskClick}
                onDropdownToggle={handleDropdownToggle}
                onEditFromDropdown={handleEditFromDropdown}
                onDeleteFromDropdown={handleDeleteFromDropdown}
                onDragStart={handleDragStart}
              />
                  );
                })}
              </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-3">
            {projectTasks.map((task) => (
              <DraggableTaskCard
                key={task.id}
                task={task}
                isDark={isDark}
                showDropdown={showDropdown}
                isHidden={hiddenTaskId === task.id}
                onTaskClick={handleTaskClick}
                onDropdownToggle={handleDropdownToggle}
                onEditFromDropdown={handleEditFromDropdown}
                onDeleteFromDropdown={handleDeleteFromDropdown}
                onDragStart={handleDragStart}
              />
            ))}
            </div>
          </div>
        )}

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 w-full max-w-md mx-4`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Create New Task</h3>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Title *
                </label>
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="Enter task title"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Description
                </label>
                <textarea
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="Enter task description"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Priority
                </label>
                <select
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value as Task['priority'])}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="top">Top</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTask}
                disabled={!newTaskTitle.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Details Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {isEditingTask ? 'Edit Task' : 'Task Details'}
              </h3>
              <button
                onClick={handleCloseModal}
                className={`${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'} transition-colors`}
              >
                <X size={24} />
              </button>
            </div>

                {isEditingTask ? (
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Title *
                  </label>
                  <input
                    type="text"
                    value={editTaskData.title || ''}
                    onChange={(e) => setEditTaskData({ ...editTaskData, title: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
            </div>

              <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Description
                  </label>
                  <textarea
                    value={editTaskData.description || ''}
                    onChange={(e) => setEditTaskData({ ...editTaskData, description: e.target.value })}
                    rows={4}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Priority
                    </label>
                    <select
                      value={editTaskData.priority || 'medium'}
                      onChange={(e) => setEditTaskData({ ...editTaskData, priority: e.target.value as Task['priority'] })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="top">Top</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Status
                    </label>
                    <select
                      value={editTaskData.status || 'todo'}
                      onChange={(e) => setEditTaskData({ ...editTaskData, status: e.target.value as Task['status'] })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="todo">To Do</option>
                      <option value="in-progress">In Progress</option>
                      <option value="fix-later">Fix Later</option>
                      <option value="done">Done</option>
                    </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Assignee
                    </label>
                    <input
                      type="text"
                      value={editTaskData.assignee || ''}
                      onChange={(e) => setEditTaskData({ ...editTaskData, assignee: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="Assign to..."
                    />
                    </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Due Date
                    </label>
                                         <input
                       type="date"
                       value={editTaskData.dueDate ? (typeof editTaskData.dueDate === 'string' ? editTaskData.dueDate : editTaskData.dueDate.toISOString().split('T')[0]) : ''}
                       onChange={(e) => setEditTaskData({ ...editTaskData, dueDate: e.target.value ? new Date(e.target.value) : undefined })}
                       className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                         isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                       }`}
                     />
              </div>
            </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setIsEditingTask(false)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveTask}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Save size={16} />
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h4 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {selectedTask.title}
                  </h4>
                  {selectedTask.description && (
                    <p className={`mt-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {selectedTask.description}
                    </p>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Priority</span>
                    <div className={`mt-1`}>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[selectedTask.priority]}`}>
                        {selectedTask.priority}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Status</span>
                    <p className={`mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {statusColumns.find(col => col.id === selectedTask.status)?.label}
                    </p>
                  </div>
                  
                  {selectedTask.assignee && (
                    <div>
                      <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Assignee</span>
                      <div className={`mt-1 flex items-center space-x-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        <User size={16} />
                        <span>{selectedTask.assignee}</span>
                      </div>
                    </div>
                  )}
                  
                  {selectedTask.dueDate && (
                    <div>
                      <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Due Date</span>
                      <div className={`mt-1 flex items-center space-x-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        <Calendar size={16} />
                        <span>{new Date(selectedTask.dueDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowDeleteConfirm(selectedTask.id)}
                    className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                    <span>Delete</span>
                  </button>
                  <button
                    onClick={() => handleEditTask(selectedTask)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Edit3 size={16} />
                    <span>Edit</span>
                  </button>
                </div>
              </div>
              )}
            </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 w-full max-w-md mx-4`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Confirm Delete
            </h3>
            <p className={`mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Are you sure you want to delete this task? This action cannot be undone.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDelete}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={() => confirmDelete(showDeleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};