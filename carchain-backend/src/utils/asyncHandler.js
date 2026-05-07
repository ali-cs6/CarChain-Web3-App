// utility function to handle asynchronous errors in Express routes. 
// no manuall wrap of every async route handler in try catch instead use this asynchandler.
const asyncHandler = (asyncfn) => {
  return async (req, res, next) => {
  try {
    await asyncfn(req, res, next);
  } catch (error) {
    next(error);
  }
};
};
 
module.exports = { asyncHandler };
