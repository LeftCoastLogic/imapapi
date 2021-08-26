/**
 * Configure for all environments here
 */
const _ = require('lodash');
const AWS = require('aws-sdk');
const iMapConfig = require('wild-config');

const region = _.get(process.env, 'AWS_REGION', 'ap-southeast-1');
const Name = process.env.AWS_SSM_NAME;
const ssm = new AWS.SSM({
  region,
  apiVersion: '2014-11-06'
});

const params = {
  Name,
  WithDecryption: true
};

var config = {};

function getConfigEnvVariables() {
  return new Promise((resolve, reject) => {
    if (!params.Name) {
      reject(new Error('Could not get AWS_SSM_NAME env'));
    }
    ssm.getParameter(params, (err, data) => {
      if (err) {
        reject(_.get(err, 'stack', 'Load System Parameter Store fail'));
      } else {
        const parameter = JSON.parse(_.get(data.Parameter, 'Value', '{}'));
        _.forEach(parameter, (item, key) => {
          process.env[key] = item;
        });
        resolve(true);
      }
    });
  });
}

async function initAppConfig() {
  if (process.env.NODE_ENV !== 'development' && params.Name) {
    await getConfigEnvVariables();
  }
  setConfig();
}

function setConfig() {
  const { NODE_ENV, REDIS_URL, API_HOST, API_PORT, API_MAX_SIZE, LOG_LEVEL, WORKERS_IMAP } = process.env;

  config = {
    NODE_ENV: NODE_ENV || 'development',
    REDIS_URL: REDIS_URL || iMapConfig && iMapConfig.dbs && iMapConfig.dbs.redis || 'redis://127.0.0.1:6379/8',
    API_HOST: API_HOST || iMapConfig && iMapConfig.host && iMapConfig.api.host || '127.0.0.1',
    API_PORT: API_PORT || iMapConfig && iMapConfig.api && iMapConfig.api.port || '3000',
    API_MAX_SIZE: API_MAX_SIZE || iMapConfig && iMapConfig.api && iMapConfig.api.maxSize || '5M',
    LOG_LEVEL: LOG_LEVEL || iMapConfig && iMapConfig.log && iMapConfig.log.level || 'info',
    WORKERS_IMAP: WORKERS_IMAP || iMapConfig && iMapConfig.workers && iMapConfig.workers.imap || '4'
  };
}

function getConfig() {
  if (!config || Object.keys(config).length === 0) {
    setConfig();
  }
  return config;
}

module.exports = {
  initAppConfig,
  getConfig
};


