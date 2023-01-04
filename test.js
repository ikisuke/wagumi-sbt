require('dotenv').config();


const { Client } = require('@notionhq/client');
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
          for(const user of users) {
            const request = {
              //本番用
              database_id: process.env.WAGUMI_USER_DATABASE_ID,
              //test環境用
              // database_id: process.env.WAGUMI_TEST_USER_ID,
              filter: {
                and: [
                  {
                    property: 'id',
                      rich_text: {
                        equals: user,
                      },
                  },{
                    property: 'roles',
                      multi_select: {
                        contains: 'Wagumi SBT'
                      }
                    }
                ]
              },
          };

            const pages = await client.databases.query(request);
            if(!pages) {
              console.log(user, false);
            } else {
              console.log(user, true);
            }
            // console.log(pages.results[0].properties.roles);
          }
        

        // await pushContributionPage(pages);

        // const results = await client.pages.retrieve({page_id: 'f57e14f9-2950-4faf-aaad-474730102da4'});
        // console.log(results.properties.roles);
    } catch (error) {
      console.error('create metadata failed',user);
    }
  };
  
    const pushContributionPage = async (pages) => {
      for (const page of pages.results) {
          console.log(page.properties.users);
        }
    };

  (async () => {
    console.log(process.env.WAGUMI_SAMURAI_API_TOKEN);
      await createMetadata();
  })();
