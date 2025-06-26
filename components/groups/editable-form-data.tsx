"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/lib/types/database";

interface EditableFormDataProps {
  formData: Record<string, string | boolean | number>;
  formFields?: FormField[];
  onDataChange: (updatedData: Record<string, string | boolean | number>) => void;
  isReadOnly?: boolean;
}

export function EditableFormData({
  formData,
  formFields,
  onDataChange,
  isReadOnly = false
}: EditableFormDataProps) {
  const [localData, setLocalData] = useState<Record<string, string | boolean | number>>(formData);

  useEffect(() => {
    setLocalData(formData);
  }, [formData]);

  const handleFieldChange = (key: string, value: string | boolean | number) => {
    const updatedData = { ...localData, [key]: value };
    setLocalData(updatedData);
    onDataChange(updatedData);
  };

  if (!formData || Object.keys(formData).length === 0) {
    return <span className="text-muted-foreground text-sm">No additional data</span>;
  }

  // Create a map of field IDs to field labels and types for quick lookup
  const fieldMap = formFields?.reduce((acc, field) => {
    if (field.id && field.label) {
      acc[field.id] = {
        label: field.label,
        type: field.type,
        options: field.options
      };
    }
    return acc;
  }, {} as Record<string, { label: string; type: string; options?: string[] }>) || {};

  // Get the CSV header mapping if it exists
  const headerMapping = (formData._csv_header_mapping as unknown as Record<string, string>) || {};
  
  // Look for nested header mapping (which contains the actual field ID to header name mapping)
  let actualHeaderMapping: Record<string, string> = {};
  
  // Find the nested mapping object that contains field_* keys
  for (const [key, value] of Object.entries(formData)) {
    if (key !== '_csv_header_mapping' && typeof value === 'object' && value !== null) {
      const nestedValue = value as Record<string, string>;
      // Check if this object contains field IDs as keys
      const hasFieldIds = Object.keys(nestedValue).some(k => k.startsWith('field_') || (k.length === 36 && k.includes('-')));
      if (hasFieldIds) {
        actualHeaderMapping = nestedValue;
        break;
      }
    }
  }

  // Fields to exclude from form data display (already shown in Lead Information)
  const excludeFields = new Set(['name', 'email', 'phone', 'full_name', 'fullname']);
  
  // Create better display labels for all keys
  const processedEntries = Object.entries(formData)
    .filter(([key]) => {
      // Exclude metadata and nested mapping objects
      return key !== '_csv_header_mapping' && 
             typeof formData[key] !== 'object';
    })
    .map(([key, value]) => {
      let displayLabel = '';
      let fieldType = 'text';
      let fieldOptions: string[] = [];
      
      // First priority: Check if this key is a form field ID and we have the form fields
      if (fieldMap[key]) {
        displayLabel = fieldMap[key].label;
        fieldType = fieldMap[key].type;
        fieldOptions = fieldMap[key].options || [];
      }
      // Second priority: Check the actual header mapping (nested object)
      else if (actualHeaderMapping[key]) {
        displayLabel = actualHeaderMapping[key];
      }
      // Third priority: Check the main CSV header mapping (UUID to field ID mapping)
      else if (headerMapping[key]) {
        // This maps UUID to field ID, so now look up that field ID in actualHeaderMapping
        const fieldId = headerMapping[key];
        if (actualHeaderMapping[fieldId]) {
          displayLabel = actualHeaderMapping[fieldId];
        } else {
          // Fallback to formatting the field ID
          displayLabel = String(fieldId)
            .replace(/[_-]/g, ' ')
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
        }
      }
      // Fourth priority: Check if it looks like a UUID (UUID keys from CSV import)
      else if (key.length === 36 && key.includes('-')) {
        // Try to find this UUID in the header mapping first
        const fieldId = headerMapping[key];
        if (fieldId && actualHeaderMapping[fieldId]) {
          displayLabel = actualHeaderMapping[fieldId];
        } else {
          // Fallback for orphaned UUID keys
          displayLabel = `Additional Field ${Object.keys(formData).filter(k => k !== '_csv_header_mapping' && typeof formData[k] !== 'object').indexOf(key) + 1}`;
        }
      }
      // Fifth priority: Use the key as is and format it nicely
      else {
        displayLabel = key
          .replace(/[_-]/g, ' ')
          .replace(/([a-z])([A-Z])/g, '$1 $2')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
      }
      
      return { key, value, displayLabel, fieldType, fieldOptions };
    });

  const filteredEntries = processedEntries.filter(({ displayLabel, key }) => {
    const lowerLabel = String(displayLabel).toLowerCase();
    const lowerKey = String(key).toLowerCase();
    
    // Exclude basic fields that are already shown in Lead Information
    const isBasicField = excludeFields.has(lowerLabel) ||
                        excludeFields.has(lowerKey) ||
                        lowerLabel.includes('name') ||
                        lowerLabel.includes('email') ||
                        lowerLabel.includes('phone') ||
                        lowerLabel.includes('full name');
    
    // Also exclude role/registered as field since it's shown in the Role column
    const isRoleField = lowerLabel.includes('role') || 
                       lowerLabel.includes('registered as') ||
                       lowerKey.includes('role');
    
    return !isBasicField && !isRoleField;
  });

  if (filteredEntries.length === 0) {
    return <span className="text-muted-foreground text-sm">No additional data</span>;
  }

  const renderField = ({ key, value, displayLabel, fieldType, fieldOptions }: typeof filteredEntries[0]) => {
    const currentValue = String(localData[key] || value || '');

    if (isReadOnly) {
      return (
        <div className="space-y-1">
          <div className="text-sm font-medium text-foreground capitalize">
            {displayLabel}:
          </div>
          <div className="text-sm text-muted-foreground break-words pl-2">
            {typeof value === 'boolean' 
              ? (value ? 'Yes' : 'No') 
              : value === '-' 
                ? <span className="italic text-xs">No data</span>
                : (
                  <div className="whitespace-pre-wrap">
                    {String(value).split('\n').map((line, index) => (
                      <div key={index} className="mb-1 last:mb-0">
                        {line.trim() || <span className="italic text-xs">Empty line</span>}
                      </div>
                    ))}
                  </div>
                )}
          </div>
        </div>
      );
    }

    // Editable version
    return (
      <div className="space-y-2">
        <Label htmlFor={`field-${key}`} className="text-sm font-medium capitalize">
          {displayLabel}
        </Label>
        
        {fieldType === 'select' && fieldOptions.length > 0 ? (
          <select
            id={`field-${key}`}
            value={currentValue}
            onChange={(e) => handleFieldChange(key, e.target.value)}
            className="w-full px-3 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Select an option</option>
            {fieldOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        ) : fieldType === 'checkbox' ? (
          <div className="flex items-center space-x-2">
            <input
              id={`field-${key}`}
              type="checkbox"
              checked={currentValue === 'true' || value === true}
              onChange={(e) => handleFieldChange(key, e.target.checked)}
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <span className="text-sm text-muted-foreground">Yes</span>
          </div>
        ) : fieldType === 'textarea' || currentValue.includes('\n') ? (
          <Textarea
            id={`field-${key}`}
            value={currentValue}
            onChange={(e) => handleFieldChange(key, e.target.value)}
            placeholder={`Enter ${displayLabel.toLowerCase()}`}
            rows={3}
            className="text-sm"
          />
        ) : (
          <Input
            id={`field-${key}`}
            type={fieldType === 'email' ? 'email' : fieldType === 'number' ? 'number' : 'text'}
            value={currentValue}
            onChange={(e) => handleFieldChange(key, e.target.value)}
            placeholder={`Enter ${displayLabel.toLowerCase()}`}
            className="text-sm"
          />
        )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-4">
      {filteredEntries.map((entry) => (
        <div key={String(entry.key)}>
          {renderField(entry)}
        </div>
      ))}
    </div>
  );
}
