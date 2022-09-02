const [, , firstArg] = process.argv;

const metadataUpdate = require('./metadataUpdate');
const metadataCreate = require('./metadataCreate');

(async () => {
	try {
        if(firstArg == 'create'){
            metadataCreate.userSearch();
        } else if(firstArg == 'update'){
            metadataUpdate.getUserId();
        } else {
            throw new Error('コマンドが違います。')
        }
	} catch(error){
		console.error(error.message);
	}
})();