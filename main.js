const [, , firstArg] = process.argv;

require('dotenv').config();

const metadataUpdate = require('./src/lib/metadataUpdate');
const metadataCreate = require('./src/lib/metadataCreate');
const { makeExecutionData } = require('./src/lib/makeLog');

(async () => {
  try {
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
