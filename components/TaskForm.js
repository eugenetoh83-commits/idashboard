const TaskForm = ({ 
  theme, 
  newTask, 
  setNewTask, 
  handleSaveTask, 
  handleCancelForm, 
  editingTask,
  personnel 
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
        {editingTask ? '✏️ Edit Task' : '➕ New Task'}
      </h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Task Name *
          </label>
          <input
            type="text"
            value={newTask.name}
            onChange={(e) => setNewTask({...newTask, name: e.target.value})}
            placeholder="Enter task name"
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
            Priority
          </label>
          <select
            value={newTask.priority}
            onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: `1px solid ${theme === 'dark' ? '#333' : '#ddd'}`,
              backgroundColor: theme === 'dark' ? '#1e1e1e' : '#fff',
              color: theme === 'dark' ? '#fff' : '#000',
              fontSize: '14px'
            }}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Description
        </label>
        <textarea
          value={newTask.description}
          onChange={(e) => setNewTask({...newTask, description: e.target.value})}
          placeholder="Enter task description"
          rows={2}
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
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Assignee
          </label>
          <select
            value={newTask.assignee}
            onChange={(e) => setNewTask({...newTask, assignee: e.target.value})}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: `1px solid ${theme === 'dark' ? '#333' : '#ddd'}`,
              backgroundColor: theme === 'dark' ? '#1e1e1e' : '#fff',
              color: theme === 'dark' ? '#fff' : '#000',
              fontSize: '14px'
            }}
          >
            <option value="">-- Select Assignee --</option>
            {personnel.map(person => (
              <option key={person.id} value={person.id}>{person.name}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Start Date
          </label>
          <input
            type="date"
            value={newTask.startDate}
            onChange={(e) => setNewTask({...newTask, startDate: e.target.value})}
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
            End Date
          </label>
          <input
            type="date"
            value={newTask.endDate}
            onChange={(e) => setNewTask({...newTask, endDate: e.target.value})}
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
          Estimated Hours
        </label>
        <input
          type="number"
          value={newTask.estimatedHours}
          onChange={(e) => setNewTask({...newTask, estimatedHours: e.target.value})}
          placeholder="0"
          min="0"
          style={{
            width: '100px',
            padding: '8px',
            borderRadius: '4px',
            border: `1px solid ${theme === 'dark' ? '#333' : '#ddd'}`,
            backgroundColor: theme === 'dark' ? '#1e1e1e' : '#fff',
            color: theme === 'dark' ? '#fff' : '#000',
            fontSize: '14px'
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={handleSaveTask}
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
          {editingTask ? '💾 Update Task' : '➕ Create Task'}
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

export default TaskForm;
