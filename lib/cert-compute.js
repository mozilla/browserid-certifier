var computecluster = require('compute-cluster'),
            logger = require('winston'),
              path = require('path'),
            config = require('./config.js'),
              keys = require('./keys.js');

// allocate a compute cluster
var cc = new computecluster({
  module: path.join(__dirname, "keysigner-compute.js"),
  max_processes: config.get('max_compute_processes')
}).on('error', function(e) {
  logger.error("error detected in keysigning computation process!  fatal: " + e.toString());
  setTimeout(function() { process.exit(1); }, 0);
}).on('info', function(msg) {
  logger.info("(compute cluster): " + msg);
}).on('debug', function(msg) {
  logger.debug("(compute cluster): " + msg);
});

module.exports = function(args, cb) {
  keys.privkey(function(err, pk) {
    if (err) return cb(err);
    args.privkey = pk.serialize();
    cc.enqueue(args, function (err, r) {
      if (err) cb(err);
      else if (!r.success) cb(r.reason);
      else cb(null, r.certificate);
    });
  });
};
