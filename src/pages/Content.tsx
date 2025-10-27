import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Session } from "@supabase/supabase-js";
import { Trash2, FileText, Video, FileQuestion } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Content() {
  const [session, setSession] = useState<Session | null>(null);
  const [contentByCourse, setContentByCourse] = useState<any>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<any>(null);
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
      fetchContent();
    }
  }, [session]);

  const fetchContent = async () => {
    const { data, error } = await supabase
      .from("content")
      .select(`
        *,
        courses (title)
      `)
      .order("order_index");

    if (error) {
      console.error("Error fetching content:", error);
      return;
    }

    // Group by course
    const grouped = (data || []).reduce((acc: any, item: any) => {
      const courseTitle = item.courses?.title || "Unassigned";
      if (!acc[courseTitle]) {
        acc[courseTitle] = [];
      }
      acc[courseTitle].push(item);
      return acc;
    }, {});

    setContentByCourse(grouped);
  };

  const handleDelete = async () => {
    if (!selectedContent) return;

    try {
      const { error } = await supabase
        .from("content")
        .delete()
        .eq("id", selectedContent.id);

      if (error) throw error;

      toast({ title: "Success", description: "Content deleted successfully" });
      fetchContent();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedContent(null);
    }
  };

  if (!session) {
    return null;
  }

  const getContentIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="h-4 w-4" />;
      case "quiz":
      case "assignment":
        return <FileQuestion className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case "video":
        return "default";
      case "quiz":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content Management</h1>
          <p className="text-muted-foreground">Manage all course content and materials</p>
        </div>

        <div className="grid gap-6">
          {Object.keys(contentByCourse).length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No content found. Create courses first.</p>
              </CardContent>
            </Card>
          ) : (
            Object.entries(contentByCourse).map(([courseTitle, items]: [string, any]) => (
              <Card key={courseTitle}>
                <CardHeader>
                  <CardTitle>{courseTitle}</CardTitle>
                  <CardDescription>{items.length} content items</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {items.map((item: any) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            {getContentIcon(item.content_type)}
                          </div>
                          <div>
                            <h4 className="font-medium">{item.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {item.description || "No description"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={getTypeBadgeVariant(item.content_type)}>
                            {item.content_type}
                          </Badge>
                          {item.duration_minutes && (
                            <span className="text-sm text-muted-foreground">
                              {item.duration_minutes} min
                            </span>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedContent(item);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the content item "{selectedContent?.title}".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
