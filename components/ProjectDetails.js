import { getPersonnelById, getStatusColor, getPriorityColor } from './utils';

const ProjectDetails = ({ 
  selectedProject, 
  theme, 
  handleEditProject, 
  handleDeleteProject, 
  handleEditTask, 
  handleDeleteTask,
  handleNewTask
}) => {
  const tasks = selectedProject.tasks || [];
  const getTaskStats = () => {
    const completed = tasks.filter(t => t.status === 'completed').length;
    const inProgress = tasks.filter(t => t.status === 'in-progress').length;
    const notStarted = tasks.filter(t => t.status === 'not-started').length;
    return { total: tasks.length, completed, inProgress, notStarted };
  };
  
  const stats = getTaskStats();
  
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3 style={{ margin: '0 0 5px 0', fontSize: '20px' }}>{selectedProject.name}</h3>
          <p style={{ margin: '0', color: theme === 'dark' ? '#ccc' : '#666' }}>{selectedProject.description}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleNewTask}
            style={{
              backgroundColor: '#ff9800',
              color: 'white',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            ➕ New Task
          </button>
          <button
            onClick={() => handleEditProject(selectedProject)}
            style={{
              backgroundColor: '#2196f3',
              color: 'white',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            ✏️ Edit Project
          </button>
          <button
            onClick={() => handleDeleteProject(selectedProject.id)}
            style={{
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            🗑️ Delete Project
          </button>
        </div>
      </div>

      {/* Project Stats */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '15px',
        marginBottom: '20px'
      }}>
        <div style={{
          backgroundColor: theme === 'dark' ? '#252525' : '#f9f9f9',
          padding: '15px',
          borderRadius: '8px',
          textAlign: 'center',
          borderLeft: '4px solid #2196f3'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
            {stats.total}
          </div>
          <div style={{ fontSize: '12px', color: theme === 'dark' ? '#ccc' : '#666' }}>Total Tasks</div>
        </div>
        
        <div style={{
          backgroundColor: theme === 'dark' ? '#252525' : '#f9f9f9',
          padding: '15px',
          borderRadius: '8px',
          textAlign: 'center',
          borderLeft: '4px solid #4caf50'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
            {stats.completed}
          </div>
          <div style={{ fontSize: '12px', color: theme === 'dark' ? '#ccc' : '#666' }}>Completed</div>
        </div>
        
        <div style={{
          backgroundColor: theme === 'dark' ? '#252525' : '#f9f9f9',
          padding: '15px',
          borderRadius: '8px',
          textAlign: 'center',
          borderLeft: '4px solid #ff9800'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
            {stats.inProgress}
          </div>
          <div style={{ fontSize: '12px', color: theme === 'dark' ? '#ccc' : '#666' }}>In Progress</div>
        </div>
        
        <div style={{
          backgroundColor: theme === 'dark' ? '#252525' : '#f9f9f9',
          padding: '15px',
          borderRadius: '8px',
          textAlign: 'center',
          borderLeft: '4px solid #f44336'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
            {tasks.filter(t => t.priority === 'high' && t.status !== 'completed').length}
          </div>
          <div style={{ fontSize: '12px', color: theme === 'dark' ? '#ccc' : '#666' }}>High Priority</div>
        </div>
        
        <div style={{
          backgroundColor: theme === 'dark' ? '#252525' : '#f9f9f9',
          padding: '15px',
          borderRadius: '8px',
          textAlign: 'center',
          borderLeft: '4px solid #9e9e9e'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
            {selectedProject.dueDate ? new Date(selectedProject.dueDate).toLocaleDateString() : 'N/A'}
          </div>
          <div style={{ fontSize: '12px', color: theme === 'dark' ? '#ccc' : '#666' }}>Due Date</div>
        </div>
      </div>

      {/* Tasks Table */}
      <div style={{ marginTop: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3 style={{ margin: 0 }}>Project Tasks</h3>
        </div>
        
        <div style={{ 
          backgroundColor: theme === 'dark' ? '#252525' : '#f9f9f9', 
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '14px',
          }}>
            <thead>
              <tr style={{ backgroundColor: theme === 'dark' ? '#333' : '#eee' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}` }}>Task Name</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}` }}>Assignee</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}` }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}` }}>Priority</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}` }}>Timeline</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}` }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks && tasks.length > 0 ? (
                tasks.map(task => {
                  return (
                    <TaskTableRow 
                      key={task.id} 
                      task={task} 
                      theme={theme} 
                      handleEditTask={handleEditTask} 
                      handleDeleteTask={handleDeleteTask}
                    />
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: theme === 'dark' ? '#999' : '#666' }}>
                    No tasks added yet. Click "New Task" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Task table row component
const TaskTableRow = ({ task, theme, handleEditTask, handleDeleteTask }) => {
  const assignee = { name: 'Unassigned', color: '#999' }; // This would be getPersonnelById(personnel, task.assignee)
  
  return (
    <tr style={{
      backgroundColor: theme === 'dark' ? '#1e1e1e' : '#fff',
      borderBottom: `1px solid ${theme === 'dark' ? '#333' : '#eee'}`
    }}>
      <td style={{ padding: '12px' }}>
        <div style={{ fontWeight: 'bold' }}>{task.name}</div>
        <div style={{ fontSize: '12px', color: theme === 'dark' ? '#999' : '#666' }}>{task.description}</div>
      </td>
      <td style={{ padding: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width: '20px',
            height: '20px',
            backgroundColor: assignee.color,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '10px',
            fontWeight: 'bold'
          }}>
            {assignee.name.charAt(0)}
          </div>
          <span>{assignee.name}</span>
        </div>
      </td>
      <td style={{ padding: '12px' }}>
        <div style={{
          backgroundColor: getStatusColor(task.status),
          color: 'white',
          padding: '4px 8px',
          borderRadius: '12px',
          display: 'inline-block',
          fontSize: '11px',
          fontWeight: 'bold'
        }}>
          {task.status.replace('-', ' ')}
        </div>
      </td>
      <td style={{ padding: '12px' }}>
        <div style={{
          backgroundColor: getPriorityColor(task.priority),
          color: 'white',
          padding: '4px 8px',
          borderRadius: '12px',
          display: 'inline-block',
          fontSize: '11px',
          fontWeight: 'bold'
        }}>
          {task.priority}
        </div>
      </td>
      <td style={{ padding: '12px' }}>
        <div style={{ fontSize: '12px' }}>
          {task.startDate && task.endDate ? 
            `${new Date(task.startDate).toLocaleDateString()} - ${new Date(task.endDate).toLocaleDateString()}` : 
            'Not scheduled'}
        </div>
        <div style={{ fontSize: '12px', color: theme === 'dark' ? '#999' : '#666' }}>
          {task.estimatedHours} hours estimated
        </div>
      </td>
      <td style={{ padding: '12px' }}>
        <div style={{ display: 'flex', gap: '5px' }}>
          <button
            onClick={() => handleEditTask(task)}
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
      </td>
    </tr>
  );
};

export default ProjectDetails;
