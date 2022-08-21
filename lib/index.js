const [, , firstArg] = process.argv;

require('dotenv').config();

const fs = require('fs');

const { Client } = require('@notionhq/client');

const client = new Client({ auth: process.env.NOTION_API_TOKEN });

const contributions = [];

const metadataStruct = {
	name: "",
  	description: "He/She is one of wagumi members.",
  	image: "",
  	external_url:"",
	contributions: contributions
}

const makeExecutionData = (logFilePath, message) => {
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
	
	fs.writeFileSync(logFilePath, executionJson);
}

const getUserData = async () => {
    const request = { 
		database_id: process.env.WAGUMI_USER_DATABASE_ID,
		filter: {
				property: 'id',
				rich_text: {
                    equals: firstArg
                }
		},
	};

    const response = await client.databases.query(request);

    const page = response.results[0];

    let tmp;

    tmp = await client.pages.properties.retrieve({ page_id: page.id, property_id: page.properties.name.id});
    metadataStruct.name = tmp.results[0].title.plain_text;

    tmp = await client.pages.retrieve({ page_id: page.id });
    metadataStruct.image = tmp.icon.external.url;

	let external_url_id = page.id

	const replacedStr = external_url_id.replace(/-/g, "");

	console.log(replacedStr);
    
    metadataStruct.external_url = `https://wagumi-dev.notion.site/${replacedStr}`;

}

const updateMetadata = async(metadataPath, logFilePath) => {
	
	try{
		const metadataFile = fs.readFileSync(metadataPath);
		let metadata = JSON.parse(metadataFile);

		const executionDataFile = fs.readFileSync(logFilePath);
		const executionData = JSON.parse(executionDataFile);

		if(executionData == []) {
			throw new Error('executionData')
		} else {
			const lastExecutionTime = executionData[0].time;
			const request = { 
				database_id: process.env.WAGUMI_DATABASE_ID,
				//古いものから順番に追加していくので、updateの場合は昇順
				sorts: [
					{
						property: 'last_edited_time',
						direction: 'ascending',
					},
				],
				filter: {
					property: 'last_edited_time',
					last_edited_time: {
						after: lastExecutionTime
					}
				}
			};


				const pages = await client.databases.query(request);
				if(pages.results.length === 0) {
					console.log("It has updated")
					return
				}

				for(const page of pages.results){

					let tmp;

					let contribution = {
						id: "",
						last_edited_time: "",
						name: "",
						image: "",
						description: "",
						date: "",
						users: []
					};

					let userSearchResult = false;

					tmp = await client.pages.properties.retrieve({ page_id: page.id, property_id: page.properties.userId.id});
					contribution.users = tmp.results.map((user) =>{
						let userId = user.rich_text.plain_text;			
						if(firstArg == userId) {
						userSearchResult = true;
						}
					return userId;
					});

				if(userSearchResult) {
					
					contribution.id = page.id;
					contribution.last_edited_time = page.last_edited_time
			
					tmp = await client.pages.properties.retrieve({ page_id: page.id, property_id: page.properties.name.id});
					contribution.name = tmp.results[0].title.plain_text;
			
					tmp = await client.pages.properties.retrieve({ page_id: page.id, property_id: page.properties.image.id});
					contribution.image = tmp.files[0].name;
		
					tmp = await client.pages.properties.retrieve({ page_id: page.id, property_id: page.properties.description.id});
					contribution.description = tmp.results[0].rich_text.plain_text;
			
					tmp = await client.pages.properties.retrieve({ page_id: page.id, property_id: page.properties.date.id});
					contribution.date = tmp.date;
					
				}
					const filterMetadata = metadata.contributions.filter(result => page.id != result.id);
					filterMetadata.unshift(contribution);
					metadata.contributions = filterMetadata;
				}
				const metadataJson = JSON.stringify(metadata, null, 2);
				fs.writeFileSync(metadataPath, metadataJson);
				const executionMessage = `update ${metadataFilePath}`;
				makeExecutionData(logFilePath, executionMessage);
		}	
	} catch(error) {
		console.error(error);
	}
}

const createMetadata = async (metadataFilePath, logFilePath) => {
	const request = { 
		database_id: process.env.WAGUMI_DATABASE_ID,
		sorts: [
			{
				property: 'last_edited_time',
				direction: 'descending',
			},
		]
	};

	const pages = await client.databases.query(request);

	for(const page of pages.results){

		let tmp;

		let contribution = {
			id: "",
			last_edited_time: "",
			name: "",
			image: "",
			description: "",
			date: "",
			users: []
		};

		//contributeにデータを追加するためのトリガー。falseの場合データ追加をしない。(計算数を減らす目的)
		let userSearchResult = false;

		tmp = await client.pages.properties.retrieve({ page_id: page.id, property_id: page.properties.userId.id});
		contribution.users = tmp.results.map((user) =>{
			// console.log(user);
				let userId = user.rich_text.plain_text;			
				if(firstArg == userId) {
				userSearchResult = true;
				}
			return userId;
		});

		if(userSearchResult) {
			
			contribution.id = page.id;
			contribution.last_edited_time = page.last_edited_time
	
			tmp = await client.pages.properties.retrieve({ page_id: page.id, property_id: page.properties.name.id});
			contribution.name = tmp.results[0].title.plain_text;
	
			tmp = await client.pages.properties.retrieve({ page_id: page.id, property_id: page.properties.image.id});
			contribution.image = tmp.files[0].name;

			tmp = await client.pages.properties.retrieve({ page_id: page.id, property_id: page.properties.description.id});
			contribution.description = tmp.results[0].rich_text.plain_text;
	
			tmp = await client.pages.properties.retrieve({ page_id: page.id, property_id: page.properties.date.id});
			contribution.date = tmp.date;

			contributions.push(contribution);
		}
}
	await getUserData();

	const jsonData = JSON.stringify(metadataStruct,null,2);
	fs.writeFileSync(metadataFilePath, jsonData);
// json形式に変換して、ファイル作成
// コマンドラインの第一引数(discordのユーザーID)をファイル名にする
	const executionMessage = `create ${metadataFilePath}`;
	makeExecutionData(logFilePath, executionMessage);
}
//update

(async () => {
	try {
		const logFilePath = 'executionData.json';

		if(!firstArg) {
			throw new Error("Discord IDを入力してください")
		}
			fs.stat(logFilePath, (err, stat) => {
				if (err) {
					const initialData = [];
					const initialDataJson = JSON.stringify(initialData, null, 2);
					fs.writeFileSync('executionData.json', initialDataJson);
					makeExecutionData(logFilePath, 'initialize')
				}
			})
		
		const userId = firstArg;
		const metadataFilePath = `${userId}.json`;
		fs.stat(metadataFilePath, (err, stat) => {
			if(!err) {
				console.log('updating... \n ------------')
				updateMetadata(metadataFilePath,logFilePath);
			} else {
				console.log('creating... \n ------------')
				createMetadata(metadataFilePath,logFilePath);
			}
		})
	} catch(error){
		console.error(error.message);
	}
})();


