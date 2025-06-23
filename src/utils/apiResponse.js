class ApiResponse{
    constructor (statusCode, data, message = "Success"){
        this.statusCode = statusCode,
        this.data = data,
        this.message = message,
        this.success = statusCode <400                            // greater than 400 is error
    }
}

export { ApiResponse };