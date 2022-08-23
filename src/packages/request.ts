import { Client } from '..';
import { Utils } from './Utils';
import crypto from 'crypto';

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import fs from 'fs';
import path from 'path';

declare module 'axios' {
  export interface AxiosRequestConfig {
    resolveWithFullResponse?: boolean;
  }
}

export class Request {
  protected config: AxiosRequestConfig;
  protected axios: AxiosInstance;

  constructor(private client: Client) {
    this.config = {
      baseURL: 'https://i.instagram.com/api/v1/',
      headers: {
        Connection: 'close',
        Accept: '*/*',
        'Content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
        Cookie2: '$Version=1',
        'Accept-Language': 'en-US',
        'User-Agent':
          'Instagram 10.26.0 Android (24/7.0; 640dpi; 1440x2560; samsung; SM-G930F; herolte; samsungexynos8890; en_US)',
      },
    };

    this.axios = axios.create(this.config);
    // this.axios.interceptors.request.use((req) => {
    //   if (!req.resolveWithFullResponse) {
    //     req.baseURL = 'https://www.instagram.com/';
    //     req.headers = {
    //       'Content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
    //       Connection: 'close',
    //       Accept: '*/*',
    //       Cookie2: '$Version=1',
    //       'Accept-Language': 'en-US',
    //       'User-Agent':
    //         'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.89 Safari/537.36',
    //     };
    //   } else {
    //     req.baseURL = 'https://i.instagram.com/api/v1/';
    //     req.headers = {
    //       Connection: 'close',
    //       Accept: '*/*',
    //       'Content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
    //       Cookie2: '$Version=1',
    //       'Accept-Language': 'en-US',
    //       'User-Agent':
    //         'Instagram 10.26.0 Android (24/7.0; 640dpi; 1440x2560; samsung; SM-G930F; herolte; samsungexynos8890; en_US)',
    //     };
    //   }
    // });
    this.axios.interceptors.response.use(
      (res) => {
        console.log(res);
        if (res.status === 200) {
          this.client.state.crfToken =
            res.headers['set-cookie']
              ?.join(' ')
              ?.match(/(en=.+?;)/gm)?.[0]
              ?.slice(3, -1) || '';
          const creds = {
            uuid: this.client.state.uuid,
            id: res.data.logged_in_user.pk,
            csrftoken: this.client.state.crfToken,
            session: res.headers['set-cookie'],
          };
          const sIdx = creds.session?.findIndex((v) => /session/.test(v)) || 0;
          const tIdx = creds.session?.findIndex((v) => /csrftoken/.test(v)) || 0;
          const userCreds = {
            sessionID: creds.session?.[sIdx].slice('sessionid='.length),
            csrfToken: creds.session?.[tIdx].split(';')[0].split('=').pop(),
          };

          fs.writeFileSync(
            `${path.resolve()}/users.json`,
            JSON.stringify(Object.assign({}, userCreds, creds), null, 2),
          );
          console.log(`hi, @${res.data.logged_in_user.username}!`);
          return this;
        }

        return res;
      },
      function (error) {
        return Promise.reject(error);
      },
    );
  }

  async login(username: string, password: string) {
    const enc = crypto.createHash('md5').update(`${username}${password}`).digest('hex');

    this.client.state.deviceId = Utils.generateDeviceId(enc);
    this.client.state.uuid = Utils.generateUUID();

    await this.fetch(`si/fetch_headers/?challenge_type=signup&guid=${this.client.state.uuid}`, 'GET');

    const payload = {
      username,
      password,
      phone_id: this.client.state.uuid,
      _csrftoken: null,
      guid: this.client.state.uuid,
      device_id: this.client.state.deviceId,
      login_attempt_count: 0,
    };

    const signature = Utils.generateSignature(JSON.stringify(payload));

    return await this.fetch('accounts/login/', 'POST', signature);
  }

  async getTimeline() {
    const data = await this.fetch('graphql/query/?query_hash=13ab8e6f3d19ee05e336ea3bd37ef12b&variables=%7B%7D', 'GET');
    return data;
  }

  protected async fetch(url: string, method: 'GET' | 'POST', body?: unknown) {
    let options = {
      url,
      method,
      resolveWithFullResponse: true,
    };

    if (body) {
      options = { ...options, ...{ data: body, json: true } };
    }

    try {
      return await this.axios.request(options);
    } catch (error) {
      return error;
    }
  }
}
