/**
 * IPFS Upload Script for Frog PFP NFT
 * Uploads images and metadata to IPFS via Pinata
 *
 * Usage: node scripts/upload-ipfs.js
 * Requires: PINATA_API_KEY and PINATA_SECRET_KEY in .env
 */

const fs = require("fs");
const path = require("path");
const FormData = require("form-data");
const axios = require("axios");
require("dotenv").config();

const ASSETS_DIR = path.join(__dirname, "..", "assets", "frogs");
const PINATA_API = "https://api.pinata.cloud";

async function pinFileToIPFS(filePath, name) {
  const formData = new FormData();
  formData.append("file", fs.createReadStream(filePath));
  formData.append(
    "pinataMetadata",
    JSON.stringify({ name })
  );
  formData.append(
    "pinataOptions",
    JSON.stringify({ cidVersion: 1 })
  );

  const res = await axios.post(`${PINATA_API}/pinning/pinFileToIPFS`, formData, {
    maxBodyLength: "Infinity",
    headers: {
      ...formData.getHeaders(),
      pinata_api_key: process.env.PINATA_API_KEY,
      pinata_secret_api_key: process.env.PINATA_SECRET_KEY,
    },
  });

  return res.data.IpfsHash;
}

async function pinJSONToIPFS(json, name) {
  const res = await axios.post(
    `${PINATA_API}/pinning/pinJSONToIPFS`,
    {
      pinataContent: json,
      pinataMetadata: { name },
    },
    {
      headers: {
        pinata_api_key: process.env.PINATA_API_KEY,
        pinata_secret_api_key: process.env.PINATA_SECRET_KEY,
      },
    }
  );

  return res.data.IpfsHash;
}

async function main() {
  if (!process.env.PINATA_API_KEY || !process.env.PINATA_SECRET_KEY) {
    console.error("Error: Set PINATA_API_KEY and PINATA_SECRET_KEY in .env");
    process.exit(1);
  }

  const manifestPath = path.join(ASSETS_DIR, "manifest.json");
  if (!fs.existsSync(manifestPath)) {
    console.error("Error: manifest.json not found. Run generate-art.py first.");
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  console.log(`Found ${manifest.length} frogs in manifest\n`);

  // Step 1: Upload all GIFs
  console.log("=== Uploading GIFs to IPFS ===");
  const imageHashes = {};

  for (const entry of manifest) {
    const gifPath = path.join(ASSETS_DIR, entry.gif);
    if (!fs.existsSync(gifPath)) {
      console.warn(`  Skipping ${entry.gif} (not found)`);
      continue;
    }

    const hash = await pinFileToIPFS(gifPath, entry.gif);
    imageHashes[entry.gif] = hash;
    console.log(`  ${entry.gif} -> ipfs://${hash}`);
  }

  console.log(`\nUploaded ${Object.keys(imageHashes).length} GIFs\n`);

  // Step 2: Update metadata with real IPFS hashes and upload
  console.log("=== Uploading Metadata to IPFS ===");
  const metadataHashes = {};

  for (const entry of manifest) {
    const metaPath = path.join(ASSETS_DIR, entry.meta);
    if (!fs.existsSync(metaPath)) continue;

    const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
    const gifHash = imageHashes[entry.gif];
    if (gifHash) {
      meta.image = `ipfs://${gifHash}/${entry.gif}`;
    }

    const metaHash = await pinJSONToIPFS(meta, entry.meta);
    metadataHashes[entry.meta] = metaHash;
    console.log(`  ${entry.meta} -> ipfs://${metaHash}`);
  }

  console.log(`\nUploaded ${Object.keys(metadataHashes).length} metadata files\n`);

  // Step 3: Upload metadata folder as directory
  console.log("=== Uploading Metadata Directory ===");
  const dirHash = await pinFileToIPFS(ASSETS_DIR, "frog-pfp-metadata");

  const baseURI = `ipfs://${dirHash}/`;
  console.log(`\n=== RESULT ===`);
  console.log(`Base URI: ${baseURI}`);
  console.log(`\nUse this in your .env file:`);
  console.log(`BASE_URI=${baseURI}`);
  console.log(`\nUpdate your contract: npx hardhat run scripts/deploy.js --network sepolia`);

  // Save result
  const resultPath = path.join(__dirname, "..", "ipfs-result.json");
  fs.writeFileSync(
    resultPath,
    JSON.stringify(
      {
        baseURI,
        imageHashes,
        metadataHashes,
        directoryHash: dirHash,
        timestamp: new Date().toISOString(),
      },
      null,
      2
    )
  );
  console.log(`\nResults saved to ${resultPath}`);
}

main().catch((err) => {
  console.error("Upload failed:", err.message);
  process.exit(1);
});
