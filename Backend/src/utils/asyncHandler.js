/**
 * Async Handler Utility
 * Wraps async controller functions to handle errors properly
 */

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
