require('dotenv').config();

const { Client } = require('@notionhq/client');
const { query } = require('express');

// alchemy sdkをimport
// const { Network, Alchemy } = require('alchemy-sdk');

//本番環境
const client = new Client({ auth: process.env.WAGUMI_SAMURAI_API_TOKEN });

const createMetadata = async () => {
      try {
  
        const request = {
            //本番用
            database_id: process.env.WAGUMI_USER_DATABASE_ID,
            //test環境用
            // database_id: process.env.WAGUMI_TEST_USER_ID,
            filter: {
              property: 'id',
              rich_text: {
                equals: '937906941257199667',
              },
            },
        };

        const pages = await client.databases.query(request);
        await pushContributionPage(pages);
    } catch (error) {
      console.error('create metadata failed',error);
    }
  };
  
  const pushContributionPage = async (pages) => {
    for (const page of pages.results) {
        console.log(page);
      }
  };

  (async () => {
      await createMetadata();
  })();
