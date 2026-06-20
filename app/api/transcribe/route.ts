import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const TRANSCRIPTION_PROMPT = `Transcribe the following audio to text. Return only the transcribed text without any additional commentary, formatting, or explanations. If the audio is unclear or contains no speech, return an empty string.`;

export async function POST(request: NextRequest) {
  try {
    console.log("TRANSCRIPTION API CALLED");

    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "API key not found" },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    console.log("AUDIO FILE:", {
      name: audioFile.name,
      type: audioFile.type,
      size: audioFile.size
    });

    // Convert audio file to base64
    const arrayBuffer = await audioFile.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = audioFile.type || "audio/wav";

    console.log("AUDIO CONVERTED TO BASE64, SIZE:", base64Audio.length);

    // Call Gemini API for transcription
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: TRANSCRIPTION_PROMPT
                },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64Audio
                  }
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1000,
          },
        }),
      }
    );

    console.log("GEMINI TRANSCRIPTION STATUS:", response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Gemini transcription error:", errorData);

      if (response.status === 429) {
        return NextResponse.json(
          { error: "API rate limit exceeded. Please try again later." },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: "Transcription failed" },
        { status: response.status }
      );
    }

    const data = await response.json();
    const transcribedText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    console.log("TRANSCRIPTION RESULT:", transcribedText.substring(0, 100));

    return NextResponse.json({
      text: transcribedText.trim(),
    });

  } catch (error) {
    console.error("Error in transcription API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
