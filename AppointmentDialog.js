// AppointmentDialog.js
const AppointmentDialog = ({ isOpen, onClose, theme }) => {
  const calendarRef = React.useRef(null);
  const [isClosing, setIsClosing] = React.useState(false);
  const [appointments, setAppointments] = React.useState(() => {
    const saved = localStorage.getItem('reservations');
    return saved ? JSON.parse(saved) : [];
  });

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300); // Match this duration with CSS transition duration
  };

  React.useEffect(() => {
    if (!window.FullCalendar) {
      console.error('[APPT] FullCalendar is not loaded');
      return;
    }
    if (isOpen && calendarRef.current) {
      const calendar = new window.FullCalendar.Calendar(calendarRef.current, {
        initialView: 'dayGridMonth',
        headerToolbar: {
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        events: appointments,
        editable: true,
        selectable: true,
        selectMirror: true,
        dayMaxEvents: true,
        themeSystem: theme === 'dark' ? 'dark' : 'standard',
        // Enable touch support
        longPressDelay: 500,
        eventLongPressDelay: 500,
        selectLongPressDelay: 500,
        // Touch-friendly event handling
        eventStartEditable: true,
        eventDurationEditable: true,
        select: function(info) {
          const title = prompt('Enter appointment title:');
          if (title) {
            const newEvent = {
              id: Date.now(),
              title: title,
              start: info.startStr,
              end: info.endStr,
              allDay: info.allDay
            };
            setAppointments(prev => {
              const updated = [...prev, newEvent];
              localStorage.setItem('reservations', JSON.stringify(updated));
              return updated;
            });
            calendar.addEvent(newEvent);
          }
          calendar.unselect();
        },
        eventClick: function(info) {
          // Prevent default to ensure touch events work
          info.jsEvent.preventDefault();
          if (confirm(`Delete appointment '${info.event.title}'?`)) {
            setAppointments(prev => {
              const updated = prev.filter(event => event.id !== parseInt(info.event.id));
              localStorage.setItem('reservations', JSON.stringify(updated));
              return updated;
            });
            info.event.remove();
          }
        },
        // Add touch event support for date clicking
        dateClick: function(info) {
          // Handle single tap on dates for touch devices
          if ('ontouchstart' in window) {
            const title = prompt('Enter appointment title:');
            if (title) {
              const newEvent = {
                id: Date.now(),
                title: title,
                start: info.dateStr,
                allDay: true
              };
              setAppointments(prev => {
                const updated = [...prev, newEvent];
                localStorage.setItem('reservations', JSON.stringify(updated));
                return updated;
              });
              calendar.addEvent(newEvent);
            }
          }
        }
      });
      calendar.render();

      // Cleanup
      return () => calendar.destroy();
    }
  }, [isOpen, theme, appointments]);

  // Add effect to listen for localStorage changes and refresh appointments
  React.useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('reservations');
      const newAppointments = saved ? JSON.parse(saved) : [];
      setAppointments(newAppointments);
    };

    // Listen for storage events (when localStorage is changed by other tabs/components)
    window.addEventListener('storage', handleStorageChange);

    // Also check for changes when the dialog opens
    if (isOpen) {
      handleStorageChange();
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isOpen]);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: '100%',
      maxWidth: '1000px',
      height: '100%',
      background: theme === 'dark' ? '#1E2028' : '#FFFFFF',
      boxShadow: '-4px 0 25px rgba(0, 0, 0, 0.15)',
      zIndex: 1000,
      transition: 'all 0.3s ease-in-out',
      transform: isClosing || !isOpen ? 'translateX(100%)' : 'translateX(0)',
      opacity: isOpen && !isClosing ? 1 : 0,
      visibility: isOpen || isClosing ? 'visible' : 'hidden',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px',
      boxSizing: 'border-box',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h2 style={{
          margin: 0,
          color: theme === 'dark' ? '#FFFFFF' : '#000000',
          fontFamily: 'Roboto Condensed, sans-serif'
        }}>
          Appointment Calendar
        </h2>
        <button
          onClick={handleClose}
          style={{
            background: 'none',
            border: 'none',
            color: theme === 'dark' ? '#FFFFFF' : '#000000',
            fontSize: '24px',
            cursor: 'pointer',
            padding: '5px',
          }}
        >
          ×
        </button>
      </div>
      <div ref={calendarRef} style={{ 
        flex: 1,
        touchAction: 'manipulation', // Improves touch responsiveness
        userSelect: 'none', // Prevents text selection on touch
        WebkitTouchCallout: 'none', // Prevents callout on iOS
        WebkitUserSelect: 'none',
        KhtmlUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none'
      }}></div>
    </div>
  );
};

// Make it available globally
console.log('[APPT] Attaching AppointmentDialog to window object');
window.AppointmentDialog = AppointmentDialog;
console.log('[APPT] AppointmentDialog attached:', !!window.AppointmentDialog);
