// Utility functions for ProjectManager

// Get personnel by ID
export const getPersonnelById = (personnel, id) => {
  return personnel.find(p => p.id === id) || { name: 'Unassigned', color: '#999' };
};

// Get task statistics for a project
export const getTaskStats = (project) => {
  const tasks = project.tasks || [];
  const completed = tasks.filter(t => t.status === 'completed').length;
  const inProgress = tasks.filter(t => t.status === 'in-progress').length;
  const notStarted = tasks.filter(t => t.status === 'not-started').length;
  return { total: tasks.length, completed, inProgress, notStarted };
};

// Calculate project progress percentage
export const getProjectProgress = (project) => {
  const stats = getTaskStats(project);
  return stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
};

// Get color for status
export const getStatusColor = (status) => {
  switch (status) {
    case 'completed': return '#4caf50';
    case 'in-progress': return '#ff9800';
    case 'not-started': return '#9e9e9e';
    default: return '#9e9e9e';
  }
};

// Get color for priority
export const getPriorityColor = (priority) => {
  switch (priority) {
    case 'high': return '#f44336';
    case 'medium': return '#ff9800';
    case 'low': return '#4caf50';
    default: return '#9e9e9e';
  }
};
