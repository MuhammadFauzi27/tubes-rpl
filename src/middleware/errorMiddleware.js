const errorMiddleware = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const errorCode = err.errorCode || (statusCode === 500 ? "INTERNAL_SERVER_ERROR" : "ERROR");

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: err.message || "Internal Server Error",
      details: err.details || undefined
    }
  });
};

export default errorMiddleware;