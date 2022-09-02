require('dotenv').config();

const { Client } = require('@notionhq/client');

const client = new Client({ auth: process.env.MY_NOTION_API_TOKEN });

(async () => {
    try {
    const request = {
        database_id: process.env.MY_DATABASE_ID,
    };

    let response = await client.databases.query(request);
    console.log(response, response.results.length);
    while(response.has_more) {
        request.start_cursor = response.next_cursor;
        response = await client.databases.query(request);
        console.log(response, response.results.length);
    }
    } catch(e) {
        console.error(e);
    } 
})();