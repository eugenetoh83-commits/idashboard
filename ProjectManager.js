const ProjectManager = ({ isOpen, onClose, theme }) => {
  // Personnel database
  const [personnel] = React.useState([
    { id: 1, name: 'Alice Johnson', role: 'Frontend Developer', color: '#FF6B6B' },
    { id: 2, name: 'Bob Smith', role: 'Backend Developer', color: '#4ECDC4' },
    { id: 3, name: 'Carol Davis', role: 'UI/UX Designer', color: '#45B7D1' },
    { id: 4, name: 'David Wilson', role: 'Project Manager', color: '#96CEB4' },
    { id: 5, name: 'Emma Brown', role: 'QA Engineer', color: '#FFEAA7' },
    { id: 6, name: 'Frank Miller', role: 'DevOps Engineer', color: '#DDA0DD' }
  ]);

  // Project state with default data
  const [projects, setProjects] = React.useState(() => {
    const saved = localStorage.getItem('projects');
    if (saved) {
      return JSON.parse(saved);
    }
    return [{
      id: 1,
      name: 'Website Redesign',
      description: 'Complete redesign of company website with modern UI/UX',
      dueDate: '2025-08-20',
      status: 'in-progress',
      created: '2025-08-01',
      tasks: []
    }];
  });

  const [currentView, setCurrentView] = React.useState('overview');
  const [selectedProject, setSelectedProject] = React.useState(null);
  const [showNewProjectForm, setShowNewProjectForm] = React.useState(false);
  const [showNewTaskForm, setShowNewTaskForm] = React.useState(false);
  const [editingProject, setEditingProject] = React.useState(null);
  const [editingTask, setEditingTask] = React.useState(null);
  
  const [newProject, setNewProject] = React.useState({
    name: '',
    description: '',
    dueDate: '',
    tasks: []
  });

  const [newTask, setNewTask] = React.useState({
    name: '',
    description: '',
    priority: 'medium',
    assignee: '',  // Empty string instead of null
    startDate: '',
    endDate: '',
    estimatedHours: 0
  });

  // Save projects to localStorage whenever projects change
  React.useEffect(() => {
    localStorage.setItem('projects', JSON.stringify(projects));
  }, [projects]);

  // Helper functions
  const getPersonnelById = (id) => personnel.find(p => p.id === id) || { name: 'Unassigned', color: '#999' };
  
  const calculateProjectStatus = (tasks) => {
    if (!tasks || tasks.length === 0) return 'not-started';
    const completed = tasks.every(task => task.status === 'completed');
    if (completed) return 'completed';
    const hasInProgress = tasks.some(task => task.status === 'in-progress');
    return hasInProgress ? 'in-progress' : 'not-started';
  };

  const handleDeleteTask = (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    setProjects(prev => prev.map(project => {
      if (project.tasks && project.tasks.some(task => task.id === taskId)) {
        const updatedTasks = project.tasks.filter(task => task.id !== taskId);
        return {
          ...project,
          tasks: updatedTasks,
          status: calculateProjectStatus(updatedTasks)
        };
      }
      return project;
    }));
  };

  const getTaskStats = (project) => {
    const tasks = project.tasks || [];
    const completed = tasks.filter(t => t.status === 'completed').length;
    const inProgress = tasks.filter(t => t.status === 'in-progress').length;
    const notStarted = tasks.filter(t => t.status === 'not-started').length;
    return { total: tasks.length, completed, inProgress, notStarted };
  };

  const getProjectProgress = (project) => {
    const stats = getTaskStats(project);
    return stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
  };

  const handleNewProject = () => {
    setShowNewProjectForm(true);
    setNewProject({
      name: '',
      description: '',
      dueDate: '',
      tasks: []
    });
  };

  const handleSaveProject = () => {
    if (!newProject.name.trim()) {
      alert('Please enter a project name');
      return;
    }

    const projectToSave = {
      id: editingProject ? editingProject.id : Date.now(),
      name: newProject.name.trim(),
      description: newProject.description.trim(),
      dueDate: newProject.dueDate,
      status: editingProject ? editingProject.status : 'not-started',
      created: editingProject ? editingProject.created : new Date().toISOString().split('T')[0],
      tasks: editingProject ? editingProject.tasks : []
    };

    if (editingProject) {
      setProjects(prev => prev.map(p => p.id === editingProject.id ? projectToSave : p));
    } else {
      setProjects(prev => [...prev, projectToSave]);
    }

    setShowNewProjectForm(false);
    setEditingProject(null);
    setNewProject({ name: '', description: '', dueDate: '', tasks: [] });
  };

  const handleEditProject = (project) => {
    setEditingProject(project);
    setNewProject({
      name: project.name,
      description: project.description,
      dueDate: project.dueDate,
      tasks: project.tasks || []
    });
    setShowNewProjectForm(true);
  };

  const handleDeleteProject = (projectId) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      setProjects(prev => prev.filter(p => p.id !== projectId));
      if (selectedProject && selectedProject.id === projectId) {
        setSelectedProject(null);
        setCurrentView('overview');
      }
    }
  };

  const handleCancelForm = () => {
    setShowNewProjectForm(false);
    setShowNewTaskForm(false);
    setEditingProject(null);
    setEditingTask(null);
    setNewProject({ name: '', description: '', dueDate: '', tasks: [] });
    setNewTask({
      name: '',
      description: '',
      priority: 'medium',
      assignee: '',
      startDate: '',
      endDate: '',
      estimatedHours: 0
    });
  };

  const handleSaveTask = () => {
    if (!newTask.name.trim()) {
      alert('Please enter a task name');
      return;
    }

    if (!selectedProject) {
      alert('No project selected');
      return;
    }

    const taskToSave = {
      id: editingTask ? editingTask.id : Date.now(),
      name: newTask.name.trim(),
      description: newTask.description.trim(),
      priority: newTask.priority,
      assignee: newTask.assignee ? parseInt(newTask.assignee) : undefined,
      startDate: newTask.startDate,
      endDate: newTask.endDate,
      estimatedHours: parseInt(newTask.estimatedHours) || 0,
      actualHours: editingTask ? editingTask.actualHours : 0,
      status: editingTask ? editingTask.status : 'not-started'
    };

    setProjects(prev => prev.map(project => {
      if (project.id === selectedProject.id) {
        const updatedTasks = editingTask
          ? project.tasks.map(task => task.id === editingTask.id ? taskToSave : task)
          : [...(project.tasks || []), taskToSave];
        
        return {
          ...project,
          tasks: updatedTasks,
          status: calculateProjectStatus(updatedTasks)
        };
      }
      return project;
    }));

    setShowNewTaskForm(false);
    setEditingTask(null);
    setSelectedProject(null);
    setNewTask({
      name: '',
      description: '',
      priority: 'medium',
      assignee: '',
      startDate: '',
      endDate: '',
      estimatedHours: 0
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#4caf50';
      case 'in-progress': return '#ff9800';
      case 'not-started': return '#9e9e9e';
      default: return '#9e9e9e';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#f44336';
      case 'medium': return '#ff9800';
      case 'low': return '#4caf50';
      default: return '#9e9e9e';
    }
  };

  // Visualization components
  const GanttChart = ({ project }) => {
    const tasks = project.tasks || [];
    if (tasks.length === 0) {
      return (
        <div style={{ padding: '20px', backgroundColor: theme === 'dark' ? '#252525' : '#f9f9f9', borderRadius: '8px', textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 20px 0' }}>📊 Gantt Chart - {project.name}</h3>
          <p>No tasks available to display in the Gantt chart.</p>
        </div>
      );
    }

    const startDate = new Date(Math.min(...tasks.map(t => new Date(t.startDate || Date.now()))));
    const endDate = new Date(Math.max(...tasks.map(t => new Date(t.endDate || Date.now()))));
    const totalDays = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)));
    
    // Generate date headers
    const dateHeaders = [];
    for (let i = 0; i <= totalDays; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      dateHeaders.push(date);
    }

    const getTaskPosition = (task) => {
      const taskStart = new Date(task.startDate || Date.now());
      const taskEnd = new Date(task.endDate || Date.now());
      const daysFromStart = Math.ceil((taskStart - startDate) / (1000 * 60 * 60 * 24));
      const taskDuration = Math.max(1, Math.ceil((taskEnd - taskStart) / (1000 * 60 * 60 * 24)));
      
      return {
        left: `${(daysFromStart / totalDays) * 100}%`,
        width: `${(taskDuration / totalDays) * 100}%`
      };
    };

    return (
      <div style={{ 
        padding: '20px', 
        backgroundColor: theme === 'dark' ? '#252525' : '#f9f9f9', 
        borderRadius: '8px',
        overflowX: 'auto'
      }}>
        <h3 style={{ margin: '0 0 20px 0' }}>📊 Gantt Chart - {project.name}</h3>
        
        <div style={{ minWidth: '800px' }}>
          {/* Timeline header */}
          <div style={{ 
            display: 'flex',
            borderBottom: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`,
            marginBottom: '10px',
            padding: '10px 0',
            position: 'sticky',
            top: 0,
            backgroundColor: theme === 'dark' ? '#252525' : '#f9f9f9'
          }}>
            <div style={{ width: '200px', flexShrink: 0 }}>Task</div>
            <div style={{ flex: 1, display: 'flex' }}>
              {dateHeaders.map((date, index) => (
                <div 
                  key={index}
                  style={{ 
                    width: `${100/totalDays}%`,
                    fontSize: '10px',
                    textAlign: 'center',
                    borderLeft: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`
                  }}
                >
                  {date.toLocaleDateString()}
                </div>
              ))}
            </div>
          </div>

          {/* Task rows */}
          {tasks.map(task => (
            <div key={task.id} style={{ display: 'flex', marginBottom: '10px', minHeight: '40px' }}>
              <div style={{ 
                width: '200px', 
                flexShrink: 0, 
                padding: '5px',
                display: 'flex',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontWeight: 'bold' }}>{task.name}</div>
                  <div style={{ fontSize: '12px', color: theme === 'dark' ? '#aaa' : '#666' }}>
                    {getPersonnelById(task.assignee).name}
                  </div>
                </div>
              </div>
              
              <div style={{ flex: 1, position: 'relative' }}>
                <div style={{
                  position: 'absolute',
                  ...getTaskPosition(task),
                  top: '5px',
                  bottom: '5px',
                  backgroundColor: getPriorityColor(task.priority),
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '12px',
                  padding: '0 5px'
                }}>
                  {task.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const KanbanBoard = ({ project }) => {
    const tasks = project.tasks || [];
    const columns = [
      { key: 'not-started', title: 'Not Started', color: '#9e9e9e' },
      { key: 'in-progress', title: 'In Progress', color: '#ff9800' },
      { key: 'completed', title: 'Completed', color: '#4caf50' }
    ];

    const handleUpdateTaskStatus = (taskId, newStatus) => {
      setProjects(prev => prev.map(p => {
        if (p.id === project.id) {
          const updatedTasks = p.tasks.map(t => 
            t.id === taskId ? { ...t, status: newStatus } : t
          );
          return {
            ...p,
            tasks: updatedTasks,
            status: calculateProjectStatus(updatedTasks)
          };
        }
        return p;
      }));
    };

    return (
      <div style={{ padding: '20px', backgroundColor: theme === 'dark' ? '#252525' : '#f9f9f9', borderRadius: '8px' }}>
        <h3 style={{ margin: '0 0 20px 0' }}>📋 Kanban Board - {project.name}</h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: `repeat(${columns.length}, 1fr)`, 
          gap: '20px',
          minHeight: '400px'
        }}>
          {columns.map(column => (
            <div 
              key={column.key}
              style={{
                backgroundColor: theme === 'dark' ? '#1e1e1e' : '#ffffff',
                borderRadius: '8px',
                padding: '15px',
                border: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '15px',
                padding: '8px',
                backgroundColor: column.color + '22',
                borderRadius: '4px'
              }}>
                <h4 style={{ 
                  margin: 0,
                  color: column.color
                }}>
                  {column.title}
                </h4>
                <div style={{
                  marginLeft: '10px',
                  backgroundColor: column.color,
                  color: 'white',
                  borderRadius: '12px',
                  padding: '2px 8px',
                  fontSize: '12px'
                }}>
                  {tasks.filter(t => t.status === column.key).length}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {tasks
                  .filter(task => task.status === column.key)
                  .map(task => (
                    <div
                      key={task.id}
                      style={{
                        backgroundColor: theme === 'dark' ? '#252525' : '#f5f5f5',
                        padding: '10px',
                        borderRadius: '4px',
                        borderLeft: `4px solid ${getPriorityColor(task.priority)}`,
                        cursor: 'grab'
                      }}
                    >
                      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{task.name}</div>
                      <div style={{ fontSize: '12px', color: theme === 'dark' ? '#aaa' : '#666', marginBottom: '5px' }}>
                        {task.description}
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginTop: '8px',
                        fontSize: '12px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            backgroundColor: getPersonnelById(task.assignee).color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '10px'
                          }}>
                            {getPersonnelById(task.assignee).name.charAt(0)}
                          </div>
                          <span>{new Date(task.endDate).toLocaleDateString()}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          {column.key !== 'not-started' && (
                            <button
                              onClick={() => handleUpdateTaskStatus(task.id, 'not-started')}
                              style={{
                                border: 'none',
                                background: 'none',
                                cursor: 'pointer',
                                padding: '2px',
                                fontSize: '12px',
                                color: theme === 'dark' ? '#aaa' : '#666'
                              }}
                            >
                              ⬅️
                            </button>
                          )}
                          {column.key !== 'completed' && (
                            <button
                              onClick={() => handleUpdateTaskStatus(
                                task.id, 
                                column.key === 'not-started' ? 'in-progress' : 'completed'
                              )}
                              style={{
                                border: 'none',
                                background: 'none',
                                cursor: 'pointer',
                                padding: '2px',
                                fontSize: '12px',
                                color: theme === 'dark' ? '#aaa' : '#666'
                              }}
                            >
                              ➡️
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: theme === 'dark' ? '#1e1e1e' : '#ffffff',
        color: theme === 'dark' ? '#ffffff' : '#000000',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
        width: '95%',
        maxWidth: '1200px',
        height: '80vh',
        overflow: 'auto'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{ margin: 0 }}>Project Manager</h2>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {selectedProject && (
              <div style={{ display: 'flex', gap: '5px' }}>
                <button
                  onClick={() => setCurrentView('overview')}
                  style={{
                    backgroundColor: currentView === 'overview' ? '#2196f3' : '#666',
                    color: 'white',
                    border: 'none',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Overview
                </button>
                <button
                  onClick={() => setCurrentView('gantt')}
                  style={{
                    backgroundColor: currentView === 'gantt' ? '#2196f3' : '#666',
                    color: 'white',
                    border: 'none',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Gantt
                </button>
                <button
                  onClick={() => setCurrentView('kanban')}
                  style={{
                    backgroundColor: currentView === 'kanban' ? '#2196f3' : '#666',
                    color: 'white',
                    border: 'none',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Kanban
                </button>
              </div>
            )}
            {!showNewProjectForm && (
              <button
                onClick={handleNewProject}
                style={{
                  backgroundColor: '#4caf50',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  marginRight: '10px',
                  cursor: 'pointer'
                }}
              >
                New Project
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>

        {selectedProject && currentView === 'gantt' ? (
          <GanttChart project={selectedProject} />
        ) : selectedProject && currentView === 'kanban' ? (
          <KanbanBoard project={selectedProject} />
        ) : showNewProjectForm ? (
          <div style={{
            backgroundColor: theme === 'dark' ? '#252525' : '#f5f5f5',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h3 style={{ marginTop: 0 }}>Create New Project</h3>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Project Name:</label>
              <input
                type="text"
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid ' + (theme === 'dark' ? '#444' : '#ddd'),
                  backgroundColor: theme === 'dark' ? '#333' : '#fff',
                  color: theme === 'dark' ? '#fff' : '#000'
                }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Description:</label>
              <textarea
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid ' + (theme === 'dark' ? '#444' : '#ddd'),
                  backgroundColor: theme === 'dark' ? '#333' : '#fff',
                  color: theme === 'dark' ? '#fff' : '#000',
                  minHeight: '100px'
                }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Due Date:</label>
              <input
                type="date"
                value={newProject.dueDate}
                onChange={(e) => setNewProject({ ...newProject, dueDate: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid ' + (theme === 'dark' ? '#444' : '#ddd'),
                  backgroundColor: theme === 'dark' ? '#333' : '#fff',
                  color: theme === 'dark' ? '#fff' : '#000'
                }}
              />
            </div>
            <div>
              <button
                onClick={handleSaveProject}
                style={{
                  backgroundColor: '#4caf50',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  marginRight: '10px',
                  cursor: 'pointer'
                }}
              >
                Save Project
              </button>
              <button
                onClick={handleCancelForm}
                style={{
                  backgroundColor: '#f44336',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {projects.map(project => (
              <div
                key={project.id}
                style={{
                  backgroundColor: theme === 'dark' ? '#252525' : '#f5f5f5',
                  padding: '20px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h3 style={{ margin: 0 }}>{project.name}</h3>
                  <div>
                    <button
                      onClick={() => handleEditProject(project)}
                      style={{
                        backgroundColor: '#2196f3',
                        color: 'white',
                        border: 'none',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        marginRight: '5px',
                        cursor: 'pointer'
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      style={{
                        backgroundColor: '#f44336',
                        color: 'white',
                        border: 'none',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <p style={{ color: theme === 'dark' ? '#cccccc' : '#666666' }}>{project.description}</p>
                
                <div style={{ marginTop: '10px' }}>
                  <div style={{ marginBottom: '5px' }}>Progress: {getProjectProgress(project)}%</div>
                  <div style={{
                    height: '4px',
                    backgroundColor: theme === 'dark' ? '#333333' : '#e0e0e0',
                    borderRadius: '2px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${getProjectProgress(project)}%`,
                      height: '100%',
                      backgroundColor: '#4caf50',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>

                <div style={{ marginTop: '15px', fontSize: '0.9em', color: theme === 'dark' ? '#cccccc' : '#666666' }}>
                  <div>Due: {new Date(project.dueDate).toLocaleDateString()}</div>
                  <div>Status: {project.status}</div>
                  <div>Tasks: {getTaskStats(project).total}</div>
                </div>

                {/* Task Management Section */}
                <div style={{ marginTop: '20px', borderTop: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`, paddingTop: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h4 style={{ margin: 0 }}>Tasks</h4>
                    <button
                      onClick={() => {
                        setSelectedProject(project);
                        setShowNewTaskForm(true);
                      }}
                      style={{
                        backgroundColor: '#2196f3',
                        color: 'white',
                        border: 'none',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Add Task
                    </button>
                  </div>
                  {project.tasks && project.tasks.length > 0 ? (
                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {project.tasks.map(task => (
                        <div
                          key={task.id}
                          style={{
                            padding: '10px',
                            backgroundColor: theme === 'dark' ? '#333' : '#fff',
                            borderRadius: '4px',
                            marginBottom: '8px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{task.name}</div>
                              <div style={{ fontSize: '12px', color: theme === 'dark' ? '#aaa' : '#666' }}>
                                {task.description}
                              </div>
                              <div style={{ 
                                display: 'flex', 
                                gap: '10px', 
                                marginTop: '8px',
                                fontSize: '12px',
                                color: theme === 'dark' ? '#aaa' : '#666'
                              }}>
                                <div>Assigned: {getPersonnelById(task.assignee).name}</div>
                                <div>Due: {new Date(task.endDate).toLocaleDateString()}</div>
                                <div style={{
                                  padding: '2px 6px',
                                  borderRadius: '10px',
                                  backgroundColor: getPriorityColor(task.priority),
                                  color: 'white',
                                  fontSize: '10px'
                                }}>
                                  {task.priority.toUpperCase()}
                                </div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '5px' }}>
                              <button
                                onClick={() => {
                                  setSelectedProject(project);
                                  setEditingTask(task);
                                  setNewTask({
                                    name: task.name,
                                    description: task.description,
                                    priority: task.priority,
                                    assignee: task.assignee ? task.assignee.toString() : '',
                                    startDate: task.startDate,
                                    endDate: task.endDate,
                                    estimatedHours: task.estimatedHours
                                  });
                                  setShowNewTaskForm(true);
                                }}
                                style={{
                                  backgroundColor: '#2196f3',
                                  color: 'white',
                                  border: 'none',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '11px'
                                }}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                style={{
                                  backgroundColor: '#f44336',
                                  color: 'white',
                                  border: 'none',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '11px'
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '20px', color: theme === 'dark' ? '#aaa' : '#666' }}>
                      No tasks yet. Click "Add Task" to create one.
                    </div>
                  )}
                </div>
              </div>
            ))}
            {projects.length === 0 && (
              <div style={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                padding: '40px',
                backgroundColor: theme === 'dark' ? '#252525' : '#f5f5f5',
                borderRadius: '8px'
              }}>
                <h3>No projects yet</h3>
                <p>Click the "New Project" button to create your first project.</p>
              </div>
            )}
          </div>
        )}

        {/* Task Form Modal */}
        {showNewTaskForm && selectedProject && (
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: theme === 'dark' ? '#252525' : '#ffffff',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
            width: '90%',
            maxWidth: '500px',
            zIndex: 1001
          }}>
            <h3 style={{ marginTop: 0 }}>{editingTask ? 'Edit Task' : 'Create New Task'}</h3>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Task Name:</label>
              <input
                type="text"
                value={newTask.name}
                onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid ' + (theme === 'dark' ? '#444' : '#ddd'),
                  backgroundColor: theme === 'dark' ? '#333' : '#fff',
                  color: theme === 'dark' ? '#fff' : '#000'
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Description:</label>
              <textarea
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid ' + (theme === 'dark' ? '#444' : '#ddd'),
                  backgroundColor: theme === 'dark' ? '#333' : '#fff',
                  color: theme === 'dark' ? '#fff' : '#000',
                  minHeight: '80px'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>Priority:</label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid ' + (theme === 'dark' ? '#444' : '#ddd'),
                    backgroundColor: theme === 'dark' ? '#333' : '#fff',
                    color: theme === 'dark' ? '#fff' : '#000'
                  }}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>Assignee:</label>
                <select
                  value={newTask.assignee}
                  onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid ' + (theme === 'dark' ? '#444' : '#ddd'),
                    backgroundColor: theme === 'dark' ? '#333' : '#fff',
                    color: theme === 'dark' ? '#fff' : '#000'
                  }}
                >
                  <option value="">Select Assignee</option>
                  {personnel.map(person => (
                    <option key={person.id} value={person.id}>
                      {person.name} ({person.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>Start Date:</label>
                <input
                  type="date"
                  value={newTask.startDate}
                  onChange={(e) => setNewTask({ ...newTask, startDate: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid ' + (theme === 'dark' ? '#444' : '#ddd'),
                    backgroundColor: theme === 'dark' ? '#333' : '#fff',
                    color: theme === 'dark' ? '#fff' : '#000'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>End Date:</label>
                <input
                  type="date"
                  value={newTask.endDate}
                  onChange={(e) => setNewTask({ ...newTask, endDate: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid ' + (theme === 'dark' ? '#444' : '#ddd'),
                    backgroundColor: theme === 'dark' ? '#333' : '#fff',
                    color: theme === 'dark' ? '#fff' : '#000'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Estimated Hours:</label>
              <input
                type="number"
                value={newTask.estimatedHours}
                onChange={(e) => setNewTask({ ...newTask, estimatedHours: parseInt(e.target.value) || 0 })}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid ' + (theme === 'dark' ? '#444' : '#ddd'),
                  backgroundColor: theme === 'dark' ? '#333' : '#fff',
                  color: theme === 'dark' ? '#fff' : '#000'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={handleSaveTask}
                style={{
                  backgroundColor: '#4caf50',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {editingTask ? 'Save Changes' : 'Create Task'}
              </button>
              <button
                onClick={handleCancelForm}
                style={{
                  backgroundColor: '#f44336',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Make it globally available for the browser
window.ProjectManager = ProjectManager;
