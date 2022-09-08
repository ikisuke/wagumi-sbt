require('dotenv').config();

const fs = require('fs');

const { makeExecutionData } = require('./makeLog');

const { Client } = require('@notionhq/client');

// alchemy sdkをimport
// const { Network, Alchemy } = require('alchemy-sdk');

const client = new Client({ auth: process.env.WAGUMI_SAMURAI_API_TOKEN });

let contribution = {
	id: '',
	last_edited_time: '',
	name: '',
	image: '',
	description: '',
	date: '',
	users: [],
};

const contributions = [];


// let nftsForOwner;
// const chains = [
//   {
//     chainId: 1,
//     network: Network.ETH_MAINNET,
//   },
//   {
//     chainId: 3,
//     network: Network.ETH_ROPSTEN,
//   },
//   {
//     chainId: 4,
//     network: Network.ETH_RINKEBY,
//   },
//   {
//     chainId: 5,
//     network: Network.ETH_GOERLI,
//   },
//   {
//     chainId: 42,
//     network: Network.ETH_KOVAN,
//   },
//   {
//     chainId: 137,
//     network: Network.MATIC_MAINNET,
//   },
//   {
//     chainId: 80001,
//     network: Network.MATIC_MUMBAI,
//   },
// ];

const metadataDirectoryPath = process.env.METADATA_PATH;

//引数にTokens
const getUserData = async (userId) => {
  const metadataStruct = {
    name: '',
    description: 'He/She is one of wagumi members.',
    image: '',
    external_url: '',
    properties: {
		toknes: [],
		sns: {},
		contributions: []
	},
  };

  const request = {
    database_id: process.env.WAGUMI_USER_DATABASE_ID,
    filter: {
      property: 'id',
      rich_text: {
        equals: userId,
      },
    },
  };

  try {
  const response = await client.databases.query(request);

  const page = response.results[0];

  let tmp;

  tmp = await client.pages.properties.retrieve({
    page_id: page.id,
    property_id: page.properties.name.id,
  });
  metadataStruct.name = tmp.results[0].title.plain_text;

  tmp = await client.pages.retrieve({ page_id: page.id });
  metadataStruct.image = tmp.icon.external.url;

	let external_url_id = page.id

	const replacedStr = external_url_id.replace(/-/g, "");

	metadataStruct.image = process.env.SBT_IMAGE_URL + userId;
    
    metadataStruct.external_url = process.env.WAGUMI_EXTERNAL_URL + `${replacedStr}`;

	const metadataJson = JSON.parse(fs.readFileSync('src/metadata.json', 'utf-8'));

	console.log(metadataJson)

  for (const contribution of metadataJson) {
    if (contribution.users.includes(userId)) {
		const userContribution = contribution;
		delete userContribution.users;
      metadataStruct.properties.contributions.push(userContribution);
    }
  }

  const json = JSON.stringify(metadataStruct, null, 2);
  fs.writeFileSync(metadataDirectoryPath + `${userId}.json`, json);
	} catch(error) {
		console.error('create user data failed', error);
	}
};

const userSearch = async () => {
  const userIds = [];
  for (const contribution of contributions) {
    for (user of contribution.users) {
      if (!userIds.includes(user)) {
        userIds.push(user);
      }
    }
  }
  return userIds;
};

// tokens情報取得
// TODO userIdを引数にとる。EOAとの結びつきを考える
// const ownerAddr = '0x7DcF131D0f8Bec6CaEa72d41Da9dB3dC4845644D';

// const getTokenData = async () => {
// 	const tokens = [];
// 	if (ownerAddr.length === 42) {
// 		for (const chain of chains) {
//     		getNFTs(chain, null, tokens);
//     	}
// 	} else {
// 	    console.log('ウォレットアドレスが共有されていません。');
// 	}
// };


// const getNFTs = async (chain, pageKey, tokens) => {
//   //Tokenの情報を取ってくる
//   const settings = {
//     apiKey: process.env.ALCHEMY_API_TOKEN,
//     network: chain.network,
//   };
//   const alchemy = new Alchemy(settings);
//   nftsForOwner = await alchemy.nft.getNftsForOwner(ownerAddr, {
//     pageKey: pageKey,
//   });

//   //検索中のチェーンのNFTをtokens配列に格納
//   for (const nft of nftsForOwner.ownedNfts) {
//     // let contract_address = '0x6144d927ee371de7e7f8221b596f3432e7a8e6d9';
//     const data = JSON.parse(
//       fs.readFileSync('src/contractAddressList.json', 'utf-8')
//     );

//     for (let i in data.list) {
//       let wagumi_address = data.list[i].constract_address;
//       if (nft.contract.address === wagumi_address) {
//         let token = {
//           address: nft.contract.address,
//           tokenId: nft.tokenId,
//           chainId: chain.chainId,
//         };
//         console.log(token);
//         tokens.push(token);
//       } else {
//         continue;
//       }
//     }
//   }

//   if (nftsForOwner.pageKey) {
//     await getNFTs(chain, nftsForOwner.pageKey, tokens);
//   } else {
//     return;
//   }
// };
// (async () => {
//   await getTokenData();
// })();

const createMetadata = async () => {
  const executionMessage = 'create metadata';
  let executionData;

	try {
        executionData = makeExecutionData(executionMessage);

		const request = { 
			database_id: process.env.WAGUMI_DATABASE_ID,
			filter: {
				property: 'publish',
				checkbox: {
					equals: true,
				}
			},
			sorts: [
				{
					property: 'last_edited_time',
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
    const userIds = await userSearch();

    for (let userId of userIds) {
      await getUserData(userId);
    }
    fs.writeFileSync('src/executionData.json', executionData);
  } catch (error) {
    console.error('create metadata failed',error);
  }
};

const pushContributionPage = async (pages) => {
  for (const page of pages.results) {
    let tmp;

	const metadataContribution = Object.assign({},contribution)	;
			//contributeにデータを追加するためのトリガー。falseの場合データ追加をしない。(計算数を減らす目的)
	
				
				metadataContribution.id = page.id;
				metadataContribution.last_edited_time = page.last_edited_time
		
				tmp = await client.pages.properties.retrieve({ page_id: page.id, property_id: page.properties.name.id});
				metadataContribution.name = tmp.results[0].title.plain_text;
		
				tmp = await client.pages.properties.retrieve({ page_id: page.id, property_id: page.properties.image.id});
				metadataContribution.image = tmp.files[0].name;
	
				tmp = await client.pages.properties.retrieve({ page_id: page.id, property_id: page.properties.description.id});
				metadataContribution.description = tmp.results[0].rich_text.plain_text;
		
				tmp = await client.pages.properties.retrieve({ page_id: page.id, property_id: page.properties.date.id});
				metadataContribution.date = tmp.date;
	
				tmp = await client.pages.properties.retrieve({ page_id: page.id, property_id: page.properties.userId.id});
				metadataContribution.users = tmp.results.map((user) =>{
						let userId = user.rich_text.plain_text;
					return userId;
				});
				contributions.push(metadataContribution);
				// console.log(contribution)
	}
  const jsonData = JSON.stringify(contributions, null, 2);
  fs.writeFileSync('src/metadata.json', jsonData);
  // json形式に変換して、ファイル作成
  // コマンドラインの第一引数(discordのユーザーID)をファイル名にする
};
exports.createMetadata = createMetadata;
exports.userSearch = userSearch;
// exports.getTokenData = getTokenData;