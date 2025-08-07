import { getPersonnelById, getStatusColor } from './utils';

const GanttChart = ({ project, theme, personnel }) => {
  const tasks = project.tasks || [];
  if (tasks.length === 0) {
    return (
      <div style={{ padding: '20px', backgroundColor: theme === 'dark' ? '#252525' : '#f9f9f9', borderRadius: '8px' }}>
        <h3 style={{ margin: '0 0 20px 0' }}>📊 Gantt Chart - {project.name}</h3>
        <div style={{ textAlign: 'center', padding: '40px 20px', color: theme === 'dark' ? '#999' : '#666' }}>
          <p>No tasks available. Add tasks to see the Gantt chart.</p>
        </div>
      </div>
    );
  }
  
  const startDate = new Date(Math.min(...tasks.map(t => new Date(t.startDate || Date.now()))));
  const endDate = new Date(Math.max(...tasks.map(t => new Date(t.endDate || Date.now()))));
  const totalDays = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)));

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
    <div style={{ padding: '20px', backgroundColor: theme === 'dark' ? '#252525' : '#f9f9f9', borderRadius: '8px' }}>
      <h3 style={{ margin: '0 0 20px 0' }}>📊 Gantt Chart - {project.name}</h3>
      
      {/* Timeline header */}
      <div style={{ display: 'flex', marginBottom: '10px', fontSize: '12px', color: theme === 'dark' ? '#ccc' : '#666' }}>
        <div style={{ width: '200px', fontWeight: 'bold' }}>Task</div>
        <div style={{ flex: 1, position: 'relative', height: '20px', backgroundColor: theme === 'dark' ? '#1e1e1e' : '#eee', borderRadius: '4px' }}>
          {Array.from({ length: Math.min(totalDays, 30) }, (_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${(i / totalDays) * 100}%`,
                height: '100%',
                borderLeft: `1px solid ${theme === 'dark' ? '#333' : '#ddd'}`,
                fontSize: '10px',
                paddingLeft: '2px'
              }}
            >
              {Math.floor(i / 7) + 1}
            </div>
          ))}
        </div>
      </div>

      {/* Task rows */}
      {tasks.map(task => {
        const position = getTaskPosition(task);
        const assignee = getPersonnelById(personnel, task.assignee);
        
        return (
          <div key={task.id} style={{ display: 'flex', marginBottom: '8px', alignItems: 'center' }}>
            <div style={{ 
              width: '200px', 
              fontSize: '12px', 
              fontWeight: 'bold',
              color: theme === 'dark' ? '#fff' : '#000'
            }}>
              <div>{task.name}</div>
              <div style={{ fontSize: '10px', color: assignee.color }}>{assignee.name}</div>
            </div>
            <div style={{ 
              flex: 1, 
              position: 'relative', 
              height: '24px', 
              backgroundColor: theme === 'dark' ? '#1e1e1e' : '#eee',
              borderRadius: '4px'
            }}>
              <div
                style={{
                  position: 'absolute',
                  ...position,
                  height: '20px',
                  top: '2px',
                  backgroundColor: getStatusColor(task.status),
                  borderRadius: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  color: 'white',
                  fontWeight: 'bold'
                }}
              >
                {task.priority.toUpperCase()}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default GanttChart;
