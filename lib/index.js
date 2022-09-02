require('dotenv').config();

const fs = require('fs');

const { makeExecutionData } = require('./makeLog');

const { Client } = require('@notionhq/client');

const client = new Client({ auth: process.env.WAGUMI_SBT_API_TOKEN });

const userIds = [];

const users = [];

const contributions = [];

const getUserTest = async () => {

    const request = { 
		database_id: process.env.WAGUMI_USER_DATABASE_ID,
		sorts:[
			{
				property: "Admin Leader",
				direction: "descending"
			},
			{
				property: 'Admin',
				direction: 'descending',
			},
			{
				property: 'AMA Leader',
				direction: 'descending',
			},
			{
				property: 'Newsletter Leader',
				direction: 'descending',
			},
			{
				property: 'Design Leader',
				direction: 'descending',
			},
			{
				property: 'Community Leader',
				direction: 'descending',
			},
			{
				property: 'Dev Leader',
				direction: 'descending',
			},
			{
				property: 'Team Member',
				direction: 'descending',
			},
			{
				property: 'Wagumi Cats',
				direction: 'descending',
			},
			{
				property: 'name',
				direction: 'ascending',
			},
		]
	};

    let response = await client.databases.query(request);

	console.log(response);
	await pushUserPage(response);

	while(response.has_more) {
		request.start_cursor = response.next_cursor;
		response = await client.databases.query(request);
		console.log(response);
		await pushUserPage(response);
	}

    // const page = response.results[0];

    // let tmp;

    // tmp = await client.pages.properties.retrieve({ page_id: page.id, property_id: page.properties.name.id});
    // metadataStruct.name = tmp.results[0].title.plain_text;

    // tmp = await client.pages.retrieve({ page_id: page.id });
    // metadataStruct.image = tmp.icon.external.url;

	// let external_url_id = page.id

	// const replacedStr = external_url_id.replace(/-/g, "");
    
    // metadataStruct.external_url = `https://wagumi-dev.notion.site/${replacedStr}`;

	// return metadataStruct
	const jsonData = JSON.stringify(users,null,2);
	fs.writeFileSync("users.json", jsonData);

}

const getUserData = async (userId) => {
	const metadataFilePath = `testMetadata/${userId}.json`;

	const metadataStruct = {
		name: "",
		description: "He/She is one of wagumi members.",
		image: "",
		external_url:"",
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
	fs.writeFileSync(metadataFilePath, json);

}

const userSearch = async() => {
	for(const contribution of contributions) {
		for(user of contribution.users) {
			if(!userIds.includes(user)) {
				userIds.push(user);
			}
		}
	}
}


const createMetadata = async () => {

	const request = { 
		database_id: process.env.WAGUMI_DATABASE_ID,
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
	userSearch();

	for(let userId of userIds) {
		getUserData(userId);
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
	}

	const jsonData = JSON.stringify(contributions,null,2);
	fs.writeFileSync("metadata.json", jsonData);
// json形式に変換して、ファイル作成
// コマンドラインの第一引数(discordのユーザーID)をファイル名にする
}

const pushUserPage = async (pages) => {

	for(const page of pages.results){

		let metadataStruct = {
			id: "",
			metadata: {
				name: "",
				description: "He/She is one of wagumi members.",
				image: "",
				external_url:"",
			}
			// contributions: contributions,
		};

		// contributeにデータを追加するためのトリガー。falseの場合データ追加をしない。(計算数を減らす目的)


    let tmp;

	tmp = await client.pages.properties.retrieve({ page_id: page.id, property_id: page.properties.id.id});
	metadataStruct.id = tmp.results[0].rich_text.plain_text;

    tmp = await client.pages.properties.retrieve({ page_id: page.id, property_id: page.properties.name.id});
    metadataStruct.metadata.name = tmp.results[0].title.plain_text;

    tmp = await client.pages.retrieve({ page_id: page.id });
    metadataStruct.metadata.image = tmp.icon.external.url;

	let external_url_id = page.id

	const replacedStr = external_url_id.replace(/-/g, "");
    
    metadataStruct.metadata.external_url = `https://wagumi-dev.notion.site/${replacedStr}`;

	users.push(metadataStruct);

	console.log(users);
	}


// json形式に変換して、ファイル作成
// コマンドラインの第一引数(discordのユーザーID)をファイル名にする
}

(async () => {
	await getUserTest();
	// await createMetadata();
	// await userSearch();
	// for(let userId of userIds) {
	// 	await getUserData(userId);
	// }
})();