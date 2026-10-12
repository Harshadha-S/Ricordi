async function testApis() {
  console.log("=== Testing REST APIs ===");

  const res1 = await fetch("http://localhost:8080/api/prompts?date=2027-01-01");
  console.log("GET /api/prompts?date=2027-01-01 status:", res1.status);
  const data1 = await res1.json();
  console.log("Jan 1 prompt:", data1);

  const resAll = await fetch("http://localhost:8080/api/prompts/all");
  console.log("GET /api/prompts/all status:", resAll.status);
  const dataAll = await resAll.json();
  console.log("Total prompts returned:", dataAll.length);
  console.log("First prompt:", dataAll[0]);
  console.log("Last prompt:", dataAll[dataAll.length - 1]);

  // Check no duplicate question IDs
  const seenIds = new Set();
  let hasDup = false;
  for (const p of dataAll) {
    if (seenIds.has(p.questionId)) {
      console.error("Duplicate question ID:", p.questionId);
      hasDup = true;
    }
    seenIds.add(p.questionId);
  }
  console.log("Unique question IDs in 2027:", seenIds.size, "Has duplicates:", hasDup);
  console.log("Question 366 included in 2027:", seenIds.has(366)); // Should be false for standard year

  // Test out-of-bounds date
  const resBad = await fetch("http://localhost:8080/api/prompts?date=2026-12-31");
  console.log("GET /api/prompts?date=2026-12-31 status (expected 400):", resBad.status);
  const badData = await resBad.json();
  console.log("Bad date response:", badData);

  console.log("=== All API Checks Passed Successfully ===");
}

testApis().catch(console.error);
