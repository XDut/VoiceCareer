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
    const { messages, language } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const systemPrompt = `You are VoiceCareer, an AI-powered career assistant that helps users find jobs and provides career advice. You communicate in ${language || 'English'}.

Your capabilities:
1. **Resume Analysis**: When users describe their skills, experience, or read their resume, extract and remember key information.
2. **Job Matching**: Based on user skills and preferences, suggest relevant job opportunities with realistic job titles, companies, and requirements.
3. **Career Advice**: Provide actionable career guidance, interview tips, and professional development suggestions.
4. **Job Search**: When asked to find jobs, provide realistic job listings with:
   - Job title
   - Company name (use realistic fictional or real company names)
   - Location (can be remote)
   - Key requirements
   - Estimated salary range
   - A brief description

Guidelines:
- Be conversational and supportive
- Remember context from the conversation
- When generating job listings, make them realistic and varied
- Tailor responses to the user's experience level
- If asked about specific industries, focus on those
- Always be encouraging while being realistic
- Keep responses concise for voice output (2-3 sentences unless providing job listings)
- When providing multiple jobs, list 3-5 at a time

Respond naturally as if speaking to the user.`;

    // Build request body for Gemini API
    const contents = [];
    
    // Add system instruction as first user message (Gemini style)
    contents.push({
      role: "user",
      parts: [{ text: systemPrompt }]
    });
    contents.push({
      role: "model",
      parts: [{ text: "I understand. I'm VoiceCareer, your AI career assistant. How can I help you today?" }]
    });
    
    // Add conversation messages
    for (const msg of messages) {
      contents.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }]
      });
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service error", details: errorText }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    console.log("Gemini response:", JSON.stringify(data));
    
    const assistantMessage = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't generate a response.";

    return new Response(JSON.stringify({ message: assistantMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Career chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
