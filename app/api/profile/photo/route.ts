import { env } from "../../../../db/runtime";
import { getSessionUser } from "../../../../lib/auth";

const maxBytes = 2 * 1024 * 1024;

function imageType(bytes: Uint8Array) {
  if (
    bytes.length > 8 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  )
    return "image/jpeg";
  if (
    bytes.length > 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  )
    return "image/png";
  if (
    bytes.length > 12 &&
    new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" &&
    new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP"
  )
    return "image/webp";
  return null;
}

function encodeBase64(bytes: Uint8Array) {
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(binary);
}

function decodeBase64(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export async function GET(request: Request) {
  const user = await getSessionUser(request);
  if (!user) return new Response(null, { status: 401 });
  if (!user.avatar) return new Response(null, { status: 404 });
  const match =
    /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+=*)$/.exec(
      user.avatar,
    );
  if (!match) return new Response(null, { status: 404 });
  return new Response(decodeBase64(match[2]), {
    headers: {
      "Content-Type": match[1],
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function POST(request: Request) {
  const user = await getSessionUser(request);
  if (!user)
    return Response.json(
      { error: "Entre para adicionar sua foto." },
      { status: 401 },
    );
  const form = await request.formData();
  const file = form.get("photo");
  if (!(file instanceof File) || file.size < 1 || file.size > maxBytes)
    return Response.json(
      { error: "Escolha uma foto de até 2 MB." },
      { status: 400 },
    );
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = imageType(bytes);
  if (!type)
    return Response.json(
      { error: "Envie uma imagem JPG, PNG ou WebP." },
      { status: 400 },
    );
  const avatar = `data:${type};base64,${encodeBase64(bytes)}`;
  await env.DB.prepare("UPDATE users SET avatar = ? WHERE id = ?")
    .bind(avatar, user.id)
    .run();
  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  const user = await getSessionUser(request);
  if (!user)
    return Response.json(
      { error: "Entre para remover sua foto." },
      { status: 401 },
    );
  await env.DB.prepare("UPDATE users SET avatar = NULL WHERE id = ?")
    .bind(user.id)
    .run();
  return Response.json({ ok: true });
}
