# Frog PFP NFT

A collection of 100 unique animated pixel art frogs on Ethereum.

## Quick Start

```bash
# Install dependencies
npm install

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Generate pixel art
python3 scripts/generate-art.py

# Deploy to Sepolia
cp .env.example .env  # Fill in your keys
npx hardhat run scripts/deploy.js --network sepolia

# Upload to IPFS
node scripts/upload-ipfs.js
```

## Project Structure

```
contracts/
  FrogPFP.sol          # ERC721 NFT contract (OpenZeppelin v5)
scripts/
  deploy.js            # Deploy + auto-verify on Etherscan
  verify.js            # Standalone contract verification
  mint.js              # CLI minting tool
  generate-art.py      # Pixel art generator (Pillow)
  upload-ipfs.js       # Pinata IPFS uploader
test/
  FrogPFP.test.js      # 22 tests (deployment, minting, withdraw, enumerable)
website/
  index.html           # Single-page mint + gallery frontend
assets/frogs/          # Generated pixel art (GIF + JSON metadata)
```

## Smart Contract

- **Standard:** ERC721 with URIStorage + Enumerable
- **Max Supply:** 100
- **Mint Price:** 0.001 ETH
- **Features:** Batch mint, owner withdraw, base URI update, ERC165 support

## Rarity System

| Tier | Count | Percentage |
|------|-------|------------|
| Common | 40 | 40% |
| Uncommon | 25 | 25% |
| Rare | 15 | 15% |
| Epic | 10 | 10% |
| Legendary | 8 | 8% |
| Mythic | 2 | 2% |

## Website

Dark theme with green accent (#39FF14). Features:
- Wallet connection (MetaMask)
- Mint interface with quantity selector
- Gallery showing all 100 frogs with rarity badges
- Rarity breakdown stats
- Mobile responsive

## Environment Variables

```bash
SEPOLIA_RPC_URL=https://rpc.sepolia.org
MAINNET_RPC_URL=https://eth.llamarpc.com
PRIVATE_KEY=your_private_key
ETHERSCAN_API_KEY=your_api_key
PINATA_API_KEY=your_pinata_key
PINATA_SECRET_KEY=your_pinata_secret
CONTRACT_ADDRESS=  # Filled after deploy
```

## License

MIT
