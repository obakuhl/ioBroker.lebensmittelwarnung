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

	/*
		For every state in the system there has to be also an object of type state
		Here a simple template for a boolean variable named "testVariable"
		Because every adapter instance uses its own unique namespace variable names can't collide with other adapters variables
	*/
	await adapter.setObjectNotExistsAsync('testVariable', {
		type: 'state',
		common: {
			name: 'testVariable',
			type: 'boolean',
			role: 'indicator',
			read: true,
			write: true,
		},
		native: {},
	});

	// In order to get state updates, you need to subscribe to them. The following line adds a subscription for our variable we have created above.
	adapter.subscribeStates('testVariable');
	// You can also add a subscription for multiple states. The following line watches all states starting with "lights."
	// adapter.subscribeStates('lights.*');
	// Or, if you really must, you can also watch all states. Don't do this if you don't need to. Otherwise this will cause a lot of unnecessary load on the system:
	// adapter.subscribeStates('*');

	/*
		setState examples
		you will notice that each setState will cause the stateChange event to fire (because of above subscribeStates cmd)
	*/
	// the variable testVariable is set to true as command (ack=false)
	await adapter.setStateAsync('testVariable', true);

	// same thing, but the value is flagged "ack"
	// ack should be always set to true if the value is received from or acknowledged from the target system
	await adapter.setStateAsync('testVariable', { val: true, ack: true });

	// same thing, but the state is deleted after 30s (getState will return null afterwards)
	await adapter.setStateAsync('testVariable', { val: true, ack: true, expire: 30 });
}

// If started as allInOne/compact mode => return function to create instance
if (module && module.parent) {
    module.exports = startAdapter;
} else {
    // or start the instance directly
    startAdapter();
}