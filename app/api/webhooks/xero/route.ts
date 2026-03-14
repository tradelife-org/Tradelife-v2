import crypto from "crypto"

export async function POST(req: Request) {
  const rawBody = await req.text()

  const signature = req.headers.get("x-xero-signature") || ""

  const webhookKey = process.env.XERO_WEBHOOK_KEY || ""

  const computed = crypto
    .createHmac("sha256", webhookKey)
    .update(rawBody)
    .digest("base64")

  if (computed !== signature) {
    return new Response("Invalid signature", { status: 401 })
  }

  console.log("Xero webhook verified")

  return new Response("OK", { status: 200 })
}
