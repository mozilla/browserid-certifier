var jwcrypto = require('jwcrypto'),
        cert = jwcrypto.cert;

require("jwcrypto/lib/algs/rs");
require("jwcrypto/lib/algs/ds");

process.on('message', function(m) {
  var pubKey = jwcrypto.loadPublicKey(m.pubkey);
  var privKey = jwcrypto.loadSecretKey(m.privkey);

  var expiration = new Date();

  expiration.setTime(new Date().valueOf() + (m.duration * 1000));

  cert.sign(
    pubKey,
    { email: m.email },
    { issuer: m.hostname, issuedAt: new Date(), expiresAt: expiration },
    null,
    privKey,
    function(err, cert) {
      if (err) process.send({ success: false, reason: err });
      else process.send({ success: true, certificate: cert });
    });
});
