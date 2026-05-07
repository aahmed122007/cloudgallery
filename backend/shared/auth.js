const jwt = require("jsonwebtoken");

function signToken(payload) {
    const secret = process.env.JWT_SECRET;
    const expiresIn = process.env.JWT_EXPIRY || "24h";
    return jwt.sign(payload, secret, { expiresIn });
}

function verifyToken(token) {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        return null;
    }
}

/**
 * Extracts and verifies JWT from the Authorization header.
 * Returns decoded user payload or null if invalid/missing.
 */
function authenticate(req) {
    const authHeader = req.headers["authorization"] || req.headers["Authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
    const token = authHeader.substring(7);
    return verifyToken(token);
}

module.exports = { signToken, verifyToken, authenticate };
