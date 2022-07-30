import { ApolloServer } from "./ApolloServer";
import {
    ApolloServerPluginLandingPageGraphQLPlayground,
    gql,
} from "apollo-server-core";
import { deleteIdentityOry, getUserInfoOry } from "./ory-api";
import { ORY_ACCESS_TOKEN, ORY_URL } from "./config";

// Construct a schema, using GraphQL schema language
const typeDefs = gql`
    type Address {
        id: String
        value: String
        verified: Boolean
        via: String
        status: String
        created_at: String
        updated_at: String
    }

    type User {
        id: String!
        credentials: String
        schema_id: String
        schema_url: String
        state: String
        state_changed_at: String
        traits: String
        verifiable_addresses: [Address]
        recovery_addresses: [Address]
        metadata_public: String
        metadata_admin: String
        created_at: String
        updated_at: String
    }
    type Query {
        user(ory_id: String!): User
    }
    type Mutation {
        deleteIdentity(ory_id: String!): User
    }
`;

// Provide resolver functions for your schema fields
const resolvers = {
    Query: {
        user: async (parent: any, args: any, context: any, info: any) => {
            // console.log(args1, args2, args3);
            const userId = args.ory_id;
            console.log(userId);
            console.log(ORY_URL)

            const userInfo = await getUserInfoOry(userId);

            userInfo.credentials = JSON.stringify(userInfo.credentials);
            userInfo.traits = JSON.stringify(userInfo.traits);
            if (userInfo.metadata_public)
                userInfo.metadata_public = JSON.stringify(
                    userInfo.metadata_public
                );

            if (userInfo.metadata_admin)
                userInfo.metadata_admin = JSON.stringify(
                    userInfo.metadata_admin
                );

            return userInfo;
        },
    },
    Mutation: {
        deleteIdentity: async (
            parent: any,
            args: any,
            context: any,
            info: any
        ) => {
            const userId = args.ory_id;
            console.log(userId);

            try {
                const res = await deleteIdentityOry(userId);
                console.log(res);
                return res;
            } catch (err) {
                console.log(err.response);
            }
        },
    },
};

const server = new ApolloServer({
    typeDefs,
    resolvers,
    // By default, the GraphQL Playground interface and GraphQL introspection
    // is disabled in "production" (i.e. when `process.env.NODE_ENV` is `production`).
    //
    // If you'd like to have GraphQL Playground and introspection enabled in production,
    // install the Playground plugin and set the `introspection` option explicitly to `true`.
    introspection: true,
    plugins: [ApolloServerPluginLandingPageGraphQLPlayground()],
});

const handler = server.createHandler();

export const main = handler;
