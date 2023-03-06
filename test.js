require('dotenv').config();


const { Client } = require('@notionhq/client');
const { CommandInteractionOptionResolver } = require('discord.js');
const { query } = require('express');

// alchemy sdkをimport
// const { Network, Alchemy } = require('alchemy-sdk');

const users = [
  "768826254093844511"
]

//本番環境
const client = new Client({ auth: process.env.WAGUMI_SAMURAI_API_TOKEN });

const createMetadata = async () => {
  try {

    const request = {
      //本番環境
      database_id: process.env.WAGUMI_DATABASE_ID,
      //test環境
      // database_id: process.env.WAGUMI_TEST_DB_ID,
      filter: {
        property: 'published',
        checkbox: {
          equals: true,
        }
      },
      sorts: [
        {
          property: 'date',
          direction: 'descending',
        },
      ],
    };

    const pages = await client.databases.query(request);
    for (const page of pages.results) {
      // console.log(page);
      let tmp;
      tmp = await client.pages.properties.retrieve({ page_id: page.id, property_id: page.properties.weighting.id });
      const weighting = tmp.select.name;
      const count = weighting.length;
      console.log(count);
    }
    // console.log(pages.results[0].properties.roles);



    // await pushContributionPage(pages);

    // const results = await client.pages.retrieve({page_id: 'f57e14f9-2950-4faf-aaad-474730102da4'});
    // console.log(results.properties.roles);
  } catch (error) {
    console.error(error);
  }
};

const pushContributionPage = async (pages) => {
  for (const page of pages.results) {
    console.log(page.properties.users);
  }
};

(async () => {
  // console.log(process.env.WAGUMI_SAMURAI_API_TOKEN);
  await createMetadata();
})();
