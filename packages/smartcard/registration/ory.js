const { Configuration, V0alpha2Api } = require("@ory/client");
// const { edgeConfig } = require("@ory/integrations/next");

exports.ory = new V0alpha2Api(
    new Configuration({
        baseUrl: "https://compassionate-cerf-qnxuxdt63h.projects.oryapis.com",
        // baseUrl: "/.ory",
        baseOptions: {
            // Ensures that cookies are included in CORS requests:
            withCredentials: true,
        },
    })
);
