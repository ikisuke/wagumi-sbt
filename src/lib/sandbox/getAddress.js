const { getAddressByUserId } = require("../../lib/utils/getAddress.js");
const {
  wagumiSBTOwners,
  wagumiCatsOwners,
} = require("../../lib/external/alchemy.js");

const main = async () => {
  const addresses = [];
  const ids = getAddressByUserId();

  for (let i = 0; i < ids.length; i++) {
    const address = await wagumiSBTOwners(ids[i]);
    addresses.push(address);
  }
  // jsonファイルに書き込み
  const fs = require("fs");
  const json = JSON.stringify(addresses);
  fs.writeFileSync("src/address.json", json);
};

main();
