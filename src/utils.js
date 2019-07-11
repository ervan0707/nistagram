import uuidv4 from 'uuid/v4';
import crypto from 'crypto';
import config from './config';

class Utils {

	generateSignature (data) {
		let cr = crypto.createHmac('sha1', config.IG_SIG_KEY).update(data).digest('hex');
		return 'ig_sig_key_version=' + config.SIG_KEY_VERSION + '&signed_body=' + cr + '.' + encodeURI(data);
	}

	generateUUID () {
		return uuidv4().replace(/-/g, '');
	}

	generateDeviceID (seed) {
		let volatileSeed = '12345';
		const enc = crypto.createHash('md5').update(seed + volatileSeed).digest('hex');
		return 'android-' + enc.substr(0, 16);
	}
}

export default Utils;
