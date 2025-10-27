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
    const { reportType } = await req.json();
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch relevant data based on report type
    let dataToAnalyze;
    let prompt;

    if (reportType === "weekly_popularity") {
      const { data: enrollments } = await supabase
        .from("enrollments")
        .select(`
          *,
          courses (title, status)
        `)
        .gte("enrolled_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      dataToAnalyze = enrollments;
      prompt = `Generate a weekly course popularity report based on enrollment data. 
      Identify the most popular courses, enrollment trends, and provide recommendations.
      Data: ${JSON.stringify(enrollments?.slice(0, 50))}`;
    } else if (reportType === "monthly_activity") {
      const { data: activities } = await supabase
        .from("activity_logs")
        .select("*")
        .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      dataToAnalyze = activities;
      prompt = `Generate a monthly learner activity report based on activity log data.
      Analyze user engagement, login patterns, and assessment participation.
      Data: ${JSON.stringify(activities?.slice(0, 100))}`;
    } else {
      throw new Error("Invalid report type");
    }

    // Call Lovable AI
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
            content: "You are an educational analytics AI assistant. Generate detailed, actionable reports.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate report with AI");
    }

    const aiData = await response.json();
    const reportContent = aiData.choices?.[0]?.message?.content;

    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token || "");

    // Save report to database
    const { data: savedReport, error: saveError } = await supabase
      .from("reports")
      .insert({
        title: reportType === "weekly_popularity" 
          ? "Weekly Course Popularity Report" 
          : "Monthly Learner Activity Report",
        report_type: reportType,
        generated_by: user?.id,
        data: {
          content: reportContent,
          generated_at: new Date().toISOString(),
          raw_data_count: dataToAnalyze?.length || 0,
        },
      })
      .select()
      .single();

    if (saveError) {
      console.error("Error saving report:", saveError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        report: reportContent,
        reportId: savedReport?.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in generate-ai-report:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
