import {App} from "./app.mjs";

/**
 * HOME_ASSISTANT_URL: <scheme>://<host>:[port]
 *
 * If no port is specified, default ports will be used
 * depending on specified scheme (http: 80, https: 443).
 */
const homeAssistantUrl = new URL( process.env.HOME_ASSISTANT_URL );

/**
 * DEBUG_HOME_ASSISTANT_LLA_TOKEN: <token>
 *
 * Home Assistant Long-lived access token, without "Bearer " prefix.
 * Should only be used when testing the Lambda function.
 */
const debugHomeAssistantLongLivedAccessToken = process.env.DEBUG_HOME_ASSISTANT_LLA_TOKEN;

const app = new App( homeAssistantUrl, debugHomeAssistantLongLivedAccessToken );

export const handler = async ( lambdaTriggerPayload, context ) => {
    return app.handle( lambdaTriggerPayload, context );
}