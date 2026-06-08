async function testConcurrency() {
  console.log("=== Starting Concurrency Verification Test ===");
  
  // 1. Fetch rooms to find an empty room
  const roomsRes = await fetch("http://localhost:3000/api/rooms");
  const rooms = await roomsRes.json();
  const emptyRoom = rooms.find(r => r.status === 'empty');

  if (!emptyRoom) {
    console.error("No empty room found. Please reset database using 'npm run setup' in backend.");
    process.exit(1);
  }

  console.log(`Found empty room: ${emptyRoom.name} (ID: ${emptyRoom.id})`);

  // 2. Fire 10 concurrent requests to claim the same room
  console.log(`Firing 10 parallel claim requests for room ID ${emptyRoom.id}...`);
  
  const requests = Array.from({ length: 10 }).map((_, index) => {
    return fetch(`http://localhost:3000/api/claim/${emptyRoom.id}`, { method: 'POST' })
      .then(async res => {
        const data = await res.json();
        return {
          index: index + 1,
          status: res.status,
          data
        };
      })
      .catch(err => {
        return {
          index: index + 1,
          status: 'ERROR',
          error: err.message
        };
      });
  });

  const results = await Promise.all(requests);

  // 3. Count successes and failures
  let successCount = 0;
  let failureCount = 0;
  let otherCount = 0;

  results.forEach(res => {
    if (res.status === 200) {
      successCount++;
      console.log(`  Request #${res.index}: SUCCESS (200) -> ${JSON.stringify(res.data)}`);
    } else if (res.status === 400) {
      failureCount++;
      console.log(`  Request #${res.index}: FAILED (400) -> ${JSON.stringify(res.data)}`);
    } else {
      otherCount++;
      console.log(`  Request #${res.index}: OTHER STATUS (${res.status}) -> ${JSON.stringify(res.data || res.error)}`);
    }
  });

  console.log("\n=== Test Results Summary ===");
  console.log(`Total Requests: 10`);
  console.log(`Successes (200): ${successCount}`);
  console.log(`Failures (400 - Already Claimed): ${failureCount}`);
  console.log(`Other Statuses: ${otherCount}`);

  // 4. Assert correctness
  if (successCount === 1 && failureCount === 9) {
    console.log("\n🟢 VERIFICATION SUCCESSFUL: Exactly 1 concurrent claim request succeeded. The race condition has been successfully fixed!");
    process.exit(0);
  } else {
    console.error(`\n🔴 VERIFICATION FAILED: Expected exactly 1 success and 9 failures, but got ${successCount} successes and ${failureCount} failures.`);
    process.exit(1);
  }
}

testConcurrency().catch(err => {
  console.error("Test execution error:", err);
  process.exit(1);
});
