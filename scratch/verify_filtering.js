async function testFiltering() {
  console.log("=== Starting Filtering Verification Test ===");

  // 1. Test Fetching All
  const allRes = await fetch("http://localhost:3000/api/rooms");
  const allRooms = await allRes.json();
  console.log(`\nFetch All: Got ${allRooms.length} rooms (Expected: 10)`);
  if (allRooms.length !== 10) throw new Error("Expected 10 rooms");

  // 2. Test block=AI Block
  const aiRes = await fetch("http://localhost:3000/api/rooms?block=AI+Block");
  const aiRooms = await aiRes.json();
  console.log(`Fetch Block 'AI Block': Got ${aiRooms.length} rooms`);
  aiRooms.forEach(r => {
    console.log(`  Room: ${r.name}, Block: ${r.block}, Desc: ${r.description}`);
    if (r.block !== "AI Block") throw new Error("Expected room block to be 'AI Block'");
  });

  // 3. Test canteen=Fusion Cafe
  const fusionRes = await fetch("http://localhost:3000/api/rooms?canteen=Fusion+Cafe");
  const fusionRooms = await fusionRes.json();
  console.log(`Fetch Canteen 'Fusion Cafe': Got ${fusionRooms.length} rooms`);
  fusionRooms.forEach(r => {
    console.log(`  Room: ${r.name}, Block: ${r.block}, Desc: ${r.description}`);
    if (!r.description.toLowerCase().includes("fusion")) throw new Error("Expected room to be near Fusion Cafe");
  });

  // 4. Test block=AI Block and canteen=Fusion Cafe combined
  const combinedRes = await fetch("http://localhost:3000/api/rooms?block=AI+Block&canteen=Fusion+Cafe");
  const combinedRooms = await combinedRes.json();
  console.log(`Fetch Block 'AI Block' AND Canteen 'Fusion Cafe': Got ${combinedRooms.length} rooms`);
  combinedRooms.forEach(r => {
    console.log(`  Room: ${r.name}, Block: ${r.block}, Desc: ${r.description}`);
    if (r.block !== "AI Block" || !r.description.toLowerCase().includes("fusion")) {
      throw new Error("Expected room in AI Block and near Fusion Cafe");
    }
  });

  console.log("\n🟢 FILTERING VERIFICATION SUCCESSFUL: API correctly filters by Block and Canteen!");
}

testFiltering().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
