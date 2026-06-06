import React, { useState, useEffect, useRef } from 'react';

interface TerminalWidgetProps {
  onLaunchProject: (projectId: string) => void;
}

interface CommandLog {
  text: string;
  type: 'input' | 'output' | 'error' | 'success';
}

interface FSNode {
  type: 'file' | 'dir';
  content?: string;
  children?: { [key: string]: FSNode };
}

// Predefined Virtual File System
const virtualFS: { [key: string]: FSNode } = {
  'bio.md': {
    type: 'file',
    content: `=====================================================
            MICHAEL JAMES BYRD JR.
=====================================================
Role: Full-Stack Software Engineer
Focus: React, React Native, Node.js REST APIs

Summary:
Highly dedicated full-stack engineer who builds user-first
applications. Bridging the gap between robust system architecture
and fluid, modern client-side experiences.

Education:
Southern Careers Institute - Full Stack Web Development

Available for work: YES
`
  },
  'projects': {
    type: 'dir',
    children: {
      'smarttodo.md': {
        type: 'file',
        content: `-----------------------------------------------------
PROJECT: SmartTodo
-----------------------------------------------------
Description: An AI-powered productivity app that automatically
prioritizes and schedules tasks. Compiled for cross-platform web use.
Stack: React Native, Expo Web, TypeScript, Async Storage

Tip: Run 'project smarttodo' to launch this application live!`
      },
      'xs-records.md': {
        type: 'file',
        content: `-----------------------------------------------------
PROJECT: XS-Records
-----------------------------------------------------
Description: A music release submission and distribution platform 
built for Indie Artists and Records Labels.
Stack: React, Redux, Node.js, Express, MongoDB

Tip: Run 'project xs-records' to launch this application live!`
      },
      'auth-portal.md': {
        type: 'file',
        content: `-----------------------------------------------------
PROJECT: Animated Authentication Portal
-----------------------------------------------------
Description: A premium client-side credentials entrance. Features
sleek animations, inline SVGs, and validation feedback.
Stack: React, React Spring, Custom CSS HSL Gradients

Tip: Run 'project auth' to launch this application live!`
      }
    }
  },
  'skills': {
    type: 'dir',
    children: {
      'languages.json': {
        type: 'file',
        content: `{\n  "TypeScript": "Expert",\n  "JavaScript": "Expert",\n  "Python": "Intermediate",\n  "PowerShell": "Intermediate",\n  "SQL/NoSQL": "Intermediate"\n}`
      },
      'frameworks.json': {
        type: 'file',
        content: `{\n  "React": "Expert (Single-page apps, Hooks, State)",\n  "React Native": "Expert (Expo CLI, Web compilations)",\n  "Express.js": "Expert (REST APIs, routing, middleware)",\n  "MongoDB/Mongoose": "Advanced (Aggregations, schemas)"\n}`
      }
    }
  },
  'contact': {
    type: 'dir',
    children: {
      'email.txt': {
        type: 'file',
        content: `Email: mbyrd405@outlook.com`
      },
      'socials.json': {
        type: 'file',
        content: `{\n  "LinkedIn": "https://www.linkedin.com/in/mbyrd405",\n  "GitHub": "https://github.com/thealchemist2016"\n}`
      }
    }
  },
  'secrets.txt': {
    type: 'file',
    content: `ACCESS GRANTED.

Easter Egg: You have discovered a hidden file!
Fun Fact: This entire shell environment runs dynamically in React state.
Thank you for inspecting my portfolio! Feel free to reach out to me
at mbyrd405@outlook.com to discuss collaboration opportunities.
`
  }
};

export const TerminalWidget: React.FC<TerminalWidgetProps> = ({ onLaunchProject }) => {
  const [input, setInput] = useState('');
  const [path, setPath] = useState<string[]>([]); // Current directory path array
  const [history, setHistory] = useState<CommandLog[]>([
    { text: 'Michael Byrd Shell [Version 1.1.2]', type: 'success' },
    { text: "Virtual filesystem mounted. Type 'help' to see commands.", type: 'output' },
    { text: "Try navigating using 'ls', 'cd <dir>', and 'cat <file>'.", type: 'output' },
    { text: '', type: 'output' },
  ]);
  
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  // Navigate the virtual FS tree to find a node by its path array
  const getNodeByPath = (targetPath: string[]): FSNode | null => {
    let curr: FSNode = { type: 'dir', children: virtualFS };
    for (const p of targetPath) {
      if (curr.type !== 'dir' || !curr.children || !curr.children[p]) {
        return null;
      }
      curr = curr.children[p];
    }
    return curr;
  };

  const handleCommand = (cmd: string) => {
    const trimmedCmd = cmd.trim();
    if (!trimmedCmd) return;

    const parts = trimmedCmd.split(' ');
    const mainCommand = parts[0].toLowerCase();
    const args = parts.slice(1);

    const currentPathStr = `~${path.length > 0 ? '/' + path.join('/') : ''}`;
    const newLogs: CommandLog[] = [
      ...history,
      { text: `mike@byrd-dev:${currentPathStr}$ ${trimmedCmd}`, type: 'input' }
    ];

    switch (mainCommand) {
      case 'clear':
        setHistory([]);
        setInput('');
        return;

      case 'help':
        newLogs.push(
          { text: 'Shell commands:', type: 'success' },
          { text: '  ls           - List files and folders in current directory.', type: 'output' },
          { text: '  cd <dir>     - Change working directory (e.g. cd projects, cd ..).', type: 'output' },
          { text: '  cat <file>   - Output contents of a file (e.g. cat bio.md).', type: 'output' },
          { text: '  pwd          - Print absolute working directory path.', type: 'output' },
          { text: '  project <id> - Launch app in mock device frame (smarttodo | xs-records | auth).', type: 'output' },
          { text: '  clear        - Flush terminal screen logs.', type: 'output' }
        );
        break;

      case 'pwd':
        newLogs.push({ text: `/${path.join('/')}`, type: 'output' });
        break;

      case 'ls': {
        const currentDir = getNodeByPath(path);
        if (currentDir && currentDir.type === 'dir' && currentDir.children) {
          const items = Object.keys(currentDir.children).map(name => {
            const isDir = currentDir.children![name].type === 'dir';
            return isDir ? `${name}/` : name;
          });
          if (items.length > 0) {
            newLogs.push({ text: items.join('      '), type: 'output' });
          } else {
            newLogs.push({ text: '(empty directory)', type: 'output' });
          }
        } else {
          newLogs.push({ text: 'Error: Cannot read current directory.', type: 'error' });
        }
        break;
      }

      case 'cd': {
        const targetDir = args[0];
        if (targetDir === '..') {
          if (path.length > 0) {
            setPath(prev => prev.slice(0, -1));
          }
        } else if (targetDir === '/' || !targetDir) {
          setPath([]);
        } else {
          // Resolve relative target directories
          const currentDir = getNodeByPath(path);
          if (currentDir && currentDir.type === 'dir' && currentDir.children && currentDir.children[targetDir]) {
            const targetNode = currentDir.children[targetDir];
            if (targetNode.type === 'dir') {
              setPath(prev => [...prev, targetDir]);
            } else {
              newLogs.push({ text: `cd: not a directory: ${targetDir}`, type: 'error' });
            }
          } else {
            newLogs.push({ text: `cd: no such file or directory: ${targetDir}`, type: 'error' });
          }
        }
        break;
      }

      case 'cat': {
        const fileName = args[0];
        if (!fileName) {
          newLogs.push({ text: 'Usage: cat <filename>', type: 'error' });
        } else {
          const fileNode = getNodeByPath([...path, fileName]);
          if (fileNode) {
            if (fileNode.type === 'file') {
              newLogs.push({ text: fileNode.content || '', type: 'output' });
            } else {
              newLogs.push({ text: `cat: ${fileName}: Is a directory`, type: 'error' });
            }
          } else {
            newLogs.push({ text: `cat: ${fileName}: No such file or directory`, type: 'error' });
          }
        }
        break;
      }

      case 'project': {
        if (args.length === 0) {
          newLogs.push({ text: 'Usage: project <smarttodo | xs-records | auth>', type: 'error' });
        } else {
          const projId = args[0].toLowerCase();
          handleLaunchProject(projId, newLogs);
        }
        break;
      }

      default:
        newLogs.push({ text: `Command not found: '${mainCommand}'. Type 'help' to see details.`, type: 'error' });
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
      onLaunchProject(targetId);
    } else {
      logs.push({ text: `Unknown project: '${projId}'. Try 'smarttodo', 'xs-records', or 'auth'.`, type: 'error' });
    }
  };

  const currentPathStr = `~${path.length > 0 ? '/' + path.join('/') : ''}`;

  return (
    <div className="terminal-widget glass">
      <div className="terminal-header">
        <div className="terminal-buttons">
          <span className="dot dot-close"></span>
          <span className="dot dot-minimize"></span>
          <span className="dot dot-maximize"></span>
        </div>
        <div className="terminal-title">bash - mike@byrd-dev:{currentPathStr}</div>
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
          <span className="prompt-label">mike@byrd-dev:{currentPathStr}$</span>
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
