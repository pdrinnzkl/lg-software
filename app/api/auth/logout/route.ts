import { env } from "../../../../db/runtime";
import { clearSessionCookie, digestToken } from "../../../../lib/auth";

export async function POST(request: Request) {
  const cookie = request.headers.get("cookie") ?? "";
  const token = cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith("lgf_session="))
    ?.split("=")[1];
  if (token && env.DB)
    await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?")
      .bind(await digestToken(token))
      .run();
  return Response.json(
    { ok: true },
    { headers: { "Set-Cookie": clearSessionCookie(request) } },
  );
}
