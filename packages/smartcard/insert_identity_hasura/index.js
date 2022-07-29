const { GraphQLClient, gql } = require("graphql-request");
const amqp = require("amqplib/callback_api");
const axios = require("axios").default;

exports.main = async (args) => {
    try {
        const endpoint = "https://hasura.smartcardnp.vn/v1/graphql";
        const graphQLClient = new GraphQLClient(endpoint, {
            headers: {
                "content-type": "application/json",
                // "x-hasura-admin-secret":
                //     "MJj7ZvOcOnNrca5DQBRQf6Eq5RAAUIWsWSK2ju2eBseBbffMzKrMCgeMtfM3ncKF",
            },
            timeout: 10000,
        });

        const oryId = args.identity.id;
        const cardId = args.identity.traits.card_id;
        const referer_id = args.identity.traits.referer_id;

        const insertAccountQuery = gql`
            mutation insertAccount($ory_id: uuid!, $referer_id: Int) {
                insert_account(
                    objects: { ory_id: $ory_id, referer_id: $referer_id }
                ) {
                    affected_rows
                    returning {
                        id
                    }
                }
            }
        `;
        const insertAccountQueryVariables = {
            ory_id: oryId,
            referer_id: referer_id ? parseInt(referer_id) : null,
        };

        const insertRes = await graphQLClient.request(
            insertAccountQuery,
            insertAccountQueryVariables
        );

        // connect card with account

        const connectAccountToCardQuery = gql`
            mutation updateCard($card_id: Int!, $account_id: Int!) {
                update_card(
                    where: { id: { _eq: $card_id } }
                    _set: { account_id: $account_id }
                ) {
                    affected_rows
                }
            }
        `;

        const account_id = insertRes.insert_account.returning[0].id;

        const connectAccountToCardVariables = {
            card_id: cardId,
            account_id: account_id,
        };

        const updateRes = await graphQLClient.request(
            connectAccountToCardQuery,
            connectAccountToCardVariables
        );

        // Create wallet

        const createWalletMutation = gql`
            mutation createWallet($account_id: Int!, $wallet_type: Int!) {
                insert_wallet(
                    objects: { account_id: $account_id, type: $wallet_type }
                ) {
                    returning {
                        id
                    }
                }
            }
        `;

        const createCardRes = await Promise.all([
            graphQLClient.request(createWalletMutation, {
                account_id: account_id,
                wallet_type: 0,
            }),
            graphQLClient.request(createWalletMutation, {
                account_id: account_id,
                wallet_type: 1,
            }),
        ]);

        // thuong nguoi dung moi
        amqp.connect(
            "amqp://admin:admin@139.59.234.34:5672",
            function (error0, connection) {
                if (error0) {
                    throw error0;
                }

                connection.createChannel(function (error1, channel) {
                    if (error1) {
                        throw error1;
                    }
                    const queue = "transaction";

                    channel.assertQueue(queue, {
                        durable: false,
                    });

                    channel.sendToQueue(
                        "transaction",
                        Buffer.from(
                            JSON.stringify({
                                account_id: account_id,
                                transaction_type: 1, // 1: reward for new user
                                payload: {},
                                date: new Date(),
                            })
                        )
                    );
                });
            }
        );

        return { success: true };
    } catch (err) {
        const res  = await axios.delete(
            `https://auth-admin.smartcardnp.vn/admin/identities/${args.identity.id}`
        );
        console.log(res.data)
        return { success: true, message: err };
    }
    // const endpoint = "https://smartmark.hasura.app/v1/graphql";
};
