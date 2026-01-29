import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "data/loot.json");

export async function GET() {
  try {
    if (!fs.existsSync(filePath)) return NextResponse.json([]);
    const data = JSON.parse(fs.readFileSync(filePath, "utf8") || "[]");
    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return NextResponse.json([]);
  }
}

export async function DELETE() {
  try {
    fs.writeFileSync(filePath, JSON.stringify([], null, 2));
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Fail" }, { status: 500 });
  }
}
