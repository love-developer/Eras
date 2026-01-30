// Script to fix infinite loop errors in CreateCapsule.tsx
// This script applies the exact fixes needed:
// 1. Line 1124: Add `&& !workflowPopulatedRef.current` to condition
// 2. Line 1127: Remove extra space before workflow.setWorkflowMedia
// 3. Line 1170: Add `&& !workflowPopulatedRef.current` to condition

import { readFileSync, writeFileSync } from 'fs';

const filePath = './components/CreateCapsule.tsx';

// Read the file
let content = readFileSync(filePath, 'utf-8');

// Split into lines for precise editing
let lines = content.split('\n');

console.log('Original line 1124:', JSON.stringify(lines[1123])); // Line 1124 is index 1123
console.log('Original line 1127:', JSON.stringify(lines[1126])); // Line 1127 is index 1126
console.log('Original line 1170:', JSON.stringify(lines[1169])); // Line 1170 is index 1169

// Fix line 1124 (index 1123): Add && !workflowPopulatedRef.current
if (lines[1123].includes('if (workflow && workflow.setWorkflowMedia)')) {
  lines[1123] = lines[1123].replace(
    'if (workflow && workflow.setWorkflowMedia) {',
    'if (workflow && workflow.setWorkflowMedia && !workflowPopulatedRef.current) {'
  );
  console.log('✅ Fixed line 1124');
} else {
  console.error('❌ Line 1124 does not match expected pattern');
  console.error('Actual content:', lines[1123]);
}

// Fix line 1127 (index 1126): Remove one space before workflow.setWorkflowMedia
// Count spaces before 'workflow'
const line1127 = lines[1126];
const match = line1127.match(/^(\s+)workflow\.setWorkflowMedia/);
if (match) {
  const spaces = match[1];
  console.log('Current spaces before workflow:', spaces.length);
  if (spaces.length === 29) {
    // Remove one space (make it 28)
    lines[1126] = line1127.replace(/^(\s+)workflow\.setWorkflowMedia/, ' '.repeat(28) + 'workflow.setWorkflowMedia');
    console.log('✅ Fixed line 1127 (removed 1 space)');
  } else if (spaces.length === 28) {
    console.log('ℹ️ Line 1127 already has correct spacing');
  } else {
    console.warn('⚠️ Line 1127 has unexpected spacing:', spaces.length, 'spaces');
  }
} else {
  console.error('❌ Line 1127 does not match expected pattern');
  console.error('Actual content:', lines[1126]);
}

// Fix line 1170 (index 1169): Add && !workflowPopulatedRef.current
if (lines[1169].includes('if (workflow && workflow.setWorkflowMedia)')) {
  lines[1169] = lines[1169].replace(
    'if (workflow && workflow.setWorkflowMedia) {',
    'if (workflow && workflow.setWorkflowMedia && !workflowPopulatedRef.current) {'
  );
  console.log('✅ Fixed line 1170');
} else {
  console.error('❌ Line 1170 does not match expected pattern');
  console.error('Actual content:', lines[1169]);
}

console.log('\nModified line 1124:', JSON.stringify(lines[1123]));
console.log('Modified line 1127:', JSON.stringify(lines[1126]));
console.log('Modified line 1170:', JSON.stringify(lines[1169]));

// Write back
const newContent = lines.join('\n');
writeFileSync(filePath, newContent, 'utf-8');

console.log('\n✅ File updated successfully!');
