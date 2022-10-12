import crypto from 'crypto';
import { CookieJar } from 'tough-cookie';

export class State {
  public uuid?: string;
  public deviceId?: string;
  public csrfToken?: string;
  public signature?: string;
  public jar: CookieJar;

  constructor() {
    this.jar = new CookieJar();
  }

  public generateDeviceId(seed: string) {
    const volatileSeed = '12345';
    const enc = crypto
      .createHash('md5')
      .update(seed + volatileSeed)
      .digest('hex');

    this.deviceId = `android-${enc.substr(0, 16)}`;
    this.uuid = crypto.randomUUID().replace(/-/g, '');
  }

  public generateSignature(data: string) {
    const cr = crypto
      .createHmac('sha1', '4f8732eb9ba7d1c8e8897a75d6474d4eb3f5279137431b2aafb71fafe2abe178')
      .update(data)
      .digest('hex');
    const signature = `ig_sig_key_version=4&signed_body=${cr}.${encodeURI(data)}`;

    this.signature = signature;
    return signature;
  }

  public setSession({ csrfToken, uuid, session }: any) {
    const url = 'https://www.instagram.com';
    session.map((v: never) => {
      this.jar.setCookie(v, url);
    });
    this.uuid = uuid;
    this.csrfToken = csrfToken;
  }
}
