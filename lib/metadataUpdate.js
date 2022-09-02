require('dotenv').config();

const fs = require('fs');

const logFile = require('../executionData.json');

const { Client } = require('@notionhq/client');
const { createMetadata } = require('./metadataCreate');
const { makeExecutionData } = require('./makeLog');

const client = new Client({ auth: process.env.WAGUMI_SBT_API_TOKEN });

//usersの比較
const compareUsers = async (contribution) => {
    const dataForComparingUsers = fs.readFileSync(`metadata/${contribution.users[0]}.json`);
    const dataForComparingUsersJson = JSON.parse(dataForComparingUsers);
    const targetPage = dataForComparingUsersJson.contributions.find((result) => result.id === contribution.id);
    console.log(contribution.users, targetPage.users);
    const comparedUsers = targetPage.users.filter(result => contribution.users.indexOf(result) === -1 );
    return comparedUsers;
}

//比較後にuserが消えていた場合に、該当ユーザーのcontributionを削除
const deleteContribution = async(userId, pageId) => {
    const comparedUserFile = fs.readFileSync(`metadata/${userId}.json`);
    const comparedUserData = JSON.parse(comparedUserFile);
    const contributionIndex = comparedUserData.contributions.findIndex((result) => result.id === pageId);
    comparedUserData.contributions.splice(contributionIndex, 1);
    const json = JSON.stringify(comparedUserData, null, 2);
    fs.writeFileSync(`metadata/${userId}.json`, json);
}

const getUserId = async (c) => {
    if(logFile.length == 0) {
        throw new Error('No Execution Data')
    }		
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
            let tmp = await client.pages.properties.retrieve({ page_id: page.id, property_id: page.properties.userId.id});
            for(const user of tmp.results){
                let userId = user.rich_text.plain_text;
                updateMetadata(userId); 
            }; 
        }
}

const updateMetadata = async (userId) => {

    const executionMessage = 'update metadata';
    let executionData;

    try{
        executionData = makeExecutionData(executionMessage);
        const metadataFilePath = `metadata/${userId}.json`;
        const metadataFile = fs.readFileSync(metadataFilePath);
        const metadata = JSON.parse(metadataFile);

            if(logFile.length == 0) {
                throw new Error('No Execution Data')
            }		

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
                            and:[
                                    {
                                        property: 'last_edited_time',
                                        last_edited_time: {
                                            after: lastExecutionTime
                                        }        
                                    },
                                    {
                                        property: 'userId',
                                        rollup: {
                                            any: {
                                                rich_text: {
                                                    equals: userId
                                                }
                                            }
                                        }
                                    }
                            ]
                    } 
                };

                    const pages = await client.databases.query(request);

                    console.log('updating...');
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

                        for(userId of contribution.users) {
                            if(!userSearch(userId)) {
                                createMetadata(userId);
                            }
                        }

                        const comparedUsers = await compareUsers(contribution);
                        console.log(comparedUsers);
                        for(const comparedUser of comparedUsers) {
                            deleteContribution(comparedUser, contribution.id);
                        }

                        //日時が更新されたものを一旦削除して先頭に入れ直す作業
                        const filterMetadata = metadata.contributions.filter(result => page.id != result.id);
                        filterMetadata.unshift(contribution);
                        metadata.contributions = filterMetadata;
                    }
                    const metadataJson = JSON.stringify(metadata, null, 2);
                    fs.writeFileSync(metadataFilePath, metadataJson);
                    fs.writeFileSync('executionData.json', executionData);
	} catch(error) {
		console.error(error);
	}
}

// const userSearch = async (userId) => {
//     const fileDir = fs.readdirSync('metadata');
//     const fileIds = fileDir.map((id) => {
// 	    return id.replace(/.json/g, "");
//     })
//     if(!fileIds.includes(userId)){
//         console.log('creating');
//         await createMetadata(userId);
//         return
//     } 
//     console.log('update');
//     await updateMetadata(userId);
// }

const userSearch = (userId) => {
    const fileDir = fs.readdirSync('metadata');
    const fileIds = fileDir.map((id) => {
	    return id.replace(/.json/g, "");
    })
    return (fileIds.includes(userId));
}

exports.userSearch = userSearch;
exports.updateMetadata = updateMetadata;
exports.getUserId = getUserId;
