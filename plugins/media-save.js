const handler = {};
handler.all = async function (m) {
  if (!m.message) return;

  // SOLO cuando sea view once
  if (JSON.stringify(m.message).includes("viewOnce")) {
    console.log("\n\n=== VIEW ONCE DETECTADO ===");
    console.log("m.mtype:", m.mtype);
    console.log("KEYS message:", Object.keys(m.message));
    console.log("RAW MESSAGE:", JSON.stringify(m.message, null, 2));
    console.log("===========================\n\n");
  }
};

export default handler;
