import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { StatsCard } from "@/components/StatsCard";
import { Users, BookOpen, TrendingUp, BarChart3, GraduationCap, Award, Star, MessageSquare } from "lucide-react";
import { Session } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

const Index = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    activeEnrollments: 0,
    avgProgress: 0,
    totalInstructors: 0,
    totalCertificates: 0,
    averageRating: 0,
    totalDiscussions: 0,
  });
  const [enrollmentTrends, setEnrollmentTrends] = useState<any[]>([]);
  const [courseDistribution, setCourseDistribution] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        if (!session) {
          navigate("/auth");
        }
      }
    );

    // Check for existing session
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
      fetchStats();
    }
  }, [session]);

  const fetchStats = async () => {
    try {
      const { count: usersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      const { count: coursesCount } = await supabase
        .from("courses")
        .select("*", { count: "exact", head: true });

      const { count: enrollmentsCount } = await supabase
        .from("enrollments")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("progress");

      const avgProgress = enrollments && enrollments.length > 0
        ? enrollments.reduce((acc, e) => acc + (Number(e.progress) || 0), 0) / enrollments.length
        : 0;

      const { count: instructorsCount } = await supabase
        .from("instructors")
        .select("*", { count: "exact", head: true });

      const { count: certificatesCount } = await supabase
        .from("certificates")
        .select("*", { count: "exact", head: true });

      const { data: reviews } = await supabase
        .from("ratings_reviews")
        .select("rating");

      const avgRating = reviews && reviews.length > 0
        ? reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / reviews.length
        : 0;

      const { count: discussionsCount } = await supabase
        .from("discussions")
        .select("*", { count: "exact", head: true });

      setStats({
        totalUsers: usersCount || 0,
        totalCourses: coursesCount || 0,
        activeEnrollments: enrollmentsCount || 0,
        avgProgress: Math.round(avgProgress),
        totalInstructors: instructorsCount || 0,
        totalCertificates: certificatesCount || 0,
        averageRating: Number(avgRating.toFixed(1)),
        totalDiscussions: discussionsCount || 0,
      });

      // Fetch enrollment trends
      const { data: enrollData } = await supabase
        .from("enrollments")
        .select("enrolled_at");

      if (enrollData) {
        const monthCounts: any = {};
        enrollData.forEach((enrollment) => {
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
        setEnrollmentTrends(chartData);
      }

      // Fetch course distribution
      const { data: courseData } = await supabase
        .from("courses")
        .select("status");

      if (courseData) {
        const statusCounts: any = {};
        courseData.forEach((course) => {
          statusCounts[course.status] = (statusCounts[course.status] || 0) + 1;
        });

        const pieData = Object.entries(statusCounts).map(([status, count]) => ({
          name: status,
          value: count,
        }));
        setCourseDistribution(pieData);
      }

      // Fetch recent activity
      const { data: activityData } = await supabase
        .from("activity_logs")
        .select("*, profiles(full_name, email)")
        .order("created_at", { ascending: false })
        .limit(5);

      setRecentActivity(activityData || []);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  if (!session) {
    return null;
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's an overview of your platform.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Users"
            value={stats.totalUsers}
            icon={Users}
            description="All registered users"
          />
          <StatsCard
            title="Total Courses"
            value={stats.totalCourses}
            icon={BookOpen}
            description="Available courses"
          />
          <StatsCard
            title="Active Enrollments"
            value={stats.activeEnrollments}
            icon={TrendingUp}
            description="Students enrolled"
          />
          <StatsCard
            title="Avg Progress"
            value={`${stats.avgProgress}%`}
            icon={BarChart3}
            description="Course completion"
          />
          <StatsCard
            title="Total Instructors"
            value={stats.totalInstructors}
            icon={GraduationCap}
            description="Active instructors"
          />
          <StatsCard
            title="Certificates Issued"
            value={stats.totalCertificates}
            icon={Award}
            description="Total certificates awarded"
          />
          <StatsCard
            title="Average Rating"
            value={stats.averageRating}
            icon={Star}
            description="Overall course rating"
          />
          <StatsCard
            title="Total Discussions"
            value={stats.totalDiscussions}
            icon={MessageSquare}
            description="Active discussion threads"
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Enrollment Trends</CardTitle>
              <CardDescription>New enrollments over time</CardDescription>
            </CardHeader>
            <CardContent>
              {enrollmentTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={enrollmentTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="enrollments" stroke="hsl(var(--primary))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No enrollment data available
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Course Distribution</CardTitle>
              <CardDescription>Courses by status</CardDescription>
            </CardHeader>
            <CardContent>
              {courseDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={courseDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {courseDistribution.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={["#3b82f6", "#a855f7", "#ec4899"][index % 3]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No course data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system activities</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <p className="font-medium">{activity.profiles?.full_name || activity.profiles?.email}</p>
                      <p className="text-sm text-muted-foreground">{activity.action}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(activity.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No recent activity
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Index;
