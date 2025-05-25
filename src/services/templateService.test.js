// Simple test for template creation
// Run this in browser console to test template creation

const testTemplateCreation = async () => {
  try {
    console.log('🧪 Testing template creation...');
    
    // Import the createTemplate function
    const { createTemplate } = await import('./templateService.js');
    
    // Test data
    const testData = {
      name: 'Test Template',
      description: 'A test template for validation',
      fileType: 'CSV',
      fieldMappings: [
        {
          sourceField: 'testField1',
          targetField: 'Test Field 1',
          transform: 'text'
        },
        {
          sourceField: 'testField2', 
          targetField: 'Test Field 2',
          transform: 'number'
        }
      ]
    };
    
    console.log('📝 Creating template with data:', testData);
    
    const result = await createTemplate(testData);
    
    console.log('✅ Template created successfully:', result);
    console.log('🆔 Generated ID:', result.id);
    console.log('📅 Created at:', result.createdAt);
    console.log('📅 Updated at:', result.updatedAt);
    console.log('🔢 Schema version:', result.schemaVersion);
    
    return result;
    
  } catch (error) {
    console.error('❌ Template creation failed:', error);
    console.error('Error details:', error.message);
    throw error;
  }
};

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.testTemplateCreation = testTemplateCreation;
  console.log('🛠️ Test function available as window.testTemplateCreation()');
} 