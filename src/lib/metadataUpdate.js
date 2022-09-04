require('dotenv').config();

const fs = require('fs');

const logFile = require('../executionData.json');

const { Client } = require('@notionhq/client');
// const { createMetadata } = require('./metadataCreate');
const { makeExecutionData } = require('./makeLog');

const client = new Client({ auth: process.env.WAGUMI_SBT_API_TOKEN });

//usersの比較
const compareUsers = async (contribution) => {
    const dataForComparingUsers = fs.readFileSync(`src/metadata/${contribution.users[0]}.json`);
    const dataForComparingUsersJson = JSON.parse(dataForComparingUsers);
    const targetPage = dataForComparingUsersJson.contributions.find((result) => result.id === contribution.id);
    console.log(contribution.users, targetPage.users);
    const comparedUsers = targetPage.users.filter(result => contribution.users.indexOf(result) === -1 );
    return comparedUsers;
}

//比較後にuserが消えていた場合に、該当ユーザーのcontributionを削除
const deleteContribution = async(userId, pageId) => {
    const comparedUserFile = fs.readFileSync(`src/metadata/${userId}.json`);
    const comparedUserData = JSON.parse(comparedUserFile);
    const contributionIndex = comparedUserData.contributions.findIndex((result) => result.id === pageId);
    comparedUserData.contributions.splice(contributionIndex, 1);
    const json = JSON.stringify(comparedUserData, null, 2);
    fs.writeFileSync(`metadata/${userId}.json`, json);
}

const updateContribution = async(userId, contribution) => {
    const comparedUserFile = fs.readFileSync(`src/metadata/${userId}.json`);
    const comparedUserData = JSON.parse(comparedUserFile);
    const contributionIndex = comparedUserData.contributions.findIndex((result) => result.id === contribution.id);
    comparedUserData.contributions.splice(contributionIndex, 1);
    comparedUserData.contributions.unshift(contribution);
    const json = JSON.stringify(comparedUserData, null, 2);
    fs.writeFileSync(`metadata/${userId}.json`,json)
}

const userSearch = (userId) => {
    const fileDir = fs.readdirSync('src/metadata');
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
                console.log(comparedUsers);
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
    const metadataFile = fs.readFileSync('src/metadata.json');
    const metadataJson = JSON.parse(metadataFile);

    const contributions = [];

    for(const contribution of metadataJson) {
        const forComparingUnix = new Date(contribution.last_edited_time);
        if(
            forComparingUnix > lastExecutionUnix && 
            contribution.users.includes(userId)
        ) {
            contributions.push(contribution);
        } else if(lastExecutionUnix > forComparingUnix) {
            break
        }
    }

    const metadataFilePath = `src/metadata/${userId}.json`;

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

    const json = JSON.stringify(metadataStruct, null, 2);
	fs.writeFileSync(metadataFilePath, json);
}



const update = async() => {
    await updateContributionPage();
}

exports.update = update;

