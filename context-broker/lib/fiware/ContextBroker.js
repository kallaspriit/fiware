import request from 'request';
import Method from './Method';

export default class ContextBroker {

	constructor({
		url,
		version = 'v1',
		token = null
	} = {}) {
		this._config = {
			url,
			version,
			token
		};
	}
	
	setAccessToken(token) {
		this._config.token = token;
	}

	query(method, token, path, data = {}) {
		return new Promise((resolve) => {
			const baseUrl = this._config.url + '/' + this._config.version;
			const url = baseUrl + '/' + path;
			const headers = {
				'Accept': 'application/json'
			};
			const hasParameters = Object.keys(data).length > 0;

			if (token) {
				headers['X-Auth-Token'] = token;
			}

			const requestInfo = {
				url: url,
				method: method,
				headers: headers
			};

			headers['Content-Type'] = 'application/json';

			if (hasParameters) {

				requestInfo.json = data;
			}

			console.log('making request\n' + JSON.stringify(requestInfo, null, '  '));
	
			request(requestInfo, (error, response, body) => {
				if (error !== null) {
					throw error;
				}
	
				if (response.statusCode !== 200) {
					throw new Error('querying broker failed (' + response.statusCode + ' - ' + body.message + ')');
				}

				if (typeof body === 'string' && body.substr(0, 1) === '{') {
					try {
						body = JSON.parse(body);
					} catch (e) {
						// ignore
					}
				}

				console.log('got response\n' + JSON.stringify(body, null, '  ') + '\n');

				resolve(body);
			});
		});
	}
	
	fetchEntity(id) {
		return this.query(
			Method.GET,
			this._config.token,
			'contextEntities/' + id
		);
	}

	createEntity(id, attributes) {
		return this.query(
			Method.POST,
			this._config.token,
			'contextEntities/' + id, {
				attributes: attributes
			}
		);
	}

	updateEntityAttribute(id, attribute, value) {
		return this.query(
			Method.PUT,
			this._config.token,
			'contextEntities/' + id + '/attributes/' + attribute, {
				value: this.serializeValue(value)
			}
		);
	}

	serializeValue(value) {
		return JSON.stringify(value);
	}

}