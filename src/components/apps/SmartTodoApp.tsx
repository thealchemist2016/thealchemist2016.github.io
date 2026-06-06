import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Plus, Trash2, CheckSquare, Square, Clock, 
  Filter, Key, Info 
} from 'lucide-react';
import './AppsStyles.css';

interface TodoTask {
  id: string;
  title: string;
  notes: string;
  priority: 'High' | 'Medium' | 'Low' | 'Inbox';
  tags: string[];
  duration: string;
  completed: boolean;
  createdAt: number;
}

const DEFAULT_TASKS: TodoTask[] = [
  {
    id: '1',
    title: 'Review production authentication routes for JWT leakage',
    notes: 'Verify credentials compare algorithms and secure transmission policies.',
    priority: 'High',
    tags: ['Security', 'Backend'],
    duration: '45m',
    completed: false,
    createdAt: Date.now() - 3600000 * 2
  },
  {
    id: '2',
    title: 'Design vector DB schema for search indexing',
    notes: 'Map text embeddings to matching query schemas.',
    priority: 'Medium',
    tags: ['AI', 'Database'],
    duration: '1h 30m',
    completed: false,
    createdAt: Date.now() - 3600000 * 4
  },
  {
    id: '3',
    title: 'Format portfolio landing CSS grid alignment',
    notes: 'Improve responsive padding for mobile viewports.',
    priority: 'Low',
    tags: ['UI/UX', 'Frontend'],
    duration: '20m',
    completed: true,
    createdAt: Date.now() - 3600000 * 24
  }
];

export const SmartTodoApp: React.FC = () => {
  const [tasks, setTasks] = useState<TodoTask[]>([]);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('All');
  
  // Stored Gemini API key (entered in AgentMesh or locally)
  const [apiKey, setApiKey] = useState<string>('');
  const [showKeyInput, setShowKeyInput] = useState(false);

  // Load from local storage
  useEffect(() => {
    const savedTasks = localStorage.getItem('smarttodo_tasks');
    if (savedTasks) {
      try {
        setTasks(JSON.parse(savedTasks));
      } catch (e) {
        setTasks(DEFAULT_TASKS);
      }
    } else {
      setTasks(DEFAULT_TASKS);
    }

    const key = localStorage.getItem('gemini_api_key') || '';
    setApiKey(key);
  }, []);

  // Sync to local storage
  const saveTasks = (updated: TodoTask[]) => {
    setTasks(updated);
    localStorage.setItem('smarttodo_tasks', JSON.stringify(updated));
  };

  const handleSaveKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
    setShowKeyInput(false);
  };

  // Local fallback parsing using regex keyword matching
  const parseTaskLocally = (taskTitle: string, taskNotes: string): Partial<TodoTask> => {
    const text = (taskTitle + ' ' + taskNotes).toLowerCase();
    
    // Tag matching
    const tags: string[] = [];
    if (text.includes('db') || text.includes('mongo') || text.includes('sql') || text.includes('postgres')) tags.push('Database');
    if (text.includes('css') || text.includes('style') || text.includes('frontend') || text.includes('ui') || text.includes('ux')) tags.push('UI/UX');
    if (text.includes('api') || text.includes('auth') || text.includes('route') || text.includes('backend')) tags.push('Backend');
    if (text.includes('ai') || text.includes('agent') || text.includes('gemini') || text.includes('llm')) tags.push('AI');
    if (tags.length === 0) tags.push('General');

    // Priority matching
    let priority: TodoTask['priority'] = 'Inbox';
    if (text.includes('critical') || text.includes('security') || text.includes('bug') || text.includes('urgent') || text.includes('leak')) {
      priority = 'High';
    } else if (text.includes('plan') || text.includes('design') || text.includes('develop')) {
      priority = 'Medium';
    } else if (text.includes('polish') || text.includes('format') || text.includes('read')) {
      priority = 'Low';
    }

    // Duration guessing
    let duration = '30m';
    if (text.includes('design') || text.includes('implement')) duration = '1h 30m';
    if (text.includes('fix') || text.includes('tweak')) duration = '15m';

    return { priority, tags, duration };
  };

  // Call client-side Gemini API directly to classify/prioritize task
  const parseTaskWithAI = async (taskTitle: string, taskNotes: string): Promise<Partial<TodoTask>> => {
    if (!apiKey) return parseTaskLocally(taskTitle, taskNotes);

    try {
      const prompt = `You are a smart productivity assistant. Classify and estimate the following task:
Title: "${taskTitle}"
Notes: "${taskNotes}"

You must respond with a strict JSON object containing EXACTLY:
{
  "priority": "High" | "Medium" | "Low",
  "tags": ["Tag1", "Tag2"], (choose from Tech, Security, AI, Database, UI/UX, General)
  "duration": "e.g. 30m, 1h, 2h 30m"
}
Response must be only valid JSON. Do not include markdown code block syntax.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' }
          })
        }
      );

      const data = await response.json();
      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const parsed = JSON.parse(responseText.trim());

      return {
        priority: parsed.priority || 'Medium',
        tags: parsed.tags || ['General'],
        duration: parsed.duration || '30m'
      };
    } catch (e) {
      console.error('Gemini classification failed, reverting to local parser.', e);
      return parseTaskLocally(taskTitle, taskNotes);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    const aiParse = await parseTaskWithAI(title, notes);
    setLoading(false);

    const newTask: TodoTask = {
      id: Math.random().toString(),
      title,
      notes,
      priority: aiParse.priority || 'Inbox',
      tags: aiParse.tags || ['General'],
      duration: aiParse.duration || '30m',
      completed: false,
      createdAt: Date.now()
    };

    saveTasks([newTask, ...tasks]);
    setTitle('');
    setNotes('');
  };

  const toggleComplete = (id: string) => {
    const updated = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    saveTasks(updated);
  };

  const deleteTask = (id: string) => {
    const updated = tasks.filter(t => t.id !== id);
    saveTasks(updated);
  };

  // Filter tasks
  const allTags = ['All', ...Array.from(new Set(tasks.flatMap(t => t.tags)))];
  const filteredTasks = tasks.filter(t => 
    selectedTagFilter === 'All' ? true : t.tags.includes(selectedTagFilter)
  );

  const getPriorityColor = (priority: TodoTask['priority']) => {
    switch (priority) {
      case 'High': return '#ef4444';
      case 'Medium': return '#f59e0b';
      case 'Low': return '#3b82f6';
      default: return '#9ca3af';
    }
  };

  return (
    <div className="app-wrapper">
      <div className="app-header-bar">
        <h2>
          <CheckSquare size={18} color="var(--accent)" />
          SmartTodo: AI Prioritization Board
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            className="sim-btn sim-btn-secondary" 
            style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => setShowKeyInput(!showKeyInput)}
          >
            <Key size={12} color={apiKey ? '#22c55e' : 'var(--text-muted)'} />
            {apiKey ? 'AI Active' : 'Configure AI'}
          </button>
        </div>
      </div>

      {showKeyInput && (
        <div style={{ padding: '16px', background: 'rgba(220, 38, 38, 0.05)', borderBottom: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Enter Gemini API Key (Stored locally in your browser cache):</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Get a key from Google AI Studio</span>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="password" 
              className="records-input" 
              placeholder="AIzaSy..." 
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              style={{ flex: 1 }}
            />
            <button className="sim-btn" onClick={() => handleSaveKey(apiKey)}>Save</button>
            <button className="sim-btn sim-btn-secondary" onClick={() => setShowKeyInput(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="app-scroll-content">
        <div className="todo-grid">
          {/* Add Task Panel */}
          <div className="todo-panel">
            <div className="glass-card" style={{ padding: '16px' }}>
              <h3 style={{ fontSize: '0.9rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={14} color="var(--accent)" />
                Smart Task Creator
              </h3>
              
              <form onSubmit={handleAddTask}>
                <div className="records-input-group">
                  <label>What do you need to do?</label>
                  <input 
                    type="text" 
                    className="records-input" 
                    placeholder="e.g. Audit bcrypt password matching in profiles router" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="records-input-group">
                  <label>Add context notes (Optional)</label>
                  <textarea 
                    className="records-input" 
                    placeholder="Provide details to assist the AI classifier..." 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    style={{ height: '60px', resize: 'none' }}
                  />
                </div>

                <button 
                  type="submit" 
                  className="sim-btn" 
                  style={{ width: '100%', marginTop: '8px', display: 'flex', justifyContent: 'center', gap: '6px' }}
                  disabled={loading}
                >
                  <Plus size={14} />
                  {loading ? 'AI Classifying...' : 'Add Task'}
                </button>
              </form>

              <div style={{ marginTop: '16px', fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Info size={12} color="var(--accent)" />
                <span>
                  {apiKey 
                    ? 'Gemini will parse intent, tags, and priority automatically!' 
                    : 'Configure Gemini API Key in the top-right to activate live AI categorization.'
                  }
                </span>
              </div>
            </div>

            {/* Filter Panel */}
            <div className="glass-card" style={{ padding: '16px' }}>
              <h4 style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <Filter size={12} />
                Filter by Category
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {allTags.map(tag => (
                  <button 
                    key={tag}
                    className={`tag ${selectedTagFilter === tag ? 'active' : ''}`}
                    style={{ 
                      cursor: 'pointer',
                      background: selectedTagFilter === tag ? 'var(--accent)' : 'rgba(255,255,255,0.02)',
                      color: selectedTagFilter === tag ? '#fff' : 'var(--text-secondary)',
                      borderColor: selectedTagFilter === tag ? 'var(--accent)' : 'var(--glass-border)'
                    }}
                    onClick={() => setSelectedTagFilter(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Kanban Lanes */}
          <div className="todo-panel">
            <div className="todo-board">
              {(['High', 'Medium', 'Low', 'Inbox'] as const).map(lane => {
                const laneTasks = filteredTasks.filter(t => t.priority === lane);
                return (
                  <div key={lane} className="todo-lane">
                    <h3>
                      <span style={{ color: getPriorityColor(lane) }}>{lane}</span>
                      <span className="todo-lane-count">{laneTasks.length}</span>
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '420px', paddingRight: '2px' }}>
                      {laneTasks.length === 0 ? (
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0', border: '1px dashed var(--glass-border)', borderRadius: '6px' }}>
                          Empty
                        </div>
                      ) : (
                        laneTasks.map(task => (
                          <div key={task.id} className="todo-card">
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'start' }}>
                              <button 
                                onClick={() => toggleComplete(task.id)} 
                                style={{ background: 'none', border: 'none', color: task.completed ? '#22c55e' : 'var(--text-muted)', cursor: 'pointer', padding: 0, marginTop: '2px' }}
                              >
                                {task.completed ? <CheckSquare size={14} /> : <Square size={14} />}
                              </button>
                              <div style={{ flex: 1 }}>
                                <div className="todo-card-title" style={{ textDecoration: task.completed ? 'line-through' : 'none', color: task.completed ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                                  {task.title}
                                </div>
                                {task.notes && (
                                  <div className="todo-card-desc" style={{ marginTop: '4px' }}>
                                    {task.notes}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="todo-card-footer">
                              <div className="todo-card-tags">
                                {task.tags.map(tag => (
                                  <span key={tag} className="todo-card-tag">{tag}</span>
                                ))}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                  <Clock size={10} />
                                  {task.duration}
                                </span>
                                <button 
                                  onClick={() => deleteTask(task.id)}
                                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                                  title="Delete Task"
                                >
                                  <Trash2 size={12} className="icon-hover-red" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
