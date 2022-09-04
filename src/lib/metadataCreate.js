require('dotenv').config();

const fs = require('fs');

const { makeExecutionData } = require('./makeLog');

const { Client } = require('@notionhq/client');

const client = new Client({ auth: process.env.WAGUMI_SBT_API_TOKEN });

const contributions = []

const metadataDirectoryPath = process.env.METADATA_PATH;

const getUserData = async (userId, tokens) => {

	const metadataStruct = {
		name: "",
		description: "He/She is one of wagumi members.",
		image: "",
		external_url:"",
		tokens: tokens,
		contributions: [],
	};

    const request = { 
		database_id: process.env.WAGUMI_USER_DATABASE_ID,
		filter: {
				property: 'id',
				rich_text: {
                    equals: userId
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
    
    metadataStruct.external_url = `https://wagumi-dev.notion.site/${replacedStr}`;

	for(const contribution of contributions) {
		if(contribution.users.includes(userId)) {
			metadataStruct.contributions.push(contribution);
		}
	}

	const json = JSON.stringify(metadataStruct, null, 2);
	fs.writeFileSync(metadataDirectoryPath + `${userId}.json`, json);

}

const userSearch = async() => {
	const userIds = [];
	for(const contribution of contributions) {
		for(user of contribution.users) {
			if(!userIds.includes(user)) {
				userIds.push(user);
			}
		}
	}
	return userIds;
}

const getTokenData = async () => {
	const tokens = [];
	//Tokenの情報を取ってくる
	return tokens;
}

const createMetadata = async () => {
	const executionMessage = 'create metadata';
    let executionData;

	try {
        executionData = makeExecutionData(executionMessage);
		const request = { 
			database_id: process.env.WAGUMI_DATABASE_ID,
			filter: {
				property: 'publish',
				checkbox: {
					equals: true,
				}
			},
			sorts: [
				{
					property: 'last_edited_time',
					direction: 'descending',
				},
			],
		};

		let pages = await client.databases.query(request);

		await pushContributionPage(pages);

		while(pages.has_more) {
			request.start_cursor = pages.next_cursor;
			pages = await client.databases.query(request)
			await pushContributionPage(pages)
		}
		const userIds = await userSearch();

		for(let userId of userIds) {
			//TODO
			const tokens = await getTokenData(userId);
			getUserData(userId, tokens);
		} 
	fs.writeFileSync("src/executionData.json", executionData);

	}catch(error) {
		console.error(error);
	}
}

const pushContributionPage = async (pages) => {

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
	
				tmp = await client.pages.properties.retrieve({ page_id: page.id, property_id: page.properties.userId.id});
				contribution.users = tmp.results.map((user) =>{
						let userId = user.rich_text.plain_text;
					return userId;
				});
				contributions.push(contribution);
				console.log(contribution)
	}

	const jsonData = JSON.stringify(contributions,null,2);
	fs.writeFileSync("src/metadata.json", jsonData);
// json形式に変換して、ファイル作成
// コマンドラインの第一引数(discordのユーザーID)をファイル名にする
}

exports.createMetadata = createMetadata;
exports.userSearch = userSearch;