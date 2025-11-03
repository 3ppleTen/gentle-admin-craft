import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Session } from "@supabase/supabase-js";
import { Search, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Discussions() {
  const [session, setSession] = useState<Session | null>(null);
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
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
      fetchDiscussions();
    }
  }, [session]);

  const fetchDiscussions = async () => {
    const { data } = await supabase
      .from("discussions")
      .select("*, courses(title), profiles(full_name, email)")
      .order("created_at", { ascending: false });

    setDiscussions(data || []);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this discussion?")) return;

    try {
      const { error } = await supabase
        .from("discussions")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Discussion deleted successfully",
      });

      fetchDiscussions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredDiscussions = discussions.filter((discussion) =>
    discussion.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    discussion.courses?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    discussion.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!session) {
    return null;
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Discussion Management</h1>
          <p className="text-muted-foreground">Monitor and manage course discussions</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Discussions</CardTitle>
            <CardDescription>
              <div className="flex items-center gap-2 mt-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search discussions..."
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
                  <TableHead>Title</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDiscussions.map((discussion) => (
                  <TableRow key={discussion.id}>
                    <TableCell className="font-medium">{discussion.title}</TableCell>
                    <TableCell>{discussion.courses?.title}</TableCell>
                    <TableCell>{discussion.profiles?.full_name || discussion.profiles?.email}</TableCell>
                    <TableCell>{discussion.content?.substring(0, 50)}...</TableCell>
                    <TableCell>{new Date(discussion.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(discussion.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
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
