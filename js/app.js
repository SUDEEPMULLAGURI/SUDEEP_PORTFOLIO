// Load Skills from JSON
async function loadSkills() {
  try {
    const response = await fetch('data/skills.json');
    const data = await response.json();
    renderSkills(data.skills);
  } catch (error) {
    console.error('Error loading skills:', error);
  }
}

// Load Projects from JSON
async function loadProjects() {
  try {
    const response = await fetch('data/projects.json');
    const data = await response.json();
    renderProjects(data.projects);
  } catch (error) {
    console.error('Error loading projects:', error);
  }
}

// Render Skills Section
function renderSkills(skills) {
  const skillsGrid = document.querySelector('.skills-grid');
  skillsGrid.innerHTML = '';
  
  skills.forEach(skill => {
    const skillCard = document.createElement('div');
    skillCard.className = 'skill-card';
    skillCard.innerHTML = `
      <h3>${skill.icon} ${skill.category}</h3>
      <ul>
        ${skill.items.map(item => `<li>${item}</li>`).join('')}
      </ul>
    `;
    skillsGrid.appendChild(skillCard);
  });
  
  // Add event listeners for delete buttons
  document.querySelectorAll('.btn-delete-skill').forEach(btn => {
    btn.addEventListener('click', (e) => deleteSkill(e.target.dataset.skillId));
  });
}

// Render Projects Section
function renderProjects(projects) {
  const projectsGrid = document.querySelector('.projects-grid');
  projectsGrid.innerHTML = '';
  
  projects.forEach(project => {
    const projectCard = document.createElement('div');
    projectCard.className = 'project-card';
    projectCard.innerHTML = `
      <div class="project-header">
        <h3>${project.title}</h3>
        <p class="project-date">${project.date}</p>
      </div>
      <div class="project-content">
        <p style="margin-bottom: 1rem; color: var(--text-secondary);">${project.description}</p>
        <ul>
          ${project.technologies.map(tech => `<li>${tech}</li>`).join('')}
        </ul>
        <div style="margin-top: 1.5rem; display: flex; gap: 1rem;">
          <a href="${project.github}" target="_blank" class="btn btn-primary" style="flex: 1; text-align: center; text-decoration: none; padding: 0.6rem 1rem; font-size: 0.9rem;">
            <i class="fab fa-github"></i> View on GitHub
          </a>
        </div>
      </div>
    `;
    projectsGrid.appendChild(projectCard);
  });
  
  // Add event listeners for delete buttons
  document.querySelectorAll('.btn-delete-project').forEach(btn => {
    btn.addEventListener('click', (e) => deleteProject(e.target.dataset.projectId));
  });
}

// Delete Project from JSON
function deleteProject(projectId) {
  if (confirm('Are you sure you want to delete this project?')) {
    fetch('data/projects.json')
      .then(res => res.json())
      .then(data => {
        data.projects = data.projects.filter(p => p.id != projectId);
        // In production, send to backend to save
        console.log('Project deleted. Updated data:', data);
        renderProjects(data.projects);
      });
  }
}

// Delete Skill from JSON
function deleteSkill(skillId) {
  if (confirm('Are you sure you want to delete this skill category?')) {
    fetch('data/skills.json')
      .then(res => res.json())
      .then(data => {
        data.skills = data.skills.filter(s => s.id != skillId);
        // In production, send to backend to save
        console.log('Skill deleted. Updated data:', data);
        renderSkills(data.skills);
      });
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  loadSkills();
  loadProjects();
});