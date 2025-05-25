import { Template } from '../models/Template';

// Mock data for templates
const mockTemplates: Template[] = [
  {
    id: '1',
    name: 'Bank Statement Export',
    description: 'Template for exporting bank statements to CSV',
    createdAt: '2023-07-15T10:30:00Z',
    updatedAt: '2023-08-20T14:15:00Z',
    fileType: 'CSV',
    fieldMappings: [
      { sourceField: 'date', targetField: 'Transaction Date' },
      { sourceField: 'amount', targetField: 'Amount' },
      { sourceField: 'description', targetField: 'Description' },
    ],
  },
  {
    id: '2',
    name: 'Customer Data Export',
    description: 'Export customer information for CRM',
    createdAt: '2023-06-10T08:45:00Z',
    updatedAt: '2023-06-10T08:45:00Z',
    fileType: 'XML',
    fieldMappings: [
      { sourceField: 'customerId', targetField: 'ID' },
      { sourceField: 'name', targetField: 'Full Name' },
      { sourceField: 'email', targetField: 'Email Address' },
    ],
  },
  {
    id: '3',
    name: 'Financial Report',
    description: 'Monthly financial report template',
    createdAt: '2023-05-05T16:20:00Z',
    updatedAt: '2023-09-01T11:10:00Z',
    fileType: 'XLSX',
    fieldMappings: [
      { sourceField: 'month', targetField: 'Reporting Period' },
      { sourceField: 'revenue', targetField: 'Total Revenue' },
      { sourceField: 'expenses', targetField: 'Total Expenses' },
    ],
  },
];

// Simulate API call to fetch templates
export const fetchTemplates = (): Promise<Template[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockTemplates);
    }, 500);
  });
};

// Get template by ID
export const getTemplateById = (id: string): Promise<Template | undefined> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const template = mockTemplates.find(t => t.id === id);
      resolve(template);
    }, 300);
  });
}; 