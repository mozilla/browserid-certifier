# A Certifier Process for BrowserID

[![Build Status](https://travis-ci.org/mozilla/browserid-certifier.png?branch=master)](https://travis-ci.org/mozilla/browserid-certifier)

This repository aims to build a process capable of signing certificates for
BrowserID.  If you wanted to build a Primary Identity Authority with
BrowserID support, this is something you can run in your environment,
and talk to over HTTP to implement certificate generation.

A Work In Progress.

Web Service API
---------------

The Certifier webservice provides the following API:

### /cert_key
A request to /cert_key *must*
* Be sent with the `Content-Type` of `application/json`
* The POST message body should be a JSON formatted object which includes:
  * email - The email address for this certificate
  * duration - How long until the certificate expires, in seconds
  * pubkey - Object [compatible with JWT](https://github.com/mozilla/jwcrypto) public keys.

The response will be:
* Sent with the `Content-Type` of `application/json`
* A JSON formatted object with includes:
  * success - boolean indicating if the certificate was generated successfully
  * certificate - string - A certificate compatible with
     `navigator.id.registerCertificate` from the [BrowserID Provisioning
    Protocol](https://developer.mozilla.org/en/BrowserID/Guide_to_Implementing_a_Persona_IdP)

Dependencies
------------

* gmp.h - on Ubuntu this is the libgmp3-dev package
* C++ compiler
* make

Installation
------------

Either npm or git should work:

    npm install git@github.com:mozilla/browserid-certifier.git

or

    git clone git://github.com/mozilla/browserid-certifier.git

You must install the dependencies:

    cd browserid-certifier
    npm install

You must create a config file. Example ``config/local.json``

    {
      "ip": "127.0.0.1",
      "port": 8080,
      "issuer_hostname": "dev.bigtent.mozilla.org",
      "pub_key_path": "var/key.publickey",
      "priv_key_path": "var/key.secretkey"
    }

For maximum security, the above configuration makes the server
only listen locally (on 127.0.0.1).

If you need the certifier to be accessible over the network,
consider changing to something else,
or listen on every IP (with "0.0.0.0"), provided you protect it by other means.

Generating the Keypar
---------------------

Both your IdP service and the Certifier must share a public key.
The Certifier, requires both a private and public keypair.

Do the following:

    mkdir var
    cd var/
    ../node_modules/.bin/generate-keypair
    ls

You should now see a ``key.publickey`` and ``key.secretkey``
in the directory. This matches your local.json config.

You'll also want to import or re-use this ``key.publickey`` in
your IdP's ``/.well-known/browserid`` file.

    cd ..
    ./scripts/gen_well_known_browserid.py var/key.publickey > /some/path/www/.well-known/browserid

Running Certifier
-----------------

    CONFIG_FILES=config/local.json npm start

Simple Test
-----------

    curl -H 'Content-Type: application/json' -d '{"duration":3600,"pubkey":"{\"algorithm\":\"DS\",\"y\":\"1dd8f60727327a136a81e3df6fcfa782c96eaad8046f3a2d1b95b8f8a92374df444ab5237cbe05cc782361ee2b9ea0fb285e7a28bec429f51b48a16277e88de8e7204f2216144072e6b60b29530a35648bf6b9b8282cad22d1cf269e6368c8c3ad72f6e4cde3cfd362016c7414c9\",\"p\":\"ff600483db6abfc5b45eab78594b3533d550d9f1bf2a992a7a8daa6dc34f8045ad4e6e0c429d334eeeaaefd7e23d4810be00e4cc1492cba325ba81ff2d5a5b305a8d17eb3bf4a06a349d392e00d329744a5179380344e82a18c47933438f891e22aeef812d69c8f75e326cb70ea000c3f776dfdbd604638c2ef717fc26d02e17\",\"q\":\"e21e04f911d1ed7991008ecaab3bf775984309c3\",\"g\":\"c52a4a0ff3b7e61fdf1867ce84138369a6154f4afa92966e3c827e25cfa6cf508b90e5de419e1337e07a2e9e2a3cd5dea704d175f8ebf6af397d69e110b96afb17c7a03259329e4829b0d03bbc7896b15b4ade53e130858cc34d96269aa89041f409136c7242a38895c9d5bccad4f389af1d7a4bd1398bd072dffa896233397a\"}","email":"austin.ok@gmail.com"}' http://127.0.0.1:8080/cert_key

will output something like

    {"success":true,"certificate":"eyJhbGciOiJEUzI1NiJ9.eyJwdWJsaWMta2V5Ijp7ImFsZ29yaXRobSI6IkRTIiwieSI6IjFkZDhmNjA3MjczMjdhMTM2YTgxZTNkZjZmY2ZhNzgyYzk2ZWFhZDgwNDZmM2EyZDFiOTViOGY4YTkyMzc0ZGY0NDRhYjUyMzdjYmUwNWNjNzgyMzYxZWUyYjllYTBmYjI4NWU3YTI4YmVjNDI5ZjUxYjQ4YTE2Mjc3ZTg4ZGU4ZTcyMDRmMjIxNjE0NDA3MmU2YjYwYjI5NTMwYTM1NjQ4YmY2YjliODI4MmNhZDIyZDFjZjI2OWU2MzY4YzhjM2FkNzJmNmU0Y2RlM2NmZDM2MjAxNmM3NDE0YzkiLCJwIjoiZmY2MDA0ODNkYjZhYmZjNWI0NWVhYjc4NTk0YjM1MzNkNTUwZDlmMWJmMmE5OTJhN2E4ZGFhNmRjMzRmODA0NWFkNGU2ZTBjNDI5ZDMzNGVlZWFhZWZkN2UyM2Q0ODEwYmUwMGU0Y2MxNDkyY2JhMzI1YmE4MWZmMmQ1YTViMzA1YThkMTdlYjNiZjRhMDZhMzQ5ZDM5MmUwMGQzMjk3NDRhNTE3OTM4MDM0NGU4MmExOGM0NzkzMzQzOGY4OTFlMjJhZWVmODEyZDY5YzhmNzVlMzI2Y2I3MGVhMDAwYzNmNzc2ZGZkYmQ2MDQ2MzhjMmVmNzE3ZmMyNmQwMmUxNyIsInEiOiJlMjFlMDRmOTExZDFlZDc5OTEwMDhlY2FhYjNiZjc3NTk4NDMwOWMzIiwiZyI6ImM1MmE0YTBmZjNiN2U2MWZkZjE4NjdjZTg0MTM4MzY5YTYxNTRmNGFmYTkyOTY2ZTNjODI3ZTI1Y2ZhNmNmNTA4YjkwZTVkZTQxOWUxMzM3ZTA3YTJlOWUyYTNjZDVkZWE3MDRkMTc1ZjhlYmY2YWYzOTdkNjllMTEwYjk2YWZiMTdjN2EwMzI1OTMyOWU0ODI5YjBkMDNiYmM3ODk2YjE1YjRhZGU1M2UxMzA4NThjYzM0ZDk2MjY5YWE4OTA0MWY0MDkxMzZjNzI0MmEzODg5NWM5ZDViY2NhZDRmMzg5YWYxZDdhNGJkMTM5OGJkMDcyZGZmYTg5NjIzMzM5N2EifSwicHJpbmNpcGFsIjp7ImVtYWlsIjoiYXVzdGluLm9rQGdtYWlsLmNvbSJ9LCJleHAiOjEzMzk4MzEyNDc4ODUsImlzcyI6ImRldi5iaWd0ZW50Lm1vemlsbGEub3JnIn0.Hc7Dz3Gk-j5VWynBXvTLhrlSid7yMycmTsUPyj5FEWBTaafWI0_Zz8kY0FpQdADvzjUJfuZAhYg-grpY307cJA"}
