import { Client } from '../Client';
import crypto from 'crypto';

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
// import fs from 'fs';
// import path from 'path';

declare module 'axios' {
  export interface AxiosRequestConfig {
    jar?: CookieJar;
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
      jar: this.client.state.jar,
    };

    this.axios = wrapper(axios.create(this.config));

    this.axios.interceptors.response.use(
      (res) => {
        // dirty way to store the session
        // if (res.status === 200) {
        //   this.client.state.crfToken =
        //     res.headers['set-cookie']
        //       ?.join(' ')
        //       ?.match(/(en=.+?;)/gm)?.[0]
        //       ?.slice(3, -1) || '';
        //   const creds = {
        //     uuid: this.client.state.uuid,
        //     id: res.data.logged_in_user.pk,
        //     csrftoken: this.client.state.crfToken,
        //     session: res.headers['set-cookie'],
        //   };
        //   const sIdx = creds.session?.findIndex((v) => /session/.test(v)) || 0;
        //   const tIdx = creds.session?.findIndex((v) => /csrftoken/.test(v)) || 0;
        //   const userCreds = {
        //     sessionID: creds.session?.[sIdx].slice('sessionid='.length),
        //     csrfToken: creds.session?.[tIdx].split(';')[0].split('=').pop(),
        //   };

        //   fs.writeFileSync(
        //     `${path.resolve()}/users.json`,
        //     JSON.stringify(Object.assign({}, userCreds, creds), null, 2),
        //   );
        //   console.log(`hi, @${res.data.logged_in_user.username}!`);
        //   return this;
        // }

        return res.data;
      },
      function (error) {
        return Promise.reject(error);
      },
    );
  }

  async login(username: string, password: string) {
    const enc = crypto.createHash('md5').update(`${username}${password}`).digest('hex');
    this.client.state.generateDeviceId(enc);
    const { uuid, deviceId: device_id } = this.client.state;

    // await this.fetch(`si/fetch_headers/?challenge_type=signup&guid=${this.client.state.uuid}`, 'GET');

    const payload = {
      username,
      password,
      phone_id: uuid,
      guid: uuid,
      device_id,
      login_attempt_count: 0,
    };

    const signature = this.client.state.generateSignature(JSON.stringify(payload));
    return await this.fetch('accounts/login/', 'POST', signature);
  }

  async getTimeline() {
    const data = await this.fetch(
      'https://instagram.com/graphql/query/?query_hash=13ab8e6f3d19ee05e336ea3bd37ef12b&variables=%7B%7D',
      'GET',
    );

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
