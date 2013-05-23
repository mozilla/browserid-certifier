var certify = require('./certify');

process.on('message', function(m) {
  certify(m, function onCertified(err, cert) {
    if (err) process.send({ success: false, reason: err });
    else process.send({ success: true, certificate: cert });
  });
});
