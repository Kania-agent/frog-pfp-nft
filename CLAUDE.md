# Frog PFP NFT Project

## Architecture
- **Smart Contract:** ERC721 (OpenZeppelin) with ERC721URIStorage, ERC721Enumerable, Ownable
- **Max Supply:** 100 tokens, 0.001 ETH per mint
- **Network:** Ethereum Sepolia (testnet), Mainnet (production)
- **Frontend:** Single-page HTML/CSS/JS with ethers.js v5
- **Assets:** 100 animated pixel frog GIFs (48x48) with rarity system
- **Metadata:** JSON files following OpenSea standard (name, description, image, attributes)

## Key Commands
- `npx hardhat compile` — compile contracts
- `npx hardhat test` — run tests
- `npx hardhat run scripts/deploy.js --network sepolia` — deploy to Sepolia
- `node scripts/upload-ipfs.js` — upload assets to IPFS via Pinata
- `python3 scripts/generate-art.py` — regenerate pixel art collection

## Directory Structure
```
contracts/          — Solidity smart contracts
scripts/            — Deploy, upload, utility scripts
test/               — Hardhat tests
website/            — Frontend (single HTML file)
assets/frogs/       — Generated pixel art (GIF + JSON metadata)
metadata/           — On-chain metadata templates
```

## Code Standards
- Solidity 0.8.24 with Cancun EVM
- JavaScript for Hardhat (no TypeScript)
- Python for art generation scripts
- ethers.js v5 on frontend (NOT v6)
- All IPFS URIs use ipfs:// protocol
- Metadata follows OpenSea ERC721 standard

## Rarity System
- Common (40%) — basic green frog
- Uncommon (25%) — slight color variation
- Rare (15%) — unique accessories
- Epic (10%) — animated effects
- Legendary (8%) — rare colors + effects
- Mythic (2%) — ultra-rare special traits
