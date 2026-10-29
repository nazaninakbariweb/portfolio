import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'
import { set } from 'sanity'
import './projectCanvasInput.css'

const imageBuilder = imageUrlBuilder(createClient({
  projectId: 'unm5orj2',
  dataset: 'production',
  apiVersion: '2025-01-01',
  useCdn: true,
}))

function blockTitle(block) {
  if (block._type === 'projectImage') return block.caption || 'Image / render'
  if (block._type === 'projectDrawing') return block.title || 'Plan / section / diagram'
  if (block._type === 'projectVideo') return block.title || 'Video'
  if (block._type === 'projectText') return block.heading || 'Text'
  return 'Content block'
}

function blockImage(block) {
  const image = block._type === 'projectImage' ? block.image : block.image
  return image?.asset?._ref ? imageBuilder.image(image).width(480).height(300).fit('crop').url() : null
}

function blockDescription(block) {
  if (block._type === 'projectText') return block.body || 'Add the text in the editor below.'
  if (block._type === 'projectVideo') return block.url || (block.file?.asset?._ref ? 'Video uploaded' : 'Add a video in the editor below.')
  if (block._type === 'projectDrawing') return block.file?.asset?._ref ? 'Drawing file uploaded' : 'Add a plan or drawing below.'
  return block.alt || 'Add media in the editor below.'
}

export function ProjectCanvasInput(props) {
  const blocks = props.value || []

  function updateLayout(key, change) {
    const next = blocks.map((block) => {
      if (block._key !== key) return block
      const width = Number(block.layout?.width) || 12
      const offset = Number(block.layout?.offset) || 0
      const nextWidth = Math.min(12, Math.max(1, width + (change.width || 0)))
      const nextOffset = Math.min(12 - nextWidth, Math.max(0, offset + (change.offset || 0)))
      return { ...block, layout: { ...block.layout, width: nextWidth, offset: nextOffset, mobileWidth: block.layout?.mobileWidth || 'full' } }
    })
    props.onChange(set(next))
  }

  function moveBlock(sourceKey, targetKey) {
    if (!sourceKey || sourceKey === targetKey) return
    const next = [...blocks]
    const from = next.findIndex((block) => block._key === sourceKey)
    const to = next.findIndex((block) => block._key === targetKey)
    if (from < 0 || to < 0) return
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    props.onChange(set(next))
  }

  return <div className="project-canvas-input">
    <section className="project-canvas">
      <div className="project-canvas__heading">
        <div>
          <h3>Project canvas</h3>
          <p>Add and edit content blocks below. Drag cards to reorder; use the controls to adjust their width and position.</p>
        </div>
        <span>{blocks.length} {blocks.length === 1 ? 'block' : 'blocks'}</span>
      </div>
      <div className="project-canvas__grid" aria-label="Project layout preview">
        {!blocks.length && <p className="project-canvas__empty">Your project canvas is empty. Add text, images, video, or drawings below.</p>}
        {blocks.map((block) => {
          const width = Math.min(12, Math.max(1, Number(block.layout?.width) || 12))
          const offset = Math.min(12 - width, Math.max(0, Number(block.layout?.offset) || 0))
          const image = blockImage(block)
          return <article
            className="project-canvas__block"
            key={block._key}
            draggable
            onDragStart={(event) => event.dataTransfer.setData('text/plain', block._key)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => { event.preventDefault(); moveBlock(event.dataTransfer.getData('text/plain'), block._key) }}
            style={{ gridColumn: `${offset + 1} / span ${width}` }}
          >
            {image && <img className="project-canvas__image" src={image} alt={block.alt || blockTitle(block)} />}
            {!image && <div className={`project-canvas__placeholder project-canvas__placeholder--${block._type}`} aria-hidden="true">{block._type === 'projectVideo' ? '▶' : block._type === 'projectText' ? 'T' : '▧'}</div>}
            <div className="project-canvas__copy">
              <strong>{blockTitle(block)}</strong>
              <p>{blockDescription(block)}</p>
            </div>
            <div className="project-canvas__controls" aria-label={`Layout controls for ${blockTitle(block)}`}>
              <button type="button" onClick={() => updateLayout(block._key, { offset: -1 })} aria-label="Move left">←</button>
              <button type="button" onClick={() => updateLayout(block._key, { offset: 1 })} aria-label="Move right">→</button>
              <button type="button" onClick={() => updateLayout(block._key, { width: -1 })} aria-label="Make narrower">−</button>
              <button type="button" onClick={() => updateLayout(block._key, { width: 1 })} aria-label="Make wider">+</button>
              <span>{width}/12</span>
            </div>
          </article>
        })}
      </div>
    </section>
    <div className="project-canvas-input__blocks">{props.renderDefault(props)}</div>
  </div>
}
