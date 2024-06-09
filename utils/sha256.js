async function sha256(buffer) {
    console.log(buffer)
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);

  const hashArray = Array.from(new Uint8Array(hashBuffer));

  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashHex;
}

module.exports = { sha256 };
