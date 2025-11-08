exports.getAllUsers = (req, res, next) => {
  res.status(200).json({
    status: "success",
    message: "hello world",
  });
};
exports.getUser = (req, res, next) => {
  res.status(404).json({
    status: "failed",
    data: null,
  });
};

exports.createUser = (req, res, next) => {
  res.status(404).json({
    status: "failed",
    data: null,
  });
};
exports.updateUser = (req, res, next) => {
  res.status(404).json({
    status: "failed",
    data: null,
  });
};

exports.deleteUser = (req, res, next) => {
  res.status(404).json({
    status: "failed",
    data: null,
  });
};
