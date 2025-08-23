import React, { useState, DragEvent, FormEvent } from 'react';
import { FiPlus, FiTrash, FiEdit2, FiCheck, FiX } from 'react-icons/fi';
import { FaFire } from 'react-icons/fa';
import { v4 as uuidv4 } from 'uuid';

import { Task } from '../types';

interface KanbanBoardProps {
  tasks: Task[];
  onTasksChange: (tasks: Task[]) => void;
  onUpdateTask: (taskId: string, newTitle: string) => void;
}

const statusColumns = [
  { 
    id: 'todo' as const, 
    label: 'TODO', 
    headingColor: 'text-yellow-200'
  },
  { 
    id: 'in-progress' as const, 
    label: 'In progress', 
    headingColor: 'text-blue-200'
  },
  { 
    id: 'fix-later' as const, 
    label: 'Fix Later', 
    headingColor: 'text-orange-200'
  },
  { 
    id: 'done' as const, 
    label: 'Complete', 
    headingColor: 'text-emerald-200'
  },
];

type ColumnProps = {
  title: string;
  headingColor: string;
  tasks: Task[];
  column: Task['status'];
  setTasks: (tasks: Task[]) => void;
  onUpdateTask: (taskId: string, newTitle: string) => void;
};

const Column = ({
  title,
  headingColor,
  tasks,
  column,
  setTasks,
  onUpdateTask,
}: ColumnProps) => {
  const [active, setActive] = useState(false);

  const handleDragStart = (e: DragEvent, task: Task) => {
    e.dataTransfer.setData("taskId", task.id);
  };

  const handleDragEnd = (e: DragEvent) => {
    const taskId = e.dataTransfer.getData("taskId");

    setActive(false);
    clearHighlights();

    const indicators = getIndicators();
    const { element } = getNearestIndicator(e, indicators);

    const before = element.dataset.before || "-1";

    if (before !== taskId) {
      let copy = [...tasks];

      let taskToTransfer = copy.find((c) => c.id === taskId);
      if (!taskToTransfer) return;
      taskToTransfer = { ...taskToTransfer, status: column };

      copy = copy.filter((c) => c.id !== taskId);

      const moveToBack = before === "-1";

      if (moveToBack) {
        copy.push(taskToTransfer);
      } else {
        const insertAtIndex = copy.findIndex((el) => el.id === before);
        if (insertAtIndex === undefined) return;

        copy.splice(insertAtIndex, 0, taskToTransfer);
      }

      setTasks(copy);
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    highlightIndicator(e);
    setActive(true);
  };

  const clearHighlights = (els?: HTMLElement[]) => {
    const indicators = els || getIndicators();
    indicators.forEach((i) => {
      i.style.opacity = "0";
    });
  };

  const highlightIndicator = (e: DragEvent) => {
    const indicators = getIndicators();
    clearHighlights(indicators);
    const el = getNearestIndicator(e, indicators);
    el.element.style.opacity = "1";
  };

  const getNearestIndicator = (e: DragEvent, indicators: HTMLElement[]) => {
    const DISTANCE_OFFSET = 50;

    const el = indicators.reduce(
      (closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = e.clientY - (box.top + DISTANCE_OFFSET);

        if (offset < 0 && offset > closest.offset) {
          return { offset: offset, element: child };
        } else {
          return closest;
        }
      },
      {
        offset: Number.NEGATIVE_INFINITY,
        element: indicators[indicators.length - 1],
      }
    );

    return el;
  };

  const getIndicators = () => {
    return Array.from(
      document.querySelectorAll(
        `[data-column="${column}"]`
      ) as unknown as HTMLElement[]
    );
  };

  const handleDragLeave = () => {
    clearHighlights();
    setActive(false);
  };

  const filteredTasks = tasks.filter((c) => c.status === column);

  return (
    <div className="flex-1 min-w-32 sm:min-w-40 md:min-w-60 h-full flex flex-col mx-1 sm:mx-2">
      <div className="mb-3 flex items-center justify-between flex-shrink-0">
        <h3 className={`font-medium ${headingColor} truncate`}>{title}</h3>
        <span className="rounded text-sm text-neutral-400 ml-2">
          {filteredTasks.length}
        </span>
      </div>
      <div
        onDrop={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`flex-1 min-h-0 overflow-y-auto transition-colors space-y-3 dark-scrollbar ${
          active ? "bg-neutral-800/50" : "bg-neutral-800/0"
        }`}
      >
        {filteredTasks.map((c) => {
          return <TaskCard key={c.id} {...c} handleDragStart={handleDragStart} onUpdateTask={onUpdateTask} />;
        })}
        <DropIndicator beforeId={null} column={column} />
        <AddCard column={column} setTasks={setTasks} allTasks={tasks} />
      </div>
    </div>
  );
};

type TaskCardProps = Task & {
  handleDragStart: (e: DragEvent, task: Task) => void;
  onUpdateTask: (taskId: string, newTitle: string) => void;
};

const TaskCard = ({ id, title, status, handleDragStart, onUpdateTask, ...task }: TaskCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(title);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const cardRef = React.useRef<HTMLDivElement>(null);

  const handleEdit = () => {
    setEditText(title);
    setIsEditing(true);
  };

  React.useEffect(() => {
    if (isEditing && textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  }, [isEditing]);

  const handleSave = React.useCallback(() => {
    const trimmedText = editText.trim();
    if (trimmedText && trimmedText !== title) {
      onUpdateTask(id, trimmedText);
      setIsEditing(false);
    } else if (trimmedText === title) {
      setIsEditing(false);
    } else {
      return;
    }
  }, [editText, title, onUpdateTask, id]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isEditing && cardRef.current && !cardRef.current.contains(event.target as Node)) {
        handleSave();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEditing, handleSave]);

  const handleDragStartWithEditCheck = (e: DragEvent) => {
    if (isEditing) {
      e.preventDefault();
      return;
    }
    handleDragStart(e, { id, title, status, ...task });
  };

  const handleCancel = () => {
    setEditText(title);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    } else if (e.key === 'Tab') {
      return;
    }
  };

  return (
    <>
      <DropIndicator beforeId={id} column={status} />
      <div
        ref={cardRef}
        draggable={!isEditing}
        onDragStart={(e) => handleDragStartWithEditCheck(e as React.DragEvent<HTMLDivElement>)}
        className={`${
          isEditing ? 'bg-amber-100 border-0' : 'border border-amber-200 bg-amber-100'
        } p-3 w-full shadow-md hover:shadow-lg transition-shadow relative group ${
          !isEditing ? 'cursor-grab active:cursor-grabbing' : ''
        }`}
        style={{ borderRadius: '0px' }}
      >
        {isEditing ? (
          <div>
            <textarea
              ref={textareaRef}
              value={editText}
              onChange={(e) => {
                setEditText(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
              onKeyDown={handleKeyDown}
              className="w-full text-sm text-gray-800 bg-transparent border-none outline-none resize-none leading-relaxed overflow-hidden focus:ring-0"
              style={{ minHeight: '60px' }}
              autoFocus
              rows={3}
              aria-label="Edit task content"
              placeholder="Enter task description..."
            />
            <div className="flex justify-end space-x-1">
              <button
                onClick={handleSave}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSave();
                  }
                }}
                className="p-1 text-green-600 hover:text-green-800 focus:text-green-800 transition-colors focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-1"
                aria-label="Save changes (Ctrl+Enter)"
                tabIndex={0}
              >
                <FiCheck size={14} />
              </button>
              <button
                onClick={handleCancel}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCancel();
                  }
                }}
                className="p-1 text-red-600 hover:text-red-800 focus:text-red-800 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1"
                aria-label="Cancel editing (Escape)"
                tabIndex={0}
              >
                <FiX size={14} />
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-800 whitespace-pre-wrap break-words leading-relaxed pr-6">{title}</p>
            <button
              onClick={handleEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleEdit();
                }
              }}
              className="absolute top-2 right-2 p-1 text-gray-600 hover:text-gray-800 focus:text-gray-800 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1"
              aria-label={`Edit task: ${title}`}
              tabIndex={0}
            >
              <FiEdit2 size={14} />
            </button>
          </>
        )}
      </div>
    </>
  );
};

type DropIndicatorProps = {
  beforeId: string | null;
  column: string;
};

const DropIndicator = ({ beforeId, column }: DropIndicatorProps) => {
  return (
    <div
      data-before={beforeId || "-1"}
      data-column={column}
      className="my-1.5 h-0.5 w-full bg-violet-400 opacity-0"
    />
  );
};

const BurnBarrel = ({
  setTasks,
  allTasks,
}: {
  setTasks: (tasks: Task[]) => void;
  allTasks: Task[];
}) => {
  const [active, setActive] = useState(false);

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setActive(true);
  };

  const handleDragLeave = () => {
    setActive(false);
  };

  const handleDragEnd = (e: DragEvent) => {
    const taskId = e.dataTransfer.getData("taskId");
    setTasks(allTasks.filter((c: Task) => c.id !== taskId));
    setActive(false);
  };
        
  return (
    <div
      onDrop={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`mt-4 sm:mt-6 md:mt-10 grid h-16 w-16 sm:h-24 sm:w-24 md:h-32 md:w-32 shrink-0 place-content-center rounded border text-lg sm:text-xl md:text-2xl ${
        active
          ? "border-red-800 bg-red-800/20 text-red-500"
          : "border-neutral-500 bg-neutral-500/20 text-neutral-500"
      }`}
    >
      {active ? <FaFire className="animate-bounce" /> : <FiTrash />}
    </div>
  );
};

type AddCardProps = {
  column: Task['status'];
  setTasks: (tasks: Task[]) => void;
  allTasks: Task[];
};

const AddCard = ({ column, setTasks, allTasks }: AddCardProps) => {
  const [text, setText] = useState("");
  const [adding, setAdding] = useState(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!text.trim().length) return;

    const newTask = {
      id: `temp-${uuidv4()}`,
      projectId: '',
      title: text.trim(),
      description: '',
      status: column,
      priority: 'medium' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setTasks([...allTasks, newTask]);

    setAdding(false);
    setText("");
  };

  return (
    <>
      {adding ? (
        <form onSubmit={handleSubmit} className="w-full">
          <textarea
            onChange={(e) => setText(e.target.value)}
            autoFocus
            placeholder="Add new task..."
            className="w-full border border-amber-200 bg-amber-50 p-3 text-sm text-gray-800 placeholder-gray-500 focus:outline-0 min-h-[80px]"
            style={{ borderRadius: '0px' }}
          />
          <div className="mt-1.5 flex items-center justify-end gap-1.5">
              <button
              type="button"
              onClick={() => setAdding(false)}
              className="px-3 py-1.5 text-xs text-gray-600 transition-colors hover:text-gray-800"
            >
              Close
              </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 bg-gray-800 px-3 py-1.5 text-xs text-white transition-colors hover:bg-gray-700"
              style={{ borderRadius: '0px' }}
            >
              <span>Add</span>
              <FiPlus />
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex w-full items-center justify-center gap-1.5 px-3 py-3 text-xs text-neutral-400 transition-colors hover:text-neutral-50 border-2 border-dashed border-neutral-600 hover:border-neutral-500 min-h-[60px]"
          style={{ borderRadius: '0px' }}
        >
          <span>Add card</span>
          <FiPlus />
        </button>
      )}
    </>
  );
};

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ 
  tasks, 
  onTasksChange, 
  onUpdateTask 
}) => {
  return (
    <div className="h-full w-full text-neutral-50" style={{ backgroundColor: '#0a0a0a' }}>
      <div 
        className="flex h-full w-full gap-1 sm:gap-2 md:gap-4 overflow-auto p-2 sm:p-4 md:p-6 dark-scrollbar"
      >
        {statusColumns.map((column) => (
          <Column
            key={column.id}
            title={column.label}
            headingColor={column.headingColor}
            tasks={tasks}
            column={column.id}
            setTasks={onTasksChange}
            onUpdateTask={onUpdateTask}
          />
        ))}
        <BurnBarrel setTasks={onTasksChange} allTasks={tasks} />
      </div>
    </div>
  );
};