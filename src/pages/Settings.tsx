import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Session } from "@supabase/supabase-js";
import { Download, FileText, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function Settings() {
  const [session, setSession] = useState<Session | null>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
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

  useEffect(() => {
    if (session) {
      fetchReports();
    }
  }, [session]);

  const fetchReports = async () => {
    const { data } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });

    setReports(data || []);
  };

  const generateReport = async (type: string) => {
    setLoading(type);
    try {
      const { data, error } = await supabase.functions.invoke("generate-ai-report", {
        body: { reportType: type },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Report generated successfully",
      });

      fetchReports();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const exportUsers = async () => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("*");

      if (!data) return;

      const csv = [
        ["Email", "Full Name", "Role", "Created At"].join(","),
        ...data.map((user) =>
          [user.email, user.full_name || "", user.role, user.created_at].join(",")
        ),
      ].join("\n");

      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `users_export_${new Date().toISOString()}.csv`;
      a.click();

      toast({
        title: "Success",
        description: "Users exported successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (!session) {
    return null;
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
          <p className="text-muted-foreground">Manage system configuration and reports</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>AI Reports</CardTitle>
              <CardDescription>Generate automated AI-powered reports</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => generateReport("weekly_popularity")}
                disabled={loading === "weekly_popularity"}
              >
                {loading === "weekly_popularity" && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {!loading && <FileText className="mr-2 h-4 w-4" />}
                Generate Weekly Course Popularity Report
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => generateReport("monthly_activity")}
                disabled={loading === "monthly_activity"}
              >
                {loading === "monthly_activity" && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {!loading && <FileText className="mr-2 h-4 w-4" />}
                Generate Monthly Learner Activity Report
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Export</CardTitle>
              <CardDescription>Export platform data</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={exportUsers}
              >
                <Download className="mr-2 h-4 w-4" />
                Export All Users Data
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Generated Reports</CardTitle>
            <CardDescription>View all AI-generated reports</CardDescription>
          </CardHeader>
          <CardContent>
            {reports.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No reports generated yet
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Generated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">{report.title}</TableCell>
                      <TableCell>{report.report_type}</TableCell>
                      <TableCell>
                        {new Date(report.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
