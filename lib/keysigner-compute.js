var jwcrypto = require('jwcrypto'),
        cert = jwcrypto.cert;

require("jwcrypto/lib/algs/rs");
require("jwcrypto/lib/algs/ds");

process.on('message', function(m) {
  var pubKey = jwcrypto.loadPublicKey(m.pubkey);
  var privKey = jwcrypto.loadSecretKey(m.privkey);

  var expiration = new Date();
  var iat = new Date();

  expiration.setTime(new Date().valueOf() + (m.duration * 1000));
  // Set issuedAt to 10 seconds ago. Pads for verifier clock skew
  iat.setTime(iat.valueOf() - (10 * 1000));

  cert.sign(
    {publicKey: pubKey, principal: {email: m.email}},
    {issuer: m.hostname, issuedAt: iat, expiresAt: expiration},
    null,
    privKey,
    function(err, cert) {
      if (err) process.send({ success: false, reason: err });
      else process.send({ success: true, certificate: cert });
    });
});
