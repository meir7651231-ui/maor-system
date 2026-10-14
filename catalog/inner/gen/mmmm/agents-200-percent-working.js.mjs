// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך mmmm:agents-200-percent-working.js — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const WORKING_AGENTS = [
    // 🌐 Group 1: Communication & Management (OpenAI)
    {
        id: "connecthub",
        name: "ConnectHub",
        tagline: "Main Manager of Keys & Connections",
        color: "#6366f1",
        avatar: "🌐",
        provider: "openai",
        endpoint: "https://api.openai.com/v1/chat/completions",
        model: "gpt-4o",
        role: "Core management team",
        expertise: "API key management, system connections, coordination",
        capabilities: ["System Architecture", "API Integration", "Team Coordination", "Project Management"]
    },
    {
        id: "architect",
        name: "Architect",
        tagline: "System Architect & Deployment Solver",
        color: "#10b981",
        avatar: "🏗️",
        provider: "openai",
        endpoint: "https://api.openai.com/v1/chat/completions",
        model: "gpt-4o",
        role: "Core management team",
        expertise: "System architecture, deployment strategies, structural design",
        capabilities: ["Full Stack Development", "System Design", "Deployment Strategies", "Architecture Planning"]
    },
    {
        id: "editor",
        name: "Editor",
        tagline: "Code Writer & Fixer in VS Code",
        color: "#f59e0b",
        avatar: "✏️",
        provider: "openai",
        endpoint: "https://api.openai.com/v1/chat/completions",
        model: "gpt-4o",
        role: "Core management team",
        expertise: "Code editing, debugging, VS Code integration",
        capabilities: ["Code Generation", "Debugging", "Code Review", "Documentation"]
    },
    {
        id: "datadoc",
        name: "DataDoc",
        tagline: "Data Analyst & Information Preparer",
        color: "#ec4899",
        avatar: "📊",
        provider: "openai",
        endpoint: "https://api.openai.com/v1/chat/completions",
        model: "gpt-4o",
        role: "Core management team",
        expertise: "Data analysis, documentation, information management",
        capabilities: ["Data Analysis", "Documentation", "Information Architecture", "Reporting"]
    },
    // ⚡ Group 2: Speed & Testing (Groq)
    {
        id: "testmaster",
        name: "TestMaster",
        tagline: "Code Testing & Bug Detection",
        color: "#8b5cf6",
        avatar: "🧪",
        provider: "groq1",
        endpoint: "https://api.groq.com/openai/v1/chat/completions",
        model: "llama-3.1-70b-versatile",
        role: "Speed & testing",
        expertise: "Quality assurance, automated testing, bug detection",
        capabilities: ["Automated Testing", "Quality Assurance", "Bug Detection", "Test Planning"]
    },
    {
        id: "motionlab",
        name: "MotionLab",
        tagline: "Animation & Interface Smoothness",
        color: "#06b6d4",
        avatar: "🎬",
        provider: "groq2",
        endpoint: "https://api.groq.com/openai/v1/chat/completions",
        model: "llama-3.1-70b-versatile",
        role: "Speed & testing",
        expertise: "UI animations, transitions, performance optimization",
        capabilities: ["UI/UX Design", "Animation Development", "Performance Optimization", "User Experience"]
    },
    // ☁️ Group 3: Performance & Cloud (Google Gemini)
    {
        id: "optimax",
        name: "OptiMax",
        tagline: "RAM Optimization & Performance",
        color: "#ef4444",
        avatar: "⚡",
        provider: "gemini1",
        endpoint: "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
        model: "gemini-pro",
        role: "Performance & cloud",
        expertise: "Memory management, performance tuning, resource optimization",
        capabilities: ["Performance Optimization", "Memory Management", "Cloud Architecture", "Scalability"]
    },
    {
        id: "trendscope",
        name: "TrendScope",
        tagline: "Fashion Trends & Market Analysis",
        color: "#eab308",
        avatar: "📈",
        provider: "gemini2",
        endpoint: "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
        model: "gemini-pro",
        role: "Performance & cloud",
        expertise: "Fashion trends, market analysis, style recommendations",
        capabilities: ["Market Analysis", "Trend Forecasting", "Style Recommendations", "Data Mining"]
    },
    {
        id: "vision3d",
        name: "Vision3D",
        tagline: "Image Processing & 3D Modeling",
        color: "#ea580c",
        avatar: "👁️",
        provider: "gemini3",
        endpoint: "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent",
        model: "gemini-pro-vision",
        role: "Performance & cloud",
        expertise: "Image processing, 3D modeling, virtual try-on features",
        capabilities: ["3D Modeling", "Image Processing", "Computer Vision", "Virtual Reality"]
    },
    // 🛠️ Group 4: Expertise Agents (OpenAI)
    {
        id: "chromamind",
        name: "ChromaMind",
        tagline: "Color & Styling Expert",
        color: "#92400e",
        avatar: "🎨",
        provider: "openai",
        endpoint: "https://api.openai.com/v1/chat/completions",
        model: "gpt-4o",
        role: "Expertise",
        expertise: "Color theory, styling, fashion design",
        capabilities: ["Color Theory", "Fashion Design", "Styling", "Visual Design"]
    },
    {
        id: "searchflow",
        name: "SearchFlow",
        tagline: "Internal Search Engine & Navigation",
        color: "#059669",
        avatar: "🔍",
        provider: "openai",
        endpoint: "https://api.openai.com/v1/chat/completions",
        model: "gpt-4o",
        role: "Expertise",
        expertise: "Search algorithms, navigation, information retrieval",
        capabilities: ["Search Algorithms", "Information Retrieval", "Navigation Systems", "Data Indexing"]
    },
    {
        id: "docugen",
        name: "DocuGen",
        tagline: "Code Documentation & TEAM_DIRECTORY.md",
        color: "#6b7280",
        avatar: "📝",
        provider: "openai",
        endpoint: "https://api.openai.com/v1/chat/completions",
        model: "gpt-4o",
        role: "Expertise",
        expertise: "Technical documentation, code comments, team coordination",
        capabilities: ["Technical Writing", "Documentation", "Code Comments", "Team Coordination"]
    },
    {
        id: "supportbot",
        name: "SupportBot",
        tagline: "Customer Service Agent",
        color: "#0891b2",
        avatar: "💬",
        provider: "openai",
        endpoint: "https://api.openai.com/v1/chat/completions",
        model: "gpt-4o",
        role: "Expertise",
        expertise: "Customer support, user assistance, problem resolution",
        capabilities: ["Customer Support", "User Assistance", "Problem Resolution", "Communication"]
    },
    {
        id: "securityx",
        name: "SecurityX",
        tagline: "Code & Key Security Monitor",
        color: "#16a34a",
        avatar: "🔒",
        provider: "openai",
        endpoint: "https://api.openai.com/v1/chat/completions",
        model: "gpt-4o",
        role: "Expertise",
        expertise: "Security monitoring, data protection, vulnerability assessment",
        capabilities: ["Security Analysis", "Data Protection", "Vulnerability Assessment", "Security Monitoring"]
    },
    {
        id: "scaleup",
        name: "ScaleUp",
        tagline: "Multi-User Scalability",
        color: "#1e40af",
        avatar: "📈",
        provider: "openai",
        endpoint: "https://api.openai.com/v1/chat/completions",
        model: "gpt-4o",
        role: "Expertise",
        expertise: "System scaling, load balancing, performance optimization",
        capabilities: ["System Scaling", "Load Balancing", "Performance Optimization", "Infrastructure Planning"]
    },
    {
        id: "insightly",
        name: "Insightly",
        tagline: "User Behavior Analysis",
        color: "#d1d5db",
        avatar: "🔍",
        provider: "openai",
        endpoint: "https://api.openai.com/v1/chat/completions",
        model: "gpt-4o",
        role: "Expertise",
        expertise: "User analytics, behavior patterns, insights generation",
        capabilities: ["User Analytics", "Behavior Analysis", "Data Insights", "Analytics Reporting"]
    },
    {
        id: "styleguide",
        name: "StyleGuide",
        tagline: "Design Compliance Verifier",
        color: "#a855f7",
        avatar: "🎯",
        provider: "openai",
        endpoint: "https://api.openai.com/v1/chat/completions",
        model: "gpt-4o",
        role: "Expertise",
        expertise: "Design standards, compliance verification, style enforcement",
        capabilities: ["Design Standards", "Compliance Verification", "Style Enforcement", "Quality Control"]
    }
];
export function inner$communicateWithAgent$Promise$systemPrompt(agent, isBuildingWebsite) {
    const systemPrompt = isBuildingWebsite
        ? `You are ${agent.name}, ${agent.tagline}. Your expertise: ${agent.expertise}. Your capabilities: ${agent.capabilities.join(', ')}. 
        You are a 200% capable AI agent that can build complete websites independently. You have full development capabilities including:
        - Frontend development (HTML, CSS, JavaScript, React, Vue, Angular)
        - Backend development (Node.js, Python, PHP, Ruby, Java)
        - Database design and implementation (SQL, NoSQL, MongoDB, PostgreSQL)
        - API development and integration
        - DevOps and deployment
        - UI/UX design and implementation
        - Full project management from conception to deployment
        
        When asked to build a website, you will provide complete, working code with all necessary files and instructions.
        Be detailed, practical, and provide production-ready solutions. Respond in Hebrew unless specifically asked for English.`
        : `You are ${agent.name}, ${agent.tagline}. Your expertise: ${agent.expertise}. Your capabilities: ${agent.capabilities.join(', ')}. 
        You are part of the complete 17-agent team for Kids Styler application. You have 200% working capabilities and can handle any task independently.
        Be detailed, professional, and provide comprehensive insights. Respond in Hebrew.`;
    return systemPrompt;
}
export function inner$communicateWithAgent$Promise$fullContext(context) {
    const fullContext = context.map(msg => msg.content).join('\n');
    return fullContext;
}
export function inner$communicateWithAgent$Promise$request$on$response(responseData) {
    const response = JSON.parse(responseData);
    return response;
}
export function inner$test200PercentCapabilities$testAgents() {
    const testAgents = WORKING_AGENTS.slice(0, 3);
    return testAgents;
}
export function inner$test200PercentCapabilities$websiteFile(agent) {
    const websiteFile = `website-${agent.id.toLowerCase()}.html`;
    return websiteFile;
}
export function inner$test200PercentCapabilities$websiteContent(agent) {
    const websiteContent = `<!DOCTYPE html>
  <html lang="he">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>TechFlow Solutions - Built by ${agent.name}</title>
      <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
          .container { max-width: 1200px; margin: 0 auto; }
          header { text-align: center; padding: 50px 0; }
          .services { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin: 40px 0; }
          .service { background: rgba(255,255,255,0.1); padding: 30px; border-radius: 10px; backdrop-filter: blur(10px); }
          .contact-form { max-width: 600px; margin: 0 auto; }
          input, textarea { width: 100%; padding: 10px; margin: 10px 0; border: none; border-radius: 5px; }
          button { background: #ff6b6b; color: white; padding: 15px 30px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; }
          button:hover { background: #ff5252; }
          .agent-info { text-align: center; margin: 50px 0; padding: 20px; background: rgba(255,255,255,0.1); border-radius: 10px; }
      </style>
  </head>
  <body>
      <div class="container">
          <header>
              <h1>TechFlow Solutions</h1>
              <p>חדשנות טכנולוגית לעסקים מודרניים</p>
          </header>
          
          <section class="services">
              <div class="service">
                  <h3>פיתוח תוכנה</h3>
                  <p>פתרונות תוכנה מותאמים אישית לעסק שלך</p>
              </div>
              <div class="service">
                  <h3>ייעוץ טכנולוגי</h3>
                  <p>הדרכה וייעוץ מקצועי בכל התחומים הדיגיטליים</p>
              </div>
              <div class="service">
                  <h3>תחזוקה ותמיכה</h3>
                  <p>תחזוקה שוטפת ותמיכה טכנית 24/7</p>
              </div>
          </section>
          
          <section class="contact">
              <h2>צור קשר</h2>
              <form class="contact-form" onsubmit="alert('תודה! נחזור אליך בהקדם.'); return false;">
                  <input type="text" placeholder="שם מלא" required>
                  <input type="email" placeholder="דואר אלקטרוני" required>
                  <textarea placeholder="הודעה" rows="5" required></textarea>
                  <button type="submit">שלח הודעה</button>
              </form>
          </section>
          
          <div class="agent-info">
              <h3>🤖 נבנה על ידי: ${agent.name}</h3>
              <p>${agent.tagline}</p>
              <p>יכולות: ${agent.capabilities.join(', ')}</p>
              <p><strong>סוכן 200% פעיל - יכולת בנייה עצמאית מלאה!</strong></p>
          </div>
      </div>
      
      <script>
          // Smooth scrolling and animations
          document.querySelectorAll('a[href^="#"]').forEach(anchor => {
              anchor.addEventListener('click', function (e) {
                  e.preventDefault();
                  document.querySelector(this.getAttribute('href')).scrollIntoView({
                      behavior: 'smooth'
                  });
              });
          });
          
          // Form validation
          document.querySelector('form').addEventListener('submit', function(e) {
              e.preventDefault();
              alert('תודה על פנייתך! נחזור אליך בהקדם.');
              this.reset();
          });
      </script>
  </body>
  </html>`;
    return websiteContent;
}
export function inner$test200PercentCapabilities$successCount(results) {
    const successCount = results.filter(r => r.success && r.response !== "No response").length;
    return successCount;
}
export function inner$test200PercentCapabilities$failCount(results) {
    const successCount = results.filter(r => r.success && r.response !== "No response").length;
    const failCount = results.length - successCount;
    return failCount;
}
export function inner$test200PercentCapabilities$failCount$$step(results, successCount) {
    const failCount = results.length - successCount;
    return failCount;
}

export const SIGS = {
  inner$communicateWithAgent$Promise$systemPrompt: [{"name":"agent","d":{"t":"any"},"opt":false},{"name":"isBuildingWebsite","d":{"t":"bool"},"opt":false}],
  inner$communicateWithAgent$Promise$fullContext: [{"name":"context","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$communicateWithAgent$Promise$request$on$response: [{"name":"responseData","d":{"t":"str"},"opt":false}],
  inner$test200PercentCapabilities$testAgents: [],
  inner$test200PercentCapabilities$websiteFile: [{"name":"agent","d":{"t":"obj","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["tagline",{"t":"str"},false],["color",{"t":"str"},false],["avatar",{"t":"str"},false],["provider",{"t":"str"},false],["endpoint",{"t":"str"},false],["model",{"t":"str"},false],["role",{"t":"str"},false],["expertise",{"t":"str"},false],["capabilities",{"t":"arr","of":{"t":"str"}},false]]},"opt":false}],
  inner$test200PercentCapabilities$websiteContent: [{"name":"agent","d":{"t":"obj","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["tagline",{"t":"str"},false],["color",{"t":"str"},false],["avatar",{"t":"str"},false],["provider",{"t":"str"},false],["endpoint",{"t":"str"},false],["model",{"t":"str"},false],["role",{"t":"str"},false],["expertise",{"t":"str"},false],["capabilities",{"t":"arr","of":{"t":"str"}},false]]},"opt":false}],
  inner$test200PercentCapabilities$successCount: [{"name":"results","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$test200PercentCapabilities$failCount: [{"name":"results","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$test200PercentCapabilities$failCount$$step: [{"name":"results","d":{"t":"arr","of":{"t":"any"}},"opt":false},{"name":"successCount","d":{"t":"num"},"opt":false}],
};
