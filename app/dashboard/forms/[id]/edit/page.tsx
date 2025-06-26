import { createClient } from "@/lib/supabase/server";
import { FormBuilder } from "@/components/forms/form-builder";
import { notFound } from "next/navigation";

interface EditFormPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditFormPage({ params }: EditFormPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }
  // Fetch the form to edit - no user restriction
  const { data: form, error } = await supabase
    .from('forms')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !form) {
    notFound();
  }  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            Edit Form
          </h1>
          <p className="text-muted-foreground">
            Update your form to collect leads
          </p>
        </div>
        
        <FormBuilder initialForm={form} />
      </div>
    </div>
  );
}
