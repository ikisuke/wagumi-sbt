require('dotenv').config();

const fs = require('fs');

// const log = require('./metadataCreate');

const { Client } = require('@notionhq/client');

const client = new Client({ auth: process.env.WAGUMI_SBT_API_TOKEN });

const userIds = [];

const updateMetadata = async (logFilePath) => {
    try{
            const metdataPath = `metadata/${file}`;
            const metadataFile = fs.readFileSync(metdataPath);
        
            let metadata = JSON.parse(metadataFile);

            const executionDataFile = fs.readFileSync(logFilePath);
            const executionData = JSON.parse(executionDataFile);

            if(executionData == []) {
                throw new Error('No Execution Data')
            }		


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
                            if(!userIds.includes(userId)){
                                userIds.push(userId);
                            }
                        return userId;
                        });
                        
                        const filterMetadata = metadata.contributions.filter(result => page.id != result.id);
                        filterMetadata.unshift(contribution);
                        metadata.contributions = filterMetadata;
                    }
                    const metadataJson = JSON.stringify(metadata, null, 2);
                    fs.writeFileSync(metadataPath, metadataJson);
                    const executionMessage = `update ${metadataFilePath}`;
                    log.makeExecutionData(logFilePath, executionMessage);	
	} catch(error) {
		console.error(error);
	}
}

const userSearch = () => {
    const fileDir = fs.readdirSync('metadata');
    const fileIds = fileDir.map((id) => {
	    return id.replace(/.json/g, "");
    })
    console.log(fileIds);
}


(async () => {
	try {
		const logFilePath = 'executionData.json';

			fs.stat(logFilePath, (err, stat) => {
				if (err) {
					const initialData = [];
					const initialDataJson = JSON.stringify(initialData, null, 2);
					fs.writeFileSync('executionData.json', initialDataJson);
					makeExecutionData(logFilePath, 'initialize')
				}
			})
		
		// await updateMetadata(logFilePath);
        userSearch();
		
	} catch(error){
		console.error(error.message);
	}
})();