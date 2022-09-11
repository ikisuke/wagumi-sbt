require('dotenv').config();

const { Client } = require('@notionhq/client');

// alchemy sdkをimport
// const { Network, Alchemy } = require('alchemy-sdk');

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
                  property: 'publish',
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
  
      let pages = await client.databases.query(request);
  
      await pushContributionPage(pages);
  
      while (pages.has_more) {
        request.start_cursor = pages.next_cursor;
        pages = await client.databases.query(request);
        await pushContributionPage(pages);
      }

    } catch (error) {
      console.error('create metadata failed',error);
    }
  };
  
  const pushContributionPage = async (pages) => {
    for (const page of pages.results) {
      let tmp;

                  tmp = await client.pages.properties.retrieve({ page_id: page.id, property_id: page.properties.image.id});
                  if(tmp.files[0].file) {
                      console.log(tmp.files[0].file);
                  } else {
                      console.log(tmp.files[0].external)
                  }

      }
  };

  (async () => {
      await createMetadata();
  })();
