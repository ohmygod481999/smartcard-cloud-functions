const { ory } = require("./ory");

exports.main = async (args) => {
    console.log(args);
    const { flowId, data, myData } = args;
    const res = await ory.submitSelfServiceRegistrationFlow(flowId, data);

    console.log("This is the user session: ", res.data, res.data.identity);
    return res.data;
};
