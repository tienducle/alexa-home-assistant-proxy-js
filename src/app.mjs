import https from 'https';
import {URL} from 'url';

/**
 * LOG_LEVEL: error|debug
 */
const logLevel = process.env.LOG_LEVEL ? process.env.LOG_LEVEL.toLowerCase() : "error";

export class App {

    /**
     * @param url {URL|string}
     * @param debugToken {string}
     */
    constructor(url, debugToken) {

        console.debug(`Initializing app with url: ${url}`);

        this.url = (typeof url === "string") ? new URL(url) : url;
        this.debugToken = debugToken;
        this.httpOptions = {
            protocol: this.url.protocol,
            hostname: this.url.hostname,
            port: this.url.port ? this.url.port : this.url.protocol === "https:" ? "443" : "80",
            path: "/api/alexa/smart_home",
            rejectUnauthorized: process.env.IGNORE_SSL_VALIDATION !== "true",
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': process.env.CUSTOM_USER_AGENT || "HomeAssistantProxy"
            }
        };
    }

    /**
     * Forwards the trigger payload to Home Assistant and returns its response.
     *
     * @param lambdaTriggerPayload
     * @return {Promise<*>}
     */
    async handle(lambdaTriggerPayload, context) {
        if (logLevel === "debug") {
            console.debug(`Lambda triggered by: '${JSON.stringify(this.getRedactedPayload(lambdaTriggerPayload))}'`);
        }

        const token = this.getToken(lambdaTriggerPayload);
        if (!token) {
            return {
                statusCode: 401, body: "No token provided."
            };
        }

        const response = await this.postRequest(token, lambdaTriggerPayload);
        if (logLevel === "debug") {
            console.debug(`Home Assistant response: '${JSON.stringify(this.getRedactedPayload(response))}'`);
        }

        return (response.statusCode >= 400) ? response : JSON.parse(response.body);
    }

    /**
     * Returns the token from the given lambda trigger payload.
     * If no token is provided, the debug token is used.
     * @param lambdaTriggerPayload
     * @return {*|string}
     */
    getToken(lambdaTriggerPayload) {
        const directive = lambdaTriggerPayload?.directive;
        const scope = directive?.endpoint?.scope || directive?.payload?.grantee || directive?.payload?.scope;
        if (scope?.token) {
            return scope.token;
        }

        console.warn("No token found in lambda trigger payload. Will use debug token.");
        if (this.debugToken) {
            return this.debugToken;
        }

        console.error("DEBUG_HOME_ASSISTANT_LLA_TOKEN not set");
        return undefined;
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
     * @return {object}
     */
    getRedactedPayload(payload) {
        const payloadCopy = JSON.parse(JSON.stringify(payload));
        this.redact(payloadCopy?.directive?.header, "correlationToken");
        this.redact(payloadCopy?.directive?.endpoint?.scope, "token");
        this.redact(payloadCopy?.directive?.payload?.scope, "token");
        if (payloadCopy?.body) {
            const body = JSON.parse(payloadCopy.body);
            this.redact(body.event?.header, "correlationToken");
            this.redact(body.event?.endpoint?.scope, "token");
            payloadCopy.body = JSON.stringify(body);
        }
        return payloadCopy;
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
     * Sends a POST request using the given authToken and payload
     *
     * @param authToken {string}
     * @param payload {object}
     *
     * @return {Promise<>}
     */
    async postRequest(authToken, payload) {
        this.httpOptions.headers.Authorization = `Bearer ${authToken}`;
        return new Promise((resolve, reject) => {
            const request = https.request(this.httpOptions, (response) => {
                let data = '';

                response.on('data', (chunk) => {
                    data += chunk;
                });

                response.on('end', () => {
                    resolve({
                        statusCode: response.statusCode, headers: response.headers, body: data
                    });
                });
            });

            request.on('error', (error) => {
                reject(error);
            });

            request.write(JSON.stringify(payload));
            request.end();
        });
    }
}