import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch assessment data
    const { data: assessments, error: assessError } = await supabase
      .from("assessments")
      .select(`
        *,
        courses (title),
        profiles (full_name)
      `);

    if (assessError) throw assessError;

    // Fetch enrollments for completion data
    const { data: enrollments, error: enrollError } = await supabase
      .from("enrollments")
      .select(`
        *,
        courses (title)
      `);

    if (enrollError) throw enrollError;

    // Call Lovable AI to analyze the data
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are an educational analytics AI. Analyze student performance data and provide actionable insights.",
          },
          {
            role: "user",
            content: `Analyze this educational data and provide:
1. Top 5 weakest quiz areas (topics where students scored lowest)
2. Average completion rate by course
3. Key insights and recommendations

Assessment Data: ${JSON.stringify(assessments?.slice(0, 100))}
Enrollment Data: ${JSON.stringify(enrollments?.slice(0, 100))}

Provide the response in JSON format with keys: weakAreas (array), completionRates (array), insights (string)`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to generate AI analysis");
    }

    const aiData = await response.json();
    const aiResponse = aiData.choices?.[0]?.message?.content;

    // Try to parse AI response as JSON
    let analysis;
    try {
      analysis = JSON.parse(aiResponse);
    } catch {
      // If not JSON, create a structured response
      analysis = {
        weakAreas: [],
        completionRates: [],
        insights: aiResponse,
      };
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-performance-report:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
