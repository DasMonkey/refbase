import React, { useState, DragEvent, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiTrash } from 'react-icons/fi';
import { FaFire } from 'react-icons/fa';
import { cn } from '../lib/utils';
import { Project, Task } from '../types';
import { useSupabaseProjects } from '../hooks/useSupabaseProjects';

interface TasksTabProps {
  project: Project;
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
};

const Column = ({
  title,
  headingColor,
  tasks,
  column,
  setTasks,
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
    <div className="flex-1 min-w-0 h-full flex flex-col mx-2">
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
        className={`flex-1 min-h-0 overflow-y-auto transition-colors ${
          active ? "bg-neutral-800/50" : "bg-neutral-800/0"
        }`}
      >
        {filteredTasks.map((c) => {
          return <TaskCard key={c.id} {...c} handleDragStart={handleDragStart} />;
        })}
        <DropIndicator beforeId={null} column={column} />
        <AddCard column={column} setTasks={setTasks} allTasks={tasks} />
      </div>
    </div>
  );
};

type TaskCardProps = Task & {
  handleDragStart: (e: DragEvent, task: Task) => void;
};

const TaskCard = ({ id, title, status, handleDragStart, ...task }: TaskCardProps) => {
  return (
    <>
      <DropIndicator beforeId={id} column={status} />
      <motion.div
        layout
        layoutId={id}
        draggable="true"
        onDragStart={(e) => handleDragStart(e as any, { id, title, status, ...task })}
        className="cursor-grab rounded border border-neutral-700 bg-neutral-800 p-3 active:cursor-grabbing"
      >
        <p className="text-sm text-neutral-100">{title}</p>
      </motion.div>
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
      className="my-0.5 h-0.5 w-full bg-violet-400 opacity-0"
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
      className={`mt-10 grid h-32 w-32 shrink-0 place-content-center rounded border text-2xl ${
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
      id: Math.random().toString(),
      projectId: '', // Will be set by parent
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
        <motion.form layout onSubmit={handleSubmit}>
          <textarea
            onChange={(e) => setText(e.target.value)}
            autoFocus
            placeholder="Add new task..."
            className="w-full rounded border border-violet-400 bg-violet-400/20 p-3 text-sm text-neutral-50 placeholder-violet-300 focus:outline-0"
          />
          <div className="mt-1.5 flex items-center justify-end gap-1.5">
              <button
              type="button"
              onClick={() => setAdding(false)}
              className="px-3 py-1.5 text-xs text-neutral-400 transition-colors hover:text-neutral-50"
            >
              Close
              </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded bg-neutral-50 px-3 py-1.5 text-xs text-neutral-950 transition-colors hover:bg-neutral-300"
            >
              <span>Add</span>
              <FiPlus />
            </button>
          </div>
        </motion.form>
      ) : (
        <motion.button
          layout
          onClick={() => setAdding(true)}
          className="flex w-full items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-400 transition-colors hover:text-neutral-50"
        >
          <span>Add card</span>
          <FiPlus />
        </motion.button>
      )}
    </>
  );
};

export const TasksTab: React.FC<TasksTabProps> = ({ project }) => {
  const { tasks, createTask, updateTask, deleteTask } = useSupabaseProjects();
  const [localTasks, setLocalTasks] = useState<Task[]>([]);
  
  const projectTasks = React.useMemo(() => 
    tasks.filter(t => t.projectId === project.id), 
    [tasks, project.id]
  );

  // Sync with Supabase when local tasks change
  React.useEffect(() => {
    setLocalTasks(projectTasks);
  }, [projectTasks]);

  const handleTasksChange = (newTasks: Task[]) => {
    setLocalTasks(newTasks);
    
    // Find what changed and sync with Supabase
    newTasks.forEach(task => {
      const originalTask = projectTasks.find(t => t.id === task.id);
      if (originalTask && originalTask.status !== task.status) {
        updateTask(task.id, { status: task.status });
      }
      if (!originalTask && task.projectId === '') {
        // New task - create with correct status
        createTask(project.id, task.title, task.description, task.priority, task.status);
      }
    });

    // Check for deleted tasks
    projectTasks.forEach(originalTask => {
      if (!newTasks.find(t => t.id === originalTask.id)) {
        deleteTask(originalTask.id);
      }
    });
  };

  return (
    <div className="h-full w-full text-neutral-50" style={{ backgroundColor: '#0a0a0a' }}>
      <div 
        className="flex h-full w-full gap-3 overflow-auto p-12 scrollbar-hide" 
        style={{ 
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none'
        }}
      >
        {statusColumns.map((column) => (
          <Column
            key={column.id}
            title={column.label}
            headingColor={column.headingColor}
            tasks={localTasks}
            column={column.id}
            setTasks={handleTasksChange}
          />
        ))}
                 <BurnBarrel setTasks={handleTasksChange} allTasks={localTasks} />
      </div>
    </div>
  );
};