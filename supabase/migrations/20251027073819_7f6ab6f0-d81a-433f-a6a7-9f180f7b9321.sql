-- Create content table for course materials
CREATE TABLE public.content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('video', 'pdf', 'assignment', 'quiz', 'reading')),
  file_url TEXT,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  duration_minutes INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on content
ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;

-- Create assessments/quiz scores table
CREATE TABLE public.assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  content_id UUID REFERENCES public.content(id) ON DELETE CASCADE,
  assessment_type TEXT NOT NULL CHECK (assessment_type IN ('quiz', 'assignment', 'exam', 'project')),
  score NUMERIC(5,2) CHECK (score >= 0 AND score <= 100),
  max_score NUMERIC(5,2) DEFAULT 100,
  topic TEXT,
  feedback TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on assessments
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

-- Create system_settings table
CREATE TABLE public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Enable RLS on system_settings
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Triggers for updated_at
CREATE TRIGGER update_content_updated_at
  BEFORE UPDATE ON public.content
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for content
CREATE POLICY "Anyone can view published course content"
  ON public.content FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = content.course_id
      AND (courses.status = 'published' OR courses.instructor_id = auth.uid())
    ) OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Instructors can manage their course content"
  ON public.content FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = content.course_id
      AND courses.instructor_id = auth.uid()
    ) OR public.has_role(auth.uid(), 'admin')
  );

-- RLS Policies for assessments
CREATE POLICY "Students can view their own assessments"
  ON public.assessments FOR SELECT
  USING (student_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'instructor'));

CREATE POLICY "Students can submit assessments"
  ON public.assessments FOR INSERT
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Instructors and admins can manage assessments"
  ON public.assessments FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'instructor'));

-- RLS Policies for system_settings
CREATE POLICY "Admins can manage system settings"
  ON public.system_settings FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Insert some default system settings
INSERT INTO public.system_settings (setting_key, setting_value, description)
VALUES 
  ('platform_name', '{"value": "EduAdmin"}', 'Platform display name'),
  ('enrollment_enabled', '{"value": true}', 'Enable student enrollments'),
  ('ai_reports_enabled', '{"value": true}', 'Enable AI-generated reports')
ON CONFLICT (setting_key) DO NOTHING;