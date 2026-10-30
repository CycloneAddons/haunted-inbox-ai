import { compileScopes, redactEvent, BUILTIN_SCOPES, DEFAULT_GLOBAL_RULES } from "@glubean/redaction";

const scopes = compileScopes({
  builtinScopes: BUILTIN_SCOPES,
  globalRules: DEFAULT_GLOBAL_RULES,
  replacementFormat: "simple",
});


export function redactHeaders(headers = {}) {
    try {
        const event = {
            type: "trace",
            data: {
                requestHeaders: headers,
            }
        };

        const res = redactEvent(event, scopes, "simple");
        return res?.data?.requestHeaders ?? headers;
    } catch {
        return headers;
    }
}

export function redactBody(body) {
    if (body === null || body === undefined) return body;

    try {
        const event = {
            type: "trace",
            data: {
                requestBody: body,
            }
        };

        const res = redactEvent(event, scopes, "simple");
        return res?.data?.requestBody ?? body;
    } catch {
        return body;
    }
}