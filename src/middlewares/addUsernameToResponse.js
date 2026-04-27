function addUsernameToResponse(req, res, next) {
  if (req.auth && req.auth.username) {
    res.locals.username = req.auth.username;
  }

  next();
}

module.exports = addUsernameToResponse;
