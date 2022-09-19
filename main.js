const [, , firstArg] = process.argv;

const fs = require("fs");

require('dotenv').config();

const metadataUpdate = require('./src/lib/metadataUpdate');
const metadataCreate = require('./src/lib/metadataCreate');
const { makeExecutionData, initializeExecutionData } = require('./src/lib/makeLog');

(async () => {
  try {
    if(!fs.existsSync('src/executionData.json')){
        initializeExecutionData();
    }
    if (firstArg == 'update') {
      await metadataUpdate.update();
    // } else if (firstArg == '') {
    //   metadataCreate.getTokenData();
    } else if(firstArg == 'create' || !firstArg){
      await metadataCreate.createMetadata();
    } else {
      throw new Error('コマンドが違います')
    }
  } catch (error) {
    console.error(error.message);
  }
})();
