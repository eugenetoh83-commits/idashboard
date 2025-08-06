const ProjectManager = ({ isOpen, onClose, theme }) => {
  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div 
        style={{
          backgroundColor: theme === 'dark' ? '#1e1e1e' : '#ffffff',
          color: theme === 'dark' ? '#ffffff' : '#000000',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
          width: '80%',
          maxWidth: '1200px',
          maxHeight: '80vh',
          overflow: 'auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px',
          borderBottom: `1px solid ${theme === 'dark' ? '#333' : '#eee'}`,
          paddingBottom: '10px'
        }}>
          <h2 style={{ margin: 0 }}>Project Manager</h2>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: theme === 'dark' ? '#fff' : '#000',
              padding: '5px 10px',
            }}
          >
            ×
          </button>
        </div>
        
        {/* Project Management Content */}
        <div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            marginBottom: '20px' 
          }}>
            <h3 style={{ margin: 0 }}>My Projects</h3>
            <button
              style={{
                backgroundColor: '#2196f3',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span style={{ fontSize: '20px' }}>+</span> New Project
            </button>
          </div>

          {/* Project Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '20px',
            padding: '20px 0'
          }}>
            {/* Example Project Cards */}
            {[1, 2, 3].map(index => (
              <div 
                key={index}
                style={{
                  border: `1px solid ${theme === 'dark' ? '#333' : '#eee'}`,
                  borderRadius: '8px',
                  padding: '15px',
                  backgroundColor: theme === 'dark' ? '#252525' : '#f9f9f9'
                }}
              >
                <h4 style={{ margin: '0 0 10px 0' }}>Project {index}</h4>
                <p style={{ margin: '0 0 15px 0', color: theme === 'dark' ? '#ccc' : '#666' }}>
                  This is a sample project description. Click to view details and manage tasks.
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ 
                    display: 'flex', 
                    gap: '5px',
                    fontSize: '12px',
                    color: theme === 'dark' ? '#999' : '#666'
                  }}>
                    <span>Tasks: 5</span>
                    <span>|</span>
                    <span>Due: Aug 15</span>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button style={{
                      padding: '5px 10px',
                      borderRadius: '4px',
                      border: 'none',
                      backgroundColor: '#2196f3',
                      color: 'white',
                      cursor: 'pointer'
                    }}>
                      Edit
                    </button>
                    <button style={{
                      padding: '5px 10px',
                      borderRadius: '4px',
                      border: 'none',
                      backgroundColor: '#f44336',
                      color: 'white',
                      cursor: 'pointer'
                    }}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Add to window object for global access
if (typeof window !== 'undefined') {
  console.log('[PROJECT] Attaching ProjectManager to window object');
  window.ProjectManager = ProjectManager;
  console.log('[PROJECT] ProjectManager attached:', !!window.ProjectManager);
}
