import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Session } from "@supabase/supabase-js";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function Enrollments() {
  const [session, setSession] = useState<Session | null>(null);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [enrollmentData, setEnrollmentData] = useState<any[]>([]);
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
      fetchEnrollments();
      fetchActivityLogs();
      fetchEnrollmentTrends();
    }
  }, [session]);

  const fetchEnrollments = async () => {
    const { data } = await supabase
      .from("enrollments")
      .select(`
        *,
        courses (title),
        profiles (full_name, email)
      `)
      .order("enrolled_at", { ascending: false })
      .limit(10);

    setEnrollments(data || []);
  };

  const fetchActivityLogs = async () => {
    const { data } = await supabase
      .from("activity_logs")
      .select(`
        *,
        profiles (full_name, email)
      `)
      .in("action", ["login", "quiz_attempt"])
      .order("created_at", { ascending: false })
      .limit(10);

    setActivityLogs(data || []);
  };

  const fetchEnrollmentTrends = async () => {
    const { data } = await supabase
      .from("enrollments")
      .select("enrolled_at");

    if (data) {
      // Group by month
      const monthCounts: any = {};
      data.forEach((enrollment) => {
        const month = new Date(enrollment.enrolled_at).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
        });
        monthCounts[month] = (monthCounts[month] || 0) + 1;
      });

      const chartData = Object.entries(monthCounts).map(([month, count]) => ({
        month,
        enrollments: count,
      }));

      setEnrollmentData(chartData);
    }
  };

  if (!session) {
    return null;
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Enrollment Tracking</h1>
          <p className="text-muted-foreground">Monitor enrollments and student activity</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Enrollment Trends</CardTitle>
            <CardDescription>New enrollments by month</CardDescription>
          </CardHeader>
          <CardContent>
            {enrollmentData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={enrollmentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="enrollments"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No enrollment data available
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Enrollments</CardTitle>
              <CardDescription>Latest student enrollments</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollments.map((enrollment) => (
                    <TableRow key={enrollment.id}>
                      <TableCell className="font-medium">
                        {enrollment.profiles?.full_name || enrollment.profiles?.email}
                      </TableCell>
                      <TableCell>{enrollment.courses?.title}</TableCell>
                      <TableCell>
                        {new Date(enrollment.enrolled_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Login and quiz attempts</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activityLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">
                        {log.profiles?.full_name || log.profiles?.email}
                      </TableCell>
                      <TableCell>{log.action}</TableCell>
                      <TableCell>
                        {new Date(log.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
