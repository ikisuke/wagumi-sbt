const [, , firstArg] = process.argv;

require('dotenv').config();

const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_API_TOKEN });

// const metadata = require("./index");

// // const metadataStruct = metadata.metadataStruct;

// const metadataStruct = {
// 	name: "",
//   	description: "He/She is one of wagumi members.",
//   	image: "",
//   	external_url:"",
// }

const userFunction = async () => {
    const request = { 
		database_id: process.env.WAGUMI_USER_DATABASE_ID,
		filter: {
				property: 'id',
				rich_text: {
                    contains: firstArg
                }
		},
	};

    const response = await notion.databases.query(request);

    const page = response.results[0];

    let tmp;

    console.log(response);
}

// const read = function() {
//     rl = readline.createInterface({
//         input: process.stdin,
//         output: process.stdout
//     });


//     rl.question("Please enter names for your project: ", async (answer) => {
//         //databaseID
//         const databaseId = answer;

//         const databaseResponse = await notion.databases.query({
//             database_id: databaseId,
//         });

//         if (properties.length == 0) {
//             for (const [_, value] of Object.entries(databaseResponse.results[0].properties)) {
//                 // console.log(`${value.id}`)
//                 properties.push(value.id);
//             }
//             // console.log(databaseResponse)
//             // console.log(properties.slice(0, properties.length - 1))
//         }


//         //pageID
//         const pageId = '54fea107-eb48-4869-9922-0721913fde6a';

//             // console.log(`Thank you!! Let's start ${pageId}`);

//         for(const propertyId of properties) {

//             const pageResponse = await notion.pages.properties.retrieve({
//                 page_id: pageId,
//                 property_id: propertyId
//             });
//             readResults(pageResponse);
                       
//         }
//         const json = JSON.stringify(metadata,null,2);
        
//         console.log(json);

//         // fs.writeFileSync(`${firstArg}.json`, json);

//         rl.close();
//     });
// }

// const readResults = (pageResponse) => {
//     if(Object.hasOwn(pageResponse, 'results')) {
//         const people = [];
//         const users = [];
//         const files = [];


//         pageResponse.results.map((result) => {
//             if(Object.hasOwn(result, 'people')) {
//                 people.push(result.people.name);
//                 metadata.people = people;
//                 return
//                 // console.log(result.people.name);
//             }
        
//             if((Object.hasOwn(result, 'rich_text')) && result.id != 'NGz%5D' ) {
//                 // Discord user idを調べている
//                 // なんでuserIDとDescriptionが一緒になってんねん
//                 // console.log(result.rich_text.text.content);
//                 users.push(result.rich_text.text.content);
//                 metadata.users = users;
//                 return
//             } else if (result.id == 'NGz%5D') {
//                 // こっちは説明を調べている
//                 // idはハードコーディングしているので、Notion APIのdatabase retrive機能を使う
//                 metadata.description = result.rich_text.text.content;
//                 return
//             }
//             if(Object.hasOwn(result, 'files')) {
//             // console.log(result)
//             files.push(result.files[0].name);
//             metadata.files = files;
//             return
//             }
//             if(Object.hasOwn(result, 'relation')) {
//                 // console.log(result)
//                 metadata.relation = result.relation;
//                 return
//             }
//         })
//         return
//     } 
    
//     // if(Object.hasOwn(pageResponse, 'checkbox')) {
//     //     // console.log(pageResponse.checkbox)
//     //     metadata.checkbox = pageResponse.checkbox;
//     //     return
//     // }
//     if(Object.hasOwn(pageResponse, 'status')) {
//         // console.log(pageResponse.status)
//         metadata.status = pageResponse.status;
//         return
//     }
//     if(Object.hasOwn(pageResponse, 'select')) {
//         // console.log(pageResponse.status)
//         metadata.select = pageResponse.select;
//         return
//     }
// }

userFunction();

// exports.userFunction = userFunction;