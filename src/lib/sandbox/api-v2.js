const fs = require("fs");

const { wagumiCatsOwners, wagumiSBTOwners } = require("../external/alchemy");
const { updateCheckSumAddress } = require("../utils/checksum");

const updateScore = async () => {
  let addresses = [];
  const sbtsAddress = await wagumiSBTOwners();

  addresses.push(...sbtsAddress);

  const score = [];
  const scoreObject = {
    score: score,
  };

  const catsAddress = await wagumiCatsOwners(
    "0x6144D927EE371de7e7f8221b596F3432E7A8e6D9"
  );

  addresses.push(...catsAddress);

  addresses = addresses.map((address) => updateCheckSumAddress(address));

  for (let i = 0; i < addresses.length; i++) {
    if (addresses[i] === "0x0000000000000000000000000000000000000000") {
      continue;
    }
    const obj = {
      address: addresses[i],
      score: 1,
    };
    score.push(obj);
  }

  // jsonファイルに書き込み
  const json = JSON.stringify(scoreObject, null, 2);

  // /metadata/scores/[timestamp].json

  fs.writeFileSync("src/score.json", json);
};
exports.updateScore = updateScore;
