import { NextRequest, NextResponse } from "next/server";

const SCAN_API_BASE_URL =
  process.env.NEXT_PUBLIC_SCAN_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "";

const readBackendError = async (response: Response): Promise<string> => {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const payload = await response.json().catch(() => null);
    if (payload && typeof payload === "object") {
      if (typeof payload.detail === "string") return payload.detail;
      if (typeof payload.error === "string") return payload.error;
      if (typeof payload.message === "string") return payload.message;
    }
  }

  const text = await response.text().catch(() => "");
  return text || "Scan request failed";
};

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> },
) {
  try {
    if (!SCAN_API_BASE_URL) {
      return NextResponse.json(
        { detail: "Scan API base URL is not configured" },
        { status: 500 },
      );
    }

    const { userId } = await context.params;
    const searchParams = new URL(request.url).searchParams;
    const language = searchParams.get("language") || "en";

    const incomingFormData = await request.formData();
    const file = incomingFormData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { detail: "No image file provided" },
        { status: 400 },
      );
    }

    const formData = new FormData();
    formData.append("file", file, file.name);

    const backendResponse = await fetch(
      `${SCAN_API_BASE_URL}/scan/${encodeURIComponent(userId)}?language=${encodeURIComponent(language)}`,
      {
        method: "POST",
        body: formData,
        cache: "no-store",
      },
    );

    if (!backendResponse.ok) {
      const detail = await readBackendError(backendResponse);
      return NextResponse.json(
        { detail },
        { status: backendResponse.status },
      );
    }

    const payload = await backendResponse.json();
    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "Unexpected scan proxy error";

    return NextResponse.json({ detail }, { status: 500 });
  }
}
