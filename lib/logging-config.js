var config = require('./config.js'),
    fs = require('fs'),
    path = require('path'),
    winston = require('winston');

// for test environments, remove the Console logging
if (process.env.NODE_ENV === 'test') {
  winston.remove(winston.transports.Console);
}

if (config.has('var_path')) {
  var logDir = path.join(config.get('var_path'), 'log');

  // simple inline function for creation of dirs
  function mkdir_p(p) {
    if (!fs.existsSync(p)) {
      mkdir_p(path.dirname(p));
      fs.mkdirSync(p, "0755");
    }
  }

  mkdir_p(logDir);

  var logfile = path.join(logDir, 'certifier.log');
  winston.add(winston.transports.File, {
    timestamp: function() { return new Date().toISOString(); },
    filename: logfile,
    colorize: true,
    handleExceptions: !!process.env.LOG_TO_CONSOLE
  });
}
