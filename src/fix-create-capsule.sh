#!/bin/bash
# Script to fix CreateCapsule.tsx infinite loop issues

# Create a backup first
cp ./components/CreateCapsule.tsx ./components/CreateCapsule.tsx.backup

# Fix line 1124: Add && !workflowPopulatedRef.current
sed -i '1124s/if (workflow && workflow\.setWorkflowMedia) {/if (workflow \&\& workflow.setWorkflowMedia \&\& !workflowPopulatedRef.current) {/' ./components/CreateCapsule.tsx

# Fix line 1127: Fix indentation (remove extra space)
sed -i '1127s/^                             workflow/                            workflow/' ./components/CreateCapsule.tsx

# Fix line 1170: Add && !workflowPopulatedRef.current  
sed -i '1170s/if (workflow && workflow\.setWorkflowMedia) {/if (workflow \&\& workflow.setWorkflowMedia \&\& !workflowPopulatedRef.current) {/' ./components/CreateCapsule.tsx

echo "✅ Fixes applied successfully!"
echo "Backup saved as CreateCapsule.tsx.backup"
