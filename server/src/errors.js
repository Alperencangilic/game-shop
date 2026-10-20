// Error with an HTTP status, turned into JSON by the error handler in index.js
export class HttpError extends Error {
  constructor(status, message, extra = {}) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}
