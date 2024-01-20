#!/bin/bash
sam build && sam deploy --config-file env/production.toml "$@"
