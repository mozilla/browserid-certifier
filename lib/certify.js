var jwcrypto = require('jwcrypto');

require('jwcrypto/lib/algs/rs');
require('jwcrypto/lib/algs/ds');

/*
 * Options:
 * - pubkey
 * - privkey
 * - duration
 * - email
 * - hostname
 */
module.exports = function certify(options, callback) {
  var pubKey = jwcrypto.loadPublicKey(options.pubkey);
  var privKey = jwcrypto.loadSecretKey(options.privkey);

  var expiration = new Date();
  var iat = new Date();

  expiration.setTime(new Date().valueOf() + (options.duration * 1000));
  // Set issuedAt to 10 seconds ago. Pads for verifier clock skew
  iat.setTime(iat.valueOf() - (10 * 1000));

  jwcrypto.cert.sign(
    { publicKey: pubKey, principal: { email: options.email } },
    { issuer: options.hostname, issuedAt: iat, expiresAt: expiration },
    null,
    privKey,
    callback);
};
