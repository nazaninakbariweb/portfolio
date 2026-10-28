import { useEffect, useState } from 'react'
import { BrowserRouter, Link, Route, Routes, useParams } from 'react-router-dom'
import { client, imageUrl } from './sanity.js'

const projectFields = `
  _id, title, "slug": slug.current, category, year, location, summary, featured,
  cover{..., "url": asset->url},
  content[]{..., "imageUrl": image.asset->url, "fileUrl": file.asset->url}
`

function useProjects(query, params = {}) {
  const [state, setState] = useState({ projects: [], loading: true, error: false })
  useEffect(() => {
    let active = true
    client.fetch(query, params)
      .then((result) => active && setState({ projects: Array.isArray(result) ? result : [result].filter(Boolean), loading: false, error: false }))
      .catch(() => active && setState({ projects: [], loading: false, error: true }))
    return () => { active = false }
  }, [query, JSON.stringify(params)])
  return state
}

function SiteLayout() {
  return <>
    <header className="site-header">
      <Link className="wordmark" to="/" aria-label="Nazanin Akbari home">NA<span>.</span></Link>
      <nav aria-label="Main navigation"><Link to="/projects">Projects</Link><Link to="/about">About</Link><Link to="/contact">Contact</Link></nav>
      <span className="header-note">Architecture · Interiors</span>
    </header>
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/projects" element={<ProjectsPage />} />
      <Route path="/projects/:slug" element={<ProjectPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    <footer className="site-footer">
      <div><p className="eyebrow">Have a project in mind?</p><Link className="footer-title" to="/contact">Let’s talk <span>↗</span></Link></div>
      <div className="footer-meta"><span>© Nazanin Akbari 2026</span><span>Architecture · Interiors</span><a href="#top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Back to top ↑</a></div>
    </footer>
  </>
}

function HomePage() {
  const { projects, loading, error } = useProjects(`*[_type == "project" && defined(slug.current)] | order(featured desc, year desc)[0...3]{${projectFields}}`)
  return <main id="top">
    <section className="hero">
      <p className="eyebrow">Independent architect & designer</p>
      <h1>Spaces shaped<br />by <em>light</em> and life.</h1>
      <div className="hero-bottom"><p>Thoughtful architecture and interiors<br />for the way we live.</p><Link className="text-link" to="/projects">Explore selected work <span>↘</span></Link></div>
      <div className="hero-art" aria-hidden="true"><div className="art-wall"></div><div className="art-opening"></div><div className="art-shadow"></div></div>
    </section>
    <section className="projects section-wrap">
      <div className="section-heading"><p className="eyebrow">Selected work</p><h2>Projects</h2></div>
      <ProjectGrid projects={projects} loading={loading} error={error} />
      <Link className="text-link all-projects" to="/projects">View all projects <span>↗</span></Link>
    </section>
    <section className="about section-wrap">
      <p className="eyebrow">A little about me</p>
      <p className="about-copy">Architecture and interior design by <em>Nazanin Akbari</em>, shaped by people, place, and material.</p>
      <Link className="text-link" to="/about">More about Nazanin <span>↗</span></Link>
    </section>
  </main>
}

function ProjectsPage() {
  const { projects, loading, error } = useProjects(`*[_type == "project" && defined(slug.current)] | order(year desc){${projectFields}}`)
  return <main className="section-wrap page-main"><div className="section-heading"><p className="eyebrow">Selected work</p><h2>Projects</h2></div><ProjectGrid projects={projects} loading={loading} error={error} /></main>
}

function ProjectGrid({ projects, loading, error }) {
  if (loading) return <p className="status-message">Loading projects…</p>
  if (error) return <p className="status-message">Projects are temporarily unavailable. Please try again soon.</p>
  if (!projects.length) return <p className="status-message">Projects will appear here soon.</p>
  return <div className="project-grid">{projects.map((project) => <Link className="project-card" to={`/projects/${project.slug}`} key={project._id}>
    <div className="project-image">
      {project.cover?.url ? <img src={imageUrl(project.cover).width(900).height(1100).fit('crop').url()} alt={project.cover.alt || project.title} /> : <div className="image-placeholder" />}
      <span>{String(project.year || '').padStart(2, '0')}</span>
    </div>
    <div className="project-caption"><div><h3>{project.title}</h3><p>{[project.category, project.location, project.year].filter(Boolean).join(' · ')}</p></div><span aria-hidden="true">↗</span></div>
  </Link>)}</div>
}

function ProjectPage() {
  const { slug } = useParams()
  const { projects, loading, error } = useProjects(`*[_type == "project" && slug.current == $slug][0]{${projectFields}}`, { slug })
  const project = projects[0]
  if (loading) return <main className="section-wrap page-main"><p className="status-message">Loading project…</p></main>
  if (error) return <main className="section-wrap page-main"><p className="status-message">This project is temporarily unavailable. Please try again soon.</p></main>
  if (!project) return <main className="section-wrap page-main"><p className="status-message">Project not found.</p><Link className="text-link" to="/projects">Back to projects <span>↗</span></Link></main>
  return <main className="project-detail page-main">
    <section className="project-intro section-wrap">
      <p className="eyebrow">{[project.category, project.year, project.location].filter(Boolean).join(' · ')}</p>
      <h1>{project.title}</h1>
      {project.summary && <p className="project-summary">{project.summary}</p>}
      {project.cover?.url && <img className="detail-cover" src={imageUrl(project.cover).width(1800).url()} alt={project.cover.alt || project.title} />}
    </section>
    <section className="story-grid">{(project.content || []).map((block) => <ContentBlock block={block} key={block._key} />)}</section>
  </main>
}

function ContentBlock({ block }) {
  const width = Math.min(12, Math.max(1, Number(block.layout?.width) || 12))
  const offset = Math.min(11, Math.max(0, Number(block.layout?.offset) || 0))
  const style = { '--block-span': width, '--block-start': offset + 1 }
  if (block._type === 'projectText') return <article className="story-block story-text" style={style}><div>{block.heading && <h2>{block.heading}</h2>}<p>{block.body}</p></div></article>
  if (block._type === 'projectImage' && block.imageUrl) return <figure className="story-block story-media" style={style}><img src={imageUrl(block.image).width(1800).url()} alt={block.alt || ''} />{block.caption && <figcaption>{block.caption}</figcaption>}</figure>
  if (block._type === 'projectDrawing') return <figure className="story-block story-media" style={style}>{block.imageUrl ? <img src={imageUrl(block.image).width(1600).url()} alt={block.alt || block.title || ''} /> : block.fileUrl ? <a className="drawing-link" href={block.fileUrl} target="_blank" rel="noreferrer">Open drawing: {block.title}</a> : null}{block.title && <figcaption>{block.title}</figcaption>}</figure>
  if (block._type === 'projectVideo') return <div className="story-block story-media" style={style}>{block.fileUrl ? <video controls preload="metadata" src={block.fileUrl}>{block.title}</video> : block.url ? <a className="drawing-link" href={block.url} target="_blank" rel="noreferrer">Watch video: {block.title || 'Open video'}</a> : null}</div>
  return null
}

function AboutPage() {
  return <main className="section-wrap page-main"><p className="eyebrow">About</p><h1 className="page-title">Nazanin Akbari</h1><p className="about-copy">Architect and interior designer working across thoughtful spaces, material, and light.</p><p className="status-message">A fuller biography will be added here.</p></main>
}

function ContactPage() {
  return <main className="section-wrap page-main"><p className="eyebrow">Contact</p><h1 className="page-title">Let’s talk.</h1><p className="status-message">Contact details will be added here.</p></main>
}

function NotFoundPage() {
  return <main className="section-wrap page-main"><p className="eyebrow">404</p><h1 className="page-title">Page not found</h1><Link className="text-link" to="/">Back home <span>↗</span></Link></main>
}

function App() { return <BrowserRouter><SiteLayout /></BrowserRouter> }
export default App
