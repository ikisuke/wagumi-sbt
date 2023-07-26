const fs = require("fs");
let addressData = fs.readFileSync("src/address.json", "utf8");
addressData = JSON.parse(addressData);

const main = async () => {
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

  const score = [];
  const scoreObject = {
    score: score,
  };
  for (let i = 0; i < addressData.length; i++) {
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

main();
