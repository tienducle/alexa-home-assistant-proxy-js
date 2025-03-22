import {App} from "../../app.mjs";
import {expect} from "chai";

describe("App tests", () => {

    it("verify app.httpOptions for http://localhost", async () => {
        let app = new App("http://localhost");
        expect(app.url).to.equal("http://localhost:80/api/alexa/smart_home");
    });

    it("verify app.httpOptions for http://localhost:81", async () => {
        let app = new App("http://localhost:81");
        expect(app.url).to.equal("http://localhost:81/api/alexa/smart_home");
    });

    it("verify app.httpOptions for https://localhost", async () => {
        let app = new App("https://localhost");
        expect(app.url).to.equal("https://localhost:443/api/alexa/smart_home");
    });

    it("verify app.httpOptions for https://localhost:444", async () => {
        let app = new App("https://localhost:444");
        expect(app.url).to.equal("https://localhost:444/api/alexa/smart_home");
    });

    it("verify app.httpOptions for https://myhost.com", async () => {
        let app = new App("https://myhost.com");
        expect(app.url).to.equal("https://myhost.com:443/api/alexa/smart_home");
    });

    it("verify app.getRedactedPayload() for ReportState request", async () => {
        const app = new App("https://localhost");
        const request = {
            "directive": {
                "header": {
                    "namespace": "Alexa",
                    "name": "ReportState",
                    "payloadVersion": "3",
                    "messageId": "20e40a6b-f25f-4d98-a0e5-55a5e80c013d",
                    "correlationToken": "mytoken"
                },
                "endpoint": {
                    "scope": {
                        "type": "BearerToken",
                        "token": "mytoken"
                    },
                    "endpointId": "switch",
                    "cookie": {}
                },
                "payload": {}
            }
        }

        const sanitizedPayload = JSON.parse(app.getRedactedPayloadForLogging(request));

        // assert
        expect(sanitizedPayload.directive.header.correlationToken).to.equal("<omitted>");
        expect(sanitizedPayload.directive.endpoint.scope.token).to.equal("<omitted>");
    });

    it("verify app.getRedactedPayload() for ReportState response", async () => {
        const app = new App("https://localhost");
        const responseJson = {
            "event": {
                "header": {
                    "namespace": "Alexa",
                    "name": "Response",
                    "messageId": "584b6516-581a-4183-b773-b181f0bfd437",
                    "payloadVersion": "3",
                    "correlationToken": "SUdTVEs6Aewqjjwqjoeq=="
                },
                "payload": {},
                "endpoint": {
                    "scope": {
                        "type": "BearerToken",
                        "token": "eyJhbGcqweqweqweqwe"
                    },
                    "endpointId": "light#bedroom_ceiling_light_group",
                    "cookie": {}
                }
            },
            "context": {
                "properties": [
                    {
                        "name": "powerState",
                        "namespace": "Alexa.PowerController",
                        "value": "ON",
                        "timeOfSample": "2025-03-22T20:27:36Z",
                        "uncertaintyInMilliseconds": 0
                    },
                    {
                        "name": "brightness",
                        "namespace": "Alexa.BrightnessController",
                        "value": 20,
                        "timeOfSample": "2025-03-22T20:27:36Z",
                        "uncertaintyInMilliseconds": 0
                    },
                    {
                        "name": "connectivity",
                        "namespace": "Alexa.EndpointHealth",
                        "value": {
                            "value": "OK"
                        },
                        "timeOfSample": "2025-03-22T20:27:36Z",
                        "uncertaintyInMilliseconds": 0
                    }
                ]
            }
        };
        const sanitizedPayload = JSON.parse(app.getRedactedPayloadForLogging(responseJson));

        // assert
        expect(sanitizedPayload.event.header.correlationToken).to.equal("<omitted>");
        expect(sanitizedPayload.event.endpoint.scope.token).to.equal("<omitted>");
    });

});

