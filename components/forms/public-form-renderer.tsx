"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Form, FormField } from "@/lib/types/database";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle } from "lucide-react";

interface PublicFormRendererProps {
  form: Form;
}

export function PublicFormRenderer({ form }: PublicFormRendererProps) {
  const supabase = createClient();
  const [formData, setFormData] = useState<Record<string, string | boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const handleFieldChange = (fieldId: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    if (errors[fieldId]) {
      setErrors(prev => ({ ...prev, [fieldId]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    form.fields.forEach(field => {
      if (field.required && !formData[field.id]) {
        newErrors[field.id] = `${field.label} is required`;
      }
      
      if (field.type === 'email' && formData[field.id] && typeof formData[field.id] === 'string') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData[field.id] as string)) {
          newErrors[field.id] = 'Please enter a valid email address';
        }
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // Extract name and email from form data
      const nameField = form.fields.find(f => f.type === 'text' && f.label.toLowerCase().includes('name'));
      const emailField = form.fields.find(f => f.type === 'email');
      const phoneField = form.fields.find(f => f.type === 'phone');
      
      const leadData = {
        name: nameField ? formData[nameField.id] : 'Unknown',
        email: emailField ? formData[emailField.id] : '',
        phone: phoneField ? formData[phoneField.id] : null,
        form_id: form.id,
        user_id: form.user_id,
        form_data: formData,
        status: 'unqualified' as const,
        source: 'web_form',
        tags: [],
      };

      const { error } = await supabase
        .from('leads')
        .insert([leadData]);

      if (error) throw error;

      setIsSubmitted(true);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: FormField) => {
    const error = errors[field.id];
    
    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <div key={field.id}>            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label><Input
              id={field.id}
              type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
              placeholder={field.placeholder}
              value={typeof formData[field.id] === 'string' ? formData[field.id] as string : ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              className={error ? 'border-destructive' : ''}
            />
            {error && <p className="text-destructive text-sm mt-1">{error}</p>}
          </div>
        );
          case 'textarea':        return (
          <div key={field.id}>
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Textarea
              id={field.id}
              placeholder={field.placeholder}
              value={typeof formData[field.id] === 'string' ? formData[field.id] as string : ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              className={error ? 'border-destructive' : ''}
              rows={4}
            />
            {error && <p className="text-destructive text-sm mt-1">{error}</p>}
          </div>
        );
          case 'select':
        return (
          <div key={field.id}>
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Select
              value={typeof formData[field.id] === 'string' ? formData[field.id] as string : ''}
              onValueChange={(value) => handleFieldChange(field.id, value)}
            >
              <SelectTrigger className={error ? 'border-destructive' : ''}>
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map(option => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error && <p className="text-destructive text-sm mt-1">{error}</p>}
          </div>
        );
        
      case 'checkbox':
        return (
          <div key={field.id} className="flex items-center space-x-2">            <Checkbox
              id={field.id}
              checked={typeof formData[field.id] === 'boolean' ? formData[field.id] as boolean : false}
              onCheckedChange={(checked) => handleFieldChange(field.id, checked as boolean)}
            />            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {error && <p className="text-destructive text-sm mt-1">{error}</p>}
          </div>
        );
        
      default:
        return null;
    }
  };
  if (isSubmitted) {
    return (
      <div className="text-center py-8">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Thank you!
        </h2>
        <p className="text-muted-foreground">
          Your information has been submitted successfully. We&apos;ll get back to you soon.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {form.fields.map(renderField)}
      
      <Button 
        type="submit" 
        disabled={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </Button>
    </form>
  );
}
