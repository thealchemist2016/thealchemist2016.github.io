import React, { useState, useEffect, useRef } from 'react';

interface TerminalWidgetProps {
  onLaunchProject: (projectId: string) => void;
}

interface CommandLog {
  text: string;
  type: 'input' | 'output' | 'error' | 'success';
}

export const TerminalWidget: React.FC<TerminalWidgetProps> = ({ onLaunchProject }) => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<CommandLog[]>([
    { text: 'Michael Byrd Shell [Version 1.0.4]', type: 'success' },
    { text: "Type 'help' to view all available commands.", type: 'output' },
    { text: '', type: 'output' },
  ]);
  
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom on command execution
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleCommand = (cmd: string) => {
    const trimmedCmd = cmd.trim();
    if (!trimmedCmd) return;

    const parts = trimmedCmd.split(' ');
    const mainCommand = parts[0].toLowerCase();
    const args = parts.slice(1);

    const newLogs: CommandLog[] = [
      ...history,
      { text: `mike@byrd-dev:~$ ${trimmedCmd}`, type: 'input' }
    ];

    switch (mainCommand) {
      case 'clear':
        setHistory([]);
        setInput('');
        return;

      case 'help':
        newLogs.push(
          { text: 'Available commands:', type: 'success' },
          { text: '  about        - Meet Michael James Byrd Jr.', type: 'output' },
          { text: '  skills       - Show core tech stack metrics.', type: 'output' },
          { text: '  projects     - List projects or launch them.', type: 'output' },
          { text: '  contact      - Display contact links.', type: 'output' },
          { text: '  project <id> - Run a project directly (e.g. project smarttodo)', type: 'output' },
          { text: '  clear        - Flush terminal log.', type: 'output' }
        );
        break;

      case 'about':
        newLogs.push(
          { text: 'Michael James Byrd Jr. - Full-Stack Software Engineer.', type: 'success' },
          { text: 'Bio: Driven developer specializing in React, React Native, and Node.js backend APIs. I bridge the gap between elegant UI presentation and high-efficiency database endpoints.', type: 'output' },
          { text: 'Education: Southern Careers Institute (Full Stack Web Development).', type: 'output' },
          { text: 'Status: Available for hire.', type: 'output' }
        );
        break;

      case 'skills':
        newLogs.push(
          { text: 'Core Skillset Breakdown:', type: 'success' },
          { text: '  Frontend  [██████████████████░░] 90% - React, TS, HTML5/CSS3', type: 'output' },
          { text: '  Mobile    [█████████████████░░░] 85% - React Native, Expo, AngularJS', type: 'output' },
          { text: '  Backend   [████████████████░░░░] 80% - Node, Express, MongoDB, ASP.NET', type: 'output' },
          { text: '  DevOps    [██████████████░░░░░░] 70% - Git, Vite, Webpack, Vercel', type: 'output' }
        );
        break;

      case 'projects':
        if (args.length === 0) {
          newLogs.push(
            { text: 'Showcase Projects:', type: 'success' },
            { text: '  1. smarttodo  - AI-Powered Task Scheduler Mobile App', type: 'output' },
            { text: '  2. xs-records - Music Release & Distribution Platform', type: 'output' },
            { text: '  3. auth       - Animated Authentication Portal', type: 'output' },
            { text: 'Tip: Type "project <id>" to run the live application inside the portfolio frame!', type: 'output' }
          );
        } else {
          // Allow opening project via 'projects <id>'
          const projId = args[0].toLowerCase();
          handleLaunchProject(projId, newLogs);
        }
        break;

      case 'project':
        if (args.length === 0) {
          newLogs.push({ text: 'Error: Please specify a project ID (e.g. project smarttodo)', type: 'error' });
        } else {
          const projId = args[0].toLowerCase();
          handleLaunchProject(projId, newLogs);
        }
        break;

      case 'contact':
        newLogs.push(
          { text: 'Get in Touch:', type: 'success' },
          { text: '  Email:    mbyrd405@outlook.com', type: 'output' },
          { text: '  LinkedIn: https://www.linkedin.com/in/mbyrd405', type: 'output' },
          { text: '  GitHub:   https://github.com/thealchemist2016', type: 'output' }
        );
        break;

      default:
        newLogs.push({ text: `Command not found: '${mainCommand}'. Type 'help' for assistance.`, type: 'error' });
        break;
    }

    setHistory(newLogs);
    setInput('');
  };

  const handleLaunchProject = (projId: string, logs: CommandLog[]) => {
    let targetId = '';
    if (projId === 'smarttodo' || projId === 'todo' || projId === '1') {
      targetId = 'smarttodo';
    } else if (projId === 'xs-records' || projId === 'xsrecords' || projId === '2') {
      targetId = 'xs-records';
    } else if (projId === 'auth' || projId === 'login-register' || projId === 'login' || projId === '3') {
      targetId = 'login-register';
    }

    if (targetId) {
      logs.push({ text: `Launching ${targetId} preview frame...`, type: 'success' });
      // Call portfolio callback to launch modal viewer
      onLaunchProject(targetId);
    } else {
      logs.push({ text: `Unknown project: '${projId}'. Try 'smarttodo', 'xs-records', or 'auth'.`, type: 'error' });
    }
  };

  return (
    <div className="terminal-widget glass">
      <div className="terminal-header">
        <div className="terminal-buttons">
          <span className="dot dot-close"></span>
          <span className="dot dot-minimize"></span>
          <span className="dot dot-maximize"></span>
        </div>
        <div className="terminal-title">bash - mike@byrd-dev:~</div>
      </div>
      <div className="terminal-body">
        {history.map((log, index) => (
          <div key={index} className={`terminal-line ${log.type}`}>
            {log.text}
          </div>
        ))}
        <div ref={terminalEndRef} />
        
        <form 
          className="terminal-prompt"
          onSubmit={(e) => {
            e.preventDefault();
            handleCommand(input);
          }}
        >
          <span className="prompt-label">mike@byrd-dev:~$</span>
          <input
            type="text"
            className="terminal-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder=""
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            autoFocus
          />
        </form>
      </div>
    </div>
  );
};
