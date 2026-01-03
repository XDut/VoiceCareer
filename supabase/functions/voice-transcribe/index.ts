import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File;
    const languageCode = formData.get("language") as string || "en";
    
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    
    if (!ELEVENLABS_API_KEY) {
      throw new Error("ELEVENLABS_API_KEY is not configured");
    }

    if (!audioFile) {
      throw new Error("No audio file provided");
    }

    console.log("Transcribing audio, language:", languageCode);

    // Use ElevenLabs Speech-to-Text API
    const apiFormData = new FormData();
    apiFormData.append("file", audioFile);
    apiFormData.append("model_id", "scribe_v1");
    
    // Map language code to ISO 639-3 for ElevenLabs
    const languageMap: Record<string, string> = {
      "en": "eng",
      "es": "spa",
      "fr": "fra",
      "de": "deu",
      "it": "ita",
      "pt": "por",
      "nl": "nld",
      "pl": "pol",
      "ru": "rus",
      "ja": "jpn",
      "ko": "kor",
      "zh": "zho",
      "ar": "ara",
      "hi": "hin",
      "tr": "tur",
      "vi": "vie",
      "th": "tha",
      "id": "ind",
      "ms": "msa",
      "sv": "swe",
      "da": "dan",
      "no": "nor",
      "fi": "fin",
      "cs": "ces",
      "sk": "slk",
      "hu": "hun",
      "ro": "ron",
      "bg": "bul",
      "el": "ell",
      "he": "heb",
      "uk": "ukr",
    };

    const iso639_3 = languageMap[languageCode] || "eng";
    apiFormData.append("language_code", iso639_3);

    const response = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
      },
      body: apiFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs STT error:", response.status, errorText);
      throw new Error(`Transcription failed: ${response.status}`);
    }

    const transcription = await response.json();
    console.log("Transcription successful:", transcription.text?.substring(0, 50));

    return new Response(JSON.stringify({ text: transcription.text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Voice transcribe error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
