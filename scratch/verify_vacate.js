async function testRelease() {
  console.log("=== Starting Room Release Verification Test ===");

  // 1. Find an empty room
  const roomsRes = await fetch("http://localhost:3000/api/rooms");
  const rooms = await roomsRes.json();
  const room = rooms[0]; // Room ID 1 (AI-101)

  console.log(`Initial Room status for ${room.name}: ${room.status}`);
  if (room.status !== 'empty') {
    throw new Error("Room should initially be empty. Reset database first.");
  }

  // 2. Claim the room
  console.log(`Claiming room ${room.name}...`);
  const claimRes = await fetch(`http://localhost:3000/api/claim/${room.id}`, { method: 'POST' });
  const claimData = await claimRes.json();
  console.log(`Claim Response (${claimRes.status}):`, claimData);
  if (claimRes.status !== 200) throw new Error("Claim request failed");

  // Verify status is now 'claimed'
  const checkClaimedRes = await fetch("http://localhost:3000/api/rooms");
  const checkClaimedRooms = await checkClaimedRes.json();
  const claimedRoom = checkClaimedRooms.find(r => r.id === room.id);
  console.log(`Verifying room status is claimed: ${claimedRoom.status} (Expected: claimed)`);
  if (claimedRoom.status !== 'claimed') throw new Error("Room status should be 'claimed'");

  // 3. Release/Vacate the room
  console.log(`Vacating room ${room.name}...`);
  const releaseRes = await fetch(`http://localhost:3000/api/release/${room.id}`, { method: 'POST' });
  const releaseData = await releaseRes.json();
  console.log(`Release Response (${releaseRes.status}):`, releaseData);
  if (releaseRes.status !== 200) throw new Error("Release request failed");

  // Verify status is now 'empty' again
  const checkReleasedRes = await fetch("http://localhost:3000/api/rooms");
  const checkReleasedRooms = await checkReleasedRes.json();
  const releasedRoom = checkReleasedRooms.find(r => r.id === room.id);
  console.log(`Verifying room status is empty: ${releasedRoom.status} (Expected: empty)`);
  if (releasedRoom.status !== 'empty') throw new Error("Room status should be 'empty'");

  console.log("\n🟢 ROOM RELEASE VERIFICATION SUCCESSFUL: Vacating mechanism works perfectly!");
}

testRelease().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
