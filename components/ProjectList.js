import { getTaskStats, getProjectProgress, getStatusColor } from './utils';

const ProjectList = ({ projects, theme, handleEditProject, handleDeleteProject, setSelectedProject }) => {
  return (
    <div>
      <h3 style={{ margin: '0 0 20px 0' }}>Projects ({projects.length})</h3>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '20px'
      }}>
        {projects.map(project => {
          const stats = getTaskStats(project);
          const progress = getProjectProgress(project);
          
          return (
            <div 
              key={project.id}
              onClick={() => setSelectedProject(project)}
              style={{
                border: `1px solid ${theme === 'dark' ? '#333' : '#eee'}`,
                borderRadius: '8px',
                padding: '20px',
                backgroundColor: theme === 'dark' ? '#252525' : '#f9f9f9',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'pointer'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <h4 style={{ margin: '0', fontSize: '18px', fontWeight: 'bold' }}>{project.name}</h4>
                <div 
                  style={{
                    backgroundColor: getStatusColor(project.status),
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase'
                  }}
                >
                  {project.status.replace('-', ' ')}
                </div>
              </div>
              
              <p style={{ 
                margin: '0 0 15px 0', 
                color: theme === 'dark' ? '#ccc' : '#666',
                lineHeight: '1.4',
                minHeight: '40px'
              }}>
                {project.description}
              </p>

              {/* Progress Bar */}
              <div style={{ marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Progress</span>
                  <span style={{ fontSize: '12px' }}>{progress}%</span>
                </div>
                <div style={{
                  width: '100%',
                  height: '6px',
                  backgroundColor: theme === 'dark' ? '#333' : '#e0e0e0',
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${progress}%`,
                    height: '100%',
                    backgroundColor: getStatusColor(project.status),
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>

              {/* Stats */}
              <div style={{ 
                display: 'flex', 
                gap: '15px',
                fontSize: '12px',
                color: theme === 'dark' ? '#999' : '#666',
                marginBottom: '15px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ 
                    backgroundColor: getStatusColor('completed'), 
                    width: '10px', 
                    height: '10px', 
                    borderRadius: '50%',
                    display: 'inline-block'
                  }}></span>
                  <span>{stats.completed} completed</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ 
                    backgroundColor: getStatusColor('in-progress'), 
                    width: '10px', 
                    height: '10px', 
                    borderRadius: '50%',
                    display: 'inline-block'
                  }}></span>
                  <span>{stats.inProgress} in progress</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ 
                    backgroundColor: getStatusColor('not-started'), 
                    width: '10px', 
                    height: '10px', 
                    borderRadius: '50%',
                    display: 'inline-block'
                  }}></span>
                  <span>{stats.notStarted} not started</span>
                </div>
              </div>

              {/* Due Date */}
              <div style={{ 
                fontSize: '12px',
                color: theme === 'dark' ? '#999' : '#666',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                marginBottom: '15px'
              }}>
                <span>📅</span>
                <span>Due: {project.dueDate ? new Date(project.dueDate).toLocaleDateString() : 'Not set'}</span>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditProject(project);
                  }}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: 'none',
                    backgroundColor: '#2196f3',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                >
                  ✏️ Edit
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteProject(project.id);
                  }}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: 'none',
                    backgroundColor: '#f44336',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          );
        })}

        {/* Empty State */}
        {projects.length === 0 && (
          <div style={{
            gridColumn: '1 / -1',
            textAlign: 'center',
            padding: '40px',
            color: theme === 'dark' ? '#666' : '#999',
            backgroundColor: theme === 'dark' ? '#252525' : '#f9f9f9',
            borderRadius: '8px'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>📋</div>
            <h3>No projects yet</h3>
            <p>Create your first project to get started with project management!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectList;
