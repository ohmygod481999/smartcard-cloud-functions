"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApolloServer = void 0;
const apollo_server_core_1 = require("apollo-server-core");
const apollo_server_env_1 = require("apollo-server-env");
function sanitizeHeaders(headers) {
    return Object.entries(headers)
        .reduce((acc, [key, value]) => {
        acc[key.toLowerCase()] = value;
        return acc;
    }, {});
}
class ApolloServer extends apollo_server_core_1.ApolloServerBase {
    serverlessFramework() {
        return true;
    }
    createGraphQLServerOptions(args) {
        return super.graphQLServerOptions({ args });
    }
    createHandler(options) {
        let landingPage;
        return async (args = {}) => {
            var _a, _b;
            await this.ensureStarted();
            if (landingPage === undefined) {
                landingPage = this.getLandingPage();
            }
            const requestHeaders = sanitizeHeaders(args.__ow_headers);
            const responseHeaders = sanitizeHeaders((_a = options === null || options === void 0 ? void 0 : options.headers) !== null && _a !== void 0 ? _a : {});
            if (args.__ow_method === 'options') {
                if (requestHeaders['access-control-request-headers'] &&
                    !responseHeaders['access-control-allow-headers']) {
                    responseHeaders['access-control-allow-headers'] = requestHeaders['access-control-request-headers'];
                    responseHeaders['vary'] = 'access-control-Request-headers';
                }
                if (requestHeaders['access-control-request-method'] &&
                    !responseHeaders['access-control-allow-methods']) {
                    responseHeaders['access-control-allow-methods'] = requestHeaders['access-control-request-method'];
                }
                return {
                    body: '',
                    statusCode: 204,
                    headers: responseHeaders,
                };
            }
            if (landingPage &&
                args.__ow_method === 'get' &&
                ((_b = requestHeaders['accept']) === null || _b === void 0 ? void 0 : _b.includes('text/html'))) {
                return {
                    body: landingPage.html,
                    statusCode: 200,
                    headers: Object.assign({ 'Content-Type': 'text/html' }, responseHeaders),
                };
            }
            const graphQLOptions = await this.createGraphQLServerOptions(args);
            return this.graphQLHandler(args, graphQLOptions, responseHeaders);
        };
    }
    async graphQLHandler(args, options, responseHeaders) {
        const method = args.__ow_method.toUpperCase();
        if (method === 'POST' && !args) {
            return {
                body: 'POST body missing.',
                statusCode: 400,
                headers: responseHeaders
            };
        }
        try {
            const { graphqlResponse, responseInit } = await (0, apollo_server_core_1.runHttpQuery)([args], {
                method: method,
                options: options,
                query: args,
                request: {
                    url: args.__ow_path,
                    method: method,
                    headers: new apollo_server_env_1.Headers(Object.assign(Object.assign({}, sanitizeHeaders(args.__ow_headers)), responseHeaders)),
                },
            });
            return {
                body: graphqlResponse,
                statusCode: responseInit.status || 200,
                headers: Object.assign(Object.assign({}, sanitizeHeaders(responseInit.headers)), responseHeaders),
            };
        }
        catch (error) {
            if ((0, apollo_server_core_1.isHttpQueryError)(error)) {
                return {
                    body: {
                        error,
                    },
                    statusCode: error.statusCode,
                    headers: Object.assign(Object.assign({}, sanitizeHeaders(error.headers)), responseHeaders),
                };
            }
            else {
                return {
                    body: {
                        error
                    },
                    statusCode: 400
                };
            }
        }
    }
}
exports.ApolloServer = ApolloServer;
