/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* Module wraps certifier client access to ../lib/certify.js over http
 * to centralize e.g. data streaming. Copied from
 * browserid-bigtent/server/lib/certifier.js. */

module.exports = function(host, port) {
  var scheme = port === 443 ? require('https') : require('http');

  return function (pubkey, email, duration_s, cb) {
    var body = JSON.stringify({
      duration: duration_s,
      pubkey: pubkey,
      email: email
    }),
    req;

    req = scheme.request({
      host: host,
      port: port,
      path: '/cert_key',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': body.length
      }
    }, function (res) {
      var res_body = "";
      res.on('data', function (chunk) {
        res_body += chunk.toString('utf8');
      });
      res.on('end', function () {
        if (res.statusCode >= 400) {
          console.log("CS: " + host + ' | ' + port + ' ' + res_body);
          return cb('Error talking to certifier... code=' + res.statusCode + ' ');
        }
        cb(null, res_body);
      });
    });
    req.on('error', function (err) {
      console.error("Ouch, certifier is down: ", err);
      cb("certifier is down");
    });
    req.write(body);
    req.end();
  };
};