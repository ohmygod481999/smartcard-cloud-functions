require("dotenv").config()

exports.CARD_PRICE = 300000;
exports.AGENCY_PRICE = 2000000;
exports.F1_PERCENT = 0.2;
exports.ROOT_WALLET_ID = parseInt(process.env.ROOT_WALLET_ID); // Need update
exports.ROOT_SECONDARY_WALLET_ID = parseInt(process.env.ROOT_SECONDARY_WALLET_ID);

exports.PERCENT_AGENCY = {
    0: 0.25,
    1: 0.1,
    2: 0.05,
    3: 0.03,
    4: 0.02,
    5: 0.01,
    6: 0.01,
    7: 0.01,
    8: 0.01,
    9: 0.01,
};
