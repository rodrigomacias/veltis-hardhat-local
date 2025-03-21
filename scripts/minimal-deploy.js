// Create a minimal deployment script using JavaScript
const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying contracts to localhost...");
  
  // Get the first available account
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying contracts with account: ${deployer.address}`);
  
  // Deploy VeltisRuleEngine first
  const RuleEngine = await ethers.deployContract("VeltisRuleEngine");
  await RuleEngine.waitForDeployment();
  
  const ruleEngineAddress = await RuleEngine.getAddress();
  console.log(`VeltisRuleEngine deployed to: ${ruleEngineAddress}`);
  
  // Deploy VeltisIPNFTRegistry with the rule engine address
  const IPNFTRegistry = await ethers.deployContract("VeltisIPNFTRegistry", [ruleEngineAddress]);
  await IPNFTRegistry.waitForDeployment();
  
  const ipNftRegistryAddress = await IPNFTRegistry.getAddress();
  console.log(`VeltisIPNFTRegistry deployed to: ${ipNftRegistryAddress}`);
  
  console.log("\nContract Addresses for .env file:");
  console.log(`VITE_IP_NFT_REGISTRY_CONTRACT=${ipNftRegistryAddress}`);
  console.log(`VITE_SIMPLE_IP_NFT_REGISTRY_CONTRACT=${ipNftRegistryAddress}`);
  console.log(`VITE_VELTIS_RULE_ENGINE=${ruleEngineAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });