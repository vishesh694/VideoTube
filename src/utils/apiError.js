class ApiError extends Error {
    constructor(
        statusCode,
        message = "Something went wrong",
        errors = [],
        stack = ""
    ){
        super(message)                                              /// overwrites the message property of the Error class
        this.statusCode = statusCode,
        this.data = null,
        this.message = message,
        this.errors = errors

        if (stack) {
            this.stack = stack
        }
        else Error.captureStackTrace(this, this.constructor)            /// captures the stack trace of the error
    }
}

export { ApiError}