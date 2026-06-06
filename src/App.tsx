import { useState, useEffect } from 'react';
import { Mail, Briefcase, GraduationCap, Code2, ArrowRight, CheckCircle, Bot, Brain } from 'lucide-react';
import { ProjectCard } from './components/ProjectCard';
import { ProjectViewer } from './components/ProjectViewer';
import { StatsDashboard } from './components/StatsDashboard';
import { ParticleBackground } from './components/ParticleBackground';
import { TerminalWidget } from './components/TerminalWidget';

interface Project {
  id: string;
  title: string;
  description: string;
  tags: string[];
  githubUrl?: string;
  liveUrl?: string;
  thumbnail: string;
  isApp: boolean;
  isMobile: boolean;
  screenshots?: string[];
}

// Custom inline SVG icons for brands because they are missing in local lucide-react package version
const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg 
    viewBox="0 0 24 24" 
    stroke="currentColor" 
    strokeWidth="2" 
    fill="none" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    {...props}
  >
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
  </svg>
);

const LinkedinIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg 
    viewBox="0 0 24 24" 
    stroke="currentColor" 
    strokeWidth="2" 
    fill="none" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    {...props}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
    <rect x="2" y="9" width="4" height="12"></rect>
    <circle cx="4" cy="4" r="2"></circle>
  </svg>
);

export default function App() {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showTerminal, setShowTerminal] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
      
      const sections = ['home', 'about', 'projects', 'stats', 'contact'];
      const scrollPosition = window.scrollY + 100;
      
      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section);
            break;
          }
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const projects: Project[] = [
    {
      id: 'agentmesh',
      title: 'AgentMesh Orchestrator',
      description: 'An interactive multi-agent system builder and simulation dashboard. Design agent prompts, select topologies (Pipelines, Supervisor-Worker, Debates), and trigger real-time simulated telemetry.',
      tags: ['React', 'TypeScript', 'AI Orchestration', 'Multi-Agent Systems', 'Telemetry'],
      githubUrl: 'https://github.com/thealchemist2016/agentmesh-orchestrator',
      liveUrl: 'local://agentmesh',
      thumbnail: '/assets/screenshots/agentmesh_preview.png',
      isApp: true,
      isMobile: false
    },
    {
      id: 'smarttodo',
      title: 'SmartTodo',
      description: 'An AI-powered smart productivity mobile application that automatically prioritizes and schedules tasks. Built as a cross-platform React Native app compiled for the web.',
      tags: ['React Native', 'Expo', 'TypeScript', 'Async Storage', 'Bun'],
      githubUrl: 'https://github.com/thealchemist2016/SmartTodo',
      liveUrl: 'local://smarttodo',
      thumbnail: '/assets/screenshots/smarttodo_preview.png',
      isApp: true,
      isMobile: true
    },
    {
      id: 'xs-records',
      title: 'XS-Records',
      description: 'A database-driven distribution platform used by Indie Artists and Record Labels to submit releases. Features robust backend storage and admin management consoles.',
      tags: ['React', 'Redux', 'MongoDB', 'Node.js', 'Express', 'MERN'],
      githubUrl: 'https://github.com/thealchemist2016/team-code-ctrl', 
      liveUrl: 'local://xs-records',
      thumbnail: '/assets/screenshots/xs_records_preview.png',
      isApp: true, 
      isMobile: false,
      screenshots: [
        '/assets/screenshots/xs_records_preview.png'
      ]
    },
    {
      id: 'login-register',
      title: 'Animated Authentication Portal',
      description: 'A frontend client demonstrating secure credential entry, utilizing fluid CSS animations and custom React form handlers.',
      tags: ['React', 'JavaScript', 'CSS Animations', 'Form Validation'],
      githubUrl: 'https://github.com/thealchemist2016/login-register-app',
      liveUrl: 'local://login-register',
      thumbnail: '/assets/screenshots/auth_portal_preview.png',
      isApp: true,
      isMobile: false
    }
  ];

  return (
    <>
      <ParticleBackground />
      {/* Navigation */}
      <nav className={`navbar glass ${scrolled ? 'scrolled' : ''}`}>
        <div className="container">
          <a href="#home" className="logo">
            Michael<span>Byrd</span>
          </a>
          <ul className="nav-links">
            <li><a href="#home" className={activeSection === 'home' ? 'active' : ''}>Home</a></li>
            <li><a href="#about" className={activeSection === 'about' ? 'active' : ''}>About</a></li>
            <li><a href="#projects" className={activeSection === 'projects' ? 'active' : ''}>Projects</a></li>
            <li><a href="#stats" className={activeSection === 'stats' ? 'active' : ''}>Analytics</a></li>
            <li><a href="#contact" className={activeSection === 'contact' ? 'active' : ''}>Contact</a></li>
          </ul>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="hero">
        <div className="container">
          <div className="hero-grid">
            <div className="hero-content">
              <h4>Available for Work</h4>
              <h1 className="gradient-text">AI Agent Architect & Developer</h1>
              <p>
                Hi, I'm Michael James Byrd Jr. I specialize in building autonomous AI agents and orchestrating multi-agent systems. I bridge the gap between robust system architecture and future-proof AI solutions.
              </p>
              <div className="hero-buttons">
                <a href="#projects" className="btn btn-primary">
                  View My Work
                  <ArrowRight size={16} style={{ marginLeft: '8px' }} />
                </a>
                <a href="#contact" className="btn btn-secondary">Contact Me</a>
              </div>
            </div>
            
            <div className="hero-interactive-card">
              <div className="card-switcher">
                <button 
                  className={!showTerminal ? 'active' : ''} 
                  onClick={() => setShowTerminal(false)}
                >
                  Profile
                </button>
                <button 
                  className={showTerminal ? 'active' : ''} 
                  onClick={() => setShowTerminal(true)}
                >
                  Terminal
                </button>
              </div>

              <div className="interactive-card-content">
                {!showTerminal ? (
                  <div className="avatar-container animate-fade-in">
                    <div className="avatar-frame">
                      <img src="/assets/avatar.jpg" alt="Michael Byrd Avatar" />
                    </div>
                  </div>
                ) : (
                  <TerminalWidget onLaunchProject={(id) => {
                    const matched = projects.find(p => p.id === id);
                    if (matched) {
                      setSelectedProject(matched);
                    }
                  }} />
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about">
        <div className="container">
          <h2 className="section-title">About Me</h2>
          <p className="subtitle">
            An AI Agent Architect with a passion for building autonomous agents, multi-agent orchestrations, and future-proof digital solutions.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', margin: '40px 0' }}>
            {/* Experience Card */}
            <div className="glass-card tech-category-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Briefcase size={20} color="#dc2626" />
                Work Experience
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>AI & Web Developer</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--accent)' }}>Phoenix Technology | 2017 - Present</p>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Leading the integration of LLMs and autonomous agents. Specializing in multi-agent orchestration, prompt engineering, and building robust AI-driven applications.
                  </p>
                </div>
                <div>
                  <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>Front End Developer</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--accent)' }}>Innovative Org. | 2015 - 2017</p>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Created responsive layouts, single page apps, and web interfaces using modern frameworks.
                  </p>
                </div>
              </div>
            </div>

            {/* Education Card */}
            <div className="glass-card tech-category-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <GraduationCap size={20} color="#dc2626" />
                Education
              </h3>
              <div>
                <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>Full Stack Web Development Program</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--accent)' }}>Southern Careers Institute | 2018 - 2019</p>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                  Acquired deep knowledge of web application frameworks, ASP.NET, Node.js, database integration with SQL/NoSQL, and JavaScript. Transitioned into AI development, focusing on vector databases, RAG systems, and LLM integrations.
                </p>
              </div>
            </div>
          </div>

          {/* Toolset Grid */}
          <div className="toolset-section">
            <h3 className="section-title" style={{ fontSize: '1.75rem' }}>Core Technical Stack</h3>
            <div className="tech-categories">
              {/* AI Card */}
              <div className="glass-card tech-category-card">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Bot size={18} />
                  AI & LLMs
                </h3>
                <div className="tech-list">
                  <span className="tech-item"><CheckCircle size={12} color="#dc2626" /> OpenAI API</span>
                  <span className="tech-item"><CheckCircle size={12} color="#dc2626" /> Anthropic Claude</span>
                  <span className="tech-item"><CheckCircle size={12} color="#dc2626" /> LangChain</span>
                  <span className="tech-item"><CheckCircle size={12} color="#dc2626" /> Vercel AI SDK</span>
                  <span className="tech-item"><CheckCircle size={12} color="#dc2626" /> AutoGen</span>
                  <span className="tech-item"><CheckCircle size={12} color="#dc2626" /> LlamaIndex</span>
                </div>
              </div>

              {/* Backend Card */}
              <div className="glass-card tech-category-card">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Brain size={18} />
                  Backend & Vector DBs
                </h3>
                <div className="tech-list">
                  <span className="tech-item"><CheckCircle size={12} color="#dc2626" /> Python</span>
                  <span className="tech-item"><CheckCircle size={12} color="#dc2626" /> Node.js</span>
                  <span className="tech-item"><CheckCircle size={12} color="#dc2626" /> Pinecone</span>
                  <span className="tech-item"><CheckCircle size={12} color="#dc2626" /> Supabase</span>
                  <span className="tech-item"><CheckCircle size={12} color="#dc2626" /> PostgreSQL (pgvector)</span>
                  <span className="tech-item"><CheckCircle size={12} color="#dc2626" /> REST APIs</span>
                </div>
              </div>

              {/* Frontend Card */}
              <div className="glass-card tech-category-card">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Code2 size={18} />
                  Modern Tech
                </h3>
                <div className="tech-list">
                  <span className="tech-item"><CheckCircle size={12} color="#dc2626" /> React</span>
                  <span className="tech-item"><CheckCircle size={12} color="#dc2626" /> Next.js</span>
                  <span className="tech-item"><CheckCircle size={12} color="#dc2626" /> TypeScript</span>
                  <span className="tech-item"><CheckCircle size={12} color="#dc2626" /> Tailwind CSS</span>
                  <span className="tech-item"><CheckCircle size={12} color="#dc2626" /> Vercel Deployment</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Projects Grid Section */}
      <section id="projects">
        <div className="container">
          <h2 className="section-title">Showcase Projects</h2>
          <p className="subtitle">
            Explore interactive versions of my main projects. Click on any application to run it live inside your browser frame.
          </p>

          <div className="projects-grid">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                title={project.title}
                description={project.description}
                tags={project.tags}
                githubUrl={project.githubUrl}
                liveUrl={project.liveUrl}
                thumbnail={project.thumbnail}
                isApp={project.isApp}
                onView={() => setSelectedProject(project)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Analytics/Dashboard Section */}
      <section id="stats">
        <div className="container">
          <StatsDashboard />
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact-section">
        <div className="container">
          <h2 className="section-title">Get In Touch</h2>
          <p className="subtitle">
            I am currently open to new opportunities. Let's discuss how my full-stack skills can benefit your development team.
          </p>

          <div className="contact-grid">
            <div className="glass-card contact-card">
              <Mail className="icon" size={32} />
              <h4>Email</h4>
              <p><a href="mailto:mbyrd405@outlook.com">mbyrd405@outlook.com</a></p>
            </div>
            
            <div className="glass-card contact-card">
              <LinkedinIcon className="icon" style={{ width: '32px', height: '32px', color: 'var(--accent)' }} />
              <h4>LinkedIn</h4>
              <p><a href="https://www.linkedin.com/in/mbyrd405" target="_blank" rel="noopener noreferrer">mbyrd405</a></p>
            </div>

            <div className="glass-card contact-card">
              <GithubIcon className="icon" style={{ width: '32px', height: '32px', color: 'var(--accent)' }} />
              <h4>GitHub</h4>
              <p><a href="https://github.com/thealchemist2016" target="_blank" rel="noopener noreferrer">thealchemist2016</a></p>
            </div>
          </div>

          <div style={{ marginTop: '48px' }}>
            <a href="mailto:mbyrd405@outlook.com" className="btn btn-primary">Hire Me Now</a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-socials">
            <a href="mailto:mbyrd405@outlook.com"><Mail size={18} /></a>
            <a href="https://www.linkedin.com/in/mbyrd405" target="_blank" rel="noopener noreferrer"><LinkedinIcon style={{ width: '18px', height: '18px' }} /></a>
            <a href="https://github.com/thealchemist2016" target="_blank" rel="noopener noreferrer"><GithubIcon style={{ width: '18px', height: '18px' }} /></a>
          </div>
          <p>© {new Date().getFullYear()} Michael James Byrd Jr. All rights reserved.</p>
        </div>
      </footer>

      {/* Interactive Project Viewer Modal */}
      {selectedProject && (
        <ProjectViewer
          title={selectedProject.title}
          description={selectedProject.description}
          liveUrl={selectedProject.liveUrl}
          githubUrl={selectedProject.githubUrl}
          isMobile={selectedProject.isMobile}
          screenshots={selectedProject.screenshots}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </>
  );
}
