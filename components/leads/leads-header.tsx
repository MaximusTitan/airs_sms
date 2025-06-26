"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Mail, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { LeadStatus, FormField } from "@/lib/types/database";

// UUID generation helper
const randomUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

interface LeadsHeaderProps {
  selectedLeads?: string[];
}

export function LeadsHeader({ selectedLeads = [] }: LeadsHeaderProps) {
  const router = useRouter();
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [importStep, setImportStep] = useState<'upload' | 'form-selection' | 'mapping'>('upload');
  const [selectedFormId, setSelectedFormId] = useState<string>('');
  const [availableForms, setAvailableForms] = useState<Array<{id: string, name: string, fields: FormField[]}>>([]);
  const [selectedFormFields, setSelectedFormFields] = useState<FormField[]>([]);

  const handleSendEmail = () => {
    if (selectedLeads.length > 0) {
      const leadIds = selectedLeads.join(',');
      router.push(`/dashboard/emails/compose?leads=${leadIds}`);
    } else {
      router.push('/dashboard/emails/compose');
    }
  };

  const createGroup = async () => {
    if (!groupName.trim() || selectedLeads.length === 0) return;

    setIsCreatingGroup(true);
    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: groupName,
          description: groupDescription,
          leadIds: selectedLeads,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create group');
      }

      // Reset form and close dialog
      setGroupName("");
      setGroupDescription("");
      setIsCreateGroupOpen(false);
      
      // Optionally show success message or redirect
      alert('Group created successfully!');
      window.location.reload();
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Failed to create group');
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const updateBulkStatus = async (newStatus: LeadStatus) => {
    setIsUpdating(true);
    try {
      const response = await fetch('/api/leads/bulk-update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ leadIds: selectedLeads, status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update statuses');
      }

      window.location.reload();
    } catch (error) {
      console.error('Error updating lead statuses:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'qualified':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'unqualified':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'trash':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  // Fetch available forms
  const fetchForms = async () => {
    try {
      const response = await fetch('/api/forms');
      if (response.ok) {
        const data = await response.json();
        setAvailableForms(data.forms || []);
      }
    } catch (error) {
      console.error('Error fetching forms:', error);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      
      // Advanced CSV parsing that handles quoted fields and multi-line cells
      const parseCSV = (csvText: string): string[][] => {
        const rows: string[][] = [];
        let currentRow: string[] = [];
        let currentCell = '';
        let inQuotes = false;
        let i = 0;
        
        while (i < csvText.length) {
          const char = csvText[i];
          const nextChar = csvText[i + 1];
          
          if (char === '"') {
            if (inQuotes && nextChar === '"') {
              // Handle escaped quotes ("")
              currentCell += '"';
              i += 2;
              continue;
            } else {
              // Toggle quote state
              inQuotes = !inQuotes;
            }
          } else if (char === ',' && !inQuotes) {
            // End of cell
            // Process multi-line content: join with space and clean up
            const processedCell = currentCell
              .split(/\r?\n/)
              .map(line => line.trim())
              .filter(line => line.length > 0)
              .join(' ')
              .trim();
            
            currentRow.push(processedCell);
            currentCell = '';
          } else if ((char === '\n' || char === '\r') && !inQuotes) {
            // End of row (only if not inside quotes)
            // Process the last cell of the row
            const processedCell = currentCell
              .split(/\r?\n/)
              .map(line => line.trim())
              .filter(line => line.length > 0)
              .join(' ')
              .trim();
            
            currentRow.push(processedCell);
            
            // Add row if it has content
            if (currentRow.some(cell => cell.length > 0)) {
              rows.push(currentRow);
            }
            
            currentRow = [];
            currentCell = '';
            
            // Skip \r\n combinations
            if (char === '\r' && nextChar === '\n') {
              i++;
            }
          } else {
            // Regular character
            currentCell += char;
          }
          
          i++;
        }
        
        // Handle last cell and row
        if (currentCell.length > 0 || currentRow.length > 0) {
          const processedCell = currentCell
            .split(/\r?\n/)
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .join(' ')
            .trim();
          
          currentRow.push(processedCell);
          
          if (currentRow.some(cell => cell.length > 0)) {
            rows.push(currentRow);
          }
        }
        
        return rows;
      };
      
      const rows = parseCSV(text);
      
      setCsvData(rows);
      setImportStep('form-selection');
      
      // Fetch available forms for selection
      fetchForms();
    };
    
    reader.readAsText(file);
  };

  const handleFormSelection = (formId: string) => {
    setSelectedFormId(formId);
    
    if (formId === 'new') {
      // Create new form - use basic mapping
      setSelectedFormFields([]);
      initializeColumnMapping([]);
    } else {
      // Use existing form
      const selectedForm = availableForms.find(form => form.id === formId);
      if (selectedForm) {
        setSelectedFormFields(selectedForm.fields || []);
        initializeColumnMapping(selectedForm.fields || []);
      }
    }
    
    setImportStep('mapping');
  };

  const initializeColumnMapping = (formFields: FormField[]) => {
    // Initialize column mapping with smart defaults based on form fields
    const headers = csvData[0] || [];
    const mapping: Record<string, string> = {};
    
    headers.forEach(header => {
      const lowerHeader = header.toLowerCase();
      
      // Try to match with existing form fields first
      const matchingField = formFields.find(field => 
        field.label.toLowerCase().includes(lowerHeader) ||
        lowerHeader.includes(field.label.toLowerCase()) ||
        (field.type === 'email' && lowerHeader.includes('email')) ||
        (field.type === 'phone' && (lowerHeader.includes('phone') || lowerHeader.includes('mobile')))
      );
      
      if (matchingField) {
        mapping[header] = matchingField.id;
      } else {
        // Fallback to basic field matching
        if (lowerHeader.includes('name') || lowerHeader.includes('full')) {
          mapping[header] = 'name';
        } else if (lowerHeader.includes('email')) {
          mapping[header] = 'email';
        } else if (lowerHeader.includes('phone')) {
          mapping[header] = 'phone';
        } else if (lowerHeader.includes('source')) {
          mapping[header] = 'source';
        } else if (lowerHeader.includes('note')) {
          mapping[header] = 'notes';
        } else if (lowerHeader.includes('status')) {
          mapping[header] = 'status';
        }
      }
    });
    
    setColumnMapping(mapping);
  };

  const handleImport = async () => {
    if (!csvData.length || !csvFile) return;

    setIsImporting(true);
    try {
      const headers = csvData[0];
      const dataRows = csvData.slice(1);
      
      const leads = dataRows.map((row: string[]) => {
        const lead: {
          name: string;
          email: string;
          phone: string | null;
          source: string;
          status: string;
          notes: string | null;
          form_data: Record<string, unknown>;
        } = {
          name: '',
          email: '',
          phone: null,
          source: 'CSV Import',
          status: 'unqualified',
          notes: null,
          form_data: {}
        };
        
        // Collect all emails and phones from the row
        const allEmails: string[] = [];
        const allPhones: string[] = [];
        
        // Store header mapping for reference
        const headerMapping: Record<string, string> = {};

        headers.forEach((header, index) => {
          let value = row[index]?.toString().trim() || '';
          const mappedField = columnMapping[header];
          const lowerHeader = header.toLowerCase();
          
          // Multi-line content is already processed during CSV parsing (joined with space)
          // Just clean up any remaining whitespace issues
          value = value.replace(/\s+/g, ' ').trim();
          
          // If value is empty, set to "-" placeholder for consistency
          if (!value || value.trim() === '') {
            value = '-';
          }

          // Handle mapped fields
          if (mappedField && ['name', 'email', 'phone', 'source', 'notes', 'status'].includes(mappedField)) {
            if (mappedField === 'status' && !['qualified', 'unqualified', 'trash'].includes(value.toLowerCase())) {
              lead[mappedField] = 'unqualified';
            } else if (mappedField === 'email') {
              // Extract all emails from this field and combine with existing
              const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
              const emails = value.match(emailRegex) || [value];
              emails.forEach((email: string) => {
                if (!allEmails.includes(email.trim())) {
                  allEmails.push(email.trim());
                }
              });
            } else if (mappedField === 'phone') {
              // Extract all phones from this field and combine with existing
              const phoneRegex = /[\+]?[0-9\s\-\(\)\.]{7,}/g;
              const phones = value.match(phoneRegex) || [value];
              phones.forEach((phone: string) => {
                const cleanPhone = phone.replace(/[^\d\+]/g, '');
                if (cleanPhone.length >= 7 && !allPhones.includes(cleanPhone)) {
                  allPhones.push(cleanPhone);
                }
              });
            } else {
              // Type-safe assignment to lead fields
              if (mappedField === 'name') {
                lead.name = value || '-';
              } else if (mappedField === 'email') {
                lead.email = value || '-';
              } else if (mappedField === 'phone') {
                lead.phone = value || '-';
              } else if (mappedField === 'source') {
                lead.source = value || 'CSV Import';
              } else if (mappedField === 'status') {
                lead.status = value || 'unqualified';
              } else if (mappedField === 'notes') {
                lead.notes = value || '-';
              }
            }
          }
          // Handle mapping to existing form fields (use UUID keys)
          else if (mappedField && selectedFormFields.some(f => f.id === mappedField)) {
            const fieldId = mappedField;
            lead.form_data[fieldId] = value;
            headerMapping[fieldId] = header;
          }
          // Auto-detect emails and phones even if not explicitly mapped
          else if (lowerHeader.includes('email') || (value !== '-' && value.includes('@'))) {
            // Check if value looks like an email and is not the placeholder
            if (value !== '-') {
              const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
              const emails = value.match(emailRegex) || [];
              emails.forEach((email: string) => {
                if (!allEmails.includes(email.trim())) {
                  allEmails.push(email.trim());
                }
              });
            }
            
            // Store in form_data with UUID key
            const fieldId = randomUUID();
            lead.form_data[fieldId] = value;
            headerMapping[fieldId] = header;
          }
          else if (lowerHeader.includes('phone') || lowerHeader.includes('mobile') || lowerHeader.includes('tel')) {
            // Extract phone numbers if not placeholder
            if (value !== '-') {
              const phoneRegex = /[\+]?[0-9\s\-\(\)\.]{7,}/g;
              const phones = value.match(phoneRegex) || [];
              phones.forEach((phone: string) => {
                const cleanPhone = phone.replace(/[^\d\+]/g, '');
                if (cleanPhone.length >= 7 && !allPhones.includes(cleanPhone)) {
                  allPhones.push(cleanPhone);
                }
              });
            }
            
            // Store in form_data with UUID key
            const fieldId = randomUUID();
            lead.form_data[fieldId] = value;
            headerMapping[fieldId] = header;
          }
          else {
            // Store all other fields in form_data with UUID keys
            const fieldId = randomUUID();
            lead.form_data[fieldId] = value;
            headerMapping[fieldId] = header;
            
            // Auto-detect name if not mapped
            if (!lead.name && (lowerHeader.includes('name') || lowerHeader.includes('full'))) {
              lead.name = value;
            }
          }
        });
        
        // Store header mapping for reference
        if (Object.keys(headerMapping).length > 0) {
          lead.form_data['_csv_header_mapping'] = headerMapping;
        }
        
        // Combine all emails and phones with commas, or use "-" if none found
        if (allEmails.length > 0) {
          lead.email = allEmails.join(', ');
        } else {
          lead.email = '-';
        }
        if (allPhones.length > 0) {
          lead.phone = allPhones.join(', ');
        } else {
          lead.phone = '-';
        }

        // Ensure we have at least a name (try to extract from any field if needed)
        if (!lead.name || lead.name === '-') {
          // Try to find name from form_data
          const nameFields = Object.entries(lead.form_data).find(([key, value]) => {
            if (key === '_csv_header_mapping') return false;
            const header = headerMapping[key] || '';
            return header.toLowerCase().includes('name') && typeof value === 'string' && value.trim() && value !== '-';
          });
          if (nameFields && typeof nameFields[1] === 'string') {
            lead.name = nameFields[1];
          }
        }
        
        return lead;
      }).filter((lead) => {
        // Filter based on name primarily (as requested)
        const hasName = lead.name && lead.name.trim() && lead.name !== '-' && lead.name !== 'Unknown';
        const hasEmail = lead.email && lead.email.trim() && lead.email !== '-';
        const hasFormData = lead.form_data && Object.keys(lead.form_data).length > 1; // More than just the mapping
        
        // Prioritize name, but accept if has email or meaningful form data
        return hasName || hasEmail || hasFormData;
      });

      console.log('Processed leads:', leads); // Debug log

      if (leads.length === 0) {
        alert('No valid leads found. Please ensure your CSV has name columns or meaningful data.');
        return;
      }

      const response = await fetch('/api/leads/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          leads,
          formId: selectedFormId === 'new' ? null : selectedFormId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to import leads');
      }

      const result = await response.json();
      alert(`Successfully imported ${result.imported} unique leads from ${csvData.length - 1} data rows! ${result.uniqueLeads} unique names were processed and data was merged by name.`);
      
      // Reset the import state
      resetImport();
      setIsImportOpen(false);
      
      // Reload the page to show new leads
      window.location.reload();
    } catch (error) {
      console.error('Error importing leads:', error);
      alert('Failed to import leads. Please try again.');
    } finally {
      setIsImporting(false);
    }
  };

  const resetImport = () => {
    setCsvFile(null);
    setCsvData([]);
    setColumnMapping({});
    setImportStep('upload');
    setSelectedFormId('');
    setAvailableForms([]);
    setSelectedFormFields([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Leads
          </h1>
          <p className="text-muted-foreground text-lg">
            Manage and track your leads
          </p>
        </div>          <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="flex items-center gap-2 border-border hover:bg-accent"
            onClick={handleSendEmail}
          >
            <Mail className="h-4 w-4" />
            Send Email
            {selectedLeads.length > 0 && (
              <span className="ml-1 text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5">
                {selectedLeads.length}
              </span>
            )}
          </Button>
          
          {selectedLeads.length > 0 && (
            <>
              <div className="flex items-center gap-3 px-3 py-2 bg-primary/5 rounded-md border border-primary/20">
                <span className="text-sm text-primary font-medium">
                  {selectedLeads.length} lead{selectedLeads.length !== 1 ? 's' : ''} selected
                </span>
              </div>
              
              <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Create Group
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Create New Group</DialogTitle>
                    <DialogDescription>
                      Create a new group with the selected {selectedLeads.length} lead{selectedLeads.length !== 1 ? 's' : ''}.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">
                        Name
                      </Label>
                      <Input
                        id="name"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        className="col-span-3"
                        placeholder="Enter group name"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="description" className="text-right">
                        Description
                      </Label>
                      <Textarea
                        id="description"
                        value={groupDescription}
                        onChange={(e) => setGroupDescription(e.target.value)}
                        className="col-span-3"
                        placeholder="Enter group description (optional)"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsCreateGroupOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="button" 
                      onClick={createGroup}
                      disabled={!groupName.trim() || isCreatingGroup}
                    >
                      {isCreatingGroup ? 'Creating...' : 'Create Group'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              <Select onValueChange={(value) => updateBulkStatus(value as LeadStatus)} disabled={isUpdating}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Update Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unqualified">
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs ${getStatusColor('unqualified')}`}>
                        unqualified
                      </Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="qualified">
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs ${getStatusColor('qualified')}`}>
                        qualified
                      </Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="trash">
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs ${getStatusColor('trash')}`}>
                        trash
                      </Badge>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </>
          )}
        </div>
        
        <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              Import CSV
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Import Leads from CSV</DialogTitle>
              <DialogDescription>
                {importStep === 'upload' && "Upload a CSV file to import leads"}
                {importStep === 'form-selection' && "Select a form to map your CSV data"}
                {importStep === 'mapping' && "Map CSV columns to lead fields"}
              </DialogDescription>
            </DialogHeader>
            
            {importStep === 'upload' && (
              <div className="py-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="csv-file">CSV File</Label>
                    <Input
                      id="csv-file"
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="mt-1"
                    />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium mb-2">CSV Import Guidelines:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>First row should contain column headers</li>
                      <li>Multiple emails/phones can be comma-separated</li>
                      <li>Data in cells with line breaks will be treated as single values</li>
                      <li>Empty cells will be imported as &quot;-&quot;</li>
                      <li>All rows with the same name will be merged into one lead</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
            
            {importStep === 'form-selection' && (
              <div className="py-4">
                <div className="space-y-4">
                  <div>
                    <Label>Select Form for Mapping</Label>
                    <Select onValueChange={handleFormSelection}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Choose a form to map CSV columns..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">Create New Form (Basic Mapping)</SelectItem>
                        {availableForms
                          .filter(form => form.id && form.id.trim() !== '')
                          .map((form) => (
                          <SelectItem key={form.id} value={form.id}>
                            {form.name} ({form.fields?.length || 0} fields)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {csvData.length > 0 && (
                    <div className="mt-4">
                      <Label className="text-sm font-medium">CSV Preview</Label>
                      <div className="mt-2 border rounded-md overflow-hidden">
                        <div className="bg-muted p-3 border-b">
                          <div className="text-sm font-medium">
                            {csvData.length - 1} data rows detected
                          </div>
                        </div>
                        <div className="p-3 max-h-32 overflow-y-auto">
                          <div className="text-xs text-muted-foreground space-y-1">
                            <div><strong>Headers:</strong> {csvData[0]?.join(', ')}</div>
                            {csvData[1] && (
                              <div><strong>Sample row:</strong> {csvData[1].join(', ')}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {importStep === 'mapping' && csvData.length > 0 && (
              <div className="py-4">
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Map your CSV columns to lead fields. Unmapped columns will be stored as additional form data.
                  </div>
                  
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {csvData[0]?.map((header) => (
                      <div key={header} className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <Label className="text-sm font-medium truncate block" title={header}>
                            {header}
                          </Label>
                          <div className="text-xs text-muted-foreground truncate" title={csvData[1]?.[csvData[0].indexOf(header)] || 'No sample data'}>
                            Sample: {csvData[1]?.[csvData[0].indexOf(header)] || `No sample data`}
                          </div>
                        </div>
                        <div className="flex-1">
                          <Select
                            value={columnMapping[header] || 'unmapped'}
                            onValueChange={(value) => 
                              setColumnMapping(prev => ({ 
                                ...prev, 
                                [header]: value === 'unmapped' ? '' : value 
                              }))
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select field..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unmapped">Don&apos;t map (store as form data)</SelectItem>
                              <SelectItem value="name">Name</SelectItem>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="phone">Phone</SelectItem>
                              <SelectItem value="source">Source</SelectItem>
                              <SelectItem value="notes">Notes</SelectItem>
                              <SelectItem value="status">Status</SelectItem>
                              
                              {selectedFormFields.length > 0 && (
                                <>
                                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                                    {availableForms.find(f => f.id === selectedFormId)?.name} Fields
                                  </div>
                                  {selectedFormFields
                                    .filter(field => field.id && field.id.trim() !== '')
                                    .map((field) => (
                                    <SelectItem key={field.id} value={field.id}>
                                      {field.label} ({field.type})
                                    </SelectItem>
                                  ))}
                                </>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            <DialogFooter className="flex gap-2">
              {importStep !== 'upload' && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (importStep === 'mapping') {
                      setImportStep('form-selection');
                    } else if (importStep === 'form-selection') {
                      setImportStep('upload');
                    }
                  }}
                >
                  Back
                </Button>
              )}
              
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetImport();
                  setIsImportOpen(false);
                }}
              >
                Cancel
              </Button>
              
              {importStep === 'mapping' && (
                <Button
                  type="button"
                  onClick={handleImport}
                  disabled={isImporting || !csvData.length}
                >
                  {isImporting ? 'Importing...' : `Import ${csvData.length - 1} Rows`}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
