// const express = require('express');
require('dotenv').config();

const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_API_TOKEN });

(async () => {
    const blocks = [];
    const databaseId = '2c1e8ad2a0c64a908854e24629c19d5a';
    const response = await notion.databases.query({ 
        database_id: databaseId,
        sorts: [
            {
                property: 'test A',
                direction: 'ascending',
            },
        ]
    });
    // console.log(response.results[0].properties);

    // console.log(response);

    const result = await Promise.all(response.results.map(async (result) => {
        const blockResponse = await notion.blocks.retrieve({
            block_id: result.id
        });
        // console.log(blockResponse); 


        //
        if (blocks.length == 0) {
            for (const [_, value] of Object.entries(response.results[0].properties)) {
                // console.log(`${value.id}`)
                blocks.push(value.id);
            }
            blocks.pop();
            // console.log(blocks)
        }
        const pageId = blockResponse.id;
        // const propertiesId = 'U%3B%3B%40';
        // console.log(pageId);

        for( const propertyId of blocks) {
            const pageResponse = await notion.pages.properties.retrieve({
                page_id: pageId,
                property_id: propertyId
            });
            // console.log(pageResponse);
        }
    }))
    
})();

// const app = express();

// app.get('/', (req, res) => {
//     res.render('hello.ejs');
// });



// app.listen(3000);