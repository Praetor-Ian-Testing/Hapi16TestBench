'use strict';
const Hoek = require('hoek');
const pluginName = 'hapitestbench.mongoinjection';

/**
 * @param {Object} db    - The mongo db instance to do stuff on
 * @param {string} type  - Name of the property of request to get the input from
 * @param {boolean} safe - Whether or not to make the route safe
 */
function baseHandler(db, type, safe, request, reply) {
  const input = safe ? '' : request[type].input;
  // db.eval('db.hapitestbench.find(' + input  + ')', function(err, result) {
  db.eval(input, function(err, result) {
    if (err) {
      reply(err.toString());
    } else {
      reply(result);
    }
  });
}

function makeHandler(db, type, safe) {
  return baseHandler.bind(this, db, type, safe);
}

exports.register = function mongoInjection(server, options, next) {
  const { db } = server.plugins['hapitestbench.mongodb'];
  if (!db) {
    Hoek.assert(db, 'mongodb was not properly initialized');
    next();
  }

  // curl http://localhost:3000/mongoinjection/header --header "input: hi_header"
  // curl http://localhost:3000/mongoinjection/headerSafe --header "input: hi_header"
  // curl http://localhost:3000/mongoinjection/cookie --cookie "input=hi_cookie"
  // curl http://localhost:3000/mongoinjection/cookieSafe --cookie "input=hi_cookie"
  const handlers = {
    query: makeHandler(db, 'query', false),
    querySafe: makeHandler(db, 'query', true),
    param: makeHandler(db, 'params', false),
    paramSafe: makeHandler(db, 'params', true),
    header: makeHandler(db, 'headers', false),
    headerSafe: makeHandler(db, 'headers', true),
    cookie: makeHandler(db, 'state', false),
    cookieSafe: makeHandler(db, 'state', true),
    post: makeHandler(db, 'payload', false),
    postSafe: makeHandler(db, 'payload', true)
  };

  server.route([
    {
      method: 'GET',
      path: '/',
      handler: {
        view: 'mongo-injection'
      }
    },
    { method: 'GET', path: '/cookie', handler: handlers.cookie },
    { method: 'GET', path: '/cookieSafe', handler: handlers.cookieSafe },
    { method: 'GET', path: '/header', handler: handlers.header },
    { method: 'GET', path: '/headerSafe', handler: handlers.headerSafe },
    { method: 'GET', path: '/param/{input}', handler: handlers.param },
    { method: 'GET', path: '/paramSafe/{input}', handler: handlers.paramSafe },
    { method: 'GET', path: '/query', handler: handlers.query },
    { method: 'GET', path: '/querySafe', handler: handlers.querySafe },
    { method: 'POST', path: '/post', handler: handlers.post },
    { method: 'POST', path: '/postSafe', handler: handlers.postSafe }
  ]);

  next();
};

exports.register.attributes = {
  name: pluginName
};
