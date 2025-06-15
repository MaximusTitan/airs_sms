import { FormBuilder } from "@/components/forms/form-builder";

export default function NewFormPage() {
  return (
    <div className="p-6 min-h-full">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            Create New Form
          </h1>
          <p className="text-muted-foreground">
            Build a custom form to collect leads
          </p>
        </div>
        
        <FormBuilder />
      </div>
    </div>
  );
}
