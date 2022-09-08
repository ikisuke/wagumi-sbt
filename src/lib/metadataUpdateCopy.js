require('dotenv').config();

const fs = require('fs');

const logFile = require('../executionData.json');

const { Client } = require('@notionhq/client');
// const { createMetadata } = require('./metadataCreate');
const { makeExecutionData } = require('./makeLog');

const client = new Client({ auth: process.env.WAGUMI_SBT_API_TOKEN });

const metadataDirectoryPath = process.env.METADATA_PATH;

//usersの比較
const compareUsers = async (contribution) => {
    const dataForComparingUsersJson = JSON.parse(fs.readFileSync(`src/metadata.json`));
    const targetPage = dataForComparingUsersJson.find((result) => result.id === contribution.id);
    if(!targetPage) {
        for(const userId of contribution.users) {
            await patchUserMetadata(contribution, userId);  
        };
        return [];
    } 
    const comparedUsers = targetPage.users.filter(result => contribution.users.indexOf(result) === -1 );
    return comparedUsers;
}

//新しいページが追加したときに追加処理をかける
const patchUserMetadata = async(contribution, userId) => {
    if(!fs.existsSync(metadataDirectoryPath + `${userId}.json`)) {
        //ファイルが存在していないときには新規作成すべきだが、createUserMetadataにて新規作成処理を施している。
        //しかし、あまり良い書き方とは言えないので、こちらの方から誘導したほうがいいかもしれない。
        //いやでも、ここからさらに新しい関数に飛ばすとなると開発者としても関数がネストのようになってしまうため運用保守がしづらいかもしれない。
        //やっぱりこのままに一応しておく
        return
    }
    const deletedUsersPropertiesContribution = Object.assign({}, contribution);
    delete deletedUsersPropertiesContribution.users;
    const dataForComparingUsersJson = JSON.parse(fs.readFileSync(metadataDirectoryPath + `${userId}.json`));
    dataForComparingUsersJson.properties.contributions.unshift(deletedUsersPropertiesContribution);
    const json = JSON.stringify(dataForComparingUsersJson, null, 2);
    fs.writeFileSync(metadataDirectoryPath + `${userId}.json`, json);
}


//比較後にuserが消えていた場合に、該当ユーザーのcontributionを削除
const deleteContribution = async(userId, pageId) => {
    const comparedUserFile = fs.readFileSync(metadataDirectoryPath + `${userId}.json`);
    const comparedUserData = JSON.parse(comparedUserFile);
    console.log(comparedUserData);
    const contributionIndex = comparedUserData.properties.contributions.findIndex((result) => result.id === pageId);
    comparedUserData.contributions.splice(contributionIndex, 1);
    const json = JSON.stringify(comparedUserData, null, 2);
    fs.writeFileSync(metadataDirectoryPath + `${userId}.json`, json);
}

const updateContribution = async(userId, contribution) => {
    console.log('update contribution');
    const deletedUsersPropertiesContribution = Object.assign({}, contribution);
    delete deletedUsersPropertiesContribution.users;
    const comparedUserFile = fs.readFileSync(metadataDirectoryPath + `${userId}.json`);
    const comparedUserData = JSON.parse(comparedUserFile);
    const contributionIndex = comparedUserData.properties.contributions.findIndex((result) => result.id === deletedUsersPropertiesContribution.id);
    comparedUserData.properties.contributions.splice(contributionIndex, 1);
    comparedUserData.properties.contributions.unshift(deletedUsersPropertiesContribution);
    const json = JSON.stringify(comparedUserData, null, 2);
    fs.writeFileSync(metadataDirectoryPath + `${userId}.json`,json)
}

const userSearch = (userId) => {
    const fileDir = fs.readdirSync(metadataDirectoryPath);
    const fileIds = fileDir.map((id) => {
	    return id.replace(/.json/g, "");
    })
    return (fileIds.includes(userId));
}

const updateContributionPage = async () => {

    const executionMessage = 'update metadata';
    let executionData;

    try{
        executionData = makeExecutionData(executionMessage);
        const newUserIds = [];
        const metadataFile = fs.readFileSync('src/metadata.json');
        let metadataJson = JSON.parse(metadataFile);

        const lastExecutionTime = logFile[0].time;
            const request = { 
                database_id: process.env.WAGUMI_TEST_DB_ID,
                //古いものから順番に追加していくので、updateの場合は昇順
                sorts: [
                    {
                        property: 'last_edited_time',
                        direction: 'ascending',
                    },
                ],
                filter: {
                    and: [
                        {
                            property: 'last_edited_time',
                            last_edited_time: {
                                after: lastExecutionTime
                            }        
                        },
                        {
                            property: 'publish',
                            checkbox: {
                                equals: true,
                            }
                        }
                    ]
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

                contribution.id = page.id;
                contribution.last_edited_time = page.last_edited_time
        
                tmp = await client.pages.properties.retrieve({ page_id: page.id, property_id: page.properties.name.id});
                contribution.name = tmp.results[0].title.plain_text;
        
                tmp = await client.pages.properties.retrieve({ page_id: page.id, property_id: page.properties.image.id});
                contribution.image = tmp.files[0].name;

                tmp = await client.pages.properties.retrieve({ page_id: page.id, property_id: page.properties.description.id});
                contribution.description = tmp.results[0].rich_text.plain_text;
        
                tmp = await client.pages.properties.retrieve({ page_id: page.id, property_id: page.properties.date.id});
                contribution.date = tmp.date                        
                
                tmp = await client.pages.properties.retrieve({ page_id: page.id, property_id: page.properties.userId.id});
                contribution.users = tmp.results.map((user) =>{
                    let userId = user.rich_text.plain_text;
                return userId;
                });

                const comparedUsers = await compareUsers(contribution);
                for(const comparedUser of comparedUsers) {
                    deleteContribution(comparedUser, contribution.id);
                }

                for(userId of contribution.users) {
                    if(!userSearch(userId)) {
                        newUserIds.push(userId);
                    } else {
                        await updateContribution(userId, contribution);
                    }
                }

                const filterMetadata = metadataJson.filter(result => page.id != result.id);
                filterMetadata.unshift(contribution);
                metadataJson = filterMetadata;
            }
        const jsonData = JSON.stringify(metadataJson,null,2);
        fs.writeFileSync("src/metadata.json", jsonData);
        fs.writeFileSync("src/executionData.json", executionData);

        for(const newUserId of newUserIds) {
            await createUserMetadata(newUserId, lastExecutionTime);
        }    
	} catch(error) {
		console.error(error);
	}
}



const createUserMetadata = async(userId, lastExecutionTime) => {
    const lastExecutionUnix = new Date(lastExecutionTime);
    const metadataJson = JSON.parse(fs.readFileSync('src/metadata.json'));

    const contributions = [];

    for(const contribution of metadataJson) {
        const forComparingUnix = new Date(contribution.last_edited_time);
        if(
            forComparingUnix > lastExecutionUnix && 
            contribution.users.includes(userId)
        ) {
            const deletedUsersPropertiesContribution = Object.assign({}, contribution);
            delete deletedUsersPropertiesContribution.users;
            contributions.push(deletedUsersPropertiesContribution);
        } else if(lastExecutionUnix > forComparingUnix) {
            break
        }
    }

    const metadataFilePath =  `${metadataDirectoryPath}${userId}.json`;

	const metadataStruct = {
		name: "",
		description: "He/She is one of wagumi members.",
		image: "",
		external_url:"",
        properties: {
            toknes: [],
            sns: {},
            contributions: contributions
        },
	};

    const request = { 
		database_id: process.env.WAGUMI_TEST_USER_ID,
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

	metadataStruct.image = process.env.SBT_IMAGE_URL + userId;

	let external_url_id = page.id

	const replacedStr = external_url_id.replace(/-/g, "");
    
    metadataStruct.external_url = process.env.WAGUMI_EXTERNAL_URL + `${replacedStr}`;

    const json = JSON.stringify(metadataStruct, null, 2);
	fs.writeFileSync(metadataFilePath, json);
}



const update = async() => {
    await updateContributionPage();
}

exports.update = update;

(async () => {
    try {
        await update();
    } catch (error) {
      console.error(error.message);
    }
  })();
  