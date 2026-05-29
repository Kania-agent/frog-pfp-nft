const hre = require("hardhat");
require("dotenv").config();

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS;
  if (!contractAddress) {
    console.error("Error: CONTRACT_ADDRESS not set in .env");
    process.exitCode = 1;
    return;
  }

  const name = "Frog PFP";
  const symbol = "FROG";
  const baseURI = "https://api.frogpfp.com/metadata/";

  console.log(`Verifying contract at ${contractAddress}...`);
  console.log(`Network: ${hre.network.name}`);

  try {
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: [name, symbol, baseURI],
    });
    console.log("Contract verified successfully!");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("Contract is already verified.");
    } else {
      console.error("Verification failed:", error.message);
      process.exitCode = 1;
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
