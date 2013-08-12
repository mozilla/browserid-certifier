process.env['NODE_ENV'] = 'test'; // set env to testing so we can skip logging, etc.
process.env['PORT'] = '0'; // for testing bind ephemeral ports
process.env['HOSTNAME'] = '127.0.0.1';

const
should = require('should'),
http = require('http'),
jwcrypto = require('jwcrypto'),
fs = require('fs'),
temp = require('temp');

// cause RSA and DSA algorithms to be loaded
// (Dear @benadida.  This API sucks.  Thanks, @lloyd)
require("jwcrypto/lib/algs/rs");
require("jwcrypto/lib/algs/ds");

// a little helper function to perform cert_key requests
function doRequest(args, cb) {
  var body = JSON.stringify(args);
  var req = http.request({
    host: '127.0.0.1',
    port: serverPort,
    path: '/cert_key',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': body.length
    }
  }, cb);

  req.write(body);
  req.end();
}

var serverPort = -1;

var server;

describe('ephemeral keys', function() {
  it('should generate properly', function(done) {
    jwcrypto.generateKeypair({algorithm: "DS", keysize: 256}, function(err, keyPair) {
      (!!err).should.be.false;
      var pubkey_file = temp.openSync();
      process.env['PUB_KEY_PATH'] = pubkey_file.path;
      fs.writeSync(pubkey_file.fd, keyPair.publicKey.serialize());
      fs.closeSync(pubkey_file.fd);
      var privkey_file = temp.openSync();
      process.env['PRIV_KEY_PATH'] = privkey_file.path;
      fs.writeSync(privkey_file.fd, keyPair.secretKey.serialize());
      fs.closeSync(privkey_file.fd);
      done();
    });
  });
});


describe('the server', function() {
  it('should start up', function(done) {
    process.env['CERTIFIER_PORT'] = 0;
    server = require('./bin/certifier');

    server(function(err, port) {
      should.not.exist(err);
      (port).should.be.ok;
      serverPort = port;
      process.env['CERTIFIER_PORT'] = port;
      done();
    });
  });
});

var keyPair;

describe('key generation', function() {
  it('should work', function(done) {
    jwcrypto.generateKeypair({
      algorithm: 'DS',
      keysize: 256
    }, function(err, kp) {
      should.not.exist(err);
      kp.should.be.a('object');
      keyPair = kp;
      done();
    });
  });
});

describe('key certification', function() {
  var now = new Date();
  it('should work', function(done) {
    doRequest({
      duration: (6 * 60 * 60 * 1000), // 6 hours
      pubkey: keyPair.publicKey.serialize(),
      email: 'lloyd@example.com'
    }, function(res) {
      (res.statusCode).should.equal(200);
      var body = "";
      res.on('data', function(chunk) { body += chunk; });
      res.on('end', function() {
        body = JSON.parse(body);
        body.success.should.equal(true);

        // We expected issued at 10 seconds ago + or - 2 seconds for Travis
        var before = now.valueOf() - (11 * 1000);
        var after = now.valueOf() - (9 * 1000);
        var c = jwcrypto.extractComponents(body.certificate);
        (before < c.payload.iat && c.payload.iat < after).should.be.true;

        done();
      });
    });
  });

  it('should fail when duration is not a number', function(done) {
    doRequest({
      duration: (6 * 60 * 60 * 1000).toString(), // 6 hours
      pubkey: keyPair.publicKey.serialize(),
      email: 'lloyd@example.com'
    }, function(res) {
      (res.statusCode).should.equal(400);
      done();
    });
  });

  it('should fail when email is not provided', function(done) {
    doRequest({
      duration: (6 * 60 * 60 * 1000).toString(), // 6 hours
      pubkey: keyPair.publicKey.serialize()
    }, function(res) {
      (res.statusCode).should.equal(400);
      done();
    });
  });

  it('should fail when email is not a string', function(done) {
    doRequest({
      duration: (6 * 60 * 60 * 1000).toString(), // 6 hours
      pubkey: keyPair.publicKey.serialize(),
      email: 42
    }, function(res) {
      (res.statusCode).should.equal(400);
      done();
    });
  });
});

describe('http client wrapping', function() {
  it('should be accessible via client', function(done) {
    var client = require('./client/certifier.js')('127.0.0.1', process.env['CERTIFIER_PORT']);
    client(keyPair.publicKey.serialize(), 'me@me.com', 1000 * 1000,
           function(err, res) {
             if (err) {
               throw err;
             }
             done();
           });
  });
});
