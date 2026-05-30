import { useState, useEffect } from 'react';

function App() {
  const [rooms, setRooms] = useState([]);
  const [block, setBlock] = useState('All');
  const [message, setMessage] = useState('');

  const blocks = ['All', 'AI Block', 'A Block', 'B Block', 'C Block', 'D Block'];

  useEffect(() => {
    fetchRooms();
  }, [block]);

  const fetchRooms = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/rooms?block=${block}`);
      const data = await response.json();
      setRooms(data);
    } catch (error) {
      console.error("Error fetching rooms:", error);
    }
  };

  const handleClaim = async (id) => {
    // INTENTIONAL BUG: No loading state, no button disabling, no debouncing.
    // Multiple rapid clicks will fire multiple requests.
    try {
      console.log(`Firing claim request for room ${id}`);
      const response = await fetch(`http://localhost:3000/api/claim/${id}`, {
        method: 'POST'
      });
      const data = await response.json();
      
      if (response.ok) {
        setMessage(data.message);
        fetchRooms(); // Refresh the list
      } else {
        setMessage(data.error);
      }
    } catch (error) {
      setMessage("Error claiming room");
    }
  };

  return (
    <div className="container">
      <header>
        <h1>Khali Class Dhundo 🏫</h1>
        <p className="subtitle">Powered by Mock Icloud EMS™</p>
      </header>

      <div className="filter-section">
        <label>Filter by Block: </label>
        <select value={block} onChange={(e) => setBlock(e.target.value)}>
          {blocks.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      {message && <div className="toast">{message}</div>}

      <div className="rooms-grid">
        {rooms.map((room) => (
          <div key={room.id} className={`room-card ${room.status}`}>
            <h3>{room.name}</h3>
            <p className="block-tag">{room.block}</p>
            <p className="description">📍 {room.description}</p>
            <p className="status">Status: <strong>{room.status}</strong></p>
            
            {/* INTENTIONAL BUG: Button is never disabled, allowing rapid concurrent clicks */}
            <button 
              className="claim-btn"
              onClick={() => handleClaim(room.id)}
            >
              Claim Room
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
