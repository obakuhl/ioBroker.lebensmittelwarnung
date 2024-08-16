'use strict';

const utils = require('@iobroker/adapter-core'); // Get common adapter utils
const parseString = require('xml2js').parseString;

/**
 * The adapter instance
 * @type {ioBroker.Adapter}
 */
let adapter;

/**
 * Starts the adapter instance
 * @param {Partial<utils.AdapterOptions>} [options]
 */
function startAdapter(options) {
	// Create the adapter and define its methods
	return adapter;
}

async function main() {

	// The adapters config (in the instance object everything under the attribute "native") is accessible via
	// adapter.config:
	adapter.log.info('config update_interval: ' + adapter.config.update_interval);
	adapter.log.info('config states: ' + adapter.config.states);
		adapter.setState('info.connection', false, true);


}

// If started as allInOne/compact mode => return function to create instance
if (module && module.parent) {
    module.exports = startAdapter;
} else {
    // or start the instance directly
    startAdapter();
}