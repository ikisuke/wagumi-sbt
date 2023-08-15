// Github: https://github.com/alchemyplatform/alchemy-sdk-js
// Setup: npm install alchemy-sdk
const { Network, Alchemy } = require("alchemy-sdk");
const { env } = require("./dotenv");

// Optional Config object, but defaults to demo api-key and eth-mainnet.

// Print total NFT count returned in the response:
const wagumiSBTOwners = async (
  tokenId,
  contractAddress = "0xef756b67b90026F91D047D1b991F87D657309A42",
  network = Network.Mainnet
) => {
  try {
    const settings = {
      apiKey: env.ALCHEMY_API_KEY, // Replace with your Alchemy API Key.
      network: network, // Replace with your network.
    };

    const alchemy = new Alchemy(settings);

    const owners = await alchemy.nft.getOwnersForNft(contractAddress, tokenId);
    console.log(owners);
    return owners.owners[0];
  } catch (error) {
    console.log(error);
  }
};
exports.wagumiSBTOwners = wagumiSBTOwners;

const wagumiCatsOwners = async (contractAddress) => {
  try {
    const settings = {
      apiKey: env.ALCHEMY_API_KEY, // Replace with your Alchemy API Key.
      network: Network.Mainnet, // Replace with your network.
    };

    const alchemy = new Alchemy(settings);

    const owners = await alchemy.nft.getOwnersForContract(contractAddress);
    return owners.owners;
  } catch (error) {
    console.log(error);
  }
};
exports.wagumiCatsOwners = wagumiCatsOwners;
