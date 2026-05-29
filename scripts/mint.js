const hre = require("hardhat");
require("dotenv").config();

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS;
  if (!contractAddress) {
    console.error("Error: CONTRACT_ADDRESS not set in .env");
    process.exitCode = 1;
    return;
  }

  // Parse CLI args: --to <address> --quantity <n>
  const args = process.argv.slice(2);
  let to = null;
  let quantity = 1;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--to" && args[i + 1]) {
      to = args[i + 1];
      i++;
    } else if (args[i] === "--quantity" && args[i + 1]) {
      quantity = parseInt(args[i + 1], 10);
      i++;
    }
  }

  if (!to) {
    console.error("Usage: node scripts/mint.js --to <address> [--quantity <n>]");
    process.exitCode = 1;
    return;
  }

  if (isNaN(quantity) || quantity < 1 || quantity > 100) {
    console.error("Error: Quantity must be between 1 and 100");
    process.exitCode = 1;
    return;
  }

  const MINT_PRICE = hre.ethers.parseEther("0.001");
  const totalCost = MINT_PRICE * BigInt(quantity);

  console.log(`Minting ${quantity} token(s) to ${to}...`);
  console.log(`Total cost: ${hre.ethers.formatEther(totalCost)} ETH`);

  const FrogPFP = await hre.ethers.getContractFactory("FrogPFP");
  const frog = FrogPFP.attach(contractAddress);

  // If the recipient is the deployer, mint directly
  const [signer] = await hre.ethers.getSigners();
  const signerAddress = await signer.getAddress();

  if (to.toLowerCase() === signerAddress.toLowerCase()) {
    const tx = await frog.mint(quantity, { value: totalCost });
    console.log(`Transaction hash: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`Confirmed in block ${receipt.blockNumber}`);
  } else {
    // Mint to self then transfer each token to the target address
    const tx = await frog.mint(quantity, { value: totalCost });
    console.log(`Transaction hash: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`Confirmed in block ${receipt.blockNumber}`);

    const totalMinted = await frog.totalMinted();
    const startId = totalMinted - BigInt(quantity);

    for (let i = 0; i < quantity; i++) {
      const tokenId = startId + BigInt(i);
      const transferTx = await frog.transferFrom(signerAddress, to, tokenId);
      await transferTx.wait();
      console.log(`Transferred token ${tokenId} to ${to}`);
    }
  }

  // Log summary
  const totalMinted = await frog.totalMinted();
  console.log("\n--- Mint Summary ---");
  console.log(`Recipient:   ${to}`);
  console.log(`Quantity:    ${quantity}`);
  console.log(`Total cost:  ${hre.ethers.formatEther(totalCost)} ETH`);
  console.log(`Total minted: ${totalMinted} / 100`);
  console.log("--------------------\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
