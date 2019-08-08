import { IProxySettings } from 'sp-rest-proxy';
// tslint:disable-next-line: no-var-requires
const RestProxy = require('sp-rest-proxy');

const settings: IProxySettings = {
  configPath: './.config/private.json'
};

const restProxy = new RestProxy(settings);
restProxy.serve();
