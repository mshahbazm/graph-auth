/* eslint-disable no-tabs */
const { gql } = require('apollo-server-express');

const typeDefs = gql`    
    
    type authPayload {
        token: String
    }

    type stringResponse {
        success: Boolean
        message: String
    }
    
    type Temp {
        _id: ID
        label: String # password-rest, email-verify, password-new, email-new
        email: String
        user: ID
    }

    type User {
        _id: ID!
        first_name: String
        last_name: String
        email: String
        password: String
        picture: String
        city: String
        country: String
        bio: String
        last_login: String
        verified: Boolean
        permissions: [String!]!
        isSubscription: Boolean
        subscriptionPlan: String
        subscriptionId: String
        subscriptionStart: String
        subscriptionEnd: String
        cancelled_due_to_payment_failures: Boolean
    }
    
    type UserResponse {
        _id: ID!
        first_name: String
        last_name: String
        email: String
        picture: String
        phone: String
        city: String
        country: String
        bio: String
        last_login: String
        verified: Boolean
        permissions: [String!]! #[add or delete]_[model name] i.e add_users
        isSubscription: Boolean
        subscriptionPlan: String
        subscriptionId: String
        subscriptionStart: String
        subscriptionEnd: String
        cancelled_due_to_payment_failures: Boolean
    }
    
    type Query {
        me: UserResponse!
        users: [UserResponse!]!
        
        #get by ID
        user(_id: ID!): UserResponse!
        temp(_id: ID): Temp
    }

    type Mutation {
        adminOnBoarding(first_name: String!, last_name: String, email: String!, password: String!) : UserResponse!
        user(_id: ID, first_name: String, last_name: String, picture: String, phone: String, city: String, country: String, bio: String) : UserResponse!
        
        updatePassword(password: String, new_password: String!, email: String) : stringResponse
        setPassword(password: String, email: String, token: ID) : stringResponse
        
        updateEmail(password: String, email: String, token: String) : stringResponse
        verifyEmail: stringResponse
	    
        updatePermissions(permissions: [String]) : UserResponse!

        register(first_name: String, last_name: String, email: String!, password: String!): authPayload!
        login(email: String, password: String): authPayload!
    }

`;

module.exports = typeDefs;

/*todo: verify email*/
