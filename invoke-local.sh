#!/bin/bash
sam build && sam local invoke --config-file env/local.toml --event events/discovery.json
