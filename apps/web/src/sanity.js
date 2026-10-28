import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'

export const client = createClient({
  projectId: 'unm5orj2',
  dataset: 'production',
  apiVersion: '2025-01-01',
  useCdn: true,
})

const builder = imageUrlBuilder(client)
export const imageUrl = (source) => builder.image(source)
