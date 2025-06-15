"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/lib/types/database";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const fieldTypes = [
  { value: 'text', label: 'Text' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'select', label: 'Select' },
  { value: 'checkbox', label: 'Checkbox' },
] as const;

export function FormBuilder() {
  const router = useRouter();
  const supabase = createClient();
  
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [fields, setFields] = useState<FormField[]>([
    {
      id: crypto.randomUUID(),
      type: 'text',
      label: 'Name',
      placeholder: 'Enter your name',
      required: true,
    },
    {
      id: crypto.randomUUID(),
      type: 'email',
      label: 'Email',
      placeholder: 'Enter your email',
      required: true,
    },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addField = () => {
    const newField: FormField = {
      id: crypto.randomUUID(),
      type: 'text',
      label: 'New Field',
      placeholder: '',
      required: false,
    };
    setFields([...fields, newField]);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(fields.map(field => 
      field.id === id ? { ...field, ...updates } : field
    ));
  };

  const removeField = (id: string) => {
    setFields(fields.filter(field => field.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    setIsSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('forms')
        .insert([
          {
            name: formName,
            description: formDescription || null,
            fields,
            is_active: true,
            user_id: user.id,
          },
        ]);

      if (error) throw error;

      router.push('/dashboard/forms');
    } catch (error) {
      console.error('Error creating form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Form Details</h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="form-name">Form Name</Label>
            <Input
              id="form-name"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Enter form name"
              required
            />
          </div>
          <div>
            <Label htmlFor="form-description">Description (optional)</Label>
            <Input
              id="form-description"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Enter form description"
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Form Fields</h2>
          <Button type="button" onClick={addField} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Field
          </Button>
        </div>        <div className="space-y-4">
          {fields.map((field) => (
            <Card key={field.id} className="p-4">
              <div className="flex items-start gap-4">
                <GripVertical className="h-5 w-5 text-gray-400 mt-2" />
                
                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Field Type</Label>
                      <select
                        value={field.type}
                        onChange={(e) => updateField(field.id, { type: e.target.value as FormField['type'] })}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                      >
                        {fieldTypes.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <Label>Field Label</Label>
                      <Input
                        value={field.label}
                        onChange={(e) => updateField(field.id, { label: e.target.value })}
                        placeholder="Enter field label"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Placeholder</Label>
                    <Input
                      value={field.placeholder || ''}
                      onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                      placeholder="Enter placeholder text"
                    />
                  </div>

                  {field.type === 'select' && (
                    <div>
                      <Label>Options (one per line)</Label>
                      <textarea
                        value={(field.options || []).join('\n')}
                        onChange={(e) => updateField(field.id, { 
                          options: e.target.value.split('\n').filter(Boolean) 
                        })}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                        rows={3}
                        placeholder="Option 1&#10;Option 2&#10;Option 3"
                      />
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`required-${field.id}`}
                      checked={field.required}
                      onCheckedChange={(checked) => updateField(field.id, { required: checked as boolean })}
                    />
                    <Label htmlFor={`required-${field.id}`}>Required field</Label>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeField(field.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" disabled={isSubmitting || !formName.trim()}>
          {isSubmitting ? 'Creating...' : 'Create Form'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
