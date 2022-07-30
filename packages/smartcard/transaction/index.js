const { GraphQLClient, gql } = require("graphql-request");
const {
    CARD_PRICE,
    F1_PERCENT,
    PERCENT_AGENCY,
    AGENCY_PRICE,
    ROOT_WALLET_ID,
    ROOT_SECONDARY_WALLET_ID,
} = require("./constants");
require("dotenv").config()

exports.main = async (args) => {
    // const endpoint = "https://smartmark.hasura.app/v1/graphql";
    const endpoint = process.env.HASURA_ENDPOINT;
    const graphQLClient = new GraphQLClient(endpoint, {
        headers: {
            "content-type": "application/json",
            // "x-hasura-admin-secret":
            //     "MJj7ZvOcOnNrca5DQBRQf6Eq5RAAUIWsWSK2ju2eBseBbffMzKrMCgeMtfM3ncKF",
        },
        timeout: 10000,
    });

    const { account_id, transaction_type, payload, date } = args;

    console.log(args);

    const getWalletByAccountIdQuery = gql`
        query getWalletByAccountIdQuery($account_id: Int!) {
            wallet(where: { account_id: { _eq: $account_id } }) {
                id
                type
                account_id
                amount
            }
        }
    `;
    const res = await graphQLClient.request(getWalletByAccountIdQuery, {
        account_id,
    });
    console.log(res);
    const wallets = res.wallet;

    let mainWallet = null;
    let secondaryWallet = null;
    wallets.forEach((wallet) => {
        if (wallet.type === 0) {
            mainWallet = wallet;
        }
        if (wallet.type === 1) {
            secondaryWallet = wallet;
        }
    });

    console.log(mainWallet);
    console.log(secondaryWallet);

    if (!mainWallet || !secondaryWallet) {
        return {
            success: false,
        };
    }

    const updateWalletMutation = gql`
        mutation updateWallet($wallet_id: Int!, $amount: numeric) {
            update_wallet_by_pk(
                pk_columns: { id: $wallet_id }
                _set: { amount: $amount }
            ) {
                id
                amount
                type
                account_id
            }
        }
    `;

    const insertTransactionMutation = gql`
        mutation insertTransaction(
            $wallet_id: Int!
            $from_wallet_id: Int
            $type: Int
            $amount: numeric
            $date: timestamp
        ) {
            insert_transaction_one(
                object: {
                    wallet_id: $wallet_id
                    type: $type
                    amount: $amount
                    date: $date
                    from_wallet_id: $from_wallet_id
                }
            ) {
                id
                amount
                type
                wallet_id
                from_wallet_id
            }
        }
    `;

    if (transaction_type === 0 || transaction_type === 2) {
        // reward for referer

        const { level, is_agency } = payload;

        const oldAmount = mainWallet.amount;
        let amount = 0;

        let price = 0;
        switch (transaction_type) {
            case 0:
                price = CARD_PRICE;
                break;
            case 2:
                price = AGENCY_PRICE;
                break;
        }

        if (!is_agency && level === 0) {
            amount = price * F1_PERCENT;
        } else if (is_agency) {
            if (level in PERCENT_AGENCY) {
                amount = price * PERCENT_AGENCY[level];
            }
        }

        const updateWalletRes = await graphQLClient.request(
            updateWalletMutation,
            {
                wallet_id: mainWallet.id,
                amount: oldAmount + amount,
            }
        );

        const insertTransactionRes = await graphQLClient.request(
            insertTransactionMutation,
            {
                from_wallet_id: ROOT_WALLET_ID,
                wallet_id: mainWallet.id,
                type: transaction_type,
                amount: amount, // dua vao level
                date,
            }
        );
    } else if (transaction_type === 1) {
        // reward for new user
        const updateWalletRes = await graphQLClient.request(
            updateWalletMutation,
            {
                wallet_id: secondaryWallet.id,
                amount: CARD_PRICE,
            }
        );

        const insertTransactionRes = await graphQLClient.request(
            insertTransactionMutation,
            {
                from_wallet_id: ROOT_SECONDARY_WALLET_ID,
                wallet_id: secondaryWallet.id,
                type: transaction_type,
                amount: CARD_PRICE,
                date,
            }
        );
    } else if (transaction_type === 3) {
        // withdraw money

        const oldAmount = mainWallet.amount;

        const { amount } = payload; // amount: so tien rut

        if (amount > oldAmount) {
            return {
                success: false,
                message: "Withdrawal amount is more than wallet amount",
            };
        }

        const updateWalletRes = await graphQLClient.request(
            updateWalletMutation,
            {
                wallet_id: mainWallet.id,
                amount: oldAmount - amount,
            }
        );

        const insertTransactionRes = await graphQLClient.request(
            insertTransactionMutation,
            {
                from_wallet_id: mainWallet.id,
                wallet_id: null,
                type: transaction_type,
                amount: amount,
                date,
            }
        );
    }

    return { success: true };
};
