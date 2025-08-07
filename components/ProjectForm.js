const ProjectForm = ({ 
  theme, 
  newProject, 
  setNewProject, 
  handleSaveProject, 
  handleCancelForm, 
  editingProject 
}) => {
  return (
    <div style={{
      backgroundColor: theme === 'dark' ? '#252525' : '#f9f9f9',
      padding: '20px',
      borderRadius: '8px',
      marginBottom: '20px',
      border: `1px solid ${theme === 'dark' ? '#333' : '#ddd'}`
    }}>
      <h3 style={{ margin: '0 0 15px 0' }}>
        {editingProject ? '✏️ Edit Project' : '➕ New Project'}
      </h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Project Name *
          </label>
          <input
            type="text"
            value={newProject.name}
            onChange={(e) => setNewProject({...newProject, name: e.target.value})}
            placeholder="Enter project name"
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: `1px solid ${theme === 'dark' ? '#333' : '#ddd'}`,
              backgroundColor: theme === 'dark' ? '#1e1e1e' : '#fff',
              color: theme === 'dark' ? '#fff' : '#000',
              fontSize: '14px'
            }}
          />
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Due Date
          </label>
          <input
            type="date"
            value={newProject.dueDate}
            onChange={(e) => setNewProject({...newProject, dueDate: e.target.value})}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: `1px solid ${theme === 'dark' ? '#333' : '#ddd'}`,
              backgroundColor: theme === 'dark' ? '#1e1e1e' : '#fff',
              color: theme === 'dark' ? '#fff' : '#000',
              fontSize: '14px'
            }}
          />
        </div>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Description
        </label>
        <textarea
          value={newProject.description}
          onChange={(e) => setNewProject({...newProject, description: e.target.value})}
          placeholder="Enter project description"
          rows={3}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '4px',
            border: `1px solid ${theme === 'dark' ? '#333' : '#ddd'}`,
            backgroundColor: theme === 'dark' ? '#1e1e1e' : '#fff',
            color: theme === 'dark' ? '#fff' : '#000',
            fontSize: '14px',
            resize: 'vertical'
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={handleSaveProject}
          style={{
            backgroundColor: '#4caf50',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          {editingProject ? '💾 Update Project' : '➕ Create Project'}
        </button>
        <button
          onClick={handleCancelForm}
          style={{
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default ProjectForm;
