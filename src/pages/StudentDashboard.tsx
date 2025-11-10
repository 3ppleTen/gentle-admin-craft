import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Trophy, TrendingUp, Clock, Award, Target } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

export default function StudentDashboard() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState<any>(null);
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<any[]>([]);
  const [recentProgress, setRecentProgress] = useState<any[]>([]);

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to view your dashboard",
          variant: "destructive",
        });
        return;
      }

      // Fetch profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setStudentData(profile);

      // Fetch enrolled courses with course details
      const { data: enrollments } = await supabase
        .from("enrollments")
        .select(`
          *,
          courses (
            id,
            title,
            description,
            thumbnail_url,
            status
          )
        `)
        .eq("student_id", user.id)
        .eq("status", "active")
        .order("enrolled_at", { ascending: false });

      setEnrolledCourses(enrollments || []);

      // Fetch certificates
      const { data: certs } = await supabase
        .from("certificates")
        .select(`
          *,
          courses (
            title
          )
        `)
        .eq("student_id", user.id)
        .order("issued_at", { ascending: false });

      setCertificates(certs || []);

      // Fetch performance metrics
      const { data: metrics } = await supabase
        .from("performance_metrics")
        .select(`
          *,
          courses (
            title
          )
        `)
        .eq("student_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      setPerformanceMetrics(metrics || []);

      // Fetch recent progress
      const { data: progress } = await supabase
        .from("progress")
        .select(`
          *,
          courses (
            title
          ),
          content (
            title
          )
        `)
        .eq("student_id", user.id)
        .order("last_accessed", { ascending: false })
        .limit(5);

      setRecentProgress(progress || []);

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

  const stats = [
    {
      title: "Enrolled Courses",
      value: enrolledCourses.length,
      icon: BookOpen,
      description: "Active courses",
    },
    {
      title: "Certificates Earned",
      value: certificates.length,
      icon: Award,
      description: "Completed courses",
    },
    {
      title: "Average Progress",
      value: enrolledCourses.length > 0 
        ? Math.round(enrolledCourses.reduce((acc, e) => acc + (Number(e.progress) || 0), 0) / enrolledCourses.length)
        : 0,
      icon: Target,
      description: "Overall completion",
      suffix: "%",
    },
    {
      title: "Recent Activity",
      value: recentProgress.length,
      icon: TrendingUp,
      description: "Last 5 activities",
    },
  ];

  const progressChartData = enrolledCourses.map(e => ({
    name: e.courses?.title?.substring(0, 15) + "..." || "Course",
    progress: Number(e.progress) || 0,
  }));

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {studentData?.full_name || "Student"}! 👋
          </h1>
          <p className="text-muted-foreground mt-2">
            Track your learning journey and continue making progress
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stat.value}{stat.suffix || ""}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Enrolled Courses */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>My Courses</CardTitle>
              <CardDescription>Continue your learning journey</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {enrolledCourses.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No enrolled courses yet. Start learning today!
                  </p>
                ) : (
                  enrolledCourses.map((enrollment) => (
                    <div
                      key={enrollment.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        {enrollment.courses?.thumbnail_url && (
                          <img
                            src={enrollment.courses.thumbnail_url}
                            alt={enrollment.courses?.title}
                            className="w-16 h-16 rounded object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">
                            {enrollment.courses?.title}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {enrollment.courses?.description}
                          </p>
                          <div className="mt-2">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-muted-foreground">
                                Progress
                              </span>
                              <span className="text-xs font-medium">
                                {Number(enrollment.progress) || 0}%
                              </span>
                            </div>
                            <Progress value={Number(enrollment.progress) || 0} />
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="ml-4">
                        Continue
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Progress Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Course Progress Overview</CardTitle>
              <CardDescription>Your completion status</CardDescription>
            </CardHeader>
            <CardContent>
              {progressChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={progressChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="progress" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No progress data available
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest learning sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentProgress.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No recent activity
                  </p>
                ) : (
                  recentProgress.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 pb-3 border-b last:border-0"
                    >
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Clock className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {item.content?.title || "Course content"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.courses?.title}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {item.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {Number(item.completion_percentage) || 0}% complete
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Certificates */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Certificates Earned
              </CardTitle>
              <CardDescription>Your achievements and accomplishments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {certificates.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8 col-span-2">
                    No certificates earned yet. Complete courses to earn certificates!
                  </p>
                ) : (
                  certificates.map((cert) => (
                    <div
                      key={cert.id}
                      className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground flex items-center gap-2">
                            <Award className="h-4 w-4 text-primary" />
                            {cert.courses?.title}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            Issued: {new Date(cert.issued_at).toLocaleDateString()}
                          </p>
                        </div>
                        {cert.certificate_url && (
                          <Button size="sm" variant="outline" asChild>
                            <a href={cert.certificate_url} target="_blank" rel="noopener noreferrer">
                              View
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Performance Insights */}
          {performanceMetrics.length > 0 && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Performance Insights</CardTitle>
                <CardDescription>AI-powered recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {performanceMetrics.map((metric) => (
                    <div key={metric.id} className="p-4 border rounded-lg">
                      <h4 className="font-semibold text-foreground mb-2">
                        {metric.courses?.title}
                      </h4>
                      {metric.strengths && (
                        <div className="mb-2">
                          <span className="text-sm font-medium text-green-600 dark:text-green-400">
                            Strengths:
                          </span>
                          <p className="text-sm text-muted-foreground mt-1">
                            {metric.strengths}
                          </p>
                        </div>
                      )}
                      {metric.weaknesses && (
                        <div className="mb-2">
                          <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                            Areas to improve:
                          </span>
                          <p className="text-sm text-muted-foreground mt-1">
                            {metric.weaknesses}
                          </p>
                        </div>
                      )}
                      {metric.recommendations && (
                        <div>
                          <span className="text-sm font-medium text-primary">
                            Recommendations:
                          </span>
                          <p className="text-sm text-muted-foreground mt-1">
                            {metric.recommendations}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
