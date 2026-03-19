from fastapi import FastAPI, Request
from fastapi.responses import Response
import httpx

app = FastAPI()

NEXTJS_URL = "http://localhost:3000"

@app.api_route("/api/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
async def proxy_to_nextjs(request: Request, path: str):
    url = f"{NEXTJS_URL}/api/{path}"
    headers = dict(request.headers)
    headers.pop("host", None)

    body = await request.body()

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.request(
            method=request.method,
            url=url,
            headers=headers,
            content=body,
            params=dict(request.query_params),
        )

    return Response(
        content=response.content,
        status_code=response.status_code,
        headers=dict(response.headers),
    )

@app.get("/health")
async def health():
    return {"status": "ok"}
