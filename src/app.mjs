import {URL} from "url";

/**
 * HOME_ASSISTANT_URL: <scheme>://<host>:[port]
 *
 * If no port is specified, default ports will be used
 * depending on specified scheme (http: 80, https: 443).
 */
const HOME_ASSISTANT_URL = process.env.HOME_ASSISTANT_URL;
const HOME_ASSISTANT_ALEXA_SMART_HOME_PATH = "/api/alexa/smart_home";

/**
 * DEBUG_LOGS_ENABLED: true|false
 *
 * If true, debug logs will be enabled.
 */
const DEBUG_LOGS_ENABLED = process.env.DEBUG_LOGS_ENABLED === "true";

/**
 * DEBUG_HOME_ASSISTANT_LLA_TOKEN: <token>
 *
 * Home Assistant Long-lived access token, without "Bearer " prefix.
 * Should only be used when testing the Lambda function.
 */
const DEBUG_HOME_ASSISTANT_LLA_TOKEN = process.env.DEBUG_HOME_ASSISTANT_LLA_TOKEN;

let app;

export const handler = async ( lambdaTriggerPayload, context ) => {
    if ( !app ) {
        app = new App(HOME_ASSISTANT_URL);
    }
    return app.handle( lambdaTriggerPayload, context );
}

export class App {

    /**
     * @param url {URL|string}
     */
    constructor(url) {

        if ( DEBUG_LOGS_ENABLED ) {
            console.debug(`Initializing app with url '${url}'`);
        }

        const parsedUrl = (typeof url === "string") ? new URL(url) : url;
        const port = parsedUrl.port ? parsedUrl.port : parsedUrl.protocol === "https:" ? "443" : "80";

        this.url = `${parsedUrl.protocol}//${parsedUrl.hostname}:${port}${HOME_ASSISTANT_ALEXA_SMART_HOME_PATH}`;
    }

    /**
     * Forwards the trigger payload to Home Assistant and returns its response.
     *
     * @param lambdaTriggerPayload {object}
     * @param context {object}
     * @return {object}
     */
    async handle(lambdaTriggerPayload, context) {
        if ( DEBUG_LOGS_ENABLED ) {
            console.debug(`Lambda triggered by: '${this.getRedactedPayloadForLogging(lambdaTriggerPayload)}'`);
        }

        let token = this.getToken(lambdaTriggerPayload);
        if ( !token ) {
            console.warn("No token found in lambda trigger payload. Will use debug token.");
            token = DEBUG_HOME_ASSISTANT_LLA_TOKEN;
        }
        if ( !token ) {
            console.error("No token found in lambda trigger payload and no debug token is set. Aborting.");
            return { statusCode: 401, body: "No token found in lambda trigger payload and no debug token is set." };
        }

        return this.postRequest( token, lambdaTriggerPayload )
            .then( response => response.status < 400
                ? response.json()
                : response.text()
                    .then( responseText => {
                        console.error(`Home Assistant HTTP ${response.status} response: '${responseText}'`);
                        return { statusCode: response.status, body: responseText }
                    })
            );
    }

    /**
     * Returns the token from the given lambda trigger payload.
     * If no token is provided, the debug token is used.
     *
     * @param lambdaTriggerPayload
     * @return {*|string}
     */
    getToken(lambdaTriggerPayload) {
        const directive = lambdaTriggerPayload?.directive;
        const scope = directive?.endpoint?.scope || directive?.payload?.grantee || directive?.payload?.scope;
        return scope?.token;
    }

    /**
     * Omit auth tokens for debug log
     * - lambdaTriggerPayload.directive.header.correlationToken
     * - lambdaTriggerPayload.directive.endpoint.scope.token
     * - lambdaTriggerPayload.directive.payload.scope.token
     * - homeAssistantResponse.body.event.header.correlationToken
     * - homeAssistantResponse.body.event.endpoint.scope.token
     *
     * @param payload {object}
     * @return {string}
     */
    getRedactedPayloadForLogging(payload) {
        const payloadCopy = JSON.parse(JSON.stringify(payload));
        this.redact(payloadCopy?.directive?.header, "correlationToken");
        this.redact(payloadCopy?.directive?.endpoint?.scope, "token");
        this.redact(payloadCopy?.directive?.payload?.scope, "token");
        this.redact(payloadCopy?.event?.header, "correlationToken");
        this.redact(payloadCopy?.event?.endpoint?.scope, "token");
        return JSON.stringify(payloadCopy);
    }

    /**
     * If object exists and has given key, set its value to "<omitted>".
     *
     * @param object {object}
     * @param key {string}
     */
    redact(object, key) {
        if (object && object[key]) {
            object[key] = "<omitted>";
        }
    }

    /**
     * Sends a POST request using the given authToken and payload.
     *
     * @param authToken
     * @param payload
     * @returns {Promise<Response>}
     */
    async postRequest(authToken, payload) {
        const options = {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json',
                'User-Agent': process.env.CUSTOM_USER_AGENT || "HomeAssistantProxy",
            }
        };
        if ( payload ) {
            options.body = JSON.stringify(payload);
            options.headers['Content-Length'] = Buffer.byteLength(options.body);
        }
        return fetch(this.url, options);
    }
}