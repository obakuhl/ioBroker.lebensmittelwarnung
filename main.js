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
	return adapter = utils.adapter(Object.assign({}, options, {
		name: 'lebensmittelwarnung',

		// The ready callback is called when databases are connected and adapter received configuration.
		// start here!
		ready: main, // Main method defined below for readability


		// If you need to accept messages in your adapter, uncomment the following block.
		// /**
		//  * Some message was sent to this instance over message box. Used by email, pushover, text2speech, ...
		//  * Using this method requires "common.messagebox" property to be set to true in io-package.json
		//  */
		// message: (obj) => {
		// 	if (typeof obj === 'object' && obj.message) {
		// 		if (obj.command === 'send') {
		// 			// e.g. send email or pushover or whatever
		// 			adapter.log.info('send command');

		// 			// Send response in callback if required
		// 			if (obj.callback) adapter.sendTo(obj.from, obj.command, 'Message received', obj.callback);
		// 		}
		// 	}
		// },
	}));
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