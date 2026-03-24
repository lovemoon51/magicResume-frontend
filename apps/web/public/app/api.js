export async function callApi(method, path, body) {
  try {
    const response = await fetch(path, {
      method,
      headers: {
        "Content-Type": "application/json"
      },
      body: body ? JSON.stringify(body) : undefined
    });
    const json = await response.json();
    if (!response.ok || json.code !== "OK") {
      return {
        ok: false,
        error: {
          code: json.code ?? "UNKNOWN",
          message: json.message ?? "request failed"
        }
      };
    }
    return { ok: true, data: json.data };
  } catch (error) {
    return {
      ok: false,
      error: {
        message: error instanceof Error ? error.message : "network error"
      }
    };
  }
}
