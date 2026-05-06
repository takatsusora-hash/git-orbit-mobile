import { NextResponse } from "next/server";
import { loadAllSystems } from "@/lib/analyzer/statusGenerator";

export async function GET() {
  const systems = await loadAllSystems();
  return NextResponse.json(systems);
}
