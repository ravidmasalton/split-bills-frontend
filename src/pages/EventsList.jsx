import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { eventsAPI } from '../services/api';
import CreateEvent from './CreateEvent';
import './EventsList.css';

const EventsList = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Fetch all events
  const fetchEvents = async () => {
    setLoading(true);
    try {
      const response = await eventsAPI.getMyEvents();
      console.log('API Response:', response.data); // Debug log
      
      // Check if response.data is an array or object
      if (Array.isArray(response.data)) {
        setEvents(response.data);
      } else if (response.data.events) {
        setEvents(response.data.events);
      } else {
        setEvents([]);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events');
      setEvents([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Handle event click - navigate to event details
  const handleEventClick = (eventId) => {
    navigate(`/event/${eventId}`);
  };

  return (
    <div className="events-list-container">
      {/* Header */}
      <div className="events-header">
        <div className="header-left">
          <h1>Split Bills</h1>
          <p className="welcome-text">Welcome, {user?.name}!</p>
        </div>
        <button onClick={handleLogout} className="logout-btn">
          <LogOut size={18} /> Logout
        </button>
      </div>

      {/* Actions bar */}
      <div className="actions-bar">
        <CreateEvent onEventCreated={fetchEvents} />
      </div>

      {/* Events list */}
      <div className="events-content">
        <h2>My Events</h2>

        {loading && <div className="loading">Loading events...</div>}
        
        {error && <div className="error-message">{error}</div>}

        {!loading && events.length === 0 && (
          <div className="empty-state">
            <p>No events yet. Create your first event!</p>
          </div>
        )}

        <div className="events-grid">
          {events.map(event => (
            <div 
              key={event.id} 
              className="event-card"
              onClick={() => handleEventClick(event.id)}
            >
              <h3>{event.name}</h3>
              <div className="event-info">
                <p><strong>Members:</strong> {event.members?.length || 0}</p>
                <p><strong>Expenses:</strong> {event.expenses_count || 0}</p>
                
              </div>
              <div className="event-date">
                Created: {new Date(event.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EventsList;