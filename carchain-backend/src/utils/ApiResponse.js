// standard structure for API responses
class ApiResponse {
    constructor(statusCode, data, message = "Success") {
        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
        this.success = statusCode < 400; // Consider status codes below 400 as successful responses
    }
}

module.exports = { ApiResponse };