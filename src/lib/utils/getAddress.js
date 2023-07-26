const metadataDirectoryPath = "src/metadata/";

const fs = require("fs");

const getAddressByUserId = () => {
  const fileDir = fs.readdirSync(metadataDirectoryPath);
  const fileIds = fileDir.map((id) => {
    return id.replace(/.json/g, "");
  });
  console.log(fileIds);
  return fileIds;
};

exports.getAddressByUserId = getAddressByUserId;
