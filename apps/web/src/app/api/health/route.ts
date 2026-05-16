import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    service: "metl-vibecoder-web",
    version: "0.1.0",
    status: "ok",
  });
}
