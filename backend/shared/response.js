/**
 * Standard CORS headers — allow the frontend (Static Web App) to call the API.
 */
const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Content-Type": "application/json"
};

function ok(body) {
    return { status: 200, headers: corsHeaders, body };
}

function created(body) {
    return { status: 201, headers: corsHeaders, body };
}

function badRequest(message) {
    return { status: 400, headers: corsHeaders, body: { error: message } };
}

function unauthorized(message = "Unauthorized") {
    return { status: 401, headers: corsHeaders, body: { error: message } };
}

function notFound(message = "Not found") {
    return { status: 404, headers: corsHeaders, body: { error: message } };
}

function serverError(err) {
    return {
        status: 500,
        headers: corsHeaders,
        body: { error: "Internal server error", detail: err?.message }
    };
}

module.exports = { ok, created, badRequest, unauthorized, notFound, serverError, corsHeaders };
