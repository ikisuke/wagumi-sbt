const [, , firstArg, secondArg] = process.argv;

require('dotenv').config();

const metadataUpdate = require('./src/lib/metadataUpdate');
const metadataCreate = require('./src/lib/metadataCreate');
const { makeExecutionData } = require('./src/lib/makeLog');

(async () => {
  try {
    if (firstArg == 'create' && secondArg != null) {
      await metadataCreate.createMetadata();
      makeExecutionData('create metadata');
    } else if (firstArg == 'update') {
      metadataUpdate.update();
    } else if (firstArg == '') {
      metadataCreate.getTokenData();
    } else {
      throw new Error('コマンドが違います。');
    }
  } catch (error) {
    console.error(error.message);
  }
})();
