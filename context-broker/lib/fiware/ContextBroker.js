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
				'Content-Type': 'application/json',
				'Accept': 'application/json'
			};

			if (token) {
				headers['X-Auth-Token'] = token;
			}

			const requestInfo = {
				url: url,
				method: method,
				json: data,
				headers: headers
			};

			console.log('making request', requestInfo);
	
			request(requestInfo, (error, response, body) => {
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
				value: value
			}
		);
	}

}