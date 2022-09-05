require('dotenv').config();

const { Client } = require('@notionhq/client');

const client = new Client({ auth: process.env.WAGUMI_SYOGUN_API_TOKEN });

(async () => {
	try {
        const request = {
            database_id: process.env.WAGUMI_DATABASE_ID,
        }
        const pages = await client.databases.query(request);
        // console.log(pages.results[0]);
        const users = await client.pages.properties.retrieve({page_id: pages.results[0].id, property_id: pages.results[0].properties.users.id})
        const userData = users.results.map((result) => {
                return result.relation;
            }
        )
        console.log(userData);

	} catch(error){
		console.error(error.message);
	}
})();