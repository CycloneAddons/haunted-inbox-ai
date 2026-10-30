import crypto from "crypto"

export function generateToken() {
    const rawT = crypto.randomBytes(32).toString("hex");
    return { raw: rawT, hash: hashToken(rawT)}
}

export function hashToken(raw) {
    return crypto.createHash("sha256").update(raw).digest("hex");
}