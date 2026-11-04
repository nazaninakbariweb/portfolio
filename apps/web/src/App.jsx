import { Component, useEffect, useMemo, useRef, useState } from 'react'
import { BrowserRouter, Link, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { PortableText } from '@portabletext/react'
import { client, imageUrl } from './sanity.js'

const categoryPaths = {
  Projects: '/projects',
  Collaborations: '/collaborations',
  Objects: '/objects',
  Explorations: '/explorations',
}

const categoryFromPath = (path) => Object.entries(categoryPaths).find(([, categoryPath]) => path === categoryPath)?.[0]
const categoryFromDetailPath = (path) => Object.entries(categoryPaths).find(([, categoryPath]) => path.startsWith(`${categoryPath}/`))?.[0]
const projectTitleSlug = (title) => String(title || '')
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim()
  .replace(/&/g, ' and ')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '')
const projectUrlSlug = (project, siblings = []) => {
  const base = projectTitleSlug(project.title) || project._id
  const duplicates = siblings.filter((item) => item.category === project.category && projectTitleSlug(item.title) === base)
  return duplicates.length > 1 ? `${base}-${String(project._id).slice(-6)}` : base
}
const projectPath = (project, siblings = []) => `${categoryPaths[project.category] || categoryPaths.Projects}/${projectUrlSlug(project, siblings)}`

const projectFields = `
  _id, title, category, year, location, summary, featured,
  cover{..., "url": asset->url},
  content[]{
    ...,
    _type == "layoutImage" => {"imageUrl": asset->url},
    _type == "imageRow" => {"images": images[]{..., "imageUrl": asset->url}},
    _type == "imageCarousel" => {"images": images[]{..., "imageUrl": asset->url}},
    _type == "layoutVideo" => {"videoUrl": asset->url}
  }
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
  const isCategoryPage = Object.values(categoryPaths).includes(pathname)
  const isProjectDetail = Boolean(categoryFromDetailPath(pathname))
  const isInfoPage = pathname === '/about' || pathname === '/contact'
  const hasHomeStyleHeader = pathname === '/' || isCategoryPage || isInfoPage || isProjectDetail
  useEffect(() => {
    let frame
    if (pathname === '/' && window.scrollY > 0) {
      frame = window.requestAnimationFrame(() => window.dispatchEvent(new Event('portfolio:home-top')))
    } else if (isCategoryPage || isInfoPage || isProjectDetail) {
      window.scrollTo(0, 0)
      setHoveredCategory(null)
    } else {
      setHoveredCategory(null)
    }
    return () => { if (frame) window.cancelAnimationFrame(frame) }
  }, [pathname, isCategoryPage, isInfoPage, isProjectDetail])
  return <>
    {hasHomeStyleHeader ? <>
      <HomeHeader onCategoryHover={setHoveredCategory} alwaysLight={isCategoryPage || isInfoPage || isProjectDetail} categoryPage={isCategoryPage || isInfoPage || isProjectDetail} infoPage={isInfoPage} />
      {pathname === '/' && <HomeSocialLinks />}
    </> : <header className="site-header">
      <Link className="wordmark" to="/" aria-label="Nazanin Akbari home">NA<span>.</span></Link>
      <nav aria-label="Main navigation">{!isInfoPage && <Link to="/projects" className={pathname.startsWith('/projects') ? 'is-active-category' : undefined}>Projects</Link>}<Link to="/about">About</Link><Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Home</Link><Link to="/contact">Contact</Link></nav>
      <span className="header-note">Architecture · Interiors</span>
    </header>}
    <Routes>
      <Route path="/" element={<HomePage hoveredCategory={hoveredCategory} />} />
      <Route path="/projects" element={<ProjectsPage routeCategory="Projects" />} />
      <Route path="/collaborations" element={<ProjectsPage routeCategory="Collaborations" />} />
      <Route path="/objects" element={<ProjectsPage routeCategory="Objects" />} />
      <Route path="/explorations" element={<ProjectsPage routeCategory="Explorations" />} />
      <Route path="/:category/:slug" element={<ProjectPageErrorBoundary key={pathname}><ProjectPage /></ProjectPageErrorBoundary>} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    {pathname === '/' ? <HomeFooter /> : <footer className="category-page__footer">
      <span>© Nazanin Akbari</span>
    </footer>}
  </>
}

function HomeFooter() {
  function backToTop(event) {
    event.preventDefault()
    window.dispatchEvent(new Event('portfolio:home-top'))
  }

  return <footer className="home-footer">
    <div className="home-footer__brand">
      <Link className="home-footer__logo" to="/" onClick={backToTop}>NAZANIN AKBARI</Link>
      <p>Architecture · Interiors · Objects</p>
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
      <span>© Nazanin Akbari</span>
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

function HomeHeader({ onCategoryHover, alwaysLight = false, categoryPage = false, infoPage = false }) {
  const { pathname, search } = useLocation()
  const introIsActive = useIntroSlideActive()
  const selectedCategory = new URLSearchParams(search).get('category')
  const pathCategory = categoryFromPath(pathname) || categoryFromDetailPath(pathname)
  const activeCategory = selectedCategory || pathCategory

  function returnHome() {
    window.dispatchEvent(new Event('portfolio:home-top'))
  }

  return <header className={`experience-header${introIsActive || alwaysLight ? ' experience-header--light' : ''}${categoryPage ? ' experience-header--category' : ''}${infoPage ? ' experience-header--info' : ''}`}>
    <nav className="experience-nav" aria-label="Main navigation">
      <Link className={activeCategory === 'Projects' ? 'is-active-category' : undefined} to={categoryPaths.Projects} onMouseEnter={() => onCategoryHover('Projects')} onMouseLeave={() => onCategoryHover(null)} onFocus={() => onCategoryHover('Projects')} onBlur={() => onCategoryHover(null)}>PROJECTS</Link>
      <Link className={activeCategory === 'Collaborations' ? 'is-active-category' : undefined} to={categoryPaths.Collaborations} onMouseEnter={() => onCategoryHover('Collaborations')} onMouseLeave={() => onCategoryHover(null)} onFocus={() => onCategoryHover('Collaborations')} onBlur={() => onCategoryHover(null)}>COLLABORATIONS</Link>
      <Link className={activeCategory === 'Objects' ? 'is-active-category' : undefined} to={categoryPaths.Objects} onMouseEnter={() => onCategoryHover('Objects')} onMouseLeave={() => onCategoryHover(null)} onFocus={() => onCategoryHover('Objects')} onBlur={() => onCategoryHover(null)}>OBJECTS</Link>
      <Link className={activeCategory === 'Explorations' ? 'is-active-category' : undefined} to={categoryPaths.Explorations} onMouseEnter={() => onCategoryHover('Explorations')} onMouseLeave={() => onCategoryHover(null)} onFocus={() => onCategoryHover('Explorations')} onBlur={() => onCategoryHover(null)}>EXPLORATIONS</Link>
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
  const { projects } = useProjects(`*[_type == "project" && defined(cover.asset)] | order(featured desc, year desc){_id, title, category, year, cover}`)
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
      const duration = 360
      const startTime = performance.now()
      originalScrollBehavior = document.documentElement.style.scrollBehavior
      document.documentElement.style.scrollBehavior = 'auto'
      activeSection = targetIndex

      function frame(now) {
        const progress = Math.min(1, (now - startTime) / duration)
        const eased = 1 - Math.pow(1 - progress, 3)
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
      const threshold = bounds.height * (direction > 0 ? .7 : .3)
      let nextSection = activeSection
      if (direction > 0 && activeSection < sections.length - 1 && currentY >= sectionTop + threshold) nextSection += 1
      if (direction < 0 && activeSection > 0 && currentY <= sectionTop + threshold) nextSection -= 1
      if (nextSection !== activeSection) animateTo(nextSection)
    }

    function onWheel() { cancelAnimation() }
    function onTouchMove() { cancelAnimation() }

    function onHomeTop() {
      cancelAnimation()
      animateTo(0)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('touchstart', cancelAnimation, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('portfolio:home-top', onHomeTop)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', cancelAnimation)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('portfolio:home-top', onHomeTop)
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
          onClick={() => navigate(categoryPaths[category] || '/projects')}
          aria-label={`Open ${category} projects`}
        >{video && <video className="home-category-slide__video" src={video} autoPlay muted loop playsInline preload="metadata" aria-hidden="true" />}<span>{category}</span></button>
        {index < categorySlides.length - 1 && <div className="home-slide-divider" aria-hidden="true" />}
      </div>)}
    </div>
  </main>
}

function ProjectsPage({ routeCategory }) {
  const { projects, loading, error } = useProjects(`*[_type == "project"] | order(year desc){${projectFields}}`)
  const [searchParams] = useSearchParams()
  const searchTerm = (searchParams.get('q') || '').trim().toLowerCase()
  const category = searchParams.get('category') || routeCategory
  const filteredProjects = projects.filter((project) => {
    const matchesCategory = !category || project.category?.toLowerCase() === category.toLowerCase()
    const searchable = [project.title, project.category, project.location, project.summary].filter(Boolean).join(' ').toLowerCase()
    return matchesCategory && (!searchTerm || searchable.includes(searchTerm))
  })
  const pageTitle = category || 'Projects'
  const emptyMessage = projects.length && (searchTerm || category) ? 'No projects match this selection.' : 'Projects will appear here soon.'
  return <main id="top" className="category-page">
    <section className="category-page__work" aria-label={`${pageTitle} projects`}>
      <ProjectGrid projects={filteredProjects} loading={loading} error={error} emptyMessage={emptyMessage} />
    </section>
  </main>
}

function ProjectGrid({ projects, loading, error, emptyMessage = 'Projects will appear here soon.' }) {
  if (loading) return <p className="status-message">Loading projects…</p>
  if (error && !projects.length) return <p className="status-message">Projects are temporarily unavailable. Please try again soon.</p>
  if (!projects.length) return <p className="status-message">{emptyMessage}</p>
  return <div className="project-grid">{projects.map((project) => {
    const cardContent = <>
      <div className="project-image">
        {project.previewImage ? <img src={project.previewImage} alt={project.title} /> : project.cover?.url ? <img src={imageUrl(project.cover).width(900).height(1100).fit('crop').url()} alt={project.cover.alt || project.title} /> : <div className="image-placeholder" />}
        <span>{String(project.year || '').padStart(2, '0')}</span>
      </div>
      <div className="project-caption"><div><h3>{project.title}</h3><p>{[project.category, project.location, project.year].filter(Boolean).join(' · ')}</p></div><span aria-hidden="true">↗</span></div>
    </>
    return <Link className="project-card" to={projectPath(project, projects)} key={project._id}>{cardContent}</Link>
  })}</div>
}

function ProjectPage() {
  const { category: categoryPath, slug } = useParams()
  const category = categoryFromPath(`/${categoryPath}`)
  const { projects, loading, error } = useProjects(`*[_type == "project" && category == $category]{${projectFields}}`, { category })
  const project = projects.find((item) => projectUrlSlug(item, projects) === slug)
  const [lightboxIndex, setLightboxIndex] = useState(null)
  if (loading) return <main className="section-wrap page-main"><p className="status-message">Loading project…</p></main>
  if (error && !project) return <main className="section-wrap page-main"><p className="status-message">This project is temporarily unavailable. Please try again soon.</p></main>
  if (!project) return <main className="section-wrap page-main"><p className="status-message">Project not found.</p><Link className="text-link" to="/projects">Back to projects <span>↗</span></Link></main>
  const content = Array.isArray(project.content) ? project.content.filter(Boolean) : []
  const getBlockText = (block) => block._type === 'block' ? (block.children || []).map((child) => child.text || '').join('') : block.body || block.url || ''
  const heroVideoBlock = content.find((block) => ['block', 'projectText', 'projectVideo'].includes(block._type) && getProjectVideoEmbed(getBlockText(block))?.provider === 'Vimeo')
  const heroVideo = heroVideoBlock && getProjectVideoEmbed(getBlockText(heroVideoBlock))
  const visibleContent = heroVideoBlock ? content.filter((block) => block !== heroVideoBlock) : content
  const galleryImages = [project.cover?.url && { src: imageUrl(project.cover).width(2200).url(), alt: project.cover.alt || project.title }, ...content.flatMap((block) => {
    const candidates = block._type === 'layoutImage' ? [block]
      : ['imageRow', 'imageCarousel'].includes(block._type) ? block.images || []
        : block._type === 'projectImage' ? [{ ...block.image, imageUrl: block.previewImage || safeImageUrl(block.image), caption: block.alt }]
          : block._type === 'projectDrawing' ? [{ ...block.image, imageUrl: block.imageUrl ? safeImageUrl(block.image, 2200) : '', caption: block.title }]
            : []
    return candidates.map((image) => ({ src: image.imageUrl || safeImageUrl(image, 2200), alt: image.caption || '' })).filter((image) => image.src)
  })].filter(Boolean)
  const openProjectImage = (src) => {
    const clickedPath = (() => { try { return new URL(src, window.location.origin).pathname } catch { return src } })()
    const imageIndex = galleryImages.findIndex((image) => image.src === src || (() => {
      try { return new URL(image.src, window.location.origin).pathname === clickedPath } catch { return false }
    })())
    setLightboxIndex(Math.max(0, imageIndex))
  }
  return <main className="project-detail page-main">
    {heroVideo && <div className="project-video-hero"><iframe src={heroVideo.src} title={`${project.title} video`} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen fetchPriority="high" /></div>}
    <section className="project-intro section-wrap">
      <p className="eyebrow">{[project.category, project.year, project.location].filter(Boolean).join(' · ')}</p>
      <h1>{project.title}</h1>
      {project.summary && <p className="project-summary">{project.summary}</p>}
      {project.previewImage ? <img className="detail-cover" src={project.previewImage} alt={project.title} /> : project.cover?.url && <img className="detail-cover" src={imageUrl(project.cover).width(1800).url()} alt={project.cover.alt || project.title} />}
    </section>
    <section className="story-grid">
      {visibleContent.some((block) => ['projectText', 'projectImage', 'projectDrawing', 'projectVideo'].includes(block?._type))
        ? visibleContent.map((block, index) => <ContentBlock block={block} key={block._key || index} onImageClick={openProjectImage} />)
        : visibleContent.length > 0 && <PortableText value={visibleContent} components={createProjectContentComponents(openProjectImage)} />}
    </section>
    {lightboxIndex !== null && <ProjectImageLightbox images={galleryImages} index={lightboxIndex} onChange={setLightboxIndex} onClose={() => setLightboxIndex(null)} />}
  </main>
}

class ProjectPageErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error) {
    console.error('Project page failed to render:', error)
  }

  render() {
    if (this.state.hasError) {
      return <main className="project-detail page-main project-error">
        <h1>This project could not be displayed.</h1>
        <p>Please reload the page or return to the category.</p>
        <button type="button" onClick={() => window.location.reload()}>Reload project</button>
      </main>
    }
    return this.props.children
  }
}

function safeImageUrl(source, width = 1800) {
  if (typeof source === 'string') return source
  if (!source || !source.asset) return ''
  try {
    return imageUrl(source).width(width).url()
  } catch {
    return ''
  }
}

function ContentBlock({ block, onImageClick }) {
  if (!block || typeof block !== 'object') return null
  const width = Math.min(12, Math.max(1, Number(block.layout?.width) || 12))
  const offset = Math.min(11, Math.max(0, Number(block.layout?.offset) || 0))
  const style = { '--block-span': width, '--block-start': offset + 1 }
  if (block._type === 'projectText') return <article className="story-block story-text" style={style}><div>{block.heading && <h2>{block.heading}</h2>}<p>{block.body}</p></div></article>
  if (block._type === 'projectImage') {
    const src = block.previewImage || safeImageUrl(block.image)
    return src ? <figure className="story-block story-media" style={style}><button className="project-image-trigger" onClick={() => onImageClick(src)} aria-label={`View ${block.alt || 'project image'}`}><img src={src} alt={block.alt || ''} /></button>{block.caption && <figcaption>{block.caption}</figcaption>}</figure> : null
  }
  if (block._type === 'projectDrawing') {
    const src = block.imageUrl ? safeImageUrl(block.image, 1600) : ''
    return <figure className="story-block story-media" style={style}>{src ? <button className="project-image-trigger" onClick={() => onImageClick(src)} aria-label={`View ${block.title || 'project drawing'}`}><img src={src} alt={block.alt || block.title || ''} /></button> : block.fileUrl ? <a className="drawing-link" href={block.fileUrl} target="_blank" rel="noreferrer">Open drawing: {block.title}</a> : null}{block.title && <figcaption>{block.title}</figcaption>}</figure>
  }
  if (block._type === 'projectVideo') return <div className="story-block story-media" style={style}>{block.fileUrl ? <video controls preload="metadata" src={block.fileUrl}>{block.title}</video> : block.url ? <a className="drawing-link" href={block.url} target="_blank" rel="noreferrer">Watch video: {block.title || 'Open video'}</a> : null}</div>
  return null
}

function ProjectSingleImage({ value, onImageClick }) {
  if (!value || typeof value !== 'object') return null
  const src = value.imageUrl || safeImageUrl(value)
  const width = Math.min(100, Math.max(20, Number(value.width) || 100))
  if (!src) return null
  return <figure className="story-portable-image" style={{ '--image-width': `${width}%` }}>
    <button className="project-image-trigger" onClick={() => onImageClick(src)} aria-label={`View ${value.caption || 'project image'}`}><img src={src} alt={value.caption || ''} loading="lazy" /></button>
    {value.caption && <figcaption>{value.caption}</figcaption>}
  </figure>
}

function ProjectImageRow({ value, onImageClick }) {
  const images = Array.isArray(value?.images) ? value.images.filter((image) => image?.imageUrl || image?.asset) : []
  const [ratios, setRatios] = useState(images.map(() => 1))
  useEffect(() => setRatios(images.map(() => 1)), [images.length])
  if (!images.length) return null
  return <div className="story-image-row">
    {images.map((image, index) => {
      const src = image.imageUrl || safeImageUrl(image, 1600)
      if (!src) return null
      return <figure key={image._key || index} style={{ flex: `${ratios[index] || 1} 1 0` }}>
        <button className="project-image-trigger" onClick={() => onImageClick(src)} aria-label={`View ${image.caption || 'project image'}`}><img
          src={src}
          alt={image.caption || ''}
          loading="lazy"
          onLoad={(event) => {
            const { naturalWidth, naturalHeight } = event.currentTarget
            if (naturalWidth && naturalHeight) {
              const ratio = naturalWidth / naturalHeight
              setRatios((current) => current.map((item, itemIndex) => itemIndex === index ? ratio : item))
            }
          }}
        /></button>
        {image.caption && <figcaption>{image.caption}</figcaption>}
      </figure>
    })}
  </div>
}

function ProjectImageCarousel({ value, onImageClick }) {
  const images = Array.isArray(value?.images) ? value.images.filter((image) => image?.imageUrl || image?.asset) : []
  const trackRef = useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  useEffect(() => {
    const track = trackRef.current
    if (!track) return undefined
    const updateArrows = () => {
      setCanScrollLeft(track.scrollLeft > 2)
      setCanScrollRight(track.scrollLeft + track.clientWidth < track.scrollWidth - 2)
    }
    updateArrows()
    track.addEventListener('scroll', updateArrows, { passive: true })
    const observer = new ResizeObserver(updateArrows)
    observer.observe(track)
    return () => {
      track.removeEventListener('scroll', updateArrows)
      observer.disconnect()
    }
  }, [images.length])

  if (!images.length) return null
  const move = (direction) => {
    const track = trackRef.current
    if (track) track.scrollBy({ left: direction * track.clientWidth * 0.8, behavior: 'smooth' })
  }

  return <div className="story-image-carousel">
    <div className="story-image-carousel__track" ref={trackRef}>
      {images.map((image, index) => {
        const src = image.imageUrl || safeImageUrl(image, 1800)
        if (!src) return null
        return <figure key={image._key || index}>
          <button className="project-image-trigger" onClick={() => onImageClick(src)} aria-label={`View ${image.caption || 'project image'}`}><img src={src} alt={image.caption || ''} loading="lazy" /></button>
          {image.caption && <figcaption>{image.caption}</figcaption>}
        </figure>
      })}
    </div>
    {canScrollLeft && <button className="story-image-carousel__arrow story-image-carousel__arrow--left" type="button" aria-label="Show previous images" onClick={() => move(-1)}>←</button>}
    {canScrollRight && <button className="story-image-carousel__arrow story-image-carousel__arrow--right" type="button" aria-label="Show next images" onClick={() => move(1)}>→</button>}
  </div>
}

function ProjectVideo({ value }) {
  if (!value?.videoUrl) return null
  return <figure className="story-portable-video">
    <video src={value.videoUrl} controls playsInline preload="metadata" />
    {value.caption && <figcaption>{value.caption}</figcaption>}
  </figure>
}

function getProjectVideoEmbed(markdownText = '') {
  const text = String(markdownText).replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&quot;/gi, '"').replace(/&#39;/gi, "'").replace(/&amp;/gi, '&')
  const iframeSource = text.match(/<iframe\b[\s\S]*?\bsrc\s*=\s*["'](https?:\/\/[^"']+)["']/i)?.[1]
  const directSource = text.match(/https?:\/\/(?:player\.)?(?:www\.)?vimeo\.com\/[^\s"'<>]+/i)?.[0]
  const rawSource = iframeSource || directSource
  if (!rawSource) return null
  try {
    const url = new URL(rawSource.replace(/[),.;]+$/, ''))
    const youtubeHosts = new Set(['youtube.com', 'www.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com'])
    if (youtubeHosts.has(url.hostname)) {
      const videoId = url.pathname.match(/^\/embed\/([\w-]{6,})$/)?.[1]
      return videoId ? { provider: 'YouTube', src: `https://www.youtube-nocookie.com/embed/${videoId}` } : null
    }

    if (url.hostname === 'player.vimeo.com' || url.hostname === 'vimeo.com' || url.hostname === 'www.vimeo.com') {
      const videoId = url.pathname.match(url.hostname === 'player.vimeo.com' ? /^\/video\/(\d+)$/ : /^\/(\d+)$/)?.[1]
      if (!videoId) return null
      const params = new URLSearchParams({ autoplay: '1', muted: '1', controls: '1', quality: '1080p', badge: '0', title: '0', byline: '0', portrait: '0' })
      const privacyHash = url.searchParams.get('h')
      if (privacyHash) params.set('h', privacyHash)
      return { provider: 'Vimeo', src: `https://player.vimeo.com/video/${videoId}?${params}` }
    }
    return null
  } catch {
    return null
  }
}

function PortableTextParagraph({ children, value }) {
  const source = (value.children || []).map((child) => child.text || '').join('')
  const videoEmbed = getProjectVideoEmbed(source)
  if (videoEmbed) {
    return <div className="story-youtube-embed"><iframe
      src={videoEmbed.src}
      title={`${videoEmbed.provider} project video`}
      loading="lazy"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      referrerPolicy="strict-origin-when-cross-origin"
      allowFullScreen
    /></div>
  }
  return <p className="story-portable-text">{children}</p>
}

function createProjectContentComponents(onImageClick) {
  return {
  block: {
    normal: PortableTextParagraph,
    h2: ({ children }) => <h2 className="story-portable-heading">{children}</h2>,
    h3: ({ children }) => <h3 className="story-portable-subheading">{children}</h3>,
    blockquote: ({ children }) => <blockquote className="story-portable-quote">{children}</blockquote>,
  },
  marks: {
    link: ({ children, value }) => <a href={value?.href} target="_blank" rel="noreferrer">{children}</a>,
  },
  types: {
    layoutImage: (props) => <ProjectSingleImage {...props} onImageClick={onImageClick} />,
    imageRow: (props) => <ProjectImageRow {...props} onImageClick={onImageClick} />,
    imageCarousel: (props) => <ProjectImageCarousel {...props} onImageClick={onImageClick} />,
    layoutVideo: ProjectVideo,
  },
  }
}

function ProjectImageLightbox({ images, index, onChange, onClose }) {
  const activeImage = images[index]
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowRight') onChange((current) => (current + 1) % images.length)
      if (event.key === 'ArrowLeft') onChange((current) => (current - 1 + images.length) % images.length)
    }
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', handleKeyDown); document.body.style.overflow = '' }
  }, [images.length, onChange, onClose])
  if (!activeImage) return null
  return <div className="project-lightbox" role="dialog" aria-modal="true" aria-label="Project image gallery" onClick={onClose}>
    <button className="project-lightbox__close" onClick={onClose} aria-label="Close gallery">×</button>
    <button className="project-lightbox__arrow project-lightbox__arrow--left" onClick={(event) => { event.stopPropagation(); onChange((index - 1 + images.length) % images.length) }} aria-label="Previous image">←</button>
    <figure onClick={(event) => event.stopPropagation()}>
      <img src={activeImage.src} alt={activeImage.alt} />
      <figcaption>{index + 1} / {images.length}{activeImage.alt ? ` · ${activeImage.alt}` : ''}</figcaption>
    </figure>
    <button className="project-lightbox__arrow project-lightbox__arrow--right" onClick={(event) => { event.stopPropagation(); onChange((index + 1) % images.length) }} aria-label="Next image">→</button>
  </div>
}

function AboutPage() {
  return <main className="section-wrap page-main info-page"><p className="eyebrow">About</p><h1 className="page-title about-page__title">Nazanin Akbari</h1><p className="about-copy">Architect and interior designer working across thoughtful spaces, material, and light.</p><p className="status-message">A fuller biography will be added here.</p></main>
}

function ContactPage() {
  return <main className="section-wrap page-main info-page"><p className="eyebrow">Contact</p><h1 className="page-title about-page__title">Let’s talk.</h1><p className="status-message">Contact details will be added here.</p></main>
}

function NotFoundPage() {
  return <main className="section-wrap page-main"><p className="eyebrow">404</p><h1 className="page-title">Page not found</h1><Link className="text-link" to="/">Back home <span>↗</span></Link></main>
}

function App() { return <BrowserRouter><SiteLayout /></BrowserRouter> }
export default App
