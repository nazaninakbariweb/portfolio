import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { projectSchemaTypes } from './schemaTypes/project.js'
import { homepageSettings } from './schemaTypes/homepageSettings.js'

export default defineConfig({
  name: 'default',
  title: 'Nazanin Portfolio',
  projectId: 'unm5orj2',
  dataset: 'production',
  plugins: [structureTool({
    structure: (S) => S.list().title('Content').items([
      S.listItem()
        .title('Homepage media')
        .id('homepageSettings')
        .child(S.document().schemaType('homepageSettings').documentId('homepageSettings').title('Homepage media')),
      S.divider(),
      S.documentTypeListItem('project').title('Projects'),
    ]),
  })],
  schema: {
    types: [...projectSchemaTypes, homepageSettings],
  },
})
