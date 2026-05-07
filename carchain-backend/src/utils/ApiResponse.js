// standard structure for API responses
class ApiResponse {
    constructor(statusCode, message = "Success", data) {
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
        this.success = statusCode < 400; // Consider status codes below 400 as successful responses
    }
}

module.exports = { ApiResponse };