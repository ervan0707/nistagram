import crypto from 'crypto';

export class Utils {
  public static generateSignature(data: string) {
    const cr = crypto
      .createHmac('sha1', '4f8732eb9ba7d1c8e8897a75d6474d4eb3f5279137431b2aafb71fafe2abe178')
      .update(data)
      .digest('hex');
    return `ig_sig_key_version=4&signed_body=${cr}.${encodeURI(data)}`;
  }

  public static generateUUID() {
    return crypto.randomUUID().replace(/-/g, '');
  }

  public static generateDeviceId(seed: string) {
    const volatileSeed = '12345';
    const enc = crypto
      .createHash('md5')
      .update(seed + volatileSeed)
      .digest('hex');
    return 'android-' + enc.substr(0, 16);
  }
}
