export async function GET() {
  return new Response("OK", { status: 200 });
}

export async function POST(req: Request) {
  try {
    const body = await req.text();
    console.log("Xero webhook received:", body);

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Xero webhook error:", error);
    return new Response("Error", { status: 500 });
  }
}
