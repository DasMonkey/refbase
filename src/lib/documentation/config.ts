import { DocumentationConfig } from './types';

// Centralized configuration - easily extensible
export const DOCUMENTATION_CONFIG: DocumentationConfig = {
  categories: {
    'API': { label: 'API Reference', order: 1 },
    'CONFIGURATION': { label: 'Setup', order: 2 },
    'DEPLOYMENT': { label: 'Setup', order: 2 },
    'IDE-SETUP': { label: 'Setup', order: 2 },
    'EXAMPLES': { label: 'Guides', order: 3 },
    'CLI': { label: 'Guides', order: 3 },
    'TESTING': { label: 'Development', order: 4 },
    'DEVELOPER': { label: 'Development', order: 4 },
    'LOGGING': { label: 'Development', order: 4 },
    'TROUBLESHOOTING': { label: 'Support', order: 5 },
    'DEPLOYMENT-CHECKLIST': { label: 'Support', order: 5 }
  },
  files: [
    'API.md',
    'CLI.md',
    'CONFIGURATION.md',
    'DEPLOYMENT-CHECKLIST.md',
    'DEPLOYMENT.md',
    'DEVELOPER.md',
    'EXAMPLES.md',
    'IDE-SETUP.md',
    'LOGGING.md',
    'TESTING.md',
    'TROUBLESHOOTING.md'
  ]
};