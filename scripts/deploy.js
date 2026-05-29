const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const name = "Frog PFP";
  const symbol = "FROG";
  const baseURI = "https://api.frogpfp.com/metadata/";

  console.log("Deploying FrogPFP...");
  console.log(`  Name: ${name}`);
  console.log(`  Symbol: ${symbol}`);
  console.log(`  Base URI: ${baseURI}`);

  const FrogPFP = await hre.ethers.getContractFactory("FrogPFP");
  const frog = await FrogPFP.deploy(name, symbol, baseURI);
  await frog.waitForDeployment();

  const address = await frog.getAddress();
  console.log(`\nFrogPFP deployed to: ${address}`);

  // Save contract address to .env
  const envPath = path.join(__dirname, "..", ".env");
  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, "utf8");
    if (envContent.includes("CONTRACT_ADDRESS=")) {
      envContent = envContent.replace(
        /CONTRACT_ADDRESS=.*/,
        `CONTRACT_ADDRESS=${address}`
      );
    } else {
      envContent += `\nCONTRACT_ADDRESS=${address}\n`;
    }
    fs.writeFileSync(envPath, envContent);
    console.log(`Contract address saved to .env`);
  }

  // Wait for block confirmations before verification
  console.log("\nWaiting for block confirmations...");
  await frog.deploymentTransaction().wait(5);

  // Verify on Etherscan
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("Verifying contract on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: address,
        constructorArguments: [name, symbol, baseURI],
      });
      console.log("Contract verified on Etherscan!");
    } catch (error) {
      if (error.message.includes("Already Verified")) {
        console.log("Contract is already verified.");
      } else {
        console.error("Verification failed:", error.message);
      }
    }
  } else {
    console.log("Skipping verification on local network.");
  }

  // Log deployment summary
  console.log("\n--- Deployment Summary ---");
  console.log(`Network:  ${hre.network.name}`);
  console.log(`Address:  ${address}`);
  console.log(`Name:     ${name}`);
  console.log(`Symbol:   ${symbol}`);
  console.log(`Base URI: ${baseURI}`);
  console.log("--------------------------\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
