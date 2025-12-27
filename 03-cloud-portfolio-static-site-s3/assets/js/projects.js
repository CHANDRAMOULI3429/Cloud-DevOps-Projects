/**
 * Projects JavaScript File
 * Handles dynamic project loading from JSON and modal functionality
 */

(function() {
    'use strict';

    // DOM Elements
    const projectsGrid = document.getElementById('projectsGrid');
    const projectModal = document.getElementById('projectModal');
    const modalBody = document.getElementById('modalBody');
    const modalClose = document.getElementById('modalClose');
    const projectsDataPath = 'assets/data/projects.json';

    // Initialize
    document.addEventListener('DOMContentLoaded', function() {
        loadProjects();
        initModal();
    });

    /**
     * Load Projects from JSON
     * Fetches project data and renders project cards
     */
    async function loadProjects() {
        try {
            const response = await fetch(projectsDataPath);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const projects = await response.json();
            
            if (projects.length === 0) {
                projectsGrid.innerHTML = '<p class="loading">No projects available yet. Check back soon!</p>';
                return;
            }

            renderProjects(projects);
        } catch (error) {
            console.error('Error loading projects:', error);
            projectsGrid.innerHTML = `
                <div class="loading" style="color: #ef4444;">
                    <p>Error loading projects. Please check the console for details.</p>
                    <p style="font-size: 0.875rem; margin-top: 0.5rem;">${error.message}</p>
                </div>
            `;
        }
    }

    /**
     * Render Projects
     * Creates project cards from JSON data
     */
    function renderProjects(projects) {
        if (!projectsGrid) return;

        // Clear loading state
        projectsGrid.innerHTML = '';

        // Sort projects: featured first, then by id
        const sortedProjects = [...projects].sort((a, b) => {
            if (a.featured && !b.featured) return -1;
            if (!a.featured && b.featured) return 1;
            return b.id - a.id;
        });

        sortedProjects.forEach(project => {
            const projectCard = createProjectCard(project);
            projectsGrid.appendChild(projectCard);
        });
    }

    /**
     * Create Project Card Element
     * Builds HTML structure for a project card
     */
    function createProjectCard(project) {
        const card = document.createElement('div');
        card.className = 'project-card';
        card.setAttribute('data-project-id', project.id);

        // Truncate description for card view
        const truncatedDescription = truncateText(project.problem || project.description || '', 150);

        // Status badge
        const statusClass = project.status.toLowerCase().replace(/\s+/g, '-');
        const statusText = project.status;

        // Tech stack preview (first 3 items)
        const techPreview = project.techStack ? project.techStack.slice(0, 3) : [];

        card.innerHTML = `
            <div class="project-card-header">
                <h3 class="project-card-title">${escapeHtml(project.title)}</h3>
                <span class="project-status ${statusClass}">${escapeHtml(statusText)}</span>
            </div>
            <p class="project-card-description">${escapeHtml(truncatedDescription)}</p>
            ${techPreview.length > 0 ? `
                <div class="project-card-tech">
                    ${techPreview.map(tech => `<span class="tech-tag">${escapeHtml(tech)}</span>`).join('')}
                    ${project.techStack.length > 3 ? `<span class="tech-tag">+${project.techStack.length - 3} more</span>` : ''}
                </div>
            ` : ''}
            <div class="project-card-footer">
                <a href="#" class="project-link view-details" data-project-id="${project.id}">View Details</a>
                ${project.githubLink ? `<a href="${escapeHtml(project.githubLink)}" target="_blank" rel="noopener noreferrer" class="project-link">GitHub</a>` : ''}
            </div>
        `;

        // Add click event to view details
        const viewDetailsLink = card.querySelector('.view-details');
        if (viewDetailsLink) {
            viewDetailsLink.addEventListener('click', function(e) {
                e.preventDefault();
                showProjectModal(project);
            });
        }

        // Also make entire card clickable
        card.addEventListener('click', function(e) {
            // Don't trigger if clicking on a link
            if (!e.target.closest('a')) {
                showProjectModal(project);
            }
        });

        return card;
    }

    /**
     * Show Project Modal
     * Displays full project details in a modal
     */
    function showProjectModal(project) {
        if (!modalBody || !projectModal) return;

        const statusClass = project.status.toLowerCase().replace(/\s+/g, '-');

        modalBody.innerHTML = `
            <h2 class="modal-title">
                ${escapeHtml(project.title)}
                <span class="project-status ${statusClass}">${escapeHtml(project.status)}</span>
            </h2>

            <div class="modal-section">
                <h3 class="modal-section-title">Problem Statement</h3>
                <div class="modal-section-content">
                    <p>${escapeHtml(project.problem)}</p>
                </div>
            </div>

            <div class="modal-section">
                <h3 class="modal-section-title">Architecture Overview</h3>
                <div class="modal-section-content">
                    <p>${escapeHtml(project.architecture)}</p>
                </div>
            </div>

            ${project.techStack && project.techStack.length > 0 ? `
                <div class="modal-section">
                    <h3 class="modal-section-title">Tech Stack</h3>
                    <div class="modal-section-content">
                        <div class="modal-tech-stack">
                            ${project.techStack.map(tech => `<span class="tech-tag">${escapeHtml(tech)}</span>`).join('')}
                        </div>
                    </div>
                </div>
            ` : ''}

            ${project.cloudServices && project.cloudServices.length > 0 ? `
                <div class="modal-section">
                    <h3 class="modal-section-title">Cloud Services</h3>
                    <div class="modal-section-content">
                        <div class="modal-cloud-services">
                            ${project.cloudServices.map(service => `<span class="tech-tag">${escapeHtml(service)}</span>`).join('')}
                        </div>
                    </div>
                </div>
            ` : ''}

            ${project.keyLearnings && project.keyLearnings.length > 0 ? `
                <div class="modal-section">
                    <h3 class="modal-section-title">Key Learnings</h3>
                    <div class="modal-section-content">
                        <ul class="modal-learnings">
                            ${project.keyLearnings.map(learning => `<li>${escapeHtml(learning)}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            ` : ''}

            <div class="modal-links">
                ${project.githubLink ? `
                    <a href="${escapeHtml(project.githubLink)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">
                        View on GitHub
                    </a>
                ` : ''}
                ${project.liveDemoLink ? `
                    <a href="${escapeHtml(project.liveDemoLink)}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary">
                        Live Demo
                    </a>
                ` : ''}
            </div>
        `;

        // Show modal
        projectModal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling

        // Focus management for accessibility
        const firstFocusable = modalClose;
        if (firstFocusable) {
            firstFocusable.focus();
        }
    }

    /**
     * Initialize Modal
     * Sets up modal close functionality
     */
    function initModal() {
        if (!projectModal || !modalClose) return;

        // Close button
        modalClose.addEventListener('click', closeModal);

        // Close on background click
        projectModal.addEventListener('click', function(e) {
            if (e.target === projectModal) {
                closeModal();
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && projectModal.classList.contains('active')) {
                closeModal();
            }
        });
    }

    /**
     * Close Modal
     * Hides the project modal
     */
    function closeModal() {
        if (!projectModal) return;
        
        projectModal.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
    }

    /**
     * Utility: Truncate Text
     * Shortens text to specified length with ellipsis
     */
    function truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength).trim() + '...';
    }

    /**
     * Utility: Escape HTML
     * Prevents XSS by escaping HTML characters
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

})();

