import { useState } from 'react';
import { Plus, X, UserPlus } from 'lucide-react';
import { eventsAPI, authAPI } from '../services/api';
import './CreateEvent.css';

const CreateEvent = ({ onEventCreated }) => {
  const [showModal, setShowModal] = useState(false);
  const [eventName, setEventName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
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

  // Handle search input change
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim() === '') {
      setFilteredUsers([]);
      setShowSuggestions(false);
      return;
    }

    // Filter users based on search query (email or name)
    const filtered = allUsers.filter(user => 
      (user.email.toLowerCase().includes(query.toLowerCase()) ||
       user.name.toLowerCase().includes(query.toLowerCase())) &&
      !selectedMembers.find(m => m.user_id === user.id)
    );

    setFilteredUsers(filtered);
    setShowSuggestions(filtered.length > 0);
  };

  // Add member from suggestions
  const addMember = (user) => {
    setSelectedMembers([...selectedMembers, { user_id: user.id, email: user.email, name: user.name }]);
    setSearchQuery('');
    setFilteredUsers([]);
    setShowSuggestions(false);
  };

  // Remove member
  const removeMember = (userId) => {
    setSelectedMembers(selectedMembers.filter(m => m.user_id !== userId));
  };

  // Create event
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    
    if (selectedMembers.length === 0) {
      setError('Please add at least one member');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await eventsAPI.createEvent({
        name: eventName,
        members: selectedMembers.map(m => ({ email: m.email }))
      });
      
      // Reset form
      setEventName('');
      setSelectedMembers([]);
      setSearchQuery('');
      setShowModal(false);
      
      // Notify parent to refresh events
      onEventCreated();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  // Close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setEventName('');
    setSelectedMembers([]);
    setSearchQuery('');
    setError('');
  };

  return (
    <>
      <button onClick={handleOpenModal} className="create-event-btn">
        <Plus size={20} /> Create New Event
      </button>

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Event</h2>
              <button onClick={handleCloseModal} className="close-btn"><X size={24} /></button>
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

              {/* Member search */}
              <div className="form-group">
                <label>Add Members</label>
                <div className="search-container">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onFocus={() => searchQuery && setShowSuggestions(true)}
                    placeholder="Search by email or name..."
                    className="search-input"
                  />
                  
                  {/* Suggestions dropdown */}
                  {showSuggestions && filteredUsers.length > 0 && (
                    <div className="suggestions-dropdown">
                      {filteredUsers.slice(0, 5).map(user => (
                        <div 
                          key={user.id} 
                          className="suggestion-item"
                          onClick={() => addMember(user)}
                        >
                          <div className="suggestion-info">
                            <strong>{user.name}</strong>
                            <span className="suggestion-email">{user.email}</span>
                          </div>
                          <button type="button" className="add-btn"><UserPlus size={18} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Selected members */}
              {selectedMembers.length > 0 && (
                <div className="selected-members">
                  <label>Selected Members ({selectedMembers.length})</label>
                  <div className="members-chips">
                    {selectedMembers.map(member => (
                      <div key={member.user_id} className="member-chip">
                        <span>{member.name || member.email}</span>
                        <button 
                          type="button"
                          onClick={() => removeMember(member.user_id)}
                          className="remove-chip-btn"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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