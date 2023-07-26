// keccak256によるハッシュ値の計算
const keccak256 = require("js-sha3").keccak256;

// ハッシュ値の計算
// address.jsonの中身を読み込む
const main = async () => {
  const fs = require("fs");
  let addressData = fs.readFileSync("src/address.json", "utf8");
  addressData = JSON.parse(addressData);

  const address = [];
  for (let i = 0; i < addressData.length; i++) {
    // 0xを削除
    const addressWithout0x = addressData[i].replace(/0x/g, "");
    // ハッシュ値の計算
    const hash = keccak256(addressWithout0x);
    // addressWithout0xとhashの比較
    // それぞれのN文字目を比較して、hashのN文字目が8, 9, a, b, c, d, e, fのいずれかであれば、addressWithout0xのN文字目を大文字にする
    // それ以外であれば、addressWithout0xのN文字目を小文字にする
    let addressWithout0xHash = "";
    for (let j = 0; j < addressWithout0x.length; j++) {
      if (
        hash[j] === "8" ||
        hash[j] === "9" ||
        hash[j] === "a" ||
        hash[j] === "b" ||
        hash[j] === "c" ||
        hash[j] === "d" ||
        hash[j] === "e" ||
        hash[j] === "f"
      ) {
        addressWithout0xHash += addressWithout0x[j].toUpperCase();
      } else {
        addressWithout0xHash += addressWithout0x[j].toLowerCase();
      }
    }
    // 0xを付与
    const addressWith0xHash = "0x" + addressWithout0xHash;
    address.push(addressWith0xHash);
  }
  // jsonファイルに書き込み
  const json = JSON.stringify(address, null, 2);
  fs.writeFileSync("src/addressHash.json", json);
};

main();
