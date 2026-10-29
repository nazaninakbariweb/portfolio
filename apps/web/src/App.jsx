import { useEffect, useMemo, useState } from 'react'
import { BrowserRouter, Link, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
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
  const { pathname } = useLocation()
  return <>
    {pathname === '/' ? <>
      <HomeHeader />
      <HomeSocialLinks />
    </> : <header className="site-header">
      <Link className="wordmark" to="/" aria-label="Nazanin Akbari home">NA<span>.</span></Link>
      <nav aria-label="Main navigation"><Link to="/projects">Projects</Link><Link to="/about">About</Link><Link to="/contact">Contact</Link></nav>
      <span className="header-note">Architecture · Interiors</span>
    </header>}
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/projects" element={<ProjectsPage />} />
      <Route path="/projects/:slug" element={<ProjectPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    <footer className={`site-footer${pathname === '/' ? ' site-footer--hidden' : ''}`}>
      <div><p className="eyebrow">Have a project in mind?</p><Link className="footer-title" to="/contact">Let’s talk <span>↗</span></Link></div>
      <div className="footer-meta"><span>© Nazanin Akbari 2026</span><span>Architecture · Interiors</span><a href="#top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Back to top ↑</a></div>
    </footer>
  </>
}

function HomeSocialLinks() {
  return <nav className="home-social-links" aria-label="Social media">
    <a href="https://www.instagram.com/nazanin_akbary/" target="_blank" rel="noreferrer" aria-label="Instagram" title="Instagram">
      <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.6" cy="6.7" r=".8" /></svg>
    </a>
    <a href="https://t.me/Nazaninnakbary" target="_blank" rel="noreferrer" aria-label="Telegram" title="Telegram">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m21 3-7.6 18-3.7-7.1L3 10.3 21 3Z" /><path d="m9.7 13.9 5.1-4.6" /></svg>
    </a>
    <a className="home-social-links__linkedin" href="https://www.linkedin.com/in/nazanin-akbari-/" target="_blank" rel="noreferrer" aria-label="LinkedIn" title="LinkedIn">in</a>
  </nav>
}

function HomeHeader() {
  const navigate = useNavigate()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  function submitSearch(event) {
    event.preventDefault()
    const term = searchTerm.trim()
    navigate(term ? `/projects?q=${encodeURIComponent(term)}` : '/projects')
  }

  return <header className="experience-header">
    <nav className="experience-nav" aria-label="Main navigation">
      <Link to="/projects?category=Projects">PROJECTS</Link>
      <Link to="/projects?category=Collaborations">COLLABORATIONS</Link>
      <Link to="/projects?category=Objects">OBJECTS</Link>
      <Link to="/projects?category=Explorations">EXPLORATIONS</Link>
      <button type="button" aria-label={searchOpen ? 'Close search' : 'Search projects'} onClick={() => setSearchOpen((open) => !open)}>
        {searchOpen ? <span className="search-close">×</span> : <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.5" /><path d="m16 16 5 5" /></svg>}
      </button>
    </nav>
    <Link className="experience-brand" to="/" aria-label="Nazanin Akbari home">
      <strong>NAZANIN AKBARI</strong>
    </Link>
    <nav className="experience-actions" aria-label="Contact and about">
      <Link to="/contact">CONTACT</Link>
      <Link to="/about">ABOUT</Link>
    </nav>
    {searchOpen && <form className="experience-search" onSubmit={submitSearch}>
      <input autoFocus value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} aria-label="Search projects" placeholder="Search projects" />
      <button type="submit" aria-label="Submit search">↗</button>
    </form>}
  </header>
}

const placeholderSlides = [
  {
    title: 'Projects',
    category: 'Projects',
    src: 'https://images.unsplash.com/photo-1704461539031-e7c2145e5fc4?auto=format&fit=crop&w=2400&q=85',
  },
  {
    title: 'Collaborations',
    category: 'Collaborations',
    src: 'https://images.unsplash.com/photo-1707638121258-eb6241971802?auto=format&fit=crop&w=2400&q=85',
  },
  {
    title: 'Objects',
    category: 'Objects',
    src: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=2400&q=85',
  },
  {
    title: 'Explorations',
    category: 'Explorations',
    src: 'https://images.unsplash.com/photo-1585674550411-3f7eed56b3e7?auto=format&fit=crop&w=2400&q=85',
  },
]

function HomePage() {
  const navigate = useNavigate()
  const { projects } = useProjects(`*[_type == "project" && defined(slug.current) && defined(cover.asset)] | order(featured desc, year desc){_id, title, category, year, cover}`)
  const { projects: homepageDocuments } = useProjects(`*[_type == "homepageSettings" && _id == "homepageSettings"][0]{
    heroImages[]{..., "src": asset->url},
    heroVideos[]{"src": asset->url},
    "collaborationsVideo": collaborationsVideo.asset->url
  }`)
  const homepageMedia = homepageDocuments[0]
  const [activeHeroImage, setActiveHeroImage] = useState(0)
  const configuredSlides = homepageMedia?.heroImages?.length === 4 && homepageMedia?.heroVideos?.length === 3
    ? [
        ...homepageMedia.heroImages.filter((item) => item.src).map((item) => ({ type: 'image', src: imageUrl(item).width(2400).fit('crop').url() })),
        ...homepageMedia.heroVideos.filter((item) => item.src).map((item) => ({ type: 'video', src: item.src })),
      ]
    : []
  const slides = configuredSlides.length === 7
    ? configuredSlides
    : projects.length
      ? projects.map((project) => ({
          type: 'image',
          title: project.title,
          category: project.category,
          year: project.year,
          src: imageUrl(project.cover).width(2400).fit('crop').url(),
        }))
      : placeholderSlides.map((slide) => ({ ...slide, type: 'image' }))
  const slideSignature = slides.map(({ type, src }) => `${type}:${src}`).join('|')
  const randomizedSlides = useMemo(() => {
    const shuffled = [...slides]
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1))
      ;[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]]
    }
    return shuffled
  }, [slideSignature])
  const slideIndex = activeHeroImage % randomizedSlides.length
  const currentSlide = randomizedSlides[slideIndex]
  const categories = placeholderSlides.map(({ category }) => category)

  useEffect(() => {
    setActiveHeroImage(0)
    if (randomizedSlides.length < 2) return
    const timer = window.setInterval(() => {
      setActiveHeroImage((index) => (index + 1) % randomizedSlides.length)
    }, 5000)
    return () => window.clearInterval(timer)
  }, [slideSignature, randomizedSlides.length])

  useEffect(() => {
    const next = randomizedSlides[(slideIndex + 1) % randomizedSlides.length]
    if (next?.type !== 'image') return
    const image = new Image()
    image.src = next.src
  }, [slideIndex, slideSignature])

  const categorySlides = categories.map((category) => {
    const project = projects.find((item) => item.category?.toLowerCase() === category.toLowerCase())
    const fallback = placeholderSlides.find((item) => item.category === category)
    return {
      category,
      image: project ? imageUrl(project.cover).width(2400).fit('crop').url() : fallback.src,
      video: category === 'Collaborations' ? homepageMedia?.collaborationsVideo : null,
    }
  })

  return <main
    id="top"
    className="home-experience"
  >
    <div className="home-experience__track">
      <section className="home-hero" aria-label="Home">
        {currentSlide.type === 'video'
          ? <video className="home-hero__image" key={currentSlide.src} src={currentSlide.src} autoPlay muted playsInline preload="auto" aria-hidden="true" />
          : <img className="home-hero__image" key={currentSlide.src} src={currentSlide.src} alt="" fetchPriority={slideIndex === 0 ? 'high' : 'auto'} />}
        <div className="home-hero__shade" aria-hidden="true" />
        <a className="experience-scroll" href="#home-intro" aria-label="Scroll to introduction">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v15m-6-6 6 6 6-6" /></svg>
        </a>
      </section>
      <section id="home-intro" className="home-intro-slide" aria-label="Introduction">
        <p>YOUR TEXT HERE</p>
      </section>
      {categorySlides.map(({ category, image, video }) => <button
        key={category}
        id={category === 'Projects' ? 'category-projects' : undefined}
        type="button"
        className={`home-category-slide${video ? ' home-category-slide--video' : ''}`}
        style={video ? undefined : { backgroundImage: `linear-gradient(180deg, rgba(0,0,0,.18), rgba(0,0,0,.28)), url("${image}")` }}
        onClick={() => navigate(`/projects?category=${encodeURIComponent(category)}`)}
        aria-label={`Open ${category} projects`}
      >{video && <video className="home-category-slide__video" src={video} autoPlay muted loop playsInline preload="metadata" aria-hidden="true" />}<span>{category}</span></button>)}
    </div>
  </main>
}

function ProjectsPage() {
  const { projects, loading, error } = useProjects(`*[_type == "project" && defined(slug.current)] | order(year desc){${projectFields}}`)
  const [searchParams] = useSearchParams()
  const searchTerm = (searchParams.get('q') || '').trim().toLowerCase()
  const category = searchParams.get('category')
  const filteredProjects = projects.filter((project) => {
    const matchesCategory = !category || project.category?.toLowerCase() === category.toLowerCase()
    const searchable = [project.title, project.category, project.location, project.summary].filter(Boolean).join(' ').toLowerCase()
    return matchesCategory && (!searchTerm || searchable.includes(searchTerm))
  })
  const emptyMessage = projects.length && (searchTerm || category) ? 'No projects match this selection.' : 'Projects will appear here soon.'
  return <main className="section-wrap page-main"><div className="section-heading"><p className="eyebrow">Selected work</p><h2>Projects</h2></div><ProjectGrid projects={filteredProjects} loading={loading} error={error} emptyMessage={emptyMessage} /></main>
}

function ProjectGrid({ projects, loading, error, emptyMessage = 'Projects will appear here soon.' }) {
  if (loading) return <p className="status-message">Loading projects…</p>
  if (error) return <p className="status-message">Projects are temporarily unavailable. Please try again soon.</p>
  if (!projects.length) return <p className="status-message">{emptyMessage}</p>
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
