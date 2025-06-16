import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PublicFormRenderer } from "@/components/forms/public-form-renderer";
import Image from "next/image";

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
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-2xl mx-auto px-4">        <div className="bg-card rounded-lg shadow-lg p-8 border">          {/* Logo Section */}
          <div className="flex justify-center mb-6">
            <Image 
              src="https://urjcavadwlpthjfeuvtk.supabase.co/storage/v1/object/public/logo//airs-logo-new-1.avif"
              alt="AIRS Logo"
              width={200}
              height={48}
              className="h-12 w-auto"
              priority
            />
          </div>
          
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {form.name}
            </h1>
            {form.description && (
              <p className="text-muted-foreground">
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
