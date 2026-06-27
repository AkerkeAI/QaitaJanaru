const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function emitTaskEvent(event: "map_visit" | "route_open") {
  if (typeof window === "undefined") return;

  const userId = window.localStorage.getItem("qaitaJanaru_user_id");
  if (!userId) return;

  try {
    await fetch(`${API_BASE_URL}/api/tasks/event/${userId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ event }),
    });
  } catch (error) {
    console.error("Failed to emit task event:", error);
  }
}
