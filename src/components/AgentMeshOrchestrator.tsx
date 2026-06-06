import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, RotateCcw, Bot, Terminal, Cpu, FileCode, Download, 
  Shield, BarChart2, FileText, Key 
} from 'lucide-react';
import './AgentMeshOrchestrator.css';

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
  pos: { x: number; y: number };
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

const formatCode = (code: string) => {
  if (!code) return '';
  let escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const keywords = ['const', 'let', 'var', 'function', 'class', 'import', 'export', 'from', 'return', 'async', 'await', 'if', 'else', 'for', 'while', 'interface', 'type', 'default', 'extends', 'try', 'catch', 'throw', 'new', 'describe', 'test', 'expect'];
  escaped = escaped.replace(new RegExp(`\\b(${keywords.join('|')})\\b`, 'g'), '<span class="hl-keyword">$1</span>');
  escaped = escaped.replace(/(['"`])(.*?)\1/g, '<span class="hl-string">$1$2$1</span>');
  escaped = escaped.replace(/(\/\/.*)/g, '<span class="hl-comment">$1</span>');
  escaped = escaped.replace(/(\/\*\*[\s\S]*?\*\/)/g, '<span class="hl-comment">$1</span>');
  escaped = escaped.replace(/\b(\d+)\b/g, '<span class="hl-number">$1</span>');
  return escaped;
};

export const AgentMeshOrchestrator: React.FC = () => {
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  const currentPreset = PRESETS[selectedPresetIndex];
  const [agentsList, setAgentsList] = useState<Agent[]>(currentPreset.agents);
  const [selectedAgentId, setSelectedAgentId] = useState<string>(currentPreset.agents[0].id);
  const [userPrompt, setUserPrompt] = useState(currentPreset.defaultPrompt);

  const activeAgent = agentsList.find(a => a.id === selectedAgentId) || agentsList[0];

  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [activePath, setActivePath] = useState<{ from: string; to: string } | null>(null);
  
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

  const [apiKey, setApiKey] = useState<string>('');
  const [showKeyInput, setShowKeyInput] = useState(false);

  const consoleBodyRef = useRef<HTMLDivElement>(null);
  const simIntervalRef = useRef<number | null>(null);
  const simStepRef = useRef<number>(0);
  const isRealRunCanceled = useRef(false);

  useEffect(() => {
    setAgentsList(currentPreset.agents);
    setSelectedAgentId(currentPreset.agents[0].id);
    setUserPrompt(currentPreset.defaultPrompt);
    resetSimulation();
  }, [selectedPresetIndex]);

  useEffect(() => {
    const key = localStorage.getItem('gemini_api_key') || '';
    setApiKey(key);
  }, []);

  const handleSaveKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
    setShowKeyInput(false);
  };

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
        return { ...a, tools: { ...a.tools, [toolName]: checked } };
      }
      return a;
    }));
  };

  useEffect(() => {
    if (consoleBodyRef.current) {
      consoleBodyRef.current.scrollTop = consoleBodyRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    return () => {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    };
  }, []);

  const addSystemLog = (text: string) => {
    setLogs(prev => [...prev, { id: Math.random().toString(), type: 'system', tag: 'system', text }]);
  };

  const addAgentLog = (agent: Agent, text: string) => {
    setLogs(prev => [...prev, { id: Math.random().toString(), agentId: agent.id, agentName: agent.name, type: 'agent', tag: agent.role, text }]);
  };

  const addToolLog = (agent: Agent, text: string) => {
    setLogs(prev => [...prev, { id: Math.random().toString(), agentId: agent.id, agentName: agent.name, type: 'tool', tag: 'tool call', text }]);
  };

  const incrementTelemetry = (tokens: number, cost: number, latencySec: number, handoffs: number, progressPct: number, currentActiveNodeId?: string) => {
    setTelemetry(prev => ({
      totalTokens: prev.totalTokens + tokens,
      apiCost: parseFloat((prev.apiCost + cost).toFixed(4)),
      latency: parseFloat((prev.latency + latencySec).toFixed(1)),
      handoffs: prev.handoffs + handoffs,
      progress: progressPct
    }));

    const node = currentActiveNodeId || activeNodeId;
    if (node) {
      setAgentTokenUsage(prev => ({
        ...prev,
        [node]: (prev[node] || 0) + tokens
      }));
    }
  };

  // Real-time API Swarm Execution (Gemini client calls)
  const runRealSwarmExecution = async () => {
    isRealRunCanceled.current = false;
    setLogs([]);
    setArtifacts([]);
    setAgentTokenUsage({});
    setTelemetry({ totalTokens: 0, apiCost: 0, latency: 0, handoffs: 0, progress: 0 });
    
    addSystemLog('Initializing Live Multi-Agent Swarm...');
    addSystemLog(`User goal: "${userPrompt}"`);

    const callGemini = async (systemPrompt: string, contextMessage: string) => {
      const prompt = `System Instructions:\n${systemPrompt}\n\nInput Context:\n${contextMessage}`;
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        }
      );
      if (!response.ok) throw new Error(`API error code ${response.status}`);
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const promptTokens = data.usageMetadata?.promptTokenCount || Math.ceil(prompt.length / 4);
      const candidatesTokens = data.usageMetadata?.candidatesTokenCount || Math.ceil(text.length / 4);
      return { text, total: promptTokens + candidatesTokens };
    };

    const getFileName = (id: string) => {
      switch (id) {
        case 'pm': return 'specifications.md';
        case 'lead': return 'architecture.json';
        case 'dev': return 'auth.ts';
        case 'qa': return 'auth.test.ts';
        case 'devops': return 'docker-compose.yml';
        case 'macro': return 'macro_outlook.md';
        case 'risk': return 'risk_assessment.md';
        case 'moderator': return 'consensus_summary.md';
        case 'director': return 'executive_decision.md';
        case 'router': return 'routing_analysis.json';
        case 'billing': return 'billing_audit.json';
        case 'tech': return 'technical_fix.json';
        default: return 'output.txt';
      }
    };

    const getLanguage = (name: string) => {
      if (name.endsWith('.md')) return 'markdown';
      if (name.endsWith('.json')) return 'json';
      if (name.endsWith('.ts')) return 'typescript';
      if (name.endsWith('.yml') || name.endsWith('.yaml')) return 'yaml';
      return 'plaintext';
    };

    let accumulativeContext = `Original User Goal: "${userPrompt}"`;

    for (let i = 0; i < agentsList.length; i++) {
      if (isRealRunCanceled.current) break;

      const agent = agentsList[i];
      setActiveNodeId(agent.id);
      addSystemLog(`Handoff: ${agent.name} is now processing the pipeline...`);
      addAgentLog(agent, `Analyzing context payload. Connecting to Gemini API...`);

      if (agent.tools.search) {
        addToolLog(agent, `Invoking Web Search tool for queries related to: "${userPrompt.substring(0, 30)}..."`);
      }

      const startTime = Date.now();
      try {
        const result = await callGemini(agent.prompt, accumulativeContext);
        const durationSec = (Date.now() - startTime) / 1000;
        
        if (isRealRunCanceled.current) break;

        const filename = getFileName(agent.id);
        const newArtifact = {
          name: filename,
          language: getLanguage(filename),
          content: result.text
        };

        setArtifacts(prev => [...prev, newArtifact]);
        setActiveFileName(filename);
        
        addAgentLog(agent, `Output generated successfully. File compiled: "${filename}"`);
        
        // Calculate cost: flash is roughly $0.075 per 1M prompt tokens, $0.30 per 1M output tokens.
        const cost = (result.total / 1000000) * 0.15;
        const progressPct = Math.min(100, Math.ceil(((i + 1) / agentsList.length) * 100));
        
        incrementTelemetry(result.total, cost, durationSec, 1, progressPct, agent.id);

        accumulativeContext += `\n\n=== Output from ${agent.name} (${agent.role}) ===\n${result.text}`;

        // Visual path animation trigger
        if (i < agentsList.length - 1) {
          const nextAgent = agentsList[i + 1];
          setActivePath({ from: agent.id, to: nextAgent.id });
          await new Promise(r => setTimeout(r, 2000));
          setActivePath(null);
        }
      } catch (err) {
        addSystemLog(`API Call Error for ${agent.name}: ${err instanceof Error ? err.message : 'Connection refused'}`);
        isRealRunCanceled.current = true;
        setIsPlaying(false);
        return;
      }
    }

    if (!isRealRunCanceled.current) {
      setActiveNodeId(null);
      addSystemLog('Live multi-agent execution completed. All files loaded into sandbox workspace.');
      setIsPlaying(false);
    }
  };

  const executeSimulationStep = () => {
    const step = simStepRef.current;
    
    if (currentPreset.id === 'software-swarm') {
      const pmAgent = agentsList.find(a => a.id === 'pm')!;
      const leadAgent = agentsList.find(a => a.id === 'lead')!;
      const devAgent = agentsList.find(a => a.id === 'dev')!;
      const qaAgent = agentsList.find(a => a.id === 'qa')!;
      const devopsAgent = agentsList.find(a => a.id === 'devops')!;

      switch (step) {
        case 0:
          addSystemLog('Initializing AI Agent Swarm topology: Pipeline with feedback loop.');
          addSystemLog(`User goal received: "${userPrompt}"`);
          setActiveNodeId('pm');
          incrementTelemetry(800, 0.016, 2, 0, 5);
          break;
        case 1:
          addAgentLog(pmAgent, 'Analyzing product requirements. Invoking Web Search to research competitors and standard specifications.');
          addToolLog(pmAgent, 'Web Search: "standard OAuth JWT claims auth best practices Node.js"');
          incrementTelemetry(1200, 0.024, 3, 0, 10);
          break;
        case 2:
          addAgentLog(pmAgent, 'Product Specifications draft completed. Sending specifications document to Tech Lead.');
          setArtifacts([{
            name: 'specifications.md',
            language: 'markdown',
            content: `# Product Specification: JWT Authentication Route\n\n## Objective\nImplement a secure login and registration route matching developer requirements: "${userPrompt}".\n\n## User Flow\n1. POST /api/register (username, password)\n2. POST /api/login (username, password) -> JWT token returned.\n3. GET /api/profile (Protected, requires Bearer token).\n\n## Security Standards\n- Argon2 / Bcrypt hashing for password databases.\n- Tokens expire in 1 hour.\n- Rate limit validation.`
          }]);
          setActiveFileName('specifications.md');
          setActivePath({ from: 'pm', to: 'lead' });
          incrementTelemetry(1500, 0.030, 2.5, 1, 20);
          break;
        case 3:
          setActiveNodeId('lead');
          setActivePath(null);
          addSystemLog('Handoff: Tech Lead is analyzing specifications.md.');
          addAgentLog(leadAgent, 'Designing file architecture and database schemes. Selecting dependencies: bcryptjs, jsonwebtoken, express-validator.');
          incrementTelemetry(2100, 0.042, 4, 1, 30);
          break;
        case 4:
          addAgentLog(leadAgent, 'Database model & architectural layouts designed. Dispatching design schemas to Developer.');
          setArtifacts(prev => [...prev, {
            name: 'architecture.json',
            language: 'json',
            content: `{\n  "directory": "src",\n  "database": "MongoDB / Mongoose Schema",\n  "packages": {\n    "bcryptjs": "^2.4.3",\n    "jsonwebtoken": "^9.0.0",\n    "express-validator": "^7.0.0"\n  },\n  "routes": [\n    "src/routes/auth.ts",\n    "src/models/User.ts",\n    "src/middleware/auth.ts"\n  ]\n}`
          }]);
          setActiveFileName('architecture.json');
          setActivePath({ from: 'lead', to: 'dev' });
          incrementTelemetry(2400, 0.048, 3.2, 2, 40);
          break;
        case 5:
          setActiveNodeId('dev');
          setActivePath(null);
          addSystemLog('Handoff: Developer is coding auth.ts and User.ts.');
          addAgentLog(devAgent, 'Generating express router endpoints. Injecting input validation middleware, password hashing, and token signature payloads.');
          incrementTelemetry(4200, 0.084, 5.5, 2, 50);
          break;
        case 6:
          addAgentLog(devAgent, 'Source code draft completed. Dispatching to QA Engineer for testing.');
          setArtifacts(prev => [...prev, {
            name: 'auth.ts',
            language: 'typescript',
            content: `import express, { Request, Response } from 'express';\nimport bcrypt from 'bcryptjs';\nimport jwt from 'jsonwebtoken';\nimport { body, validationResult } from 'express-validator';\nimport { User } from '../models/User';\n\nconst router = express.Router();\nconst JWT_SECRET = process.env.JWT_SECRET || 'supersecret';\n\nrouter.post('/register',\n  body('username').isString().isLength({ min: 3 }),\n  body('password').isLength({ min: 6 }),\n  async (req: Request, res: Response) => {\n    const errors = validationResult(req);\n    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });\n    \n    const { username, password } = req.body;\n    const hashedPassword = await bcrypt.hash(password, 10);\n    \n    const user = new User({ username, password: hashedPassword });\n    await user.save();\n    res.status(201).json({ message: 'User registered' });\n  }\n);\n\nrouter.post('/login', async (req: Request, res: Response) => {\n  const { username, password } = req.body;\n  const user = await User.findOne({ username });\n  if (!user) return res.status(400).json({ error: 'Invalid credentials' });\n  \n  // BUG: developer forgot to check password matches before signing JWT!\n  const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });\n  res.json({ token });\n});\n\nexport default router;`
          }]);
          setActiveFileName('auth.ts');
          setActivePath({ from: 'dev', to: 'qa' });
          incrementTelemetry(3900, 0.078, 4.8, 3, 60);
          break;
        case 7:
          setActiveNodeId('qa');
          setActivePath(null);
          addSystemLog('Handoff: QA Engineer runs compliance & vulnerability tests.');
          addAgentLog(qaAgent, 'Setting up Jest workspace environment. Invoking Sandbox Execution to run auth.test.ts against code.');
          addToolLog(qaAgent, 'Sandbox Execution: "npm run test:auth"');
          incrementTelemetry(2500, 0.050, 4.2, 3, 70);
          break;
        case 8:
          addAgentLog(qaAgent, 'TEST FAILED: Login success with incorrect credentials. Vulnerability found: Password match check missing! Routing report back to Developer for repair.');
          setArtifacts(prev => [...prev, {
            name: 'qa_report.json',
            language: 'json',
            content: `{\n  "vulnerabilities": [\n    {\n      "severity": "HIGH",\n      "endpoint": "POST /api/login",\n      "issue": "Password is not validated. Any password will authenticate a matching username.",\n      "solution": "Add await bcrypt.compare(password, user.password) check."\n    }\n  ],\n  "status": "REJECTED"\n}`
          }]);
          setActiveFileName('qa_report.json');
          setActivePath({ from: 'qa', to: 'dev' });
          incrementTelemetry(2200, 0.044, 3.5, 4, 75);
          break;
        case 9:
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
          setActiveNodeId('qa');
          setActivePath(null);
          addSystemLog('QA running validation suites on updated codebase.');
          addToolLog(qaAgent, 'Sandbox Execution: "npm run test:auth" -> ALL TESTS PASSED (100% Coverage)');
          addAgentLog(qaAgent, 'Security validation verified. Output approved. Dispatching system release to DevOps Engineer.');
          setArtifacts(prev => [...prev, {
            name: 'auth.test.ts',
            language: 'typescript',
            content: `import request from 'supertest';\nimport app from '../app';\n\ndescribe('Auth endpoints', () => {\n  it('should block incorrect password', async () => {\n    const res = await request(app)\n      .post('/api/login')\n      .send({ username: 'mike', password: 'wrongpassword' });\n    expect(res.status).toBe(400);\n  });\n});`
          }]);
          setActiveFileName('auth.test.ts');
          setActivePath({ from: 'qa', to: 'devops' });
          incrementTelemetry(2800, 0.056, 3.8, 6, 90);
          break;
        case 11:
          setActiveNodeId('devops');
          setActivePath(null);
          addSystemLog('Handoff: DevOps compiling deployment assets.');
          addAgentLog(devopsAgent, 'Configuring docker-compose container mesh. Setting up environment configs and volume hooks.');
          setArtifacts(prev => [...prev, {
            name: 'docker-compose.yml',
            language: 'yaml',
            content: `version: '3.8'\nservices:\n  auth-app:\n    build: .\n    ports:\n      - "8080:8080"\n    environment:\n      - NODE_ENV=production\n      - JWT_SECRET=env_loaded_key\n      - MONGO_URI=mongodb://db:2717/auth\n    depends_on:\n      - db\n  db:\n    image: mongo:latest\n    ports:\n      - "27017:27017"`
          }]);
          setActiveFileName('docker-compose.yml');
          incrementTelemetry(3200, 0.064, 4.5, 6, 95);
          break;
        case 12:
          setActiveNodeId(null);
          addSystemLog('AI agent swarm workflow execution completed successfully!');
          incrementTelemetry(500, 0.010, 1.2, 7, 100);
          setIsPlaying(false);
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
          addAgentLog(macroAgent, 'Constructing Bull thesis. Rates cuts lower capital expenses for tech startups, inflating WACC models.');
          setArtifacts([{
            name: 'macro_outlook.md',
            language: 'markdown',
            content: `# Macroeconomic Bull Case: Valuations\nInterest rate reductions lower discount models favoring growth equity indexes.`
          }]);
          setActiveFileName('macro_outlook.md');
          setActivePath({ from: 'macro', to: 'moderator' });
          incrementTelemetry(2800, 0.056, 4.0, 1, 25);
          break;
        case 2:
          setActiveNodeId('risk');
          setActivePath(null);
          addSystemLog('Moderator routes thread to Risk Analyst for counter-perspective.');
          addAgentLog(riskAgent, 'Constructing Bear thesis. Lagging recession indicators suggest immediate margin compression.');
          setArtifacts(prev => [...prev, {
            name: 'risk_assessment.md',
            language: 'markdown',
            content: `# Risk Bear Case: Recession Multiples\nRate cuts indicate lagging core contractions. Focus allocation on defensive bounds.`
          }]);
          setActiveFileName('risk_assessment.md');
          setActivePath({ from: 'risk', to: 'moderator' });
          incrementTelemetry(3100, 0.062, 4.5, 2, 50);
          break;
        case 3:
          setActiveNodeId('moderator');
          setActivePath(null);
          addSystemLog('Moderator synthesizing macro arguments.');
          addAgentLog(modAgent, 'Structuring weighted model. Rejecting hyperbole.');
          setArtifacts(prev => [...prev, {
            name: 'consensus_summary.md',
            language: 'markdown',
            content: `# Macro/Risk Synthesis Consensus\n- Multiple expansion supports growth asset class in short term.\n- Economic growth threshold must maintain above 2%.`
          }]);
          setActiveFileName('consensus_summary.md');
          setActivePath({ from: 'moderator', to: 'director' });
          incrementTelemetry(2500, 0.050, 3.8, 3, 75);
          break;
        case 4:
          setActiveNodeId('director');
          setActivePath(null);
          addSystemLog('Executive Director structuring final allocation mandate.');
          addAgentLog(dirAgent, 'Reviewing consensus. Authorizing allocation: 60% tech index, 40% treasuries.');
          setArtifacts(prev => [...prev, {
            name: 'executive_decision.md',
            language: 'markdown',
            content: `# Capital Allocation Mandate\n- 60% High-growth Equities\n- 40% Cash/Treasury Hedging`
          }]);
          setActiveFileName('executive_decision.md');
          incrementTelemetry(3000, 0.060, 4.2, 4, 95);
          break;
        case 5:
          setActiveNodeId(null);
          addSystemLog('Consensus debate completed.');
          incrementTelemetry(400, 0.008, 1.0, 4, 100);
          setIsPlaying(false);
          break;
      }
    } else if (currentPreset.id === 'support-router') {
      const routerAgent = agentsList.find(a => a.id === 'router')!;
      const billingAgent = agentsList.find(a => a.id === 'billing')!;

      switch (step) {
        case 0:
          addSystemLog('Initializing Support Triage Router.');
          setActiveNodeId('router');
          incrementTelemetry(600, 0.012, 1.5, 0, 10);
          break;
        case 1:
          addAgentLog(routerAgent, 'Classifying subject intent. Detected duplicate charges. Assigning: BILLING.');
          setArtifacts([{
            name: 'customer_ticket.json',
            language: 'json',
            content: `{\n  "ticket_id": "TKT-4919",\n  "subject": "Duplicate billing query",\n  "content": "${userPrompt}"\n}`
          }]);
          setActiveFileName('customer_ticket.json');
          setActivePath({ from: 'router', to: 'billing' });
          incrementTelemetry(1200, 0.024, 2.0, 1, 35);
          break;
        case 2:
          setActiveNodeId('billing');
          setActivePath(null);
          addAgentLog(billingAgent, 'Querying database transactions ledger.');
          addToolLog(billingAgent, 'Database Query: "SELECT * FROM charges WHERE user_id = \'usr_92\'"');
          setArtifacts(prev => [...prev, {
            name: 'billing_audit.json',
            language: 'json',
            content: `{\n  "charges": [\n    { "id": "chg_1", "status": "succeeded", "amount": 2999 },\n    { "id": "chg_2", "status": "succeeded", "amount": 2999 }\n  ],\n  "issue": "Double billing race condition. stripe_id chg_2 requires reversal."\n}`
          }]);
          setActiveFileName('billing_audit.json');
          setActivePath({ from: 'billing', to: 'router' });
          incrementTelemetry(2800, 0.056, 3.5, 2, 70);
          break;
        case 3:
          setActiveNodeId('router');
          setActivePath(null);
          addAgentLog(routerAgent, 'Reversal authorized. Drafting final reply.');
          setArtifacts(prev => [...prev, {
            name: 'client_response.md',
            language: 'markdown',
            content: `# Ticket Resolution\nRefund of $29.99 for duplicate transaction code chg_2 has been successfully issued.`
          }]);
          setActiveFileName('client_response.md');
          incrementTelemetry(1400, 0.028, 2.2, 3, 90);
          break;
        case 4:
          setActiveNodeId(null);
          addSystemLog('Ticket successfully resolved.');
          incrementTelemetry(300, 0.006, 0.8, 3, 100);
          setIsPlaying(false);
          break;
      }
    }

    simStepRef.current += 1;
  };

  useEffect(() => {
    if (isPlaying && !apiKey) {
      const delay = Math.max(100, 3500 / speedMultiplier);
      simIntervalRef.current = window.setInterval(() => {
        executeSimulationStep();
      }, delay);
    } else if (isPlaying && apiKey) {
      runRealSwarmExecution();
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
    if (apiKey) {
      runRealSwarmExecution();
      setIsPlaying(true);
    } else {
      if (simStepRef.current === 0) {
        setLogs([]);
        setArtifacts([]);
        setAgentTokenUsage({});
        setTelemetry({ totalTokens: 0, apiCost: 0, latency: 0, handoffs: 0, progress: 0 });
      }
      setIsPlaying(true);
    }
  };

  const pauseSimulation = () => {
    setIsPlaying(false);
    isRealRunCanceled.current = true;
  };

  const resetSimulation = () => {
    setIsPlaying(false);
    isRealRunCanceled.current = true;
    setActiveNodeId(null);
    setActivePath(null);
    simStepRef.current = 0;
    setLogs([]);
    setArtifacts([]);
    setAgentTokenUsage({});
    setTelemetry({ totalTokens: 0, apiCost: 0, latency: 0, handoffs: 0, progress: 0 });
  };

  const selectedArtifact = artifacts.find(a => a.name === activeFileName) || artifacts[0];

  const renderSVGConnections = () => {
    const paths: { fromId: string; toId: string }[] = [];
    if (currentPreset.id === 'software-swarm') {
      paths.push({ fromId: 'pm', toId: 'lead' });
      paths.push({ fromId: 'lead', toId: 'dev' });
      paths.push({ fromId: 'dev', toId: 'qa' });
      paths.push({ fromId: 'qa', toId: 'dev' });
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
      <div className="agentmesh-sidebar">
        <div className="sidebar-header">
          <h3>
            <Bot size={16} color="var(--accent)" />
            Agent Architect
          </h3>
          <button 
            className="editor-action-btn"
            onClick={() => setShowKeyInput(!showKeyInput)}
            title="Configure Gemini API Credentials"
            style={{ padding: '4px' }}
          >
            <Key size={14} color={apiKey ? '#22c55e' : 'var(--text-muted)'} />
          </button>
        </div>

        {showKeyInput && (
          <div style={{ padding: '12px', background: 'rgba(220, 38, 38, 0.05)', borderBottom: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 700 }}>Gemini Client API Key:</span>
            <input 
              type="password" 
              className="records-input" 
              placeholder="AIzaSy..." 
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
              <button className="sim-btn" style={{ padding: '4px 10px', fontSize: '0.7rem' }} onClick={() => handleSaveKey(apiKey)}>Save</button>
              <button className="sim-btn sim-btn-secondary" style={{ padding: '4px 10px', fontSize: '0.7rem' }} onClick={() => setShowKeyInput(false)}>Close</button>
            </div>
          </div>
        )}

        <div className="sidebar-content">
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

      <div className="agentmesh-workspace">
        <div className="visualizer-canvas-container">
          <div className="visualizer-overlay">
            <h2>{currentPreset.name} Diagram</h2>
            <p>Select any node to adjust prompt instructions in real time.</p>
          </div>

          <div className="sim-controls">
            {!apiKey && (
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
            )}
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
                <Play size={14} /> Run {apiKey && 'Live'}
              </button>
            )}
            <button className="sim-btn sim-btn-secondary" onClick={resetSimulation}>
              <RotateCcw size={14} /> Reset
            </button>
          </div>

          <svg className="nodes-svg-layer" viewBox="0 0 100 100" preserveAspectRatio="none">
            {renderSVGConnections()}
          </svg>

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

        <div className="sim-console-shell">
          <div className="console-header-bar">
            <div className="console-title-text">
              <Terminal size={12} color="var(--accent)" />
              Simulation Log Output {apiKey && '(Live Gemini Chain)'}
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

      <div className="agentmesh-sidebar agentmesh-sidebar-right">
        <div className="sidebar-header">
          <h3>
            <BarChart2 size={16} color="var(--accent)" />
            System Analytics
          </h3>
        </div>

        <div className="sidebar-content">
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
                      style={{ width: `${percentage}%`, '--agent-color': a.color } as React.CSSProperties}
                    />
                  </div>
                  <span className="chart-row-value">{tokens}</span>
                </div>
              );
            })}
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
              Generated Artifact Files
            </label>
            <div className="code-editor-card">
              <div className="code-editor-header">
                <span className="code-editor-title">Workspace Sandbox Editor</span>
                {selectedArtifact && (
                  <div className="code-editor-actions">
                    <button className="editor-action-btn" onClick={handleDownloadFile} title="Download Artifact File">
                      <Download size={12} />
                    </button>
                  </div>
                )}
              </div>

              <div className="code-editor-body">
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
