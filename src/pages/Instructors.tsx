import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Session } from "@supabase/supabase-js";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Instructors() {
  const [session, setSession] = useState<Session | null>(null);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState<any>(null);
  const [formData, setFormData] = useState({
    expertise: "",
    qualifications: "",
    bio: "",
  });
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
      fetchInstructors();
    }
  }, [session]);

  const fetchInstructors = async () => {
    const { data } = await supabase
      .from("instructors")
      .select("*")
      .order("created_at", { ascending: false });

    setInstructors(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingInstructor) {
        const { error } = await supabase
          .from("instructors")
          .update(formData)
          .eq("id", editingInstructor.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Instructor updated successfully",
        });
      } else {
        const { error } = await supabase
          .from("instructors")
          .insert([{ ...formData, user_id: session?.user.id }]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Instructor created successfully",
        });
      }

      setDialogOpen(false);
      setEditingInstructor(null);
      setFormData({ expertise: "", qualifications: "", bio: "" });
      fetchInstructors();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (instructor: any) => {
    setEditingInstructor(instructor);
    setFormData({
      expertise: instructor.expertise || "",
      qualifications: instructor.qualifications || "",
      bio: instructor.bio || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this instructor?")) return;

    try {
      const { error } = await supabase
        .from("instructors")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Instructor deleted successfully",
      });

      fetchInstructors();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredInstructors = instructors.filter((instructor) =>
    instructor.expertise?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    instructor.qualifications?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!session) {
    return null;
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Instructor Management</h1>
            <p className="text-muted-foreground">Manage platform instructors</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingInstructor(null);
                setFormData({ expertise: "", qualifications: "", bio: "" });
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Add Instructor
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>{editingInstructor ? "Edit" : "Add"} Instructor</DialogTitle>
                  <DialogDescription>
                    {editingInstructor ? "Update" : "Create a new"} instructor profile
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="expertise">Expertise</Label>
                    <Input
                      id="expertise"
                      value={formData.expertise}
                      onChange={(e) => setFormData({ ...formData, expertise: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="qualifications">Qualifications</Label>
                    <Textarea
                      id="qualifications"
                      value={formData.qualifications}
                      onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">{editingInstructor ? "Update" : "Create"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Instructors</CardTitle>
            <CardDescription>
              <div className="flex items-center gap-2 mt-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search instructors..."
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
                  <TableHead>Expertise</TableHead>
                  <TableHead>Qualifications</TableHead>
                  <TableHead>Bio</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInstructors.map((instructor) => (
                  <TableRow key={instructor.id}>
                    <TableCell className="font-medium">{instructor.expertise}</TableCell>
                    <TableCell>{instructor.qualifications?.substring(0, 50)}...</TableCell>
                    <TableCell>{instructor.bio?.substring(0, 50)}...</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(instructor)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(instructor.id)}>
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
