// InfoDialog.js
// Sliding info panel with animated charts using Chart.js

(function() {
  // Set Chart.js global font defaults
  if (typeof Chart !== 'undefined') {
    Chart.defaults.font.family = 'Roboto Condensed, sans-serif';
  }

  function InfoDialog({ isOpen, onClose, theme }) {
    const [data, setData] = React.useState({
      lineChart: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          label: 'Performance Metrics',
          data: [65, 78, 80, 81, 76, 85],
          borderColor: theme === 'light' ? 'rgb(180, 200, 220)' : 'rgb(210, 230, 250)',
          backgroundColor: theme === 'light' ? 'rgba(180, 200, 220, 0.2)' : 'rgba(210, 230, 250, 0.2)',
          tension: 0.4
        }]
      },
      pieChart: {
        labels: ['Active', 'Inactive', 'Pending', 'Error'],
        datasets: [{
          data: [45, 20, 25, 10],
          backgroundColor: [
            'rgb(150, 170, 200)',
            'rgb(180, 200, 220)', 
            'rgb(210, 230, 250)',
            'rgb(220, 100, 100)'
          ]
        }]
      },
      barChart: {
        labels: ['CPU', 'Memory', 'Storage', 'Network'],
        datasets: [{
          label: 'Resource Usage (%)',
          data: [75, 60, 85, 45],
          backgroundColor: theme === 'light' ? 'rgba(180, 200, 220, 0.8)' : 'rgba(210, 230, 250, 0.8)',
          borderColor: theme === 'light' ? 'rgb(150, 170, 200)' : 'rgb(180, 200, 220)',
          borderWidth: 2
        }]
      }
    });

    const lineChartRef = React.useRef(null);
    const pieChartRef = React.useRef(null);
    const barChartRef = React.useRef(null);
    const chartInstances = React.useRef({});

    // Initialize charts when dialog opens
    React.useEffect(() => {
      if (isOpen && window.Chart) {
        setTimeout(() => {
          initializeCharts();
        }, 300); // Wait for slide animation
      }
      return () => {
        // Cleanup charts when dialog closes
        Object.values(chartInstances.current).forEach(chart => {
          if (chart) chart.destroy();
        });
        chartInstances.current = {};
      };
    }, [isOpen, theme]);

    function initializeCharts() {
      const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: theme === 'light' ? '#333' : '#fff',
              font: {
                family: 'Roboto Condensed, sans-serif'
              }
            }
          }
        },
        scales: {
          y: {
            ticks: { 
              color: theme === 'light' ? '#333' : '#fff',
              font: {
                family: 'Roboto Condensed, sans-serif'
              }
            },
            grid: { color: theme === 'light' ? '#ddd' : '#444' }
          },
          x: {
            ticks: { 
              color: theme === 'light' ? '#333' : '#fff',
              font: {
                family: 'Roboto Condensed, sans-serif'
              }
            },
            grid: { color: theme === 'light' ? '#ddd' : '#444' }
          }
        }
      };

      // Line Chart
      if (lineChartRef.current) {
        if (chartInstances.current.line) chartInstances.current.line.destroy();
        chartInstances.current.line = new Chart(lineChartRef.current, {
          type: 'line',
          data: data.lineChart,
          options: {
            ...commonOptions,
            animation: {
              duration: 2000,
              easing: 'easeInOutQuart'
            }
          }
        });
      }

      // Pie Chart
      if (pieChartRef.current) {
        if (chartInstances.current.pie) chartInstances.current.pie.destroy();
        chartInstances.current.pie = new Chart(pieChartRef.current, {
          type: 'doughnut',
          data: data.pieChart,
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  color: theme === 'light' ? '#333' : '#fff',
                  padding: 15,
                  font: {
                    family: 'Roboto Condensed, sans-serif'
                  }
                }
              }
            },
            animation: {
              duration: 2000,
              easing: 'easeInOutBounce'
            }
          }
        });
      }

      // Bar Chart
      if (barChartRef.current) {
        if (chartInstances.current.bar) chartInstances.current.bar.destroy();
        chartInstances.current.bar = new Chart(barChartRef.current, {
          type: 'bar',
          data: data.barChart,
          options: {
            ...commonOptions,
            animation: {
              duration: 2000,
              easing: 'easeInOutElastic'
            }
          }
        });
      }
    }

    // Simulate real-time data updates
    React.useEffect(() => {
      if (!isOpen) return;
      
      const interval = setInterval(() => {
        setData(prevData => ({
          lineChart: {
            ...prevData.lineChart,
            datasets: [{
              ...prevData.lineChart.datasets[0],
              data: prevData.lineChart.datasets[0].data.map(val => 
                Math.max(0, Math.min(100, val + (Math.random() - 0.5) * 10))
              )
            }]
          },
          pieChart: prevData.pieChart,
          barChart: {
            ...prevData.barChart,
            datasets: [{
              ...prevData.barChart.datasets[0],
              data: prevData.barChart.datasets[0].data.map(val => 
                Math.max(0, Math.min(100, val + (Math.random() - 0.5) * 15))
              )
            }]
          }
        }));
      }, 3000);

      return () => clearInterval(interval);
    }, [isOpen]);

    // Update chart data
    React.useEffect(() => {
      if (chartInstances.current.line) {
        chartInstances.current.line.data = data.lineChart;
        chartInstances.current.line.update('none');
      }
      if (chartInstances.current.bar) {
        chartInstances.current.bar.data = data.barChart;
        chartInstances.current.bar.update('none');
      }
    }, [data]);

    const dialogStyle = {
      position: 'fixed',
      top: 0,
      left: 0,
      height: '100vh',
      width: '400px',
      backgroundColor: theme === 'light' ? '#f8f9fa' : '#1a1a2e',
      color: theme === 'light' ? '#333' : '#fff',
      boxShadow: '4px 0 20px rgba(0,0,0,0.3)',
      transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
      transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      zIndex: 1000,
      overflowY: 'auto',
      fontFamily: 'Roboto Condensed, sans-serif'
    };

    return React.createElement('div', { style: dialogStyle }, [
      // Header
      React.createElement('div', {
        key: 'header',
        style: {
          padding: '20px',
          borderBottom: `2px solid ${theme === 'light' ? '#e0e0e0' : '#333'}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: theme === 'light' ? 'linear-gradient(135deg, rgb(210, 230, 250), rgb(180, 200, 220))' : 'linear-gradient(135deg, #2d3748, #1a1a2e)'
        }
      }, [
        React.createElement('h2', {
          key: 'title',
          style: {
            margin: 0,
            fontSize: '24px',
            fontWeight: 700,
            color: theme === 'light' ? '#333' : '#fff'
          }
        }, '📊 System Analytics'),
        React.createElement('button', {
          key: 'close',
          onClick: onClose,
          style: {
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: theme === 'light' ? '#333' : '#fff',
            padding: '5px 10px',
            borderRadius: '50%',
            transition: 'background-color 0.3s'
          },
          onMouseEnter: (e) => {
            e.target.style.backgroundColor = theme === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';
          },
          onMouseLeave: (e) => {
            e.target.style.backgroundColor = 'transparent';
          }
        }, '✕')
      ]),

      // Content
      React.createElement('div', {
        key: 'content',
        style: { padding: '20px' }
      }, [
        // Performance Line Chart
        React.createElement('div', {
          key: 'line-section',
          style: { marginBottom: '30px' }
        }, [
          React.createElement('h3', {
            key: 'line-title',
            style: { 
              marginBottom: '15px', 
              color: theme === 'light' ? '#333' : '#fff',
              fontSize: '18px',
              fontWeight: 600
            }
          }, '📈 Performance Trends'),
          React.createElement('div', {
            key: 'line-container',
            style: { 
              height: '200px', 
              backgroundColor: theme === 'light' ? '#fff' : '#2d3748',
              borderRadius: '8px',
              padding: '15px',
              boxShadow: theme === 'light' ? '0 2px 8px rgba(0,0,0,0.1)' : '0 2px 8px rgba(0,0,0,0.3)'
            }
          }, [
            React.createElement('canvas', {
              key: 'line-canvas',
              ref: lineChartRef
            })
          ])
        ]),

        // Resource Usage Bar Chart
        React.createElement('div', {
          key: 'bar-section',
          style: { marginBottom: '30px' }
        }, [
          React.createElement('h3', {
            key: 'bar-title',
            style: { 
              marginBottom: '15px', 
              color: theme === 'light' ? '#333' : '#fff',
              fontSize: '18px',
              fontWeight: 600
            }
          }, '📊 Resource Usage'),
          React.createElement('div', {
            key: 'bar-container',
            style: { 
              height: '200px', 
              backgroundColor: theme === 'light' ? '#fff' : '#2d3748',
              borderRadius: '8px',
              padding: '15px',
              boxShadow: theme === 'light' ? '0 2px 8px rgba(0,0,0,0.1)' : '0 2px 8px rgba(0,0,0,0.3)'
            }
          }, [
            React.createElement('canvas', {
              key: 'bar-canvas',
              ref: barChartRef
            })
          ])
        ]),

        // System Status Pie Chart
        React.createElement('div', {
          key: 'pie-section',
          style: { marginBottom: '30px' }
        }, [
          React.createElement('h3', {
            key: 'pie-title',
            style: { 
              marginBottom: '15px', 
              color: theme === 'light' ? '#333' : '#fff',
              fontSize: '18px',
              fontWeight: 600
            }
          }, '🎯 System Status'),
          React.createElement('div', {
            key: 'pie-container',
            style: { 
              height: '250px', 
              backgroundColor: theme === 'light' ? '#fff' : '#2d3748',
              borderRadius: '8px',
              padding: '15px',
              boxShadow: theme === 'light' ? '0 2px 8px rgba(0,0,0,0.1)' : '0 2px 8px rgba(0,0,0,0.3)'
            }
          }, [
            React.createElement('canvas', {
              key: 'pie-canvas',
              ref: pieChartRef
            })
          ])
        ]),

        // Live Stats Cards
        React.createElement('div', {
          key: 'stats-section'
        }, [
          React.createElement('h3', {
            key: 'stats-title',
            style: { 
              marginBottom: '15px', 
              color: theme === 'light' ? '#333' : '#fff',
              fontSize: '18px',
              fontWeight: 600
            }
          }, '⚡ Live Statistics'),
          React.createElement('div', {
            key: 'stats-grid',
            style: {
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '15px'
            }
          }, [
            ['Uptime', '99.9%', '⏱️'],
            ['Connections', '1,247', '🔗'],
            ['Throughput', '2.4 GB/s', '🚀'],
            ['Errors', '0.01%', '⚠️']
          ].map((stat, idx) => 
            React.createElement('div', {
              key: `stat-${idx}`,
              style: {
                padding: '15px',
                backgroundColor: theme === 'light' ? '#fff' : '#2d3748',
                borderRadius: '8px',
                textAlign: 'center',
                boxShadow: theme === 'light' ? '0 2px 8px rgba(0,0,0,0.1)' : '0 2px 8px rgba(0,0,0,0.3)',
                border: `2px solid ${theme === 'light' ? 'rgb(180, 200, 220)' : 'rgb(210, 230, 250)'}`
              }
            }, [
              React.createElement('div', {
                key: 'icon',
                style: { fontSize: '24px', marginBottom: '8px' }
              }, stat[2]),
              React.createElement('div', {
                key: 'value',
                style: { 
                  fontSize: '20px', 
                  fontWeight: 700,
                  color: theme === 'light' ? 'rgb(150, 170, 200)' : 'rgb(210, 230, 250)',
                  marginBottom: '4px'
                }
              }, stat[1]),
              React.createElement('div', {
                key: 'label',
                style: { 
                  fontSize: '12px', 
                  color: theme === 'light' ? '#666' : '#ccc',
                  fontWeight: 500
                }
              }, stat[0])
            ])
          ))
        ])
      ])
    ]);
  }

  window.InfoDialog = InfoDialog;
})();
