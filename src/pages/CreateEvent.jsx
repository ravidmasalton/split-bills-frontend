import { useState } from 'react';
import { eventsAPI, authAPI } from '../services/api';
import './CreateEvent.css';

const CreateEvent = ({ onEventCreated }) => {
  const [showModal, setShowModal] = useState(false);
  const [eventName, setEventName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch all users when modal opens
  const handleOpenModal = async () => {
    setShowModal(true);
    try {
      const response = await authAPI.getAllUsers();
      setAllUsers(response.data);
    } catch (err) {
      setError('Failed to load users');
    }
  };

  // Toggle user selection
  const toggleMember = (user) => {
    if (selectedMembers.find(m => m.user_id === user.id)) {
      setSelectedMembers(selectedMembers.filter(m => m.user_id !== user.id));
    } else {
      setSelectedMembers([...selectedMembers, { user_id: user.id, email: user.email }]);
    }
  };

  // Create event
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    
    if (selectedMembers.length === 0) {
      setError('Please select at least one member');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await eventsAPI.createEvent({
        name: eventName,
        members: selectedMembers
      });
      
      // Reset form
      setEventName('');
      setSelectedMembers([]);
      setShowModal(false);
      
      // Notify parent to refresh events
      onEventCreated();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button onClick={handleOpenModal} className="create-event-btn">
        + Create New Event
      </button>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Event</h2>
              <button onClick={() => setShowModal(false)} className="close-btn">×</button>
            </div>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleCreateEvent}>
              {/* Event name input */}
              <div className="form-group">
                <label>Event Name</label>
                <input
                  type="text"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="e.g., Trip to Eilat"
                  required
                />
              </div>

              {/* Members selection */}
              <div className="form-group">
                <label>Select Members</label>
                <div className="members-list">
                  {allUsers.map(user => (
                    <div key={user.id} className="member-item">
                      <input
                        type="checkbox"
                        id={user.id}
                        checked={selectedMembers.some(m => m.user_id === user.id)}
                        onChange={() => toggleMember(user)}
                      />
                      <label htmlFor={user.id}>
                        {user.name} ({user.email})
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="selected-count">
                Selected: {selectedMembers.length} member(s)
              </div>

              <button type="submit" disabled={loading} className="submit-btn">
                {loading ? 'Creating...' : 'Create Event'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default CreateEvent;