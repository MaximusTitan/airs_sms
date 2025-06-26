import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

interface ImportLead {
  name?: string;
  email?: string;
  phone?: string;
  source?: string;
  status?: string;
  notes?: string;
  form_data?: Record<string, unknown>;
}

interface ProcessedLead {
  name: string;
  email: string | null;
  phone: string;
  source: string;
  status: string;
  notes: string;
  form_data: Record<string, unknown>;
}

interface LeadForInsertion {
  name: string;
  email: string | null;
  phone: string | null;
  source: string;
  status: string;
  notes: string | null;
  form_data: Record<string, unknown>;
  form_id: string;
  user_id: string;
  tags: string[];
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { leads, formId: selectedFormId } = await request.json();

    if (!leads || !Array.isArray(leads)) {
      return NextResponse.json({ error: "Invalid leads data" }, { status: 400 });
    }

    let formId = selectedFormId;

    // Check if a default CSV import form exists - no user restriction
    if (!formId || formId === 'new') {
      const { data: existingForm } = await supabase
        .from('forms')
        .select('id')
        .eq('name', 'CSV Import')
        .single();

      formId = existingForm?.id;

      if (!formId) {
        const { data: newForm, error: formError } = await supabase
          .from('forms')
          .insert({
            name: 'CSV Import',
            description: 'Default form for CSV imported leads - supports multi-line data',
            fields: [
              {
                id: randomUUID(),
                type: 'text',
                label: 'Name',
                required: true,
                placeholder: 'Enter full name'
              },
              {
                id: randomUUID(),
                type: 'email',
                label: 'Email',
                required: true,
                placeholder: 'Enter email address'
              },
              {
                id: randomUUID(),
                type: 'tel',
                label: 'Phone',
                required: false,
                placeholder: 'Enter phone number'
              },
              {
                id: randomUUID(),
                type: 'textarea',
                label: 'Additional Data',
                required: false,
                placeholder: 'All other CSV fields will be stored here as multi-line data'
              }
            ],
            user_id: user.id
          })
          .select('id, fields')
          .single();

        if (formError) {
          console.error('Error creating form:', formError);
          return NextResponse.json({ error: "Failed to create form" }, { status: 500 });
        }

        formId = newForm.id;
      }
    }    // Group leads by name and merge data
    const leadsByName = new Map<string, ProcessedLead>();
    
    // Create a mapping from header names to field IDs for form_data
    const headerToFieldId = new Map<string, string>();
    
    leads.forEach((lead: ImportLead) => {
      const name = lead.name?.trim() || 'Unknown';
      
      if (leadsByName.has(name)) {
        // Merge with existing lead
        const existing = leadsByName.get(name)!;
        
        // Merge emails (combine and deduplicate)
        const allEmails = new Set<string>();
        if (existing.email && existing.email !== '-' && existing.email !== null) {
          String(existing.email).split(',').forEach((e: string) => {
            const trimmed = e.trim();
            if (trimmed && trimmed !== '-') allEmails.add(trimmed);
          });
        }
        if (lead.email && lead.email !== '-' && lead.email !== null) {
          String(lead.email).split(',').forEach((e: string) => {
            const trimmed = e.trim();
            if (trimmed && trimmed !== '-') allEmails.add(trimmed);
          });
        }
        existing.email = allEmails.size > 0 ? Array.from(allEmails).join(', ') : null;
        
        // Merge phones (combine and deduplicate)
        const allPhones = new Set<string>();
        if (existing.phone && existing.phone !== '-') {
          existing.phone.split(',').forEach((p: string) => {
            const trimmed = p.trim();
            if (trimmed && trimmed !== '-') allPhones.add(trimmed);
          });
        }
        if (lead.phone && lead.phone !== '-') {
          lead.phone.split(',').forEach((p: string) => {
            const trimmed = p.trim();
            if (trimmed && trimmed !== '-') allPhones.add(trimmed);
          });
        }
        existing.phone = allPhones.size > 0 ? Array.from(allPhones).join(', ') : '-';
        
        // Merge notes with line breaks (textarea style)
        const allNotes: string[] = [];
        if (existing.notes && existing.notes !== '-') {
          existing.notes.split('\n').forEach((note: string) => {
            const trimmed = note.trim();
            if (trimmed && trimmed !== '-') allNotes.push(trimmed);
          });
        }
        if (lead.notes && lead.notes !== '-') {
          lead.notes.split('\n').forEach((note: string) => {
            const trimmed = note.trim();
            if (trimmed && trimmed !== '-') allNotes.push(trimmed);
          });
        }
        // Remove duplicates while preserving order
        const uniqueNotes = Array.from(new Set(allNotes));
        existing.notes = uniqueNotes.length > 0 ? uniqueNotes.join('\n') : '-';
        
        // Merge form_data - convert headers to field IDs
        Object.keys(lead.form_data || {}).forEach(headerKey => {
          // Generate or get existing field ID for this header
          if (!headerToFieldId.has(headerKey)) {
            headerToFieldId.set(headerKey, randomUUID());
          }
          const fieldId = headerToFieldId.get(headerKey)!;
          
          const newValue = lead.form_data ? lead.form_data[headerKey] : undefined;
          const existingValue = existing.form_data[fieldId];
          const lowerKey = headerKey.toLowerCase();
          
          // Handle emails and phones separately (already handled above)
          if (lowerKey.includes('email') || lowerKey.includes('phone') || lowerKey.includes('mobile') || lowerKey.includes('tel')) {
            if (!existingValue || existingValue === '-') {
              existing.form_data[fieldId] = newValue || '-';
            }
            return;
          }
          
          // For all other fields, treat as textarea and merge with line breaks
          if (!newValue || newValue.toString().trim() === '' || newValue === '-') {
            // If new value is empty, keep existing or set to "-"
            if (!existingValue || existingValue === '-') {
              existing.form_data[fieldId] = '-';
            }
          } else {
            // If new value exists
            if (!existingValue || existingValue === '-') {
              existing.form_data[fieldId] = newValue;
            } else {
              // Merge values with line breaks (textarea style)
              const existingLines = existingValue.toString().split('\n').map((line: string) => line.trim()).filter((line: string) => line && line !== '-');
              const newLines = newValue.toString().split('\n').map((line: string) => line.trim()).filter((line: string) => line && line !== '-');
              
              // Combine and deduplicate lines
              const allLines = new Set([...existingLines, ...newLines]);
              existing.form_data[fieldId] = allLines.size > 0 ? Array.from(allLines).join('\n') : '-';
            }
          }
        });
        
        // Use the highest priority status
        const statusPriority = { 'qualified': 3, 'unqualified': 2, 'trash': 1 };
        const existingPriority = statusPriority[existing.status as keyof typeof statusPriority] || 0;
        const newPriority = statusPriority[(lead.status || 'unqualified') as keyof typeof statusPriority] || 0;
        if (newPriority > existingPriority) {
          existing.status = lead.status || 'unqualified';
        }
        
        // Keep other fields if they're empty in existing
        if ((!existing.source || existing.source === '-') && lead.source) existing.source = lead.source;
        
      } else {
        // Create new lead entry - convert headers to field IDs for form_data
        const processedFormData: Record<string, unknown> = {};
        Object.keys(lead.form_data || {}).forEach(headerKey => {
          // Generate field ID for this header
          if (!headerToFieldId.has(headerKey)) {
            headerToFieldId.set(headerKey, randomUUID());
          }
          const fieldId = headerToFieldId.get(headerKey)!;
          const value = lead.form_data ? lead.form_data[headerKey] : undefined;
          processedFormData[fieldId] = value || '-';
        });
        
        leadsByName.set(name, {
          name: name,
          email: lead.email || '-',
          phone: lead.phone || '-',
          source: lead.source || 'CSV Import',
          status: ['qualified', 'unqualified', 'trash'].includes(lead.status || '') ? (lead.status || 'unqualified') : 'unqualified',
          notes: lead.notes || '-',
          form_data: processedFormData
        });
      }
    });    // Prepare leads data for insertion
    const leadsToInsert = Array.from(leadsByName.values()).map((lead: ProcessedLead): LeadForInsertion => ({
      name: lead.name === 'Unknown' ? `Import_${Date.now()}` : lead.name,
      email: lead.email === '-' ? null : lead.email,
      phone: lead.phone === '-' ? null : lead.phone,
      source: lead.source || 'CSV Import',
      status: lead.status,
      notes: lead.notes === '-' ? null : lead.notes,
      form_data: {
        ...lead.form_data,
        // Store the header mapping for reference
        _csv_header_mapping: Object.fromEntries(
          Array.from(headerToFieldId.entries()).map(([header, fieldId]) => [fieldId, header])
        )
      },
      form_id: formId,
      user_id: user.id,
      tags: []
    }));

    // Filter out leads with completely missing data
    const validLeads = leadsToInsert.filter(lead => {
      const hasValidEmail = lead.email && lead.email !== '' && lead.email !== '-';
      const hasValidName = lead.name && !lead.name.startsWith('Import_') && lead.name.trim() !== '';
      const hasFormData = lead.form_data && Object.keys(lead.form_data).length > 1; // More than just header mapping
      
      // Prioritize name (as requested), but accept if has email or meaningful form data
      return hasValidName || hasValidEmail || hasFormData;
    });if (validLeads.length === 0) {
      return NextResponse.json({ error: "No valid leads to import. Please ensure your CSV contains meaningful data." }, { status: 400 });
    }

    // Insert leads in batches to avoid timeout
    const batchSize = 100;
    let imported = 0;
    let errors = 0;

    for (let i = 0; i < validLeads.length; i += batchSize) {
      const batch = validLeads.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('leads')
        .insert(batch)
        .select('id');

      if (error) {
        console.error('Error inserting batch:', error);
        errors += batch.length;
      } else {
        imported += data?.length || 0;
      }
    }    return NextResponse.json({ 
      imported,
      errors,
      total: validLeads.length,
      originalRows: leads.length,
      uniqueLeads: leadsByName.size,
      message: `Successfully imported ${imported} unique leads from ${leads.length} data rows${errors > 0 ? ` with ${errors} errors` : ''}`
    });

  } catch (error) {
    console.error('Error importing leads:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
