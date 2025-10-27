import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Session } from "@supabase/supabase-js";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Performance() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        if (!session) {
          navigate("/auth");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const generateReport = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-performance-report");

      if (error) throw error;

      setAnalysis(data);
      toast({
        title: "Success",
        description: "AI-powered performance analysis generated",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return null;
  }

  const COLORS = ["#3b82f6", "#a855f7", "#ec4899", "#f59e0b", "#10b981"];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Performance Monitoring</h1>
            <p className="text-muted-foreground">AI-powered performance analytics and insights</p>
          </div>
          <Button onClick={generateReport} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generate AI Analysis
          </Button>
        </div>

        {!analysis && !loading && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                Click "Generate AI Analysis" to get AI-powered performance insights
              </p>
            </CardContent>
          </Card>
        )}

        {loading && (
          <Card>
            <CardContent className="py-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Analyzing performance data with AI...</p>
            </CardContent>
          </Card>
        )}

        {analysis && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Top 5 Weakest Quiz Areas</CardTitle>
                <CardDescription>Topics where students need the most support</CardDescription>
              </CardHeader>
              <CardContent>
                {analysis.weakAreas && analysis.weakAreas.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analysis.weakAreas}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="topic" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="averageScore" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    No assessment data available for analysis
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Average Completion Rate by Course</CardTitle>
                <CardDescription>Course completion statistics</CardDescription>
              </CardHeader>
              <CardContent>
                {analysis.completionRates && analysis.completionRates.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analysis.completionRates}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ course, rate }) => `${course}: ${rate}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="rate"
                      >
                        {analysis.completionRates.map((_: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    No enrollment data available for analysis
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AI Insights & Recommendations</CardTitle>
                <CardDescription>Actionable insights powered by AI</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap">{analysis.insights}</p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </Layout>
  );
}
