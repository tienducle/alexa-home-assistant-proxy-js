import {App} from "../../app.mjs";
import {expect} from "chai";

describe("App tests", () => {

    it("verify app.httpOptions for http://localhost", async () => {
        let app = new App("http://localhost", "mytoken");
        expect(app.httpOptions.protocol).to.equal("http:");
        expect(app.httpOptions.hostname).to.equal("localhost");
        expect(app.httpOptions.port).to.equal("80");
    });

    it("verify app.httpOptions for http://localhost:81", async () => {
        let app = new App("http://localhost:81", "mytoken");
        expect(app.httpOptions.protocol).to.equal("http:");
        expect(app.httpOptions.hostname).to.equal("localhost");
        expect(app.httpOptions.port).to.equal("81");
    });

    it("verify app.httpOptions for https://localhost", async () => {
        let app = new App("https://localhost", "mytoken");
        expect(app.httpOptions.protocol).to.equal("https:");
        expect(app.httpOptions.hostname).to.equal("localhost");
        expect(app.httpOptions.port).to.equal("443");
    });

    it("verify app.httpOptions for https://localhost:444", async () => {
        let app = new App("https://localhost:444", "mytoken");
        expect(app.httpOptions.protocol).to.equal("https:");
        expect(app.httpOptions.hostname).to.equal("localhost");
        expect(app.httpOptions.port).to.equal("444");
    });

    it("verify app.getRedactedPayload() for ReportState request", async () => {
        const app = new App("https://localhost", "mytoken");
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

        const sanitizedPayload = app.getRedactedPayload(request)

        // assert
        expect(sanitizedPayload.directive.header.correlationToken).to.equal("<omitted>");
        expect(sanitizedPayload.directive.endpoint.scope.token).to.equal("<omitted>");
    });

    it("verify app.getRedactedPayload() for ReportState response", async () => {
        const app = new App("https://localhost", "mytoken");
        const response = {
            "statusCode": 200,
            "headers": {
                "date": "Sat, 20 Jan 2024 11:50:41 GMT",
                "content-type": "application/json",
                "transfer-encoding": "chunked",
                "connection": "keep-alive",
                "referrer-policy": "no-referrer",
                "x-content-type-options": "nosniff",
                "x-frame-options": "SAMEORIGIN",
                "strict-transport-security": "max-age=31536000; includeSubDomains",
                "cf-cache-status": "DYNAMIC",
                "report-to": "{\"endpoints\":[{\"url\":\"https:\\/\\/a.nel.cloudflare.com\\/report\\/v3?s=i8MtrbzCEgEMuE1o4GaDtv0GJZjeZiLJUfBpsckninuY6BUJJyTLZvaB%2FYPYEtyYBrIWUYCOL3jvgCSNCuyQHCfeXnh1OqCR5TUvXXJ6wA%2FBFBXQHV9TYAvNLhpJLBcRw9H82IntlA%3D%3D\"}],\"group\":\"cf-nel\",\"max_age\":604800}",
                "nel": "{\"success_fraction\":0,\"report_to\":\"cf-nel\",\"max_age\":604800}",
                "server": "cloudflare",
                "cf-ray": "848719eb6d5156eb-DUB",
                "alt-svc": "h3=\":443\"; ma=86400"
            },
            "body": "{\"event\":{\"header\":{\"namespace\":\"Alexa\",\"name\":\"Response\",\"messageId\":\"85101a2e-e555-43dc-9cf9-d369393d8d4d\",\"payloadVersion\":\"3\",\"correlationToken\":\"mytoken==\"},\"payload\":{},\"endpoint\":{\"scope\":{\"type\":\"BearerToken\",\"token\":\"mytoken\"},\"endpointId\":\"switch#office_plug_fan\",\"cookie\":{}}},\"context\":{\"properties\":[{\"name\":\"powerState\",\"namespace\":\"Alexa.PowerController\",\"value\":\"OFF\",\"timeOfSample\":\"2024-01-20T11:50:41Z\",\"uncertaintyInMilliseconds\":0},{\"name\":\"detectionState\",\"namespace\":\"Alexa.ContactSensor\",\"value\":\"NOT_DETECTED\",\"timeOfSample\":\"2024-01-20T11:50:41Z\",\"uncertaintyInMilliseconds\":0},{\"name\":\"connectivity\",\"namespace\":\"Alexa.EndpointHealth\",\"value\":{\"value\":\"OK\"},\"timeOfSample\":\"2024-01-20T11:50:41Z\",\"uncertaintyInMilliseconds\":0}]}}"
        }
        const sanitizedPayload = app.getRedactedPayload(response)

        // assert
        expect(JSON.parse(sanitizedPayload.body).event.header.correlationToken).to.equal("<omitted>");
        expect(JSON.parse(sanitizedPayload.body).event.endpoint.scope.token).to.equal("<omitted>");
    });

});

