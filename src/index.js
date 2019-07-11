import 'dotenv/config';
import multi from './multi'
import config from './config';
import uuidv4 from 'uuid/v4';
import crypto from 'crypto';
import fs from 'fs';
import request from 'request-promise';
import Api from './api';
import Utils from './utils';
const j = request.jar();

class Nistagram extends multi.inherit(Api, Utils) {

	constructor (session) {
		super(session)
		if (session) {
			this.setSession(session);
		}
		this.mediaImage = [];
		this.followerList = {
			total: 0,
			data: [],
		};
		this.followingList = {
			total: 0,
			data: [],
		};
		this.userId = '';
		this.count = 0;
	}

	async fetchApi (url, method, body, upload) {
		let headers = {
			'Content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
			'Connection': 'close',
			'Accept': '*/*',
			'Cookie2': '$Version=1',
			'Accept-Language': 'en-US',
			'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.89 Safari/537.36',
		};

		if (method === 'POST') {
			Object.assign(headers, {
				'Content-type': upload ? `multipart/form-data; boundary=${this.uuid}` : 'application/x-www-form-urlencoded',
				'x-requested-with': 'XMLHttpRequest',
				'x-instagram-ajax': '1',
				'x-csrftoken': this.xCsrfToken,
			});
		};

		const options = {
			uri: config.BASE_URL + url,
			method,
			jar: j,
			timeout: 15000,
			headers: {
				...headers,
			},
		};

		if (body) {
			Object.assign(options, { formData: body });
		}
		try {
			let response = await request(options);
			return JSON.parse(response);
		} catch (error) {
			if (error.code === 'ETIMEDOUT') {
				console.error('TimeOut !!');
			}
			return error.code;
		}
	}

	async login (username, password) {
		this.username = username;
		this.password = password;
		const enc = crypto.createHash('md5').update(this.username + this.password).digest('hex');

		this.device_id = this.generateDeviceID(enc);
		this.uuid = this.generateUUID();

		await this.sendRequest('si/fetch_headers/?challenge_type=signup&guid=' + this.generateUUID(), 'GET');
		let data = {
			'phone_id': this.generateUUID(),
			'_csrftoken': this.csrfToken,
			'username': this.username,
			'guid': this.uuid,
			'device_id': this.device_id,
			'password': this.password,
			'login_attempt_count': '0',
		};
		let signature = this.generateSignature(JSON.stringify(data));
		let result = await this.sendRequest('accounts/login/', 'POST', signature);
		return result;
	}

	setSession (session) {
		let url = 'https://www.instagram.com';
		session.session.map((v) => {
			let cookie = request.cookie(v);
			j.setCookie(cookie, url);
		});
		this.jars = j;
		this.uuid = session._uuid;
		this.xCsrfToken = session.csrfToken;
		this.username_id = session._uid;
		this.xToken = session._csrftoken;
	}

	async sendRequest (endpoint, method, body) {
		let options = {
			uri: config.API_URL + endpoint,
			headers: {
				'Connection': 'close',
				'Accept': '*/*',
				'Content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
				'Cookie2': '$Version=1',
				'Accept-Language': 'en-US',
				'User-Agent': config.USER_AGENT,
			},
			method,
			resolveWithFullResponse: true,
		};

		if (body) {
			Object.assign(options, {
				body,
				json: true,
			});
		}

		if (this.xToken) {
			Object.assign(options, {
				jar: this.jars,
			});
		}

		try {
			let response = await request(options);
			if (response.statusCode === 200) {
				this.csrfToken = response.headers['set-cookie'].join(' ').match(/(en=.+?;)/gm)[0].slice(3, -1);
				this.responseJson = response.body;
				if (this.responseJson.logged_in_user) {
					this.xToken = this.csrfToken;
					let saveCredentials = {
						_uuid: this.uuid,
						_uid: this.responseJson.logged_in_user.pk,
						id: this.responseJson.logged_in_user.pk,
						_csrftoken: this.xToken,
						session: response.headers['set-cookie'],
					};
					let pathLocation = require('path').resolve() + '/user.json';
					let sIdx = saveCredentials.session.findIndex((v) => /session/.test(v));
					let tIdx = saveCredentials.session.findIndex((v) => /csrftoken/.test(v));
					const userCredential = {
						sessionID: saveCredentials.session[sIdx].slice('sessionid='.length),
						csrfToken: saveCredentials.session[tIdx].split(';')[0].split('=').pop(),
					};
					const newCredential = Object.assign({}, userCredential, saveCredentials);
					fs.writeFileSync(pathLocation, JSON.stringify(newCredential, null, 2));
					console.info(`=>> data credential save on ${pathLocation}`);
					this.setSession(newCredential);
					return this;
				}
				return response.body;
			}
		} catch (error) {
			console.error({
				uri: error,
				message: error.message,
			});
		}
	}
}

export default Nistagram;