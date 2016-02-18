import fs from 'fs';
import request from 'request';
import inquirer from 'inquirer';

const config = {
	api: {
		url: 'https://orion.lab.fiware.org',
		broker: {
			url: 'http://orion.lab.fiware.org',
			port: '1026',
			version: 'v1',
			baseUrl: null // built below
		},
		token: null // this will be populated automatically
	}
};

config.api.broker.baseUrl = config.api.broker.url + ':' + config.api.broker.port + '/' + config.api.broker.version;

function promptCredentials() {
	return new Promise((resolve) => {
		inquirer.prompt([{
			type: 'input',
			name: 'username',
			message: 'Enter FIWARE username:',
			default: 'priit@stagnationlab.com'
		}, {
			type: 'password',
			name: 'password',
			message: 'Enter FIWARE password:',
			default: 'kW9Amk23'
		}], (answers) => {
		    const { username, password } = answers;

			resolve({
				username,
				password
			});
		});
	});
}

function queryApi(path, data) {
	return new Promise((resolve, reject) => {
		request({
			url: config.api.url + '/' + path,
			method: 'POST',
			headers: {
				'Content-type': 'application/json'
			},
			json: data
		}, (error, response, body) => {
			if (error !== null) {
				throw new error;
			}

			if (response.statusCode !== 200) {
				throw new Error('fetching access token failed (' + response.statusCode + ' - ' + body.message + ')');
			}

			resolve(body);
		});
	});
}

function queryBroker(token, path, data = {}) {
	return new Promise((resolve) => {
		const url = config.api.broker.baseUrl + '/' + path;

		request({
			url: url,
			method: 'GET',
			headers: {
				'Content-type': 'application/json'
			},
			json: data,
			headers: {
				'X-Auth-Token': token,
				'Content-Type': 'application/json',
				'Accept': 'application/json'
			}
		}, (error, response, body) => {
			if (error !== null) {
				throw error;
			}

			if (response.statusCode !== 200) {
				throw new Error('querying broker failed (' + response.statusCode + ' - ' + body.message + ')');
			}

			resolve(body);
		});
	});
}

function fetchEntity(name) {
	return queryBroker(
		config.api.token,
		'contextEntities/' + name
	);
}

function fetchToken({ username, password }) {
	return queryApi(
		'token', {
			username: username,
			password: password
		}
	);
}

function handleToken(token) {
	config.api.token = token;

	console.log('your access token is "' + token + '"');
}

function handleResponse(name) {
	return (response) => {
		const responseText = JSON.stringify(response, null, '  ');

		console.log(name, responseText);
	};
}

// ask for user username/password
promptCredentials()

	// fetch, remember and display the access token
	.then(fetchToken)
	.then(handleToken)

	// fetch and display traffic sensor info
	.then(() => fetchEntity('urn:smartsantander:testbed:357'))
	.then(handleResponse('sound level meter'))

	// fetch and display traffic sensor info
	.then(() => fetchEntity('urn:smartsantander:testbed:3332'))
	.then(handleResponse('traffic sensor'))

	// handle any errors
	.catch((error) => {
		console.error(error.stack);
	});