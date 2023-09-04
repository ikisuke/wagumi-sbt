const fs = require("fs");

const { wagumiCatsOwners } = require("../external/alchemy");

const updateScore = async () => {
  //取得したデータを配列に格納
  // 以下のフォーマットのオブジェクトを作成
  // {
  //   score:[
  //     {
  //       address: "0x00
  //       score: 0
  //     },
  //    ]
  //  }

  let addressData = fs.readFileSync("src/addressHash.json", "utf8");
  addressData = JSON.parse(addressData);

  const score = [];
  const scoreObject = {
    score: score,
  };

  const catsAddress = await wagumiCatsOwners(
    "0x6144D927EE371de7e7f8221b596F3432E7A8e6D9"
  );

  addressData.push(...catsAddress);

  for (let i = 0; i < addressData.length; i++) {
    if (addressData[i] === "0x0000000000000000000000000000000000000000") {
      continue;
    }
    const obj = {
      address: addressData[i],
      score: 1,
    };
    score.push(obj);
  }

  // jsonファイルに書き込み
  const json = JSON.stringify(scoreObject, null, 2);
  fs.writeFileSync("src/score.json", json);
};
exports.updateScore = updateScore;
