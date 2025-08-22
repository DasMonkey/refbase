import React, { useState } from 'react';

import { Project, Task } from '../types';
import { useSupabaseProjects } from '../hooks/useSupabaseProjects';
import { KanbanBoard } from './KanbanBoard';

interface TasksTabProps {
  project: Project;
}

export const TasksTab: React.FC<TasksTabProps> = ({ project }) => {
  const { tasks, createTask, updateTask, deleteTask } = useSupabaseProjects();
  const [localTasks, setLocalTasks] = useState<Task[]>([]);
  
  const projectTasks = React.useMemo(() => 
    tasks.filter(t => t.projectId === project.id), 
    [tasks, project.id]
  );

  React.useEffect(() => {
    setLocalTasks(projectTasks);
  }, [projectTasks]);


  const handleTasksChange = async (newTasks: Task[]) => {
    setLocalTasks(newTasks);
    
    for (const task of newTasks) {
      const originalTask = projectTasks.find(t => t.id === task.id);
      
      if (originalTask && originalTask.status !== task.status) {
        await updateTask(task.id, { status: task.status });
      } else if (!originalTask && task.id.startsWith('temp-')) {
        try {
          const createdTask = await createTask(project.id, task.title, task.description, task.priority, task.status);
          setLocalTasks(prevTasks => 
            prevTasks.map(t => t.id === task.id ? { ...t, id: createdTask.id, projectId: project.id } : t)
          );
        } catch (error) {
          console.error('Failed to create task:', error);
        }
      }
    }

    const permanentTasks = newTasks.filter(t => !t.id.startsWith('temp-'));
    projectTasks.forEach(originalTask => {
      if (!permanentTasks.find(t => t.id === originalTask.id)) {
        deleteTask(originalTask.id);
      }
    });
  };

  const handleUpdateTask = async (taskId: string, newTitle: string) => {
    const updatedTasks = localTasks.map(task => 
      task.id === taskId ? { ...task, title: newTitle } : task
    );
    setLocalTasks(updatedTasks);
    
    if (!taskId.startsWith('temp-')) {
      try {
        await updateTask(taskId, { title: newTitle });
      } catch (error) {
        console.error('Failed to update task:', error);
      }
    }
  };

  return (
    <KanbanBoard 
      tasks={localTasks}
      onTasksChange={handleTasksChange}
      onUpdateTask={handleUpdateTask}
    />
  );
};