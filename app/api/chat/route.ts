import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const SYSTEM_PROMPT = `You are Eco Assistant for the QaitaJanaru platform.

Your role:

* Teach recycling.
* Explain environmental issues.
* Help users sort waste correctly.
* Encourage sustainable habits.
* Promote environmental education.
* Answer in the language used by the user.
* Keep answers friendly, polite, educational, and concise.
* Never answer harmful or illegal environmental questions.

GREETING RULES:

* If the user says "Hi", "Hello", "Привет", "Сәлем" or greets you first, greet them back politely.
* Introduce yourself as the QaitaJanaru Eco Assistant.
* Ask how you can help with ecology.
* Do not repeat greetings during an ongoing conversation.

STRICT ECO-FOCUS RULE:

* Only answer questions about ecology, sustainability, recycling and environmental protection.
* If the user asks about unrelated topics, politely explain that you specialize only in ecology and recycling.

If a user asks about recycling locations:
tell them that QaitaJanaru Recycling Map contains official recycling locations.

Return clean text only.

Formatting rules:

- Use short paragraphs.
- Use bullet points when listing information.
- Separate ideas with blank lines.
- Never return one long block of text.
- Make answers easy for teenagers to read.
- Format all responses using Markdown.

If the user asks a short follow-up question, use previous messages to determine context before answering.

USER PROFILE:
You have access to the user's profile information:
- Name: {{name}}
- City: {{city}}
- User Type: {{userType}}
- Eco Points: {{ecoPoints}}
- Current Streak: {{streak}} days
- Achievements Count: {{achievementsCount}}
- Level: {{level}}
- Total Scans: {{totalScans}}
- Institution: {{institution}}

You can answer questions about the user's profile when asked:
- What is my name?
- What city am I from?
- What's my user type?
- How many eco points do I have?
- What's my current streak?
- How many achievements do I have?
- What level am I?
- How many total scans do I have?
- What institution am I from?

QaitaJanaru platform structure:

Main sections:
- Profile
- Scan Waste
- Leaderboard
- Recycling Map
- Eco Assistant
- Settings

If the user asks where to find recycling locations, tell them:

"Open the Recycling Map section from the main navigation menu. There you can view official recycling locations and build routes to them."

Never answer vaguely when the location of a platform feature is known.`;

export async function POST(request: NextRequest) {
try {
const body = await request.json();
const { history, profile } = body;

console.log("API KEY EXISTS:", !!GEMINI_API_KEY);

if (!history || !Array.isArray(history)) {
  return NextResponse.json(
    { response: "Invalid request. Please try again." },
    { status: 400 }
  );
}

console.log("HISTORY LENGTH:", history.length);
console.log("FIRST MESSAGE:", history[0]);

if (!GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY not configured");
  return NextResponse.json(
    { response: "Service temporarily unavailable. Please try again." },
    { status: 500 }
  );
}

// Limit history to last 10 messages for Gemini to reduce token usage
const recentHistory = history.slice(-10);
console.log("SENDING TO GEMINI - RECENT HISTORY LENGTH:", recentHistory.length);

const contents = recentHistory.map(
  (msg: { role: string; text: string }) => ({
    role: msg.role === "user" ? "user" : "model",
    parts: [{ text: msg.text || "" }],
  })
);

// Inject profile data into system prompt
let systemPrompt = SYSTEM_PROMPT;
if (profile) {
  systemPrompt = systemPrompt
    .replace("{{name}}", profile.name || "Unknown")
    .replace("{{city}}", profile.city || "Unknown")
    .replace("{{userType}}", profile.userType || "Unknown")
    .replace("{{ecoPoints}}", profile.ecoPoints?.toString() || "0")
    .replace("{{streak}}", profile.streak?.toString() || "0")
    .replace("{{achievementsCount}}", profile.achievementsCount?.toString() || "0")
    .replace("{{level}}", profile.level || "Unknown")
    .replace("{{totalScans}}", profile.totalScans?.toString() || "0")
    .replace("{{institution}}", profile.institution || "Unknown");
}

const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents,
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      generationConfig: {
        temperature: 0.7,
      },
    }),
  }
);

console.log("GEMINI STATUS:", response.status);

if (!response.ok) {
  const errorData = await response.text();
  console.error("Gemini API error:", errorData);

  // Handle quota limit errors gracefully
  if (response.status === 429) {
    return NextResponse.json({
      response: "AI chat limit reached. Upgrade to Pro to continue chatting with Eco Assistant."
    });
  }

  // Hide all technical errors from user - return generic message
  return NextResponse.json({
    response: "Service temporarily unavailable. Please try again.",
  }, { status: 503 });
}

const data = await response.json();

const generatedText =
  data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

if (!generatedText) {
  console.error("Empty response from Gemini API");
  return NextResponse.json({
    response: "Service temporarily unavailable. Please try again.",
  }, { status: 503 });
}

return NextResponse.json({
  response: generatedText,
});


} catch (error) {
console.error("Error in chat API route:", error);

return NextResponse.json(
  {
    response: "Service temporarily unavailable. Please try again.",
  },
  {
    status: 503,
  }
);

}
}
