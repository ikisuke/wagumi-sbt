// Github: https://github.com/alchemyplatform/alchemy-sdk-js
// Setup: npm install alchemy-sdk
const { Network, Alchemy } = require("alchemy-sdk");
const { env } = require("./dotenv");

// Optional Config object, but defaults to demo api-key and eth-mainnet.
const settings = {
  apiKey: env.ALCHEMY_API_KEY, // Replace with your Alchemy API Key.
  network: Network.MATIC_MAINNET, // Replace with your network.
};

const alchemy = new Alchemy(settings);

// Print total NFT count returned in the response:
const getOwnersForNft = async (
  tokenId,
  contractAddress = "0xef756b67b90026F91D047D1b991F87D657309A42"
) => {
  try {
    const owners = await alchemy.nft.getOwnersForNft(
      contractAddress,
      "495980446245584948"
    );
    console.log(owners);
    return owners.owners[0];
  } catch (error) {
    console.log(error);
  }
};

exports.getOwnersForNft = getOwnersForNft;
getOwnersForNft();
