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
    } else {
      await metadataCreate.createMetadata();
      console.log('success!')
      makeExecutionData('create metadata'); 
    }
  } catch (error) {
    console.error(error.message);
  }
})();
