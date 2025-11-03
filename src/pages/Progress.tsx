import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Session } from "@supabase/supabase-js";
import { Search } from "lucide-react";
import { Progress as ProgressBar } from "@/components/ui/progress";

export default function Progress() {
  const [session, setSession] = useState<Session | null>(null);
  const [progressData, setProgressData] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

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
      fetchProgress();
    }
  }, [session]);

  const fetchProgress = async () => {
    const { data } = await supabase
      .from("progress")
      .select("*, courses(title), profiles(full_name, email)")
      .order("last_accessed", { ascending: false });

    setProgressData(data || []);
  };

  const filteredProgress = progressData.filter((progress) =>
    progress.courses?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    progress.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    progress.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!session) {
    return null;
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Progress Tracking</h1>
          <p className="text-muted-foreground">Monitor student progress across all courses</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Student Progress</CardTitle>
            <CardDescription>
              <div className="flex items-center gap-2 mt-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by student or course..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Accessed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProgress.map((progress) => (
                  <TableRow key={progress.id}>
                    <TableCell className="font-medium">
                      {progress.profiles?.full_name || progress.profiles?.email}
                    </TableCell>
                    <TableCell>{progress.courses?.title}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <ProgressBar value={Number(progress.completion_percentage)} className="w-[100px]" />
                        <span className="text-sm text-muted-foreground">
                          {progress.completion_percentage}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`capitalize ${progress.status === 'completed' ? 'text-green-600' : 'text-yellow-600'}`}>
                        {progress.status}
                      </span>
                    </TableCell>
                    <TableCell>{new Date(progress.last_accessed).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
