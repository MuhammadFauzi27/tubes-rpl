const errorMiddleware = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    status: "error",
    message: err.message || "Internal Server Error",
    error_code: err.errorCode,
  });
};

export default errorMiddleware;