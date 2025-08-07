import { getPersonnelById, getStatusColor, getPriorityColor } from './utils';

const KanbanBoard = ({ project, theme, personnel, handleTaskStatusChange }) => {
  const tasks = project.tasks || [];
  const columns = [
    { key: 'not-started', title: 'Not Started', color: '#9e9e9e' },
    { key: 'in-progress', title: 'In Progress', color: '#ff9800' },
    { key: 'completed', title: 'Completed', color: '#4caf50' }
  ];

  return (
    <div style={{ padding: '20px' }}>
      <h3 style={{ margin: '0 0 20px 0' }}>📋 Kanban Board - {project.name}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
        {columns.map(column => (
          <div key={column.key} style={{
            backgroundColor: theme === 'dark' ? '#252525' : '#f9f9f9',
            borderRadius: '8px',
            padding: '15px',
            minHeight: '400px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '15px',
              borderBottom: `2px solid ${column.color}`,
              paddingBottom: '8px'
            }}>
              <div style={{
                width: '12px',
                height: '12px',
                backgroundColor: column.color,
                borderRadius: '50%'
              }} />
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>
                {column.title} ({tasks.filter(t => t.status === column.key).length})
              </h4>
            </div>

            {tasks.filter(task => task.status === column.key).map(task => {
              const assignee = getPersonnelById(personnel, task.assignee);
              return (
                <div key={task.id} style={{
                  backgroundColor: theme === 'dark' ? '#1e1e1e' : '#fff',
                  borderRadius: '6px',
                  padding: '12px',
                  marginBottom: '10px',
                  border: `1px solid ${theme === 'dark' ? '#333' : '#eee'}`,
                  cursor: 'pointer'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <h5 style={{ margin: 0, fontSize: '13px', fontWeight: 'bold' }}>{task.name}</h5>
                    <span style={{
                      backgroundColor: getPriorityColor(task.priority),
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: '10px',
                      fontSize: '10px',
                      fontWeight: 'bold'
                    }}>
                      {task.priority.toUpperCase()}
                    </span>
                  </div>
                  <p style={{ 
                    margin: '0 0 8px 0', 
                    fontSize: '11px', 
                    color: theme === 'dark' ? '#ccc' : '#666',
                    lineHeight: '1.3'
                  }}>
                    {task.description}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '10px'
                    }}>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        backgroundColor: assignee.color,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold'
                      }}>
                        {assignee.name.charAt(0)}
                      </div>
                      <span style={{ color: theme === 'dark' ? '#ccc' : '#666' }}>
                        {assignee.name}
                      </span>
                    </div>
                    <div style={{ fontSize: '10px', color: theme === 'dark' ? '#999' : '#666' }}>
                      {task.estimatedHours}h
                    </div>
                  </div>
                  
                  {/* Status change buttons */}
                  <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
                    {columns.map(col => (
                      col.key !== task.status && (
                        <button
                          key={col.key}
                          onClick={() => handleTaskStatusChange(task.id, col.key)}
                          style={{
                            backgroundColor: col.color,
                            color: 'white',
                            border: 'none',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '9px',
                            cursor: 'pointer'
                          }}
                        >
                          → {col.title}
                        </button>
                      )
                    ))}
                  </div>
                </div>
              );
            })}

            {tasks.filter(task => task.status === column.key).length === 0 && (
              <div style={{
                color: theme === 'dark' ? '#666' : '#999',
                textAlign: 'center',
                padding: '20px 0',
                fontStyle: 'italic',
                fontSize: '12px'
              }}>
                No tasks in this column
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default KanbanBoard;
