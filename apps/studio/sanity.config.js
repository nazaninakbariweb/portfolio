import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { projectSchemaTypes } from './schemaTypes/project.js'

export default defineConfig({
  name: 'default',
  title: 'Nazanin Portfolio',
  projectId: 'unm5orj2',
  dataset: 'production',
  plugins: [structureTool()],
  schema: {
    types: projectSchemaTypes,
  },
})
