const { GraphQLClient, gql } = require("graphql-request");
var QRCode = require("qrcode");
// const fs = require("fs");
const { PutObjectCommand, S3Client } = require("@aws-sdk/client-s3");

const MAX_LENGTH_ID = 9;

const main = async (args) => {
    const endpoint = "https://hasura.smartcardnp.vn/v1/graphql";
    const graphQLClient = new GraphQLClient(endpoint, {
        headers: {
            "content-type": "application/json",
            // "x-hasura-admin-secret":
            //     "MJj7ZvOcOnNrca5DQBRQf6Eq5RAAUIWsWSK2ju2eBseBbffMzKrMCgeMtfM3ncKF",
        },
        timeout: 10000,
    });

    const numCards = args.num_cards || 1;

    const insertCardMutation = gql`
        mutation insertCards {
            insert_card(objects: {}) {
                affected_rows
                returning {
                    id
                }
            }
        }
    `;

    const cards = [];
    const domain = "https://smartcardnp.vn";

    const getQrUrl = (domain, cardId) => {
        return new Promise((resolve, reject) => {
            QRCode.toDataURL(`${domain}/user/${cardId}`, function (err, url) {
                if (err) {
                    reject(err);
                } else {
                    resolve(url);
                }
            });
        });
    };

    for (let i = 0; i <= numCards; i++) {
        const insertRes = await graphQLClient.request(insertCardMutation);

        const cardId = insertRes.insert_card.returning[0].id;
        const url = await getQrUrl(domain, cardId);

        const str1 = String(cardId);

        const paddedCardId = str1.padStart(MAX_LENGTH_ID - str1.length, "0")

        cards.push({
            url: url,
            id: paddedCardId,
        });
    }

    let csvContent = `url\tid\n`;

    cards.forEach((card) => {
        csvContent += `${card["url"]}\t'${card["id"]}\n`;
    });

    // console.log(csvContent);
    const s3Client = new S3Client({
        endpoint: process.env.SPACE_URL, // Find your endpoint in the control panel, under Settings. Prepend "https://".
        region: process.env.SPACE_REGION, // Must be "us-east-1" when creating new Spaces. Otherwise, use the region in your endpoint (e.g. nyc3).
        credentials: {
            accessKeyId: process.env.ACCESS_KEY_ID, // Access key pair. You can create access key pairs using the control panel or API.
            secretAccessKey: process.env.SECRET_ACCESS_KEY, // Secret access key defined through an environment variable.
        },
    });

    const params = {
        Bucket: "long-space", // The path to the directory you want to upload the object to, starting with your Space name.
        Key: `smartcard/qr-code/cards-${cards.length}records-${Date.now()}.csv`, // Object key, referenced whenever you want to access this file later.
        Body: csvContent, // The object's contents. This variable is an object, not a string.
        ACL: "public-read", // Defines ACL permissions, such as private or public.
    };

    try {
        const data = await s3Client.send(new PutObjectCommand(params));
        console.log(
            "Successfully uploaded object: " + params.Bucket + "/" + params.Key
        );
        return data;
    } catch (err) {
        console.log("Error", err);
    }

    return { success: true };
};

// main({
//     num_cards: 3
// })

exports.main = main;
