import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PublicFormRenderer } from "@/components/forms/public-form-renderer";

interface FormPageProps {
  params: Promise<{ id: string }>;
}

export default async function FormPage({ params }: FormPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: form } = await supabase
    .from('forms')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (!form) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {form.name}
            </h1>
            {form.description && (
              <p className="text-gray-600 dark:text-gray-400">
                {form.description}
              </p>
            )}
          </div>
          
          <PublicFormRenderer form={form} />
        </div>
      </div>
    </div>
  );
}
