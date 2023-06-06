require('dotenv').config();

const fs = require('fs');

const { makeExecutionData } = require('./makeLog');

const { Client } = require('@notionhq/client');


// alchemy sdkをimport
// const { Network, Alchemy } = require('alchemy-sdk');

//本番環境
const client = new Client({ auth: process.env.WAGUMI_SAMURAI_API_TOKEN });

//test環境用
// const client = new Client({ auth: process.env.WAGUMI_TEST_API_TOKEN });



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

// 失敗時のidを取得するためのリスト
const failedIdList = [];

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
    attributes: [
      { trait_type: "weighting", value: 0 },
    ]
  };

  const request = {
    //本番用
    database_id: process.env.WAGUMI_USER_DATABASE_ID,
    //test環境用
    // database_id: process.env.WAGUMI_TEST_USER_ID,
    filter: {
      property: 'id',
      rich_text: {
        equals: userId,
      },
    },
  };
  console.log('Making ', userId)

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

    for (const contribution of metadataJson) {
      if (contribution.users.includes(userId)) {
        const userContribution = contribution;
        delete userContribution.users;
        delete userContribution.last_edited_time;
        metadataStruct.attributes[0].value += userContribution.weighting;
        metadataStruct.properties.contributions.push(userContribution);
      }
    }


    const json = JSON.stringify(metadataStruct, null, 2);


    fs.writeFileSync(metadataDirectoryPath + `${userId}.json`, json + '\n');
  } catch (error) {
    failedIdList.push(userId);
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

    let pages = await client.databases.query(request);
    console.log(pages.results)

    await pushContributionPage(pages);

    while (pages.has_more) {
      request.start_cursor = pages.next_cursor;
      pages = await client.databases.query(request);
      await pushContributionPage(pages);
    }
    const userIds = await userSearch();

    // metadataディレクトリが存在しない場合は作成
    if (!fs.existsSync(metadataDirectoryPath)) {
      fs.mkdirSync(metadataDirectoryPath);
    }
    // metadataディレクトリ直下のファイルを全て削除
    fs.readdirSync(metadataDirectoryPath).forEach((file) => {
      fs.unlinkSync(metadataDirectoryPath + file);
    });

    for (let userId of userIds) {
      await getUserData(userId);
    }

    // 取得失敗に対して再取得を行う関数
    while (failedIdList.length > 0) {
      const failedId = failedIdList.shift();
      console.log('making again', failedId)
      await getUserData(failedId);
    }

    fs.writeFileSync('src/executionData.json', executionData + '\n');
    console.log('success!')
  } catch (error) {
    console.error('create metadata failed', error);
  }
};

const pushContributionPage = async (pages) => {
  for (const page of pages.results) {
    let tmp;

    let contribution = {
      last_edited_time: '',
      name: '',
      image: '',
      description: '',
      properties: {
        page_id: '',
        reference: []
      },
      weighting: 0,
      date: {
        start: "",
        end: ""
      },
      users: [],
    };

    const retrivedPage = await client.pages.retrieve({ page_id: page.id });
    console.log(retrivedPage.archived);
    //contributeにデータを追加するためのトリガー。falseの場合データ追加をしない。(計算数を減らす目的)


    contribution.properties.page_id = page.id;
    contribution.last_edited_time = page.last_edited_time;

    tmp = await client.pages.properties.retrieve({ page_id: page.id, property_id: page.properties.name.id });
    contribution.name = tmp.results[0].title.plain_text;

    //imageが設定されていない場合
    tmp = await client.pages.properties.retrieve({ page_id: page.id, property_id: page.properties.image.id });
    console.log(tmp);
    if (tmp.files.length == 0) {
      contribution.image = "No Image";
    } else if (tmp.files[0].file) {
      contribution.image = tmp.files[0].file.url;
    } else {
      contribution.image = tmp.files[0].external.url;
    }

    tmp = await client.pages.properties.retrieve({ page_id: page.id, property_id: page.properties.description.id });
    contribution.description = tmp.results[0].rich_text.plain_text;

    tmp = await client.pages.properties.retrieve({ page_id: page.id, property_id: page.properties.date.id });
    contribution.date.start = tmp.date.start;
    contribution.date.end = tmp.date.end;
    if (!contribution.date.end) {
      contribution.date.end = "";
    }

    tmp = await client.pages.properties.retrieve({ page_id: page.id, property_id: page.properties.userId.id });
    contribution.users = tmp.results.map((user) => {
      let userId = user.rich_text.plain_text;
      return userId;
    });

    tmp = await client.pages.properties.retrieve({ page_id: page.id, property_id: page.properties.weighting.id })
    contribution.weighting = tmp.select.name.length;

    contributions.push(contribution);
    console.log(contribution)
  }
  const jsonData = JSON.stringify(contributions, null, 2);
  fs.writeFileSync('src/metadata.json', jsonData + '\n');
  // json形式に変換して、ファイル作成
  // コマンドラインの第一引数(discordのユーザーID)をファイル名にする
};
exports.createMetadata = createMetadata;
exports.userSearch = userSearch;
// exports.getTokenData = getTokenData;
