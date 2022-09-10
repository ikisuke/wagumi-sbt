require('dotenv').config();

const fs = require('fs');

const logFile = require('../executionData.json');

const { Client } = require('@notionhq/client');
// const { createMetadata } = require('./metadataCreate');
const { makeExecutionData } = require('./makeLog');

//本番環境
const client = new Client({ auth: process.env.WAGUMI_SAMURAI_API_TOKEN });

//test環境
// const client = new Client({ auth: process.env.WAGUMI_TEST_API_TOKEN});

const metadataDirectoryPath = process.env.METADATA_PATH;

//usersの比較
const compareUsers = async (contribution) => {
    let userIds = { 
        forDelete: [],
        forAdd: []
    }
    const dataForComparingUsersJson = JSON.parse(fs.readFileSync(`src/metadata.json`));
    const targetPage = dataForComparingUsersJson.find((result) => result.id === contribution.id);
    if(!targetPage) {
        for(const userId of contribution.users) {
            await addContribution(contribution, userId);  
        };
        return userIds;
    } 
    userIds.forDelete = targetPage.users.filter(result => contribution.users.indexOf(result) === -1 );
    userIds.forAdd = contribution.users.filter(result => targetPage.users.indexOf(result) === -1);
    // console.log(userIds);
    return userIds;
}

//新しいページが追加されたときに追加処理をかける
const addContribution = async(userId, contribution) => {
    // console.log('add contribution');
    if(!fs.existsSync(metadataDirectoryPath + `${userId}.json`)) {
        // console.log('create user metadata')
        await createUserMetadata(userId);
    }
    const deletedUsersPropertiesContribution = Object.assign({}, contribution);
    delete deletedUsersPropertiesContribution.users;
    delete deletedUsersPropertiesContribution.last_edited_time;

    const dataForComparingUsersJson = JSON.parse(fs.readFileSync(metadataDirectoryPath + `${userId}.json`));
    const forAddDataIndex = dataForComparingUsersJson.properties.contributions.findIndex((result) => {
        Number(contribution.date.start.replaceAll("-", "")) > Number(result.date.start.replaceAll("-", ""));
    })
    dataForComparingUsersJson.properties.contributions.splice(forAddDataIndex, 0, contribution);
    const json = JSON.stringify(dataForComparingUsersJson, null, 2);
    fs.writeFileSync(metadataDirectoryPath + `${userId}.json`, json);
}


//比較後にuserが消えていた場合に、該当ユーザーのcontributionを削除
const deleteContribution = async(userId, pageId) => {
    const comparedUserFile = fs.readFileSync(metadataDirectoryPath + `${userId}.json`);
    const comparedUserData = JSON.parse(comparedUserFile);
    const contributionIndex = comparedUserData.properties.contributions.findIndex((result) => result.id === pageId);
    comparedUserData.properties.contributions.splice(contributionIndex, 1);
    const json = JSON.stringify(comparedUserData, null, 2);
    fs.writeFileSync(metadataDirectoryPath + `${userId}.json`, json);
}

const updateContribution = async(userId, contribution) => {
    // console.log('update contribution');
    const deletedUsersPropertiesContribution = Object.assign({}, contribution);
    delete deletedUsersPropertiesContribution.users;
    delete deletedUsersPropertiesContribution.last_edited_time;

    const comparedUserData = JSON.parse(fs.readFileSync(metadataDirectoryPath + `${userId}.json`));
    const filterContributions = comparedUserData.properties.contributions.filter(result => contribution.id !== result.id);
    const forUpdateDataIndex = filterContributions.findIndex(result => 
        Number(contribution.date.start.replaceAll("-", "")) > Number(result.date.start.replaceAll("-", ""))
    );
    filterContributions.splice(forUpdateDataIndex, 0, deletedUsersPropertiesContribution);
    comparedUserData.properties.contributions = filterContributions;
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
        const metadataFile = fs.readFileSync('src/metadata.json');
        let metadataJson = JSON.parse(metadataFile);

        const lastExecutionTime = logFile[0].time;
            const request = {
                //本番
                database_id: process.env.WAGUMI_DATABASE_ID,

                //test版
                // database_id: process.env.WAGUMI_TEST_DB_ID,
                //古いものから順番に追加していくので、updateの場合は昇順
                sorts: [
                    {
                        property: 'date',
                        direction: 'descending',
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
                const targetPage = metadataJson.find((result) => result.id === contribution.id);
                //contributionの変更と追加で分ける
                if(targetPage) {
                    // console.log('patch')
                    targetPage.last_edited_time = page.last_edited_time
        
                    tmp = await client.pages.properties.retrieve({ page_id: page.id, property_id: page.properties.name.id});
                    targetPage.name = tmp.results[0].title.plain_text;
            
                    tmp = await client.pages.properties.retrieve({ page_id: page.id, property_id: page.properties.image.id});
                    targetPage.image = tmp.files[0].name;

                    tmp = await client.pages.properties.retrieve({ page_id: page.id, property_id: page.properties.description.id});
                    targetPage.description = tmp.results[0].rich_text.plain_text;
            
                    tmp = await client.pages.properties.retrieve({ page_id: page.id, property_id: page.properties.date.id});
                    targetPage.date = tmp.date                        
                    
                    tmp = await client.pages.properties.retrieve({ page_id: page.id, property_id: page.properties.userId.id});
                    targetPage.users = tmp.results.map((user) =>{
                        let userId = user.rich_text.plain_text;
                    return userId;
                    });
                    const filterContributions = metadataJson.filter(result => targetPage.id !== result.id);
                    const changeContributionIndex = filterContributions.findIndex(result => 
                        Number(result.date.start.replaceAll("-", "")) < Number(targetPage.date.start.replaceAll("-", ""))
                    );
                    filterContributions.splice(changeContributionIndex, 0, targetPage);
                    metadataJson = filterContributions;
                    contribution = targetPage;
                } else {
                    // console.log('add');
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
                    const addContributionIndex = metadataJson.findIndex(result => 
                        Number(result.date.start.replaceAll("-", "")) < Number(contribution.date.start.replaceAll("-", ""))
                    );
                    // console.log(addContributionIndex);
                    metadataJson.splice(addContributionIndex, 0, contribution);
                }

                // console.log(contribution);

                const comparedUsers = await compareUsers(contribution);
                for(const deleteUserId of comparedUsers.forDelete) {
                    deleteContribution(deleteUserId, contribution.id);
                }

                for(const addUserId of comparedUsers.forAdd) {
                    addContribution(addUserId, contribution);
                }

                for(userId of contribution.users) {
                    if(userSearch(userId)) {
                        await updateContribution(userId, contribution);
                    }
                }


            }
        const jsonData = JSON.stringify(metadataJson,null,2);
        fs.writeFileSync("src/metadata.json", jsonData);
        fs.writeFileSync("src/executionData.json", executionData);

	} catch(error) {
		console.error(error);
	}
}



const createUserMetadata = async(userId) => {

    const metadataFilePath =  `${metadataDirectoryPath}${userId}.json`;

	const metadataStruct = {
		name: "",
		description: "He/She is one of wagumi members.",
		image: "",
		external_url:"",
        properties: {
            toknes: [],
            sns: {},
            contributions: []
        },
	};

    const request = { 
        //本番
		database_id: process.env.WAGUMI_USER_DATABASE_ID,
        //test版
        // database_id: process.env.WAGUMI_TEST_USER_ID,
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
