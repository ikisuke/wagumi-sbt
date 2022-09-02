require('dotenv').config();

const fs = require('fs');

const { makeExecutionData } = require('./makeLog');

const { Client } = require('@notionhq/client');

const client = new Client({ auth: process.env.WAGUMI_SBT_API_TOKEN });

const userIds = [];

const getUserData = async (userId, contributions) => {

	const metadataStruct = {
		name: "",
		description: "He/She is one of wagumi members.",
		image: "",
		external_url:"",
		contributions: contributions,
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

	return metadataStruct

}

const userSearch = async() => {
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

		tmp = await client.pages.properties.retrieve({ page_id: page.id, property_id: page.properties.userId.id});
		tmp.results.map((user) =>{
				let userId = user.rich_text.plain_text;
				if(!userIds.includes(userId)) {
					userIds.push(userId);
				}
		});
	}
	for(user of userIds) {
		console.log(`${user}を作ります`)
		await createMetadata(user);
	}
}


const createMetadata = async (userId) => {

	const executionMessage = 'create metadata';
	const executionData = makeExecutionData(executionMessage);

	const contributions = [];

//API制限に引っかかる可能性があるので、後で考える
	const request = { 
		database_id: process.env.WAGUMI_DATABASE_ID,
		sorts: [
			{
				property: 'last_edited_time',
				direction: 'descending',
			},
		],
		filter: {
				property: 'userId',
				rollup: {
					any: {
						rich_text: {
							equals: userId
						}
					}
				}
		}
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
	const metadataStruct = await getUserData(userId, contributions);

	const metadataFilePath = `metadata/${userId}.json`;

	const jsonData = JSON.stringify(metadataStruct,null,2);
	fs.writeFileSync(metadataFilePath, jsonData);
	fs.writeFileSync('create metadata', executionData);
// json形式に変換して、ファイル作成
// コマンドラインの第一引数(discordのユーザーID)をファイル名にする
}

exports.createMetadata = createMetadata;
exports.userSearch = userSearch;