import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import StudentDashboard from "./pages/StudentDashboard";
import Users from "./pages/Users";
import Instructors from "./pages/Instructors";
import Courses from "./pages/Courses";
import Content from "./pages/Content";
import Resources from "./pages/Resources";
import Quizzes from "./pages/Quizzes";
import Enrollments from "./pages/Enrollments";
import Progress from "./pages/Progress";
import Reviews from "./pages/Reviews";
import Discussions from "./pages/Discussions";
import Certificates from "./pages/Certificates";
import Performance from "./pages/Performance";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/student-dashboard" element={<StudentDashboard />} />
          <Route path="/users" element={<Users />} />
          <Route path="/instructors" element={<Instructors />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/content" element={<Content />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/quizzes" element={<Quizzes />} />
          <Route path="/enrollments" element={<Enrollments />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/discussions" element={<Discussions />} />
          <Route path="/certificates" element={<Certificates />} />
          <Route path="/performance" element={<Performance />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
