const fs = require('fs');

const makeExecutionData = (message) => {

    const logFilePath = 'src/executionData.json';

    fs.stat(logFilePath, (err, stat) => {
        if (err) {
            const initialData = [];
            const initialDataJson = JSON.stringify(initialData, null, 2);
            fs.writeFileSync('src/executionData.json', initialDataJson);
            makeExecutionData(logFilePath, 'initialize');
        }
    })

	const readFile = fs.readFileSync(logFilePath);
	const fileData = JSON.parse(readFile);

	let timeData = new Date();

	const executionTime = timeData.toISOString();
	const executionLog = `${message}`;

	const executionData = {
		time: executionTime,
		log: executionLog
	}

	fileData.unshift(executionData);
	const executionJson = JSON.stringify(fileData, null, 2);
	
    return executionJson;
	// fs.writeFileSync(logFilePath, executionJson);
}

exports.makeExecutionData = makeExecutionData;