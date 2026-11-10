export class VerifyAuthError extends Error {
  constructor(status, message, code) {
    super(message);
    this.name = "VerifyAuthError";
    this.status = status;
    this.code = code;
  }
}
