
const { Client } = require('@notionhq/client');
//envファイルを読み込む
require('dotenv').config();

const client = new Client({ auth: process.env.WAGUMI_SAMURAI_API_TOKEN });

//pageをretrieveする関数
const retrievePage = async (pageId) => {
    const response = await client.pages.retrieve({
        page_id: pageId,
    });
    return response;
};

(async () => {
    await retrievePage('82462e9c-3a16-47cd-bd19-784671cbdf05').then((response) => {
        console.log(response);
    }
    )
})();