const projects = [
  { number: '01', name: 'Courtyard House', type: 'Residential · 2025', tone: 'sand' },
  { number: '02', name: 'A Quiet Interior', type: 'Interior · 2024', tone: 'clay' },
  { number: '03', name: 'Light Study', type: 'Residential · 2023', tone: 'stone' },
]

function App() {
  return (
    <main>
      <header className="site-header">
        <a className="wordmark" href="#home" aria-label="Nazanin Akbari home">NA<span>.</span></a>
        <nav aria-label="Main navigation">
          <a href="#projects">Projects</a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
        </nav>
        <span className="header-note">Architecture · Interiors</span>
      </header>

      <section className="hero" id="home">
        <p className="eyebrow">Independent architect & designer</p>
        <h1>Spaces shaped<br />by <em>light</em> and life.</h1>
        <div className="hero-bottom">
          <p>Thoughtful architecture and interiors<br />for the way we live.</p>
          <a className="text-link" href="#projects">Explore selected work <span>↘</span></a>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="art-wall"></div><div className="art-opening"></div><div className="art-shadow"></div>
          <span>01 / 03</span>
        </div>
      </section>

      <section className="projects section-wrap" id="projects">
        <div className="section-heading"><p className="eyebrow">Selected work · 2023—25</p><h2>Projects</h2></div>
        <div className="project-grid">
          {projects.map((project) => (
            <a className="project-card" href="#contact" key={project.number}>
              <div className={`project-image ${project.tone}`}><span>{project.number}</span><i aria-hidden="true"></i></div>
              <div className="project-caption"><div><h3>{project.name}</h3><p>{project.type}</p></div><span aria-hidden="true">↗</span></div>
            </a>
          ))}
        </div>
      </section>

      <section className="about section-wrap" id="about">
        <p className="eyebrow">A little about me</p>
        <p className="about-copy">I’m Nazanin Akbari, an architect and interior designer exploring the quiet connection between <em>people, place,</em> and material.</p>
        <a className="text-link" href="#contact">More about Nazanin <span>↗</span></a>
      </section>

      <footer id="contact">
        <div><p className="eyebrow">Have a project in mind?</p><p className="footer-title">Let’s talk <span>↗</span></p></div>
        <div className="footer-meta"><span>© Nazanin Akbari 2026</span><span>Architecture · Interiors</span><a href="#home">Back to top ↑</a></div>
      </footer>
    </main>
  )
}

export default App
