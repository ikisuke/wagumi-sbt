const { getAddressByUserId } = require("../../lib/utils/getAddress.js");
const {
  wagumiSBTOwners,
  wagumiCatsOwners,
} = require("../../lib/external/alchemy.js");
const { updateCheckSumAddress } = require("../utils/checksum.js");
const { updateScore } = require("./api-v2.js");

const main = async () => {
  const addresses = [];
  const ids = getAddressByUserId();

  for (let i = 0; i < ids.length; i++) {
    let address = await wagumiSBTOwners(ids[i]);
    address = await updateCheckSumAddress(address);
    addresses.push(address);
  }
  // jsonファイルに書き込み
  const fs = require("fs");
  const json = JSON.stringify(addresses);
  fs.writeFileSync("src/addressHash.json", json);

  await updateScore();
};

main();
