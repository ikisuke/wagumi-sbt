const [, , firstArg] = process.argv;

require('dotenv').config();

const fs = require('fs');

const { Client } = require('@notionhq/client');

const path = require('path');

const client = new Client({ auth: process.env.NOTION_API_TOKEN });


const contribution = {
	id: "",
	last_edited_time: "",
	name: "",
	image: "",
	description: "",
	date: "",
	users: []
};

const contributions = [contribution];

const metadataStruct = {
	name: "araimono",
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
	const executionLog = `${message} ${firstArg}.json`;

	const executionData = {
		time: executionTime,
		log: executionLog
	}

	fileData.unshift(executionData);
	const executionJson = JSON.stringify(fileData, null, 2);
	
	fs.writeFileSync(logFilePath, executionJson);
}

const updateMetadata = async(metadataPath, logFilePath) => {
	console.log('updateMetadata');
	const metadataFile = fs.readFileSync(metadataPath);
	const metadata = JSON.parse(metadataFile);

	const executionDataFile = fs.readFileSync(logFilePath);
	const executionData = JSON.parse(executionDataFile);

	if(executionData == []) {
		//TODO
		return
	} else {
		const lastExecutionTime = executionData[0].time;
		console.log(lastExecutionTime);
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

		console.log('updating... \n ------------');

		try {
			const pages = await client.databases.query(request);
			if(pages.results.length === 0) {
				console.log("It has updated")
				return
			}
	
			for(const page of pages.results){
	
				let tmp;

				for(i = 0; i < metadata.length; i++){

					const data = metadata[i];

					if(page.id == data.id) {
					//既存のpage内容が更新されたときの更新パッチ

						data.last_edited_time = page.last_edited_time;

						tmp = await client.pages.properties.retrieve({ page_id: page.id, property_id: page.properties.name.id});
						data.name = tmp.results[0].title.plain_text;
				
						tmp = await client.pages.properties.retrieve({ page_id: page.id, property_id: page.properties.image.id});
						data.image = tmp.files[0].name;
			
						tmp = await client.pages.properties.retrieve({ page_id: page.id, property_id: page.properties.description.id});
						data.description = tmp.results[0].rich_text.plain_text;
				
						tmp = await client.pages.properties.retrieve({ page_id: page.id, property_id: page.properties.date.id});
						data.date = tmp.date;

						//以下最終更新時刻順の移動
						//そもそも更新時刻が新しい順番で

						metadata.splice(i,1);
						metadata.unshift(data);


						//以下最終更新時刻順の移動
						//そもそも更新時刻でsortされているのでここのロジックが必要ないことが判明している

						// const newestEditTime = Date.parse(data.last_edited_time);
						// const compareEditTime = Date.parse(metadata[1].last_edited_time);
						// if(newestEditTime < compareEditTime) {
						// 	[metadata[0], metadata[1]] = [metadata[1], metadata[0]];
						// }

					} else {
					//新たなpageが追加された時
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
			
						metadata.unshift(contribution);

						// const newestEditTime = Date.parse(data.last_edited_time);
						// const compareEditTime = Date.parse(metadata[1].last_edited_time);
						
						// //追加した要素が一個前と	
						// if(newestEditTime < compareEditTime) {
						// 	[metadata[0], metadata[1]] = [metadata[1], metadata[0]];
						// }
					}
				}
				}				
			}
			makeExecutionData(logFilePath, "update");
		} catch(error) {
			console.error('Error.')
		}	
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

		//contributeにデータを追加するためのトリガー。falseの場合データ追加をしない。(計算数を減らす目的)
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

			contributions.push(contribution);
		}

//ここまで変更点
		   
/** 
   page検索から適切なプロパティを抜き出して、contributeにセットしている。
   オブジェクト形式に加工している
*/
}
const jsonData = JSON.stringify(metadataStruct,null,2);
fs.writeFileSync(metadataFilePath, jsonData);
// json形式に変換して、ファイル作成
// コマンドラインの第一引数(discordのユーザーID)をファイル名にする
makeExecutionData(logFilePath, "create");
}


(async () => {

	const logFilePath = 'executionData.json';

	console.log(logFilePath);
		fs.stat(logFilePath, (err, stat) => {
			if (err) {
				const initialData = [];
				const initialDataJson = JSON.stringify(initialData, null, 2);
				fs.writeFileSync('executionData.json', initialDataJson);
			}
		})

	
	const userId = firstArg;
	const metadataFilePath = `${userId}.json`;
	fs.stat(metadataFilePath, (err, stat) => {
		if(!err) {
			updateMetadata(metadataFilePath,logFilePath);
		} else {
			createMetadata(metadataFilePath,logFilePath);
		}
	})

})();

