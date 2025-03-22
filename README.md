# alexa-home-assistant-proxy-js

Just some PoC to play around with Node.js 20 and AWS SAM. Functionality is ported from [lambda_function.py by matt2005](https://gist.github.com/matt2005/744b5ef548cc13d88d0569eea65f5e5b).

The app can be deployed on AWS Lambda to serve as a proxy between Home Assistant and a custom Alexa Smart Home Skill.

For a detailed guide, check out the [Home Assistant documentation](https://www.home-assistant.io/integrations/alexa.smart_home/).

## Set up Lambda function following Home Assistant documentation

At step [ADD CODE TO THE LAMBDA FUNCTION](https://www.home-assistant.io/integrations/alexa.smart_home/#add-code-to-the-lambda-function), follow the steps below:

- Instead of selecting Python 3.X as runtime, select Node.js 20.x
- Copy the content of *src/index.mjs* into the Lambda function code editor
- The environment variables differ a bit:
  - `BASE_URL` -> `HOME_ASSISTANT_URL`
  - `NOT_VERIFY_SSL` -> `NODE_TLS_REJECT_UNAUTHORIZED` (set to 0 to disable SSL/TLS validation)
  - `DEBUG`-> `DEBUG_LOGS_ENABLED`
  - `LONG_LIVED_ACCESS_TOKEN` -> `DEBUG_HOME_ASSISTANT_LLA_TOKEN` (does not require DEBUG flag to be enabled)
- Follow all remaining steps in the Home Assistant documentation

## Set up Lambda function using AWS SAM

- Install aws-sam-cli (e.g. `brew install aws-sam-cli`)
- Set up your AWS credentials
  - Create a new IAM user with the `AdministratorAccess` policy
  - Either put your credentials manually into `~/.aws/credentials` or install the AWS CLI (e.g. `brew install awscli`) and run `aws configure`
- Make a copy of *env/production.sample.toml* to *env/production.toml*
  - Fill in the required values:
    - `"HomeAssistantUrl=https://myhost.com:443"`
  - Optional values:
    - `"NodeTlsRejectUnauthorized=0"` (to disable SSL/TLS validation)
    - `"DebugLogsEnabled=1"` (to enable debug logs)
    - `"DebugHomeAssistantLlaToken=someToken"` (set a static long-lived access token for testing)
- Run `./deploy.sh`
- Follow remaining instructions in Home Assistant documentation