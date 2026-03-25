import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

export async function POST(request: Request) {
  const body = await request.json();
  const { name, username, password } = body;

  if (!name || !username || !password) {
    return NextResponse.json({ error: "Name, username, and password are required" }, { status: 400 });
  }

  if (!USERNAME_REGEX.test(username)) {
    return NextResponse.json(
      { error: "Username must be 3-20 characters, letters, numbers, and underscores only" },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const normalized = username.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { username: normalized } });
  if (existing) {
    return NextResponse.json({ error: "This username is already taken" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: { name, username: normalized, passwordHash },
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
