import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, RotateCcw, Bot, Terminal, Cpu, FileCode, Download, 
  Shield, BarChart2, FileText
} from 'lucide-react';
import './AgentMeshOrchestrator.css';

// TypeScript interfaces
interface Agent {
  id: string;
  name: string;
  role: string;
  color: string;
  prompt: string;
  model: string;
  temperature: number;
  tools: {
    search: boolean;
    sandbox: boolean;
    database: boolean;
    filesystem: boolean;
  };
  pos: { x: number; y: number }; // position in percentage
}

interface Preset {
  id: string;
  name: string;
  description: string;
  topology: 'pipeline' | 'hierarchical' | 'peer';
  defaultPrompt: string;
  agents: Agent[];
}

interface LogEntry {
  id: string;
  agentId?: string;
  agentName?: string;
  type: 'system' | 'agent' | 'tool';
  tag: string;
  text: string;
}

interface FileArtifact {
  name: string;
  language: string;
  content: string;
}

interface Telemetry {
  totalTokens: number;
  apiCost: number;
  latency: number;
  handoffs: number;
  progress: number;
}

// Preset systems definition
const PRESETS: Preset[] = [
  {
    id: 'software-swarm',
    name: 'Software Dev Swarm',
    description: 'Pipeline with a feedback loop. PM writes specs -> Tech Lead designs modules -> Dev writes code -> QA reviews and sends bugs back to Dev -> DevOps deploys.',
    topology: 'pipeline',
    defaultPrompt: 'Create a secure Node.js JWT Authentication route with unit tests.',
    agents: [
      {
        id: 'pm',
        name: 'Product Manager',
        role: 'Product Specification',
        color: '#a855f7',
        prompt: 'You are a PM. Write clear, detailed functional requirements for user authentication, specifying endpoint structure, security expectations, and payload validation criteria.',
        model: 'Gemini 1.5 Pro',
        temperature: 0.2,
        tools: { search: true, sandbox: false, database: false, filesystem: true },
        pos: { x: 20, y: 30 }
      },
      {
        id: 'lead',
        name: 'Tech Lead',
        role: 'System Architecture',
        color: '#ec4899',
        prompt: 'You are a Software Architect. Translate PM requirements into module directories, database schemas, cryptographic algorithms, and dependency lists.',
        model: 'Claude 3.5 Sonnet',
        temperature: 0.1,
        tools: { search: true, sandbox: false, database: true, filesystem: true },
        pos: { x: 50, y: 20 }
      },
      {
        id: 'dev',
        name: 'Developer',
        role: 'Code Generation',
        color: '#22c55e',
        prompt: 'You are a Senior Engineer. Write clean, modular, typed code matching the architectural specifications. Ensure error boundaries and robust security standards are met.',
        model: 'GPT-4o',
        temperature: 0.5,
        tools: { search: false, sandbox: true, database: true, filesystem: true },
        pos: { x: 30, y: 75 }
      },
      {
        id: 'qa',
        name: 'QA Engineer',
        role: 'Code Review & Testing',
        color: '#f59e0b',
        prompt: 'You are a QA Engineer. Run static analysis, write security unit tests, mock external database components, and review logic for edge-cases or vulnerability leakage.',
        model: 'Llama 3.1 70B',
        temperature: 0.2,
        tools: { search: false, sandbox: true, database: false, filesystem: true },
        pos: { x: 70, y: 75 }
      },
      {
        id: 'devops',
        name: 'DevOps Engineer',
        role: 'Deployment Scripting',
        color: '#06b6d4',
        prompt: 'You are a Site Reliability Engineer. Design a containerization architecture, environment variables, health checks, and build pipeline configs to compile and deploy modules.',
        model: 'Gemini 1.5 Flash',
        temperature: 0.1,
        tools: { search: false, sandbox: true, database: true, filesystem: true },
        pos: { x: 80, y: 30 }
      }
    ]
  },
  {
    id: 'advisory-debate',
    name: 'Advisory Consensus Board',
    description: 'Debate / Consensus topology. Two analyst agents argue different viewpoints on a topic, moderated by a synthesizer agent, producing an executive report.',
    topology: 'peer',
    defaultPrompt: 'Analyze the impact of interest rate cuts on high-growth technology stock valuation.',
    agents: [
      {
        id: 'macro',
        name: 'Macro Analyst',
        role: 'Bull Viewpoint',
        color: '#3b82f6',
        prompt: 'You are a bullish Macroeconomist. Present arguments showing why interest rate cuts increase market liquidity, lower corporate discount factors, and favor tech valuations.',
        model: 'Claude 3.5 Sonnet',
        temperature: 0.7,
        tools: { search: true, sandbox: false, database: false, filesystem: true },
        pos: { x: 25, y: 30 }
      },
      {
        id: 'risk',
        name: 'Risk Analyst',
        role: 'Bear Viewpoint',
        color: '#ef4444',
        prompt: 'You are a bearish Risk Officer. Present counterarguments showing why rate cuts signal recession risk, core inflation stickiness, and increased volatility in tech valuations.',
        model: 'GPT-4o',
        temperature: 0.7,
        tools: { search: true, sandbox: false, database: false, filesystem: true },
        pos: { x: 25, y: 70 }
      },
      {
        id: 'moderator',
        name: 'Moderator / Synthesizer',
        role: 'Consensus Weaver',
        color: '#14b8a6',
        prompt: 'You are an objective Research Coordinator. Analyze the debate, evaluate structural data points from both sides, discard hyperbole, and build a balanced outlook summary.',
        model: 'Gemini 1.5 Pro',
        temperature: 0.1,
        tools: { search: false, sandbox: false, database: true, filesystem: true },
        pos: { x: 55, y: 50 }
      },
      {
        id: 'director',
        name: 'Executive Director',
        role: 'Final Executive Decision',
        color: '#f43f5e',
        prompt: 'You are a Fund Manager. Authorize a definitive investment recommendation report based on the synthesizer\'s consensus framework, applying capital allocation bounds.',
        model: 'Gemini 1.5 Pro',
        temperature: 0.3,
        tools: { search: false, sandbox: false, database: false, filesystem: true },
        pos: { x: 80, y: 50 }
      }
    ]
  },
  {
    id: 'support-router',
    name: 'Customer Support Router',
    description: 'Orchestrator-Worker pattern. A router agent inspects customer query semantics, dispatches it to specialized specialists, and aggregates the solution.',
    topology: 'hierarchical',
    defaultPrompt: 'Customer complains about being billed twice for their monthly subscription after a payment error.',
    agents: [
      {
        id: 'router',
        name: 'Dispatcher Router',
        role: 'Intent Classification',
        color: '#14b8a6',
        prompt: 'You are a Customer Operations Triage Agent. Read the query, determine the primary intent category (billing, technical, account), and assign it to the correct specialized sub-agent.',
        model: 'Gemini 1.5 Flash',
        temperature: 0.0,
        tools: { search: false, sandbox: false, database: true, filesystem: false },
        pos: { x: 30, y: 50 }
      },
      {
        id: 'billing',
        name: 'Billing Specialist',
        role: 'Transaction Auditing',
        color: '#a855f7',
        prompt: 'You are a Financial Operations Agent. Inspect transaction ledgers, lookup invoice statuses, double check payment gateway responses, and draft refund authorizations.',
        model: 'Claude 3.5 Sonnet',
        temperature: 0.2,
        tools: { search: false, sandbox: false, database: true, filesystem: true },
        pos: { x: 70, y: 25 }
      },
      {
        id: 'tech',
        name: 'Tech Support Specialist',
        role: 'API Diagnostics',
        color: '#06b6d4',
        prompt: 'You are a Tier 2 Technical Engineer. Inspect error trace logs, webhook payloads, rate limit indicators, and database status codes to address core systemic bugs.',
        model: 'GPT-4o',
        temperature: 0.3,
        tools: { search: false, sandbox: true, database: true, filesystem: true },
        pos: { x: 70, y: 75 }
      }
    ]
  }
];

// Helper to color keys in simple syntax highlighter
const formatCode = (code: string) => {
  if (!code) return '';
  
  // Basic Regex highlighting
  let escaped = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Highlights keywords
  const keywords = ['const', 'let', 'var', 'function', 'class', 'import', 'export', 'from', 'return', 'async', 'await', 'if', 'else', 'for', 'while', 'interface', 'type', 'default', 'extends', 'try', 'catch', 'throw', 'new', 'describe', 'test', 'expect'];
  escaped = escaped.replace(
    new RegExp(`\\b(${keywords.join('|')})\\b`, 'g'),
    '<span class="hl-keyword">$1</span>'
  );

  // Strings
  escaped = escaped.replace(/(['"`])(.*?)\1/g, '<span class="hl-string">$1$2$1</span>');

  // Comments
  escaped = escaped.replace(/(\/\/.*)/g, '<span class="hl-comment">$1</span>');
  escaped = escaped.replace(/(\/\*\*[\s\S]*?\*\/)/g, '<span class="hl-comment">$1</span>');

  // Numbers
  escaped = escaped.replace(/\b(\d+)\b/g, '<span class="hl-number">$1</span>');

  return escaped;
};

export const AgentMeshOrchestrator: React.FC = () => {
  // Config state
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  const currentPreset = PRESETS[selectedPresetIndex];
  const [agentsList, setAgentsList] = useState<Agent[]>(currentPreset.agents);
  const [selectedAgentId, setSelectedAgentId] = useState<string>(currentPreset.agents[0].id);
  const [userPrompt, setUserPrompt] = useState(currentPreset.defaultPrompt);

  // Selected agent config edit bindings
  const activeAgent = agentsList.find(a => a.id === selectedAgentId) || agentsList[0];

  // Simulation parameters
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1); // 1x, 2x, 5x, 10x
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [activePath, setActivePath] = useState<{ from: string; to: string } | null>(null);
  
  // Dashboard & outputs
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [telemetry, setTelemetry] = useState<Telemetry>({
    totalTokens: 0,
    apiCost: 0,
    latency: 0,
    handoffs: 0,
    progress: 0
  });
  const [agentTokenUsage, setAgentTokenUsage] = useState<{ [id: string]: number }>({});
  const [artifacts, setArtifacts] = useState<FileArtifact[]>([]);
  const [activeFileName, setActiveFileName] = useState<string>('');

  // Refs for logs auto scroll
  const consoleBodyRef = useRef<HTMLDivElement>(null);
  const simIntervalRef = useRef<number | null>(null);
  const simStepRef = useRef<number>(0);

  // Sync state when switching presets
  useEffect(() => {
    setAgentsList(currentPreset.agents);
    setSelectedAgentId(currentPreset.agents[0].id);
    setUserPrompt(currentPreset.defaultPrompt);
    resetSimulation();
  }, [selectedPresetIndex]);

  // Handle agent customization
  const updateAgentProperty = (property: keyof Agent, value: any) => {
    setAgentsList(prev => prev.map(a => {
      if (a.id === selectedAgentId) {
        return { ...a, [property]: value };
      }
      return a;
    }));
  };

  const updateAgentTool = (toolName: keyof Agent['tools'], checked: boolean) => {
    setAgentsList(prev => prev.map(a => {
      if (a.id === selectedAgentId) {
        return {
          ...a,
          tools: {
            ...a.tools,
            [toolName]: checked
          }
        };
      }
      return a;
    }));
  };

  // Auto-scroll logs terminal
  useEffect(() => {
    if (consoleBodyRef.current) {
      consoleBodyRef.current.scrollTop = consoleBodyRef.current.scrollHeight;
    }
  }, [logs]);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    };
  }, []);

  // Generate mock simulation steps based on the current preset & user prompt
  const executeSimulationStep = () => {
    const step = simStepRef.current;
    
    // Add logs, telemetry, artifacts incrementally
    if (currentPreset.id === 'software-swarm') {
      const pmAgent = agentsList.find(a => a.id === 'pm')!;
      const leadAgent = agentsList.find(a => a.id === 'lead')!;
      const devAgent = agentsList.find(a => a.id === 'dev')!;
      const qaAgent = agentsList.find(a => a.id === 'qa')!;
      const devopsAgent = agentsList.find(a => a.id === 'devops')!;

      switch (step) {
        case 0:
          // System starts
          addSystemLog('Initializing AI Agent Swarm topology: Pipeline with feedback loop.');
          addSystemLog(`User goal received: "${userPrompt}"`);
          setActiveNodeId('pm');
          incrementTelemetry(800, 0.016, 2, 0, 5);
          break;
        case 1:
          // PM starts thinking
          addAgentLog(pmAgent, 'Analyzing product requirements. Invoking Web Search to research competitors and standard specifications.');
          addToolLog(pmAgent, 'Web Search: "standard OAuth JWT claims auth best practices Node.js"');
          incrementTelemetry(1200, 0.024, 3, 0, 10);
          break;
        case 2:
          // PM outputs specs
          addAgentLog(pmAgent, 'Product Specifications draft completed. Sending specifications document to Tech Lead.');
          setArtifacts([
            {
              name: 'specifications.md',
              language: 'markdown',
              content: `# Product Specification: JWT Authentication Route\n\n## Objective\nImplement a secure login and registration route matching developer requirements: "${userPrompt}".\n\n## User Flow\n1. POST /api/register (username, password)\n2. POST /api/login (username, password) -> JWT token returned.\n3. GET /api/profile (Protected, requires Bearer token).\n\n## Security Standards\n- Argon2 / Bcrypt hashing for password databases.\n- Tokens expire in 1 hour.\n- Rate limit validation.`
            }
          ]);
          setActiveFileName('specifications.md');
          setActivePath({ from: 'pm', to: 'lead' });
          incrementTelemetry(1500, 0.030, 2.5, 1, 20);
          break;
        case 3:
          // Tech lead takes over
          setActiveNodeId('lead');
          setActivePath(null);
          addSystemLog('Handoff: Tech Lead is analyzing specifications.md.');
          addAgentLog(leadAgent, 'Designing file architecture and database schemes. Selecting dependencies: bcryptjs, jsonwebtoken, express-validator.');
          incrementTelemetry(2100, 0.042, 4, 1, 30);
          break;
        case 4:
          // Tech lead writes architecture
          addAgentLog(leadAgent, 'Database model & architectural layouts designed. Dispatching design schemas to Developer.');
          setArtifacts(prev => [
            ...prev,
            {
              name: 'architecture.json',
              language: 'json',
              content: `{\n  "directory": "src",\n  "database": "MongoDB / Mongoose Schema",\n  "packages": {\n    "bcryptjs": "^2.4.3",\n    "jsonwebtoken": "^9.0.0",\n    "express-validator": "^7.0.0"\n  },\n  "routes": [\n    "src/routes/auth.ts",\n    "src/models/User.ts",\n    "src/middleware/auth.ts"\n  ]\n}`
            }
          ]);
          setActiveFileName('architecture.json');
          setActivePath({ from: 'lead', to: 'dev' });
          incrementTelemetry(2400, 0.048, 3.2, 2, 40);
          break;
        case 5:
          // Developer codes
          setActiveNodeId('dev');
          setActivePath(null);
          addSystemLog('Handoff: Developer is coding auth.ts and User.ts.');
          addAgentLog(devAgent, 'Generating express router endpoints. Injecting input validation middleware, password hashing, and token signature payloads.');
          incrementTelemetry(4200, 0.084, 5.5, 2, 50);
          break;
        case 6:
          // Developer outputs code
          addAgentLog(devAgent, 'Source code draft completed. Dispatching to QA Engineer for testing.');
          setArtifacts(prev => [
            ...prev,
            {
              name: 'auth.ts',
              language: 'typescript',
              content: `import express, { Request, Response } from 'express';\nimport bcrypt from 'bcryptjs';\nimport jwt from 'jsonwebtoken';\nimport { body, validationResult } from 'express-validator';\nimport { User } from '../models/User';\n\nconst router = express.Router();\nconst JWT_SECRET = process.env.JWT_SECRET || 'supersecret';\n\nrouter.post('/register',\n  body('username').isString().isLength({ min: 3 }),\n  body('password').isLength({ min: 6 }),\n  async (req: Request, res: Response) => {\n    const errors = validationResult(req);\n    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });\n    \n    const { username, password } = req.body;\n    const hashedPassword = await bcrypt.hash(password, 10);\n    \n    const user = new User({ username, password: hashedPassword });\n    await user.save();\n    res.status(201).json({ message: 'User registered' });\n  }\n);\n\nrouter.post('/login', async (req: Request, res: Response) => {\n  const { username, password } = req.body;\n  const user = await User.findOne({ username });\n  if (!user) return res.status(400).json({ error: 'Invalid credentials' });\n  \n  // BUG: developer forgot to check password matches before signing JWT!\n  const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });\n  res.json({ token });\n});\n\nexport default router;`
            }
          ]);
          setActiveFileName('auth.ts');
          setActivePath({ from: 'dev', to: 'qa' });
          incrementTelemetry(3900, 0.078, 4.8, 3, 60);
          break;
        case 7:
          // QA takes over
          setActiveNodeId('qa');
          setActivePath(null);
          addSystemLog('Handoff: QA Engineer runs compliance & vulnerability tests.');
          addAgentLog(qaAgent, 'Setting up Jest workspace environment. Invoking Sandbox Execution to run auth.test.ts against code.');
          addToolLog(qaAgent, 'Sandbox Execution: "npm run test:auth"');
          incrementTelemetry(2500, 0.050, 4.2, 3, 70);
          break;
        case 8:
          // QA finds bug!
          addAgentLog(qaAgent, 'TEST FAILED: Login success with incorrect credentials. Vulnerability found: Password match check missing! Routing report back to Developer for repair.');
          setArtifacts(prev => [
            ...prev,
            {
              name: 'qa_report.json',
              language: 'json',
              content: `{\n  "vulnerabilities": [\n    {\n      "severity": "HIGH",\n      "endpoint": "POST /api/login",\n      "issue": "Password is not validated. Any password will authenticate a matching username.",\n      "solution": "Add await bcrypt.compare(password, user.password) check."\n    }\n  ],\n  "status": "REJECTED"\n}`
            }
          ]);
          setActiveFileName('qa_report.json');
          setActivePath({ from: 'qa', to: 'dev' });
          incrementTelemetry(2200, 0.044, 3.5, 4, 75);
          break;
        case 9:
          // Developer fixes code
          setActiveNodeId('dev');
          setActivePath(null);
          addSystemLog('Repair Loop: Developer resolving issue highlighted in qa_report.json.');
          addAgentLog(devAgent, 'Vulnerability resolved. Added bcrypt.compare check inside the login controller. Dispatching updated files back to QA.');
          setArtifacts(prev => prev.map(f => {
            if (f.name === 'auth.ts') {
              return {
                ...f,
                content: f.content.replace(
                  `  // BUG: developer forgot to check password matches before signing JWT!\n  const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });`,
                  `  const isMatch = await bcrypt.compare(password, user.password);\n  if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });\n  \n  const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });`
                )
              };
            }
            return f;
          }));
          setActiveFileName('auth.ts');
          setActivePath({ from: 'dev', to: 'qa' });
          incrementTelemetry(2600, 0.052, 4.0, 5, 85);
          break;
        case 10:
          // QA runs tests again and approves
          setActiveNodeId('qa');
          setActivePath(null);
          addSystemLog('QA running validation suites on updated codebase.');
          addToolLog(qaAgent, 'Sandbox Execution: "npm run test:auth" -> ALL TESTS PASSED (100% Coverage)');
          addAgentLog(qaAgent, 'Security validation verified. Output approved. Dispatching system release to DevOps Engineer.');
          setArtifacts(prev => [
            ...prev,
            {
              name: 'auth.test.ts',
              language: 'typescript',
              content: `import request from 'supertest';\nimport app from '../app';\n\ndescribe('Auth endpoints', () => {\n  it('should block incorrect password', async () => {\n    const res = await request(app)\n      .post('/api/login')\n      .send({ username: 'mike', password: 'wrongpassword' });\n    expect(res.status).toBe(400);\n  });\n});`
            }
          ]);
          setActiveFileName('auth.test.ts');
          setActivePath({ from: 'qa', to: 'devops' });
          incrementTelemetry(2800, 0.056, 3.8, 6, 90);
          break;
        case 11:
          // DevOps deploys
          setActiveNodeId('devops');
          setActivePath(null);
          addSystemLog('Handoff: DevOps compiling deployment assets.');
          addAgentLog(devopsAgent, 'Configuring docker-compose container mesh. Setting up environment configs and volume hooks.');
          setArtifacts(prev => [
            ...prev,
            {
              name: 'docker-compose.yml',
              language: 'yaml',
              content: `version: '3.8'\nservices:\n  auth-app:\n    build: .\n    ports:\n      - "8080:8080"\n    environment:\n      - NODE_ENV=production\n      - JWT_SECRET=env_loaded_key\n      - MONGO_URI=mongodb://db:2717/auth\n    depends_on:\n      - db\n  db:\n    image: mongo:latest\n    ports:\n      - "27017:27017"`
            }
          ]);
          setActiveFileName('docker-compose.yml');
          incrementTelemetry(3200, 0.064, 4.5, 6, 95);
          break;
        case 12:
          // System completes
          setActiveNodeId(null);
          addSystemLog('AI agent swarm workflow execution completed successfully!');
          addSystemLog('Final code build exported to workspace files.');
          incrementTelemetry(500, 0.010, 1.2, 7, 100);
          setIsPlaying(false);
          break;
        default:
          break;
      }
    } else if (currentPreset.id === 'advisory-debate') {
      const macroAgent = agentsList.find(a => a.id === 'macro')!;
      const riskAgent = agentsList.find(a => a.id === 'risk')!;
      const modAgent = agentsList.find(a => a.id === 'moderator')!;
      const dirAgent = agentsList.find(a => a.id === 'director')!;

      switch (step) {
        case 0:
          addSystemLog('Initializing AI Advisory Board: Peer debate with synthesis moderate.');
          addSystemLog(`User question: "${userPrompt}"`);
          setActiveNodeId('macro');
          incrementTelemetry(1200, 0.024, 2.5, 0, 10);
          break;
        case 1:
          addAgentLog(macroAgent, 'Constructing Bull thesis. Rates cuts lower capital expenses for highly leveraged technology startups, inflating asset multiples.');
          addToolLog(macroAgent, 'Web Search: "macro inflation projections technology valuations rates cuts"');
          setArtifacts([
            {
              name: 'macro_outlook.md',
              language: 'markdown',
              content: `# Macroeconomic Bull Case: Technology Valuations\n\n## Abstract\nInterest rate reductions are highly beneficial for high-growth tech.\n\n## Key Factors\n- **Lower WACC**: Lower cost of capital yields higher discounted present values for cash flows.\n- **Risk Appetite**: Capital shifts out of yields and into equity indices.`
            }
          ]);
          setActiveFileName('macro_outlook.md');
          setActivePath({ from: 'macro', to: 'moderator' });
          incrementTelemetry(2800, 0.056, 4.0, 1, 25);
          break;
        case 2:
          setActiveNodeId('risk');
          setActivePath(null);
          addSystemLog('Moderator routes thread to Risk Analyst for counter-perspective.');
          addAgentLog(riskAgent, 'Constructing Bear thesis. Historical data suggests rate cuts are often defensive moves responding to underlying recessions, creating revenue earnings contractions.');
          addToolLog(riskAgent, 'Web Search: "historical market earnings drops post first rate cuts recessions"');
          setArtifacts(prev => [
            ...prev,
            {
              name: 'risk_assessment.md',
              language: 'markdown',
              content: `# Risk Officer Bear Case: Recessionary Contractions\n\n## Abstract\nRate cuts indicate lagging macroeconomic stress, not a clear bull run.\n\n## Points of Concern\n- **Defensive Cuts**: Fed typically cuts rates when growth is stalling.\n- **Earnings Multiple Compression**: Multiples contract if sales growth falls below inflation.`
            }
          ]);
          setActiveFileName('risk_assessment.md');
          setActivePath({ from: 'risk', to: 'moderator' });
          incrementTelemetry(3100, 0.062, 4.5, 2, 50);
          break;
        case 3:
          setActiveNodeId('moderator');
          setActivePath(null);
          addSystemLog('Moderator synthesizing macro arguments.');
          addAgentLog(modAgent, 'Auditing structural models. Removing bias from macro reports. Building dynamic risk-reward weighting.');
          setArtifacts(prev => [
            ...prev,
            {
              name: 'consensus_summary.md',
              language: 'markdown',
              content: `# Macro/Risk Synthesis Consensus\n\n## Balanced Outlook\n- Rate cuts support startup discounted multipliers in short-term valuation modeling.\n- Long-term performance is contingent on whether economic growth sustains above a 2% threshold.`
            }
          ]);
          setActiveFileName('consensus_summary.md');
          setActivePath({ from: 'moderator', to: 'director' });
          incrementTelemetry(2500, 0.050, 3.8, 3, 75);
          break;
        case 4:
          setActiveNodeId('director');
          setActivePath(null);
          addSystemLog('Executive Director structuring final allocation mandate.');
          addAgentLog(dirAgent, 'Reviewing consensus. Authorizing partial capital deployment: 60% high-growth growth equities, 40% hedging assets.');
          setArtifacts(prev => [
            ...prev,
            {
              name: 'executive_decision.md',
              language: 'markdown',
              content: `# Executive Decision & Capital Allocation Mandate\n\n## Portfolio Adjustments\nBased on macroeconomic debate files and synthesis, the fund will deploy:\n- **60% Allocation**: High-growth Tech Growth Index.\n- **40% Allocation**: Treasury notes to hedge inflation.`
            }
          ]);
          setActiveFileName('executive_decision.md');
          incrementTelemetry(3000, 0.060, 4.2, 4, 95);
          break;
        case 5:
          setActiveNodeId(null);
          addSystemLog('Consensus debate completed. Portfolio recommendation generated.');
          incrementTelemetry(400, 0.008, 1.0, 4, 100);
          setIsPlaying(false);
          break;
        default:
          break;
      }
    } else if (currentPreset.id === 'support-router') {
      const routerAgent = agentsList.find(a => a.id === 'router')!;
      const billingAgent = agentsList.find(a => a.id === 'billing')!;

      switch (step) {
        case 0:
          addSystemLog('Initializing Support Orchestration: Semantics Router.');
          addSystemLog(`Ticket received: "${userPrompt}"`);
          setActiveNodeId('router');
          incrementTelemetry(600, 0.012, 1.5, 0, 10);
          break;
        case 1:
          addAgentLog(routerAgent, 'Analyzing ticket semantics. Query references "billed twice" and "payment error". Routing target: BILLING.');
          setArtifacts([
            {
              name: 'customer_ticket.json',
              language: 'json',
              content: `{\n  "ticket_id": "TKT-4919",\n  "subject": "Duplicate billing query",\n  "content": "${userPrompt}"\n}`
            }
          ]);
          setActiveFileName('customer_ticket.json');
          setActivePath({ from: 'router', to: 'billing' });
          incrementTelemetry(1200, 0.024, 2.0, 1, 35);
          break;
        case 2:
          setActiveNodeId('billing');
          setActivePath(null);
          addSystemLog('Handoff: Billing Specialist querying stripe ledger DB.');
          addAgentLog(billingAgent, 'Querying database using payment ID. Detecting double invoice posting due to race condition webhook failures.');
          addToolLog(billingAgent, 'Database Query: "SELECT * FROM charges WHERE user_id = \'usr_92\'" -> 2 charges posted ($29.99 x 2)');
          setArtifacts(prev => [
            ...prev,
            {
              name: 'billing_audit.json',
              language: 'json',
              content: `{\n  "charges": [\n    { "id": "chg_1", "status": "succeeded", "amount": 2999 },\n    { "id": "chg_2", "status": "succeeded", "amount": 2999 }\n  ],\n  "issue": "Double billing detected. Stripe ID chg_2 requires reversal."\n}`
            }
          ]);
          setActiveFileName('billing_audit.json');
          setActivePath({ from: 'billing', to: 'router' });
          incrementTelemetry(2800, 0.056, 3.5, 2, 70);
          break;
        case 3:
          setActiveNodeId('router');
          setActivePath(null);
          addSystemLog('Router assembling final ticket response.');
          addAgentLog(routerAgent, 'Drafting refund confirmation and billing explanation for customer. Authorizing transaction reversal via Stripe gateway.');
          setArtifacts(prev => [
            ...prev,
            {
              name: 'client_response.md',
              language: 'markdown',
              content: `# Ticket Resolution: Duplicate Charge Refund\n\nDear Customer,\n\nOur financial systems detected a duplicate charge of $29.99 due to an automated payment gateway retry error. \n\nWe have issued a full refund of $29.99 for charge \`chg_2\`. Funds should settle in your account within 3-5 business days.`
            }
          ]);
          setActiveFileName('client_response.md');
          incrementTelemetry(1400, 0.028, 2.2, 3, 90);
          break;
        case 4:
          setActiveNodeId(null);
          addSystemLog('Ticket successfully resolved. Customer notified.');
          incrementTelemetry(300, 0.006, 0.8, 3, 100);
          setIsPlaying(false);
          break;
        default:
          break;
      }
    }

    simStepRef.current += 1;
  };

  // Helper log functions
  const addSystemLog = (text: string) => {
    setLogs(prev => [
      ...prev,
      {
        id: Math.random().toString(),
        type: 'system',
        tag: 'system',
        text
      }
    ]);
  };

  const addAgentLog = (agent: Agent, text: string) => {
    setLogs(prev => [
      ...prev,
      {
        id: Math.random().toString(),
        agentId: agent.id,
        agentName: agent.name,
        type: 'agent',
        tag: agent.role,
        text
      }
    ]);
  };

  const addToolLog = (agent: Agent, text: string) => {
    setLogs(prev => [
      ...prev,
      {
        id: Math.random().toString(),
        agentId: agent.id,
        agentName: agent.name,
        type: 'tool',
        tag: 'tool call',
        text
      }
    ]);
  };

  // Helper to add telemetry counters
  const incrementTelemetry = (tokens: number, cost: number, latencySec: number, handoffs: number, progressPct: number) => {
    setTelemetry(prev => ({
      totalTokens: prev.totalTokens + tokens,
      apiCost: parseFloat((prev.apiCost + cost).toFixed(4)),
      latency: parseFloat((prev.latency + latencySec).toFixed(1)),
      handoffs: prev.handoffs + handoffs,
      progress: progressPct
    }));

    // Distribute tokens to active agent
    if (activeNodeId) {
      setAgentTokenUsage(prev => ({
        ...prev,
        [activeNodeId]: (prev[activeNodeId] || 0) + tokens
      }));
    }
  };

  // Run simulation loops
  useEffect(() => {
    if (isPlaying) {
      const delay = Math.max(100, 3500 / speedMultiplier);
      simIntervalRef.current = window.setInterval(() => {
        executeSimulationStep();
      }, delay);
    } else {
      if (simIntervalRef.current) {
        clearInterval(simIntervalRef.current);
        simIntervalRef.current = null;
      }
    }
    return () => {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    };
  }, [isPlaying, speedMultiplier, activeNodeId]);

  const startSimulation = () => {
    if (simStepRef.current === 0) {
      setLogs([]);
      setArtifacts([]);
      setAgentTokenUsage({});
      setTelemetry({
        totalTokens: 0,
        apiCost: 0,
        latency: 0,
        handoffs: 0,
        progress: 0
      });
    }
    setIsPlaying(true);
  };

  const pauseSimulation = () => {
    setIsPlaying(false);
  };

  const resetSimulation = () => {
    setIsPlaying(false);
    setActiveNodeId(null);
    setActivePath(null);
    simStepRef.current = 0;
    setLogs([]);
    setArtifacts([]);
    setAgentTokenUsage({});
    setTelemetry({
      totalTokens: 0,
      apiCost: 0,
      latency: 0,
      handoffs: 0,
      progress: 0
    });
  };

  // Get active artifact content
  const selectedArtifact = artifacts.find(a => a.name === activeFileName) || artifacts[0];

  // Render SVG Paths between agent nodes based on activePreset
  const renderSVGConnections = () => {
    // Collect paths to draw based on preset topology
    const paths: { fromId: string; toId: string }[] = [];

    if (currentPreset.id === 'software-swarm') {
      paths.push({ fromId: 'pm', toId: 'lead' });
      paths.push({ fromId: 'lead', toId: 'dev' });
      paths.push({ fromId: 'dev', toId: 'qa' });
      paths.push({ fromId: 'qa', toId: 'dev' }); // Loop back
      paths.push({ fromId: 'qa', toId: 'devops' });
    } else if (currentPreset.id === 'advisory-debate') {
      paths.push({ fromId: 'macro', toId: 'moderator' });
      paths.push({ fromId: 'risk', toId: 'moderator' });
      paths.push({ fromId: 'moderator', toId: 'director' });
    } else if (currentPreset.id === 'support-router') {
      paths.push({ fromId: 'router', toId: 'billing' });
      paths.push({ fromId: 'router', toId: 'tech' });
      paths.push({ fromId: 'billing', toId: 'router' });
      paths.push({ fromId: 'tech', toId: 'router' });
    }

    return paths.map((p, idx) => {
      const fromAgent = agentsList.find(a => a.id === p.fromId);
      const toAgent = agentsList.find(a => a.id === p.toId);

      if (!fromAgent || !toAgent) return null;

      // Draw SVG lines (needs coordinates relative to container size 100%)
      const x1 = `${fromAgent.pos.x}%`;
      const y1 = `${fromAgent.pos.y}%`;
      const x2 = `${toAgent.pos.x}%`;
      const y2 = `${toAgent.pos.y}%`;

      const isActive = activePath && activePath.from === p.fromId && activePath.to === p.toId;
      const pathColor = isActive ? fromAgent.color : 'rgba(255,255,255,0.06)';

      return (
        <g key={idx}>
          <line
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            className={`flow-path ${isActive ? 'active-path pulse-path' : ''}`}
            style={{ '--active-color': pathColor } as React.CSSProperties}
          />
          {isActive && (
            <circle r="6" className="messenger-dot" style={{ '--active-color': pathColor } as React.CSSProperties}>
              <animateMotion
                dur="1.5s"
                repeatCount="indefinite"
                path={`M ${fromAgent.pos.x} ${fromAgent.pos.y} L ${toAgent.pos.x} ${toAgent.pos.y}`}
                // Transform scale factor mapping percentages
              />
            </circle>
          )}
        </g>
      );
    });
  };

  const handleDownloadFile = () => {
    if (!selectedArtifact) return;
    const blob = new Blob([selectedArtifact.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = selectedArtifact.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="agentmesh-container">
      {/* Left Sidebar: Configurations */}
      <div className="agentmesh-sidebar">
        <div className="sidebar-header">
          <h3>
            <Bot size={16} color="var(--accent)" />
            Agent Architect
          </h3>
          <span className="tag" style={{ fontSize: '0.6rem' }}>Sandbox v1.0</span>
        </div>

        <div className="sidebar-content">
          {/* Preset Workflows Selection */}
          <div className="preset-selector">
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Workflow Topology</label>
            {PRESETS.map((p, idx) => (
              <div 
                key={p.id}
                className={`preset-card ${idx === selectedPresetIndex ? 'active' : ''}`}
                onClick={() => setSelectedPresetIndex(idx)}
              >
                <h4>{p.name}</h4>
                <p>{p.description}</p>
              </div>
            ))}
          </div>

          <div style={{ borderBottom: '1px solid var(--glass-border)', margin: '4px 0' }}></div>

          {/* Active Agent Configuration Panel */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
              Swarm Nodes Settings
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {agentsList.map(a => (
                <div 
                  key={a.id}
                  className={`agent-config-card ${a.id === selectedAgentId ? 'selected' : ''}`}
                  style={{ '--agent-color': a.color } as React.CSSProperties}
                  onClick={() => setSelectedAgentId(a.id)}
                >
                  <div className="agent-config-header">
                    <span className="agent-badge-dot"></span>
                    <span className="agent-config-title">{a.name}</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{a.model}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Editing attributes of selected Agent */}
            <div className="glass-card" style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)' }}>
              <h5 style={{ fontSize: '0.8rem', color: activeAgent.color, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Cpu size={14} />
                Configure: {activeAgent.name}
              </h5>

              <div className="edit-form-group">
                <label>System Instructions Prompt</label>
                <textarea 
                  className="edit-textarea" 
                  value={activeAgent.prompt} 
                  onChange={(e) => updateAgentProperty('prompt', e.target.value)}
                />
              </div>

              <div className="edit-form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <label>Temperature</label>
                  <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>{activeAgent.temperature}</span>
                </div>
                <input 
                  type="range" 
                  min="0.0" 
                  max="1.0" 
                  step="0.1" 
                  value={activeAgent.temperature}
                  onChange={(e) => updateAgentProperty('temperature', parseFloat(e.target.value))}
                  style={{ cursor: 'pointer' }}
                />
              </div>

              <div className="edit-form-group">
                <label>Enabled Tool API Access</label>
                <div className="tool-checkbox-grid">
                  <label className="tool-checkbox-label">
                    <input 
                      type="checkbox" 
                      checked={activeAgent.tools.search} 
                      onChange={(e) => updateAgentTool('search', e.target.checked)}
                    />
                    Search
                  </label>
                  <label className="tool-checkbox-label">
                    <input 
                      type="checkbox" 
                      checked={activeAgent.tools.sandbox} 
                      onChange={(e) => updateAgentTool('sandbox', e.target.checked)}
                    />
                    Sandbox
                  </label>
                  <label className="tool-checkbox-label">
                    <input 
                      type="checkbox" 
                      checked={activeAgent.tools.database} 
                      onChange={(e) => updateAgentTool('database', e.target.checked)}
                    />
                    Database
                  </label>
                  <label className="tool-checkbox-label">
                    <input 
                      type="checkbox" 
                      checked={activeAgent.tools.filesystem} 
                      onChange={(e) => updateAgentTool('filesystem', e.target.checked)}
                    />
                    Filesystem
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Center Display: Graph & Console logs */}
      <div className="agentmesh-workspace">
        {/* Visualizer Frame */}
        <div className="visualizer-canvas-container">
          <div className="visualizer-overlay">
            <h2>{currentPreset.name} Diagram</h2>
            <p>Select any node to adjust prompt instructions in real time.</p>
          </div>

          <div className="sim-controls">
            <div className="speed-slider-container">
              <span>Speed:</span>
              <input 
                type="range" 
                min="1" 
                max="10" 
                step="1" 
                value={speedMultiplier} 
                onChange={(e) => setSpeedMultiplier(parseInt(e.target.value))} 
              />
              <span style={{ fontFamily: 'var(--font-mono)' }}>{speedMultiplier === 10 ? 'Instant' : `${speedMultiplier}x`}</span>
            </div>
            {isPlaying ? (
              <button className="sim-btn" onClick={pauseSimulation}>
                <Pause size={14} /> Pause
              </button>
            ) : (
              <button 
                className="sim-btn" 
                onClick={startSimulation}
                disabled={telemetry.progress === 100}
              >
                <Play size={14} /> Run
              </button>
            )}
            <button className="sim-btn sim-btn-secondary" onClick={resetSimulation}>
              <RotateCcw size={14} /> Reset
            </button>
          </div>

          {/* SVG Lines layers */}
          <svg className="nodes-svg-layer" viewBox="0 0 100 100" preserveAspectRatio="none">
            {renderSVGConnections()}
          </svg>

          {/* Nodes containers */}
          <div className="nodes-container">
            {agentsList.map((a) => (
              <div 
                key={a.id}
                className={`agent-node-element ${a.id === selectedAgentId ? 'selected' : ''} ${activeNodeId === a.id ? 'active' : ''}`}
                style={{ 
                  left: `${a.pos.x}%`, 
                  top: `${a.pos.y}%`,
                  '--agent-color': a.color,
                  '--accent-rgb': a.color === '#a855f7' ? '168, 85, 247' : 
                                  a.color === '#ec4899' ? '236, 72, 153' :
                                  a.color === '#22c55e' ? '34, 197, 94' :
                                  a.color === '#f59e0b' ? '245, 158, 11' : 
                                  a.color === '#3b82f6' ? '59, 130, 246' :
                                  a.color === '#ef4444' ? '239, 68, 68' :
                                  a.color === '#14b8a6' ? '20, 184, 166' : '6, 182, 212'
                } as React.CSSProperties}
                onClick={() => setSelectedAgentId(a.id)}
              >
                <div className="agent-node-circle">
                  <Bot size={24} style={{ color: activeNodeId === a.id ? '#fff' : a.color }} />
                </div>
                <div className="agent-node-label">{a.name}</div>
                {activeNodeId === a.id && (
                  <span className="agent-node-status">Thinking</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Console logs */}
        <div className="sim-console-shell">
          <div className="console-header-bar">
            <div className="console-title-text">
              <Terminal size={12} color="var(--accent)" />
              Simulation Log Output
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }}></span>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }}></span>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }}></span>
            </div>
          </div>

          <div className="terminal-body" ref={consoleBodyRef}>
            {logs.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', marginTop: '20px' }}>
                Press "Run" to trigger the multi-agent system execution simulation.
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className={`log-entry ${log.agentId || log.type}`}>
                  <div className="log-meta">
                    <span className="log-tag">{log.tag}</span>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 'normal' }}>
                      {log.agentName ? `${log.agentName}` : 'Orchestration Kernel'}
                    </span>
                  </div>
                  <div className="log-text">{log.text}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Right Sidebar: Telemetry & Artifact Files */}
      <div className="agentmesh-sidebar agentmesh-sidebar-right">
        <div className="sidebar-header">
          <h3>
            <BarChart2 size={16} color="var(--accent)" />
            System Analytics
          </h3>
        </div>

        <div className="sidebar-content">
          {/* Telemetry panel */}
          <div className="telemetry-summary">
            <div className="telemetry-card">
              <span>Handoffs</span>
              <h4>{telemetry.handoffs}</h4>
            </div>
            <div className="telemetry-card">
              <span>Latency</span>
              <h4>{telemetry.latency}s</h4>
            </div>
            <div className="telemetry-card">
              <span>Est. API Cost</span>
              <h4>${telemetry.apiCost}</h4>
            </div>
            <div className="telemetry-card">
              <span>Swarm Progress</span>
              <h4 style={{ color: telemetry.progress === 100 ? '#22c55e' : 'var(--text-primary)' }}>
                {telemetry.progress}%
              </h4>
            </div>
          </div>

          {/* Token distribution bar charts */}
          <div className="token-distribution-chart">
            <div className="token-chart-header">Tokens Consumed ({telemetry.totalTokens})</div>
            {agentsList.map(a => {
              const tokens = agentTokenUsage[a.id] || 0;
              const maxTokens = Math.max(...Object.values(agentTokenUsage), 1);
              const percentage = telemetry.totalTokens > 0 ? (tokens / maxTokens) * 100 : 0;

              return (
                <div key={a.id} className="chart-row">
                  <span className="chart-row-label">{a.name}</span>
                  <div className="chart-row-bar-container">
                    <div 
                      className="chart-row-bar" 
                      style={{ 
                        width: `${percentage}%`, 
                        '--agent-color': a.color 
                      } as React.CSSProperties}
                    />
                  </div>
                  <span className="chart-row-value">{tokens}</span>
                </div>
              );
            })}
          </div>

          {/* Tabbed File Artifact Viewer */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
              Generated Artifact Files
            </label>
            <div className="code-editor-card">
              <div className="code-editor-header">
                <span className="code-editor-title">Workspace Sandbox Editor</span>
                {selectedArtifact && (
                  <div className="code-editor-actions">
                    <button 
                      className="editor-action-btn" 
                      onClick={handleDownloadFile}
                      title="Download Artifact File"
                    >
                      <Download size={12} />
                    </button>
                  </div>
                )}
              </div>

              <div className="code-editor-body">
                {/* File Tree sidebar */}
                <div className="editor-file-tree">
                  {artifacts.length === 0 ? (
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', padding: '4px' }}>Empty</span>
                  ) : (
                    artifacts.map(f => (
                      <div 
                        key={f.name}
                        className={`file-tree-item ${f.name === activeFileName ? 'active' : ''}`}
                        onClick={() => setActiveFileName(f.name)}
                      >
                        {f.name.endsWith('.json') || f.name.endsWith('.ts') ? <FileCode size={10} /> : <FileText size={10} />}
                        {f.name}
                      </div>
                    ))
                  )}
                </div>

                {/* Code viewport */}
                <div className="editor-code-pane">
                  {selectedArtifact ? (
                    <pre className="code-pre">
                      <code dangerouslySetInnerHTML={{ __html: formatCode(selectedArtifact.content) }} />
                    </pre>
                  ) : (
                    <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.65rem', padding: '20px', textAlign: 'center' }}>
                      Files will populate as the agent team outputs code segments.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Future Proofing Architecture Note */}
          <div className="architect-info-card">
            <h4>
              <Shield size={14} />
              Future-Proofing Your Skillset
            </h4>
            <p>
              In an AI-augmented world, writing lines of code manually is rapidly yielding to system orchestration. Being an <strong>Agent Architect</strong> shifts your expertise from syntax implementation to designing boundaries, safety checks, collaboration patterns, and evaluation frameworks.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
