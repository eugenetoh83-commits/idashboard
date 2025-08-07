const WorkloadVisualization = ({ projects, personnel, theme }) => {
  const workload = personnel.map(person => {
    const personTasks = projects.flatMap(project => 
      (project.tasks || []).filter(task => task.assignee === person.id)
    );
    
    const totalHours = personTasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0);
    const completedHours = personTasks
      .filter(task => task.status === 'completed')
      .reduce((sum, task) => sum + (task.actualHours || task.estimatedHours || 0), 0);
    
    const projectBreakdown = projects.map(project => {
      const projectTasks = (project.tasks || []).filter(task => task.assignee === person.id);
      const projectHours = projectTasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0);
      return {
        projectName: project.name,
        hours: projectHours,
        taskCount: projectTasks.length
      };
    }).filter(p => p.hours > 0);

    return {
      ...person,
      totalHours,
      completedHours,
      activeTaskCount: personTasks.filter(task => task.status === 'in-progress').length,
      projectBreakdown
    };
  });

  const maxHours = Math.max(...workload.map(w => w.totalHours), 1);

  return (
    <div style={{ padding: '20px' }}>
      <h3 style={{ margin: '0 0 20px 0' }}>👥 Personnel Workload Analysis</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {workload.map(person => (
          <div key={person.id} style={{
            backgroundColor: theme === 'dark' ? '#252525' : '#f9f9f9',
            borderRadius: '8px',
            padding: '20px',
            border: `2px solid ${person.color}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                backgroundColor: person.color,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '16px'
              }}>
                {person.name.charAt(0)}
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '16px' }}>{person.name}</h4>
                <p style={{ margin: 0, fontSize: '12px', color: theme === 'dark' ? '#ccc' : '#666' }}>
                  {person.role}
                </p>
              </div>
            </div>

            {/* Workload bar */}
            <div style={{ marginBottom: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Total Workload</span>
                <span style={{ fontSize: '12px' }}>{person.totalHours}h</span>
              </div>
              <div style={{
                width: '100%',
                height: '8px',
                backgroundColor: theme === 'dark' ? '#1e1e1e' : '#e0e0e0',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${Math.min((person.totalHours / maxHours) * 100, 100)}%`,
                  height: '100%',
                  backgroundColor: person.color,
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
              <div style={{ textAlign: 'center', padding: '8px', backgroundColor: theme === 'dark' ? '#1e1e1e' : '#fff', borderRadius: '4px' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#4caf50' }}>{person.completedHours}</div>
                <div style={{ fontSize: '10px', color: theme === 'dark' ? '#ccc' : '#666' }}>Completed Hours</div>
              </div>
              <div style={{ textAlign: 'center', padding: '8px', backgroundColor: theme === 'dark' ? '#1e1e1e' : '#fff', borderRadius: '4px' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ff9800' }}>{person.activeTaskCount}</div>
                <div style={{ fontSize: '10px', color: theme === 'dark' ? '#ccc' : '#666' }}>Active Tasks</div>
              </div>
            </div>

            {/* Project breakdown */}
            <div>
              <h5 style={{ margin: '0 0 10px 0', fontSize: '12px', fontWeight: 'bold' }}>Project Breakdown:</h5>
              {person.projectBreakdown.length > 0 ? (
                person.projectBreakdown.map((proj, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '4px 8px',
                    backgroundColor: theme === 'dark' ? '#1e1e1e' : '#fff',
                    borderRadius: '4px',
                    marginBottom: '4px',
                    fontSize: '11px'
                  }}>
                    <span>{proj.projectName}</span>
                    <span style={{ color: person.color, fontWeight: 'bold' }}>
                      {proj.hours}h ({proj.taskCount} tasks)
                    </span>
                  </div>
                ))
              ) : (
                <div style={{ 
                  fontSize: '11px', 
                  color: theme === 'dark' ? '#666' : '#999',
                  fontStyle: 'italic',
                  textAlign: 'center',
                  padding: '10px'
                }}>
                  No assigned tasks
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkloadVisualization;
