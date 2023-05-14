require('dotenv').config();

const fs = require('fs');

const { Client } = require('@notionhq/client');
// const { createMetadata } = require('./metadataCreate');
const { makeExecutionData } = require('./makeLog');

//本番環境
const client = new Client({ auth: process.env.WAGUMI_SAMURAI_API_TOKEN });

//test環境
// const client = new Client({ auth: process.env.WAGUMI_TEST_API_TOKEN});

const metadataDirectoryPath = process.env.METADATA_PATH;

//usersの比較
const compareUsers = async (contribution) => {
    let userIds = {
        forDelete: [],
        forAdd: []
    }
    const dataForComparingUsersJson = JSON.parse(fs.readFileSync(`src/metadata.json`));
    const targetPage = dataForComparingUsersJson.find((result) => result.properties.page_id === contribution.properties.page_id);
    if (!targetPage) {
        for (const userId of contribution.users) {
            await addContribution(userId, contribution);
        };
        return userIds;
    }
    userIds.forDelete = targetPage.users.filter(result => contribution.users.indexOf(result) === -1);
    userIds.forAdd = contribution.users.filter(result => targetPage.users.indexOf(result) === -1);
    // console.log(userIds);
    return userIds;
}

//新しいページが追加されたときに追加処理をかける

const addContribution = async (userId, contribution) => {
    // console.log('add contribution');

    // もし、./metadata/${userId}.jsonが存在しない場合は、新規作成する。
    if (!fs.existsSync(metadataDirectoryPath + `${userId}.json`)) {
        // console.log('create user metadata')
        await createUserMetadata(userId);
    }
    // Q:Object.assignで、contributionの中身をコピーしているが、これはなぜ必要なのか？
    // A:contributionの中身をそのまま渡すと、contributionの中身が変更されてしまうため。
    // 　　そのため、contributionの中身をコピーして、コピーしたものを渡している。
    const deletedUsersPropertiesContribution = Object.assign({}, contribution);

    // Q: なぜ、deletedUsersPropertiesContributionの中身を削除しているのか？
    // A: usersとlast_edited_timeは、{userId}.jsonには不要な情報なので、削除している。
    delete deletedUsersPropertiesContribution.users;
    delete deletedUsersPropertiesContribution.last_edited_time;


    const dataForComparingUsersJson = JSON.parse(fs.readFileSync(metadataDirectoryPath + `${userId}.json`));

    // Q: 以下の処理は、何をしているのか？
    // A: metadata.json内のcontributionの日付を比較して、sortをかけている。
    const forAddDataIndex = dataForComparingUsersJson.properties.contributions.findIndex((result) => {
        Number(contribution.date.start.replaceAll("-", "")) >= Number(result.date.start.replaceAll("-", ""));
    })
    dataForComparingUsersJson.properties.contributions.splice(forAddDataIndex, 0, deletedUsersPropertiesContribution);
    const json = JSON.stringify(dataForComparingUsersJson, null, 2);
    fs.writeFileSync(metadataDirectoryPath + `${userId}.json`, json + `\n`);
}

//更新時にweightingを再計算することで、レピュテーションを調整する。
const calculateWeighting = async (contributions) => {
    let weightingSum = 0;
    for (const contribution of contributions) {
        weightingSum += contribution.weighting;
    }
    console.log(weightingSum);
    return weightingSum;
}


//比較後にuserが消えていた場合に、該当ユーザーのcontributionを削除
const deleteContribution = async (userId, pageId) => {
    // {userId}.jsonを読み込む
    const comparedUserFile = fs.readFileSync(metadataDirectoryPath + `${userId}.json`);
    const comparedUserData = JSON.parse(comparedUserFile);

    // {userId}.jsonの中のcontributionの中から、pageIdが一致するものを削除する。
    const contributionIndex = comparedUserData.properties.contributions.findIndex((result) => result.properties.page_id === pageId);
    comparedUserData.properties.contributions.splice(contributionIndex, 1);
    const json = JSON.stringify(comparedUserData, null, 2);
    fs.writeFileSync(metadataDirectoryPath + `${userId}.json`, json + '\n');
}

// const deleteContributionPage = async(metadataJson, lastExecutionTime) => {
//     try {

//         const request = {
//             //本番環境
//                 // database_id: process.env.WAGUMI_DATABASE_ID,
//             //test環境
//             database_id: process.env.WAGUMI_TEST_DB_ID,
//             filter: {
//                 and: [
//                     {
//                         property: 'last_edited_time',
//                         last_edited_time: {
//                             after: lastExecutionTime
//                         }
//                     },
//                     {
//                         property: 'publish',
//                         checkbox: {
//                             equals: false,
//                         }
//                     }
//                 ],
//                 sorts: [
//                     {
//                         property: 'date',
//                         direction: 'descending',
//                     },
//                 ],
//             }}

//         let pages = await client.databases.query(request);

//         for(const page of pages.results) {
//             const users = await client.pages.properties.retrieve({page_id: page.id, property_id: page.properties.userId.id});
//             for(const user of users) {
//                 const userId = user.rich_text.plain_text;
//                 deleteContribution(userId, page.id);
//             }

//             const deletePageIndex = metadataJson.findIndex(result => result.properties.page_id === page.id);
//             metadataJson.splice(deletePageIndex, 1);
//         }

//         return metadataJson;

//     } catch(error) {
//         console.error(error);
//     }
// }

const updateContribution = async (userId, contribution) => {

    // Q:Object.assignで、contributionの中身をコピーしているが、これはなぜ必要なのか？
    // A:contributionの中身をそのまま渡すと、contributionの中身が変更されてしまうため。
    // 　　そのため、contributionの中身をコピーして、コピーしたものを渡している。
    const deletedUsersPropertiesContribution = Object.assign({}, contribution);
    delete deletedUsersPropertiesContribution.users;
    delete deletedUsersPropertiesContribution.last_edited_time;

    const comparedUserData = JSON.parse(fs.readFileSync(metadataDirectoryPath + `${userId}.json`));
    const filterContributions = comparedUserData.properties.contributions.filter(result => contribution.properties.page_id !== result.properties.page_id);
    const forUpdateDataIndex = filterContributions.findIndex(result =>
        Number(contribution.date.start.replaceAll("-", "")) >= Number(result.date.start.replaceAll("-", ""))
    );
    filterContributions.splice(forUpdateDataIndex, 0, deletedUsersPropertiesContribution);
    comparedUserData.properties.contributions = filterContributions;
    comparedUserData.attributes[1].value = await calculateWeighting(filterContributions);
    const json = JSON.stringify(comparedUserData, null, 2);
    fs.writeFileSync(metadataDirectoryPath + `${userId}.json`, json + '\n');
}


// コントリビューションの作成時に、ユーザーのメタデータが存在するか確認する。
// ./metadata/ディレクトリの{userId}.jsonを配列の形にして検索する
// incluedsで検索するために、配列に変換する。
// true or falseを返す。
// trueの場合は、更新を行う。
// falseの場合は、新規作成を行う。
const userSearch = (userId) => {
    const fileDir = fs.readdirSync(metadataDirectoryPath);
    const fileIds = fileDir.map((id) => {
        return id.replace(/.json/g, "");
    })
    return (fileIds.includes(userId));
}

const updateContributionPage = async () => {

    const executionMessage = 'update metadata';
    let executionData;

    try {
        executionData = makeExecutionData(executionMessage);
        const metadataFile = fs.readFileSync('src/metadata.json');
        let metadataJson = JSON.parse(metadataFile);

        const logFile = JSON.parse(fs.readFileSync('src/executionData.json'));
        const lastExecutionTime = logFile[0].time;


        //archivedされたレピュテーションを削除するための仕組み
        //もう少し効率的に書き出すことはできるだろうと思う。
        metadataJson = await checkArchivedData(metadataJson);
        // console.log(metadataJson);
        let jsonData = JSON.stringify(metadataJson, null, 2);
        fs.writeFileSync("src/metadata.json", jsonData);

        const request = {
            //本番
            database_id: process.env.WAGUMI_DATABASE_ID,

            //test版
            // database_id: process.env.WAGUMI_TEST_DB_ID,
            //古いものから順番に追加していくので、updateの場合は昇順
            sorts: [
                {
                    property: 'date',
                    direction: 'descending',
                },
            ],
            filter: {
                and: [
                    {
                        property: 'last_edited_time',
                        last_edited_time: {
                            after: lastExecutionTime
                        }
                    },
                    {
                        property: 'published',
                        checkbox: {
                            equals: true,
                        }
                    }
                ]
            }
        };

        const pages = await client.databases.query(request);

        if (pages.results.length === 0) {
            console.log("It has updated")
            return
        }

        for (const page of pages.results) {

            let tmp;

            let contribution = {
                last_edited_time: "",
                name: "",
                image: "",
                description: "",
                properties: {
                    page_id: "",
                    reference: []
                },
                weighting: 0,
                date: {
                    start: "",
                    end: ""
                },
                users: []
            };

            contribution.properties.page_id = page.id;
            const targetPageIndex = metadataJson.findIndex((result) => result.properties.page_id === contribution.properties.page_id);
            //contributionの変更と追加で分ける
            if (targetPageIndex !== -1) {
                console.log('patch')

                //重複分の削除
                const filterPages = metadataJson.filter((result) => result.properties.page_id === contribution.properties.page_id);

                const targetPages = metadataJson.splice(targetPageIndex, filterPages.length);
                const targetPage = targetPages[0];

                targetPage.last_edited_time = page.last_edited_time

                tmp = await client.pages.properties.retrieve({ page_id: page.id, property_id: page.properties.name.id });
                targetPage.name = tmp.results[0].title.plain_text;

                tmp = await client.pages.properties.retrieve({ page_id: page.id, property_id: page.properties.image.id });
                if (tmp.files[0].file) {
                    targetPage.image = tmp.files[0].file.url;
                } else {
                    targetPage.image = tmp.files[0].external.url;
                }

                tmp = await client.pages.properties.retrieve({ page_id: page.id, property_id: page.properties.description.id });
                targetPage.description = tmp.results[0].rich_text.plain_text;

                tmp = await client.pages.properties.retrieve({ page_id: page.id, property_id: page.properties.date.id });
                targetPage.date.start = tmp.date.start;
                targetPage.date.end = tmp.date.end;
                if (!targetPage.date.end) {
                    targetPage.date.end = "";
                }

                tmp = await client.pages.properties.retrieve({ page_id: page.id, property_id: page.properties.userId.id });
                targetPage.users = tmp.results.map((user) => {
                    let userId = user.rich_text.plain_text;
                    return userId;
                });

                tmp = await client.pages.properties.retrieve({ page_id: page.id, property_id: page.properties.weighting.id })
                contribution.weighting = tmp.select.name.length;
                console.log(contribution);

                const filterContributions = metadataJson.filter(result => targetPage.properties.page_id !== result.id);
                const changeContributionIndex = filterContributions.findIndex(result =>
                    Number(result.date.start.replaceAll("-", "")) < Number(targetPage.date.start.replaceAll("-", ""))
                );
                filterContributions.splice(changeContributionIndex, 0, targetPage);
                metadataJson = filterContributions;
                contribution = targetPage;
            } else {
                console.log('add');
                contribution.last_edited_time = page.last_edited_time

                tmp = await client.pages.properties.retrieve({ page_id: page.id, property_id: page.properties.name.id });
                contribution.name = tmp.results[0].title.plain_text;

                tmp = await client.pages.properties.retrieve({ page_id: page.id, property_id: page.properties.image.id });
                if (tmp.files[0].file) {
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

                console.log(contribution);
                const addContributionIndex = metadataJson.findIndex(result =>
                    Number(result.date.start.replaceAll("-", "")) < Number(contribution.date.start.replaceAll("-", ""))
                );
                console.log(addContributionIndex);
                metadataJson.splice(addContributionIndex, 0, contribution);
            }

            // console.log(contribution);

            // deleteUserIdは更新時に、削除するユーザーのidが格納された配列
            // これを元にdeleteContributionを実行する
            const comparedUsers = await compareUsers(contribution);
            for (const deleteUserId of comparedUsers.forDelete) {
                deleteContribution(deleteUserId, contribution.properties.page_id);
            }

            // addUserIdは更新時に、追加するユーザーのidが格納された配列
            // これを元にaddContributionを実行する
            for (const addUserId of comparedUsers.forAdd) {
                addContribution(addUserId, contribution);
            }

            for (userId of contribution.users) {
                if (userSearch(userId)) {
                    await updateContribution(userId, contribution);
                    // await calculateWeighting(userId, contribution);
                }
            }


        }
        // const updatedMetadata = deleteContributionPage(metadataJson, lastExecutionTime);
        jsonData = JSON.stringify(metadataJson, null, 2);
        fs.writeFileSync("src/metadata.json", jsonData + '\n');
        fs.writeFileSync("src/executionData.json", executionData + '\n');

    } catch (error) {
        console.error(error);
    }
}



const createUserMetadata = async (userId) => {

    const metadataFilePath = `${metadataDirectoryPath}${userId}.json`;

    const metadataStruct = {
        name: "",
        description: "He/She is one of wagumi members.",
        image: "",
        external_url: "",
        properties: {
            toknes: [],
            sns: {},
            contributions: []
        },
        attributes: [
            { trait_type: "weighting" }, { value: 0 }
        ]
    };

    const request = {
        //本番
        database_id: process.env.WAGUMI_USER_DATABASE_ID,
        //test版
        // database_id: process.env.WAGUMI_TEST_USER_ID,
        filter: {
            property: 'id',
            rich_text: {
                equals: userId
            }
        },
    };


    const response = await client.databases.query(request);

    const page = response.results[0];

    let tmp;

    tmp = await client.pages.properties.retrieve({ page_id: page.id, property_id: page.properties.name.id });
    metadataStruct.name = tmp.results[0].title.plain_text;

    metadataStruct.image = process.env.SBT_IMAGE_URL + userId;

    let external_url_id = page.id

    const replacedStr = external_url_id.replace(/-/g, "");

    metadataStruct.external_url = process.env.WAGUMI_EXTERNAL_URL + `${replacedStr}`;

    metadataStruct.attributes[1].value = 0;

    const json = JSON.stringify(metadataStruct, null, 2);
    fs.writeFileSync(metadataFilePath, json + '\n');
}

const checkArchivedData = async (metadataJson) => {
    const archivedContributions = await Promise.all(metadataJson.map(async (result) => {
        const page = await client.pages.retrieve({ page_id: result.properties.page_id });
        const isArchived = page.archived;
        if (isArchived) {
            const users = result.users;
            for (const userId of users) {
                deleteContribution(userId, result.properties.page_id);
            }
            return
        }
        return result
    }))
    const isNotArchivedContributions = archivedContributions.filter(result => result);
    return isNotArchivedContributions

}


const update = async () => {
    await updateContributionPage();
}

exports.update = update;
