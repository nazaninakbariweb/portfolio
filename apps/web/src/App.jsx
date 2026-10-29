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
  const [hoveredCategory, setHoveredCategory] = useState(null)
  useEffect(() => {
    if (pathname === '/') window.scrollTo({ top: 0, behavior: 'smooth' })
    else setHoveredCategory(null)
  }, [pathname])
  return <>
    {pathname === '/' ? <>
      <HomeHeader onCategoryHover={setHoveredCategory} />
      <HomeSocialLinks />
    </> : <header className="site-header">
      <Link className="wordmark" to="/" aria-label="Nazanin Akbari home">NA<span>.</span></Link>
      <nav aria-label="Main navigation"><Link to="/projects" className={pathname.startsWith('/projects') ? 'is-active-category' : undefined}>Projects</Link><Link to="/about">About</Link><Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Home</Link><Link to="/contact">Contact</Link></nav>
      <span className="header-note">Architecture · Interiors</span>
    </header>}
    <Routes>
      <Route path="/" element={<HomePage hoveredCategory={hoveredCategory} />} />
      <Route path="/projects" element={<ProjectsPage />} />
      <Route path="/projects/:slug" element={<ProjectPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    {pathname === '/' ? <HomeFooter /> : <footer className="site-footer">
      <div><p className="eyebrow">Have a project in mind?</p><Link className="footer-title" to="/contact">Let’s talk <span>↗</span></Link></div>
      <div className="footer-meta"><span>© Nazanin Akbari 2026</span><span>Architecture · Interiors</span><a href="#top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Back to top ↑</a></div>
    </footer>}
  </>
}

function HomeFooter() {
  function backToTop(event) {
    event.preventDefault()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return <footer className="home-footer">
    <div className="home-footer__brand">
      <Link className="home-footer__logo" to="/" onClick={backToTop}>NAZANIN AKBARI</Link>
      <p>Architecture · Interiors</p>
    </div>
    <div className="home-footer__details">
      <div className="home-footer__column">
        <h2>Contact</h2>
        <p>For projects and collaborations</p>
        <Link to="/contact">Get in touch <span>↗</span></Link>
      </div>
      <div className="home-footer__column">
        <h2>Explore</h2>
        <Link to="/about">About</Link>
        <Link to="/projects">All projects</Link>
      </div>
      <div className="home-footer__column">
        <h2>Follow</h2>
        <a href="https://www.instagram.com/nazanin_akbary/" target="_blank" rel="noreferrer">Instagram</a>
        <a href="https://t.me/Nazaninnakbary" target="_blank" rel="noreferrer">Telegram</a>
        <a href="https://www.linkedin.com/in/nazanin-akbari-/" target="_blank" rel="noreferrer">LinkedIn</a>
      </div>
    </div>
    <div className="home-footer__bottom">
      <span>© 2026 Nazanin Akbari</span>
      <span>Architecture · Interiors</span>
      <a href="#top" onClick={backToTop}>Back to top ↑</a>
    </div>
  </footer>
}

function useIntroSlideActive() {
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    const intro = document.getElementById('home-intro')
    if (!intro || !('IntersectionObserver' in window)) return
    const observer = new IntersectionObserver(([entry]) => setIsActive(entry.isIntersecting), { threshold: 0.55 })
    observer.observe(intro)
    return () => observer.disconnect()
  }, [])

  return isActive
}

function HomeSocialLinks() {
  const introIsActive = useIntroSlideActive()
  return <nav className={`home-social-links${introIsActive ? ' home-social-links--light' : ''}`} aria-label="Social media">
    <a href="https://www.instagram.com/nazanin_akbary/" target="_blank" rel="noreferrer" aria-label="Instagram" title="Instagram">
      <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.6" cy="6.7" r=".8" /></svg>
    </a>
    <a href="https://t.me/Nazaninnakbary" target="_blank" rel="noreferrer" aria-label="Telegram" title="Telegram">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m21 3-7.6 18-3.7-7.1L3 10.3 21 3Z" /><path d="m9.7 13.9 5.1-4.6" /></svg>
    </a>
    <a className="home-social-links__linkedin" href="https://www.linkedin.com/in/nazanin-akbari-/" target="_blank" rel="noreferrer" aria-label="LinkedIn" title="LinkedIn">in</a>
  </nav>
}

function HomeHeader({ onCategoryHover }) {
  const { pathname, search } = useLocation()
  const introIsActive = useIntroSlideActive()
  const selectedCategory = new URLSearchParams(search).get('category')
  const activeCategory = selectedCategory || (pathname === '/projects' ? 'Projects' : null)

  function returnHome() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return <header className={`experience-header${introIsActive ? ' experience-header--light' : ''}`}>
    <nav className="experience-nav" aria-label="Main navigation">
      <Link className={activeCategory === 'Projects' ? 'is-active-category' : undefined} to="/projects?category=Projects" onMouseEnter={() => onCategoryHover('Projects')} onMouseLeave={() => onCategoryHover(null)} onFocus={() => onCategoryHover('Projects')} onBlur={() => onCategoryHover(null)}>PROJECTS</Link>
      <Link className={activeCategory === 'Collaborations' ? 'is-active-category' : undefined} to="/projects?category=Collaborations" onMouseEnter={() => onCategoryHover('Collaborations')} onMouseLeave={() => onCategoryHover(null)} onFocus={() => onCategoryHover('Collaborations')} onBlur={() => onCategoryHover(null)}>COLLABORATIONS</Link>
      <Link className={activeCategory === 'Objects' ? 'is-active-category' : undefined} to="/projects?category=Objects" onMouseEnter={() => onCategoryHover('Objects')} onMouseLeave={() => onCategoryHover(null)} onFocus={() => onCategoryHover('Objects')} onBlur={() => onCategoryHover(null)}>OBJECTS</Link>
      <Link className={activeCategory === 'Explorations' ? 'is-active-category' : undefined} to="/projects?category=Explorations" onMouseEnter={() => onCategoryHover('Explorations')} onMouseLeave={() => onCategoryHover(null)} onFocus={() => onCategoryHover('Explorations')} onBlur={() => onCategoryHover(null)}>EXPLORATIONS</Link>
    </nav>
    <Link className="experience-brand" to="/" aria-label="Nazanin Akbari home" onClick={returnHome}>
      <strong>NAZANIN AKBARI</strong>
    </Link>
    <nav className="experience-actions" aria-label="Home, contact and about">
      <Link to="/" onClick={returnHome}>HOME</Link>
      <Link to="/contact">CONTACT</Link>
      <Link to="/about">ABOUT</Link>
    </nav>
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

function HomePage({ hoveredCategory }) {
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
  const [hoveredHeroSlide, setHoveredHeroSlide] = useState(null)
  const displayedSlide = hoveredHeroSlide || currentSlide
  const categories = placeholderSlides.map(({ category }) => category)

  useEffect(() => {
    if (!hoveredCategory) {
      setHoveredHeroSlide(null)
      return
    }
    const categoryProjects = projects.filter((project) => project.category?.toLowerCase() === hoveredCategory.toLowerCase() && project.cover?.asset)
    const randomProject = categoryProjects[Math.floor(Math.random() * categoryProjects.length)]
    const fallback = placeholderSlides.find((slide) => slide.category === hoveredCategory)
    setHoveredHeroSlide({ type: 'image', src: randomProject ? imageUrl(randomProject.cover).width(2400).fit('crop').url() : fallback?.src })
  }, [hoveredCategory, projects])

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

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const sections = [...document.querySelectorAll('.home-hero, .home-intro-slide, .home-category-slide, .home-footer')]
    if (sections.length < 2) return

    const nearestSectionIndex = () => sections.reduce((closest, section, index) => {
      const distance = Math.abs(section.getBoundingClientRect().top)
      return distance < closest.distance ? { index, distance } : closest
    }, { index: 0, distance: Infinity }).index

    let activeSection = nearestSectionIndex()
    let previousY = window.scrollY
    let animationFrame = null
    let originalScrollBehavior = ''

    function cancelAnimation() {
      if (animationFrame === null) return
      window.cancelAnimationFrame(animationFrame)
      animationFrame = null
      document.documentElement.style.scrollBehavior = originalScrollBehavior
      activeSection = nearestSectionIndex()
      previousY = window.scrollY
    }

    function animateTo(targetIndex) {
      const startY = window.scrollY
      const targetTop = sections[targetIndex].getBoundingClientRect().top + startY
      const distance = targetTop - startY
      const duration = 1350
      const startTime = performance.now()
      originalScrollBehavior = document.documentElement.style.scrollBehavior
      document.documentElement.style.scrollBehavior = 'auto'
      activeSection = targetIndex

      function frame(now) {
        const progress = Math.min(1, (now - startTime) / duration)
        const eased = progress < .5
          ? 16 * progress ** 5
          : 1 - Math.pow(-2 * progress + 2, 5) / 2
        window.scrollTo(0, startY + distance * eased)
        if (progress < 1) {
          animationFrame = window.requestAnimationFrame(frame)
        } else {
          window.scrollTo(0, targetTop)
          animationFrame = null
          document.documentElement.style.scrollBehavior = originalScrollBehavior
          previousY = targetTop
        }
      }

      animationFrame = window.requestAnimationFrame(frame)
    }

    function onScroll() {
      const currentY = window.scrollY
      const direction = Math.sign(currentY - previousY)
      previousY = currentY
      if (!direction || animationFrame !== null) return

      const section = sections[activeSection]
      const bounds = section.getBoundingClientRect()
      const sectionTop = bounds.top + currentY
      const threshold = Math.min(bounds.height, window.innerHeight) / 2
      let nextSection = activeSection
      if (direction > 0 && activeSection < sections.length - 1 && currentY >= sectionTop + threshold) nextSection += 1
      if (direction < 0 && activeSection > 0 && currentY <= sectionTop - threshold) nextSection -= 1
      if (nextSection !== activeSection) animateTo(nextSection)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('wheel', cancelAnimation, { passive: true })
    window.addEventListener('touchstart', cancelAnimation, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('wheel', cancelAnimation)
      window.removeEventListener('touchstart', cancelAnimation)
      if (animationFrame !== null) window.cancelAnimationFrame(animationFrame)
      document.documentElement.style.scrollBehavior = originalScrollBehavior
    }
  }, [])

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
        {displayedSlide.type === 'video'
          ? <video className="home-hero__image" key={displayedSlide.src} src={displayedSlide.src} autoPlay muted playsInline preload="auto" aria-hidden="true" />
          : <img className="home-hero__image" key={displayedSlide.src} src={displayedSlide.src} alt="" fetchPriority={slideIndex === 0 ? 'high' : 'auto'} />}
        <div className="home-hero__shade" aria-hidden="true" />
      </section>
      <section id="home-intro" className="home-intro-slide" aria-label="Introduction">
        <p>YOUR TEXT HERE</p>
      </section>
      {categorySlides.map(({ category, image, video }, index) => <div className="home-category-group" key={category}>
        <button
          id={category === 'Projects' ? 'category-projects' : undefined}
          type="button"
          className={`home-category-slide${video ? ' home-category-slide--video' : ''}`}
          style={video ? undefined : { backgroundImage: `linear-gradient(180deg, rgba(0,0,0,.18), rgba(0,0,0,.28)), url("${image}")` }}
          onClick={() => navigate(`/projects?category=${encodeURIComponent(category)}`)}
          aria-label={`Open ${category} projects`}
        >{video && <video className="home-category-slide__video" src={video} autoPlay muted loop playsInline preload="metadata" aria-hidden="true" />}<span>{category}</span></button>
        {index < categorySlides.length - 1 && <div className="home-slide-divider" aria-hidden="true" />}
      </div>)}
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
  return <main className="section-wrap page-main"><div className="section-heading"><p className="eyebrow">Selected work</p><h2 className={category ? 'category-title' : undefined}>{category || 'Projects'}</h2></div><ProjectGrid projects={filteredProjects} loading={loading} error={error} emptyMessage={emptyMessage} /></main>
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
