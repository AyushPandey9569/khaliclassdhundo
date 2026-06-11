import { useState, useEffect, useRef } from 'react';

let API_URL = import.meta.env.VITE_API_URL || "";
if (!API_URL || API_URL.trim() === "" || API_URL.trim() === "/") {
  API_URL = "http://localhost:3000";
} else {
  API_URL = API_URL.trim();
  if (!API_URL.startsWith("http://") && !API_URL.startsWith("https://")) {
    API_URL = "https://" + API_URL;
  }
  if (API_URL.endsWith("/")) {
    API_URL = API_URL.slice(0, -1);
  }
}

function App() {
  const [rooms, setRooms] = useState([]);
  const [block, setBlock] = useState('All');
  const [canteen, setCanteen] = useState('All');
  const [claimingRooms, setClaimingRooms] = useState({});
  const [toast, setToast] = useState(null);
  const lastClickTime = useRef({});

  const blocks = ['All', 'AI Block', 'A Block', 'B Block', 'C Block', 'D Block'];
  const canteens = ['All', 'Fusion Cafe', 'Chai Adda', 'Maggie Point', 'Le Broc'];

  useEffect(() => {
    fetchRooms();
  }, [block, canteen]);

  useEffect(() => {
    return () => {
      if (window.toastTimeout) clearTimeout(window.toastTimeout);
    };
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await fetch(`${API_URL}/api/rooms?block=${block}&canteen=${canteen}`);
      const data = await response.json();
      setRooms(data);
    } catch (error) {
      console.error("Error fetching rooms:", error);
      showToast("Failed to fetch rooms", "error");
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    if (window.toastTimeout) clearTimeout(window.toastTimeout);
    window.toastTimeout = setTimeout(() => {
      setToast(null);
    }, 5000);
  };

  const handleClaim = async (id) => {
    const now = Date.now();
    // Debounce / Click-Throttle: Ignore clicks within 800ms
    if (lastClickTime.current[id] && (now - lastClickTime.current[id] < 800)) {
      console.log(`Click for room ${id} debounced.`);
      return;
    }
    lastClickTime.current[id] = now;

    // Frontend state locking
    if (claimingRooms[id]) return;

    setClaimingRooms(prev => ({ ...prev, [id]: true }));

    try {
      const response = await fetch(`${API_URL}/api/claim/${id}`, {
        method: 'POST'
      });
      const data = await response.json();
      
      if (response.ok) {
        showToast(data.message || "Room claimed successfully!", "success");
        fetchRooms();
      } else {
        showToast(data.error || "Room is already claimed", "error");
        fetchRooms();
      }
    } catch (error) {
      showToast("Error claiming room", "error");
    } finally {
      setClaimingRooms(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleRelease = async (id) => {
    const now = Date.now();
    // Debounce / Click-Throttle: Ignore clicks within 800ms
    if (lastClickTime.current[id] && (now - lastClickTime.current[id] < 800)) {
      console.log(`Release click for room ${id} debounced.`);
      return;
    }
    lastClickTime.current[id] = now;

    if (claimingRooms[id]) return;

    setClaimingRooms(prev => ({ ...prev, [id]: true }));

    try {
      const response = await fetch(`${API_URL}/api/release/${id}`, {
        method: 'POST'
      });
      const data = await response.json();
      
      if (response.ok) {
        showToast(data.message || "Room released successfully!", "success");
        fetchRooms();
      } else {
        showToast(data.error || "Room could not be released", "error");
        fetchRooms();
      }
    } catch (error) {
      showToast("Error vacating room", "error");
    } finally {
      setClaimingRooms(prev => ({ ...prev, [id]: false }));
    }
  };

  // Helper to resolve canteen icon & styling badges
  const getCanteenBadge = (description) => {
    const desc = description.toLowerCase();
    if (desc.includes('fusion')) return { name: 'Fusion Cafe', emoji: '🍛', class: 'fusion' };
    if (desc.includes('chai')) return { name: 'Chai Adda', emoji: '☕', class: 'chai' };
    if (desc.includes('maggie')) return { name: 'Maggie Point', emoji: '🍜', class: 'maggie' };
    if (desc.includes('broc')) return { name: 'Le Broc', emoji: '🥐', class: 'lebroc' };
    return null;
  };

  const totalRooms = rooms.length;
  const emptyRoomsCount = rooms.filter(r => r.status === 'empty').length;
  const claimedRoomsCount = rooms.filter(r => r.status === 'claimed').length;
  const isFilterActive = block !== 'All' || canteen !== 'All';

  return (
    <div className="container">
      <header className="dashboard-header">
        <div className="logo-section">
          <span className="logo-icon">🏫</span>
          <div>
            <h1>Khali Class Dhundo</h1>
            <p className="subtitle">Real-time Classroom Availability • Galgotias University</p>
          </div>
        </div>
        <div className="system-badge-container">
          <span className="pulse-indicator"></span>
          <span className="system-badge">iCloud EMS Sync Active</span>
        </div>
      </header>

      {/* Stats Dashboard */}
      <section className="stats-container">
        <div className="stat-card">
          <div className="stat-value-container">
            <span className="stat-value">{totalRooms}</span>
            <span className="stat-icon-mini">📊</span>
          </div>
          <div className="stat-label">Total Classrooms</div>
          <div className="stat-bar"><div className="stat-progress" style={{ width: '100%', backgroundColor: '#60a5fa' }}></div></div>
        </div>
        <div className="stat-card empty-rooms">
          <div className="stat-value-container">
            <span className="stat-value">{emptyRoomsCount}</span>
            <span className="stat-icon-mini">🟢</span>
          </div>
          <div className="stat-label">Available (Khali)</div>
          <div className="stat-bar">
            <div 
              className="stat-progress" 
              style={{ 
                width: `${totalRooms > 0 ? (emptyRoomsCount / totalRooms) * 100 : 0}%`,
                backgroundColor: 'var(--color-available)'
              }}
            ></div>
          </div>
        </div>
        <div className="stat-card claimed-rooms">
          <div className="stat-value-container">
            <span className="stat-value">{claimedRoomsCount}</span>
            <span className="stat-icon-mini">🔴</span>
          </div>
          <div className="stat-label">Claimed (Occupied)</div>
          <div className="stat-bar">
            <div 
              className="stat-progress" 
              style={{ 
                width: `${totalRooms > 0 ? (claimedRoomsCount / totalRooms) * 100 : 0}%`,
                backgroundColor: 'var(--color-claimed)'
              }}
            ></div>
          </div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="glass-panel filter-section">
        <div className="filter-header-row">
          <h2>Refine Search</h2>
          {isFilterActive && (
            <button 
              className="reset-btn" 
              onClick={() => { setBlock('All'); setCanteen('All'); }}
              title="Clear all filters"
            >
              Reset Filters ✕
            </button>
          )}
        </div>
        
        <div className="filters-row">
          <div className="filter-group">
            <label htmlFor="block-select">Block Location</label>
            <select 
              id="block-select" 
              value={block} 
              onChange={(e) => setBlock(e.target.value)}
              className="custom-select"
            >
              {blocks.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="canteen-select">Proximity to Canteen</label>
            <select 
              id="canteen-select" 
              value={canteen} 
              onChange={(e) => setCanteen(e.target.value)}
              className="custom-select"
            >
              {canteens.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </section>

      {/* Toast Notifications */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          <span className="toast-icon">
            {toast.type === 'success' ? '✅' : '❌'}
          </span>
          <span className="toast-message">{toast.message}</span>
          <button className="toast-close-btn" onClick={() => setToast(null)}>×</button>
        </div>
      )}

      {/* Classroom Grid */}
      <main className="rooms-grid">
        {rooms.length === 0 ? (
          <div className="no-rooms-card">
            <span className="no-rooms-icon">🔍</span>
            <p>No classrooms match your filter criteria.</p>
          </div>
        ) : (
          rooms.map((room) => {
            const isClaiming = !!claimingRooms[room.id];
            const isClaimed = room.status === 'claimed';
            const isDisabled = isClaimed || isClaiming;
            const canteenBadge = getCanteenBadge(room.description);

            return (
              <div 
                key={room.id} 
                className={`room-card ${room.status} ${isClaiming ? 'claiming' : ''}`}
              >
                <div className="room-card-header">
                  <h3>{room.name}</h3>
                  <span className={`status-badge ${room.status}`}>
                    {room.status === 'empty' ? 'Available' : 'Claimed'}
                  </span>
                </div>
                
                <div className="badges-row">
                  <span className="block-tag">{room.block}</span>
                  {canteenBadge && (
                    <span className={`canteen-badge-tag ${canteenBadge.class}`}>
                      {canteenBadge.emoji} {canteenBadge.name}
                    </span>
                  )}
                </div>
                
                <p className="description">
                  <span className="pin-icon">📍</span> {room.description}
                </p>
                
                {isClaimed ? (
                  <button 
                    id={`release-btn-${room.id}`}
                    className={`vacate-btn ${isClaiming ? 'disabled' : ''} ${isClaiming ? 'loading' : ''}`}
                    onClick={() => handleRelease(room.id)}
                    disabled={isClaiming}
                  >
                    {isClaiming ? (
                      <>
                        <span className="spinner"></span>
                        Vacating...
                      </>
                    ) : (
                      'Vacate Room ✕'
                    )}
                  </button>
                ) : (
                  <button 
                    id={`claim-btn-${room.id}`}
                    className={`claim-btn ${isDisabled ? 'disabled' : ''} ${isClaiming ? 'loading' : ''}`}
                    onClick={() => handleClaim(room.id)}
                    disabled={isDisabled}
                  >
                    {isClaiming ? (
                      <>
                        <span className="spinner"></span>
                        Claiming...
                      </>
                    ) : (
                      'Claim Room'
                    )}
                  </button>
                )}
              </div>
            );
          })
        )}
      </main>
    </div>
  );
}

export default App;
