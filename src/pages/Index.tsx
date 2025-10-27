import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { StatsCard } from "@/components/StatsCard";
import { Users, BookOpen, TrendingUp, BarChart3 } from "lucide-react";
import { Session } from "@supabase/supabase-js";

const Index = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    activeEnrollments: 0,
    avgProgress: 0,
  });
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
      // Fetch total users
      const { count: usersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Fetch total courses
      const { count: coursesCount } = await supabase
        .from("courses")
        .select("*", { count: "exact", head: true });

      // Fetch active enrollments
      const { count: enrollmentsCount } = await supabase
        .from("enrollments")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      // Fetch average progress
      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("progress");

      const avgProgress = enrollments && enrollments.length > 0
        ? enrollments.reduce((acc, e) => acc + (Number(e.progress) || 0), 0) / enrollments.length
        : 0;

      setStats({
        totalUsers: usersCount || 0,
        totalCourses: coursesCount || 0,
        activeEnrollments: enrollmentsCount || 0,
        avgProgress: Math.round(avgProgress),
      });
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
            trend={{ value: 12, isPositive: true }}
          />
          <StatsCard
            title="Total Courses"
            value={stats.totalCourses}
            icon={BookOpen}
            description="Available courses"
            trend={{ value: 8, isPositive: true }}
          />
          <StatsCard
            title="Active Enrollments"
            value={stats.activeEnrollments}
            icon={TrendingUp}
            description="Students enrolled"
            trend={{ value: 15, isPositive: true }}
          />
          <StatsCard
            title="Avg Progress"
            value={`${stats.avgProgress}%`}
            icon={BarChart3}
            description="Course completion"
            trend={{ value: 5, isPositive: true }}
          />
        </div>
      </div>
    </Layout>
  );
};

export default Index;
