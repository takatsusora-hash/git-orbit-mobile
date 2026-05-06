import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      mode: "mvp-placeholder",
      message:
        "Live GitHub sync is not enabled yet. The MVP reads config/system maps and public status JSON.",
    },
    { status: 501 },
  );
}
