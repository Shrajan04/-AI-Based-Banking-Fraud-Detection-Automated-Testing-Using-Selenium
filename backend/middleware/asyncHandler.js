/** Forward rejected async route handlers to Express 4's error middleware. */
module.exports = function asyncHandler(handler) {
  return function wrappedHandler(req, res, next) {
    return Promise.resolve(handler(req, res, next)).catch(next);
  };
};
