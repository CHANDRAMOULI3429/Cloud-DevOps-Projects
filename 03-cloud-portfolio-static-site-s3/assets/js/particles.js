/**
 * Particle Animation System
 * Creates animated background particles that highlight the work
 */

(function() {
    'use strict';

    class ParticleSystem {
        constructor(canvasId) {
            this.canvas = document.getElementById(canvasId);
            if (!this.canvas) return;
            
            this.ctx = this.canvas.getContext('2d');
            this.particles = [];
            this.animationId = null;
            this.mouse = { x: 0, y: 0 };
            
            this.init();
        }

        init() {
            this.resize();
            this.createParticles();
            this.animate();
            this.setupEventListeners();
        }

        resize() {
            const rect = this.canvas.parentElement.getBoundingClientRect();
            this.canvas.width = rect.width;
            this.canvas.height = rect.height;
        }

        createParticles() {
            const particleCount = Math.floor((this.canvas.width * this.canvas.height) / 15000);
            
            for (let i = 0; i < particleCount; i++) {
                this.particles.push({
                    x: Math.random() * this.canvas.width,
                    y: Math.random() * this.canvas.height,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5,
                    radius: Math.random() * 2 + 1,
                    opacity: Math.random() * 0.5 + 0.2,
                    color: this.getRandomColor()
                });
            }
        }

        getRandomColor() {
            const colors = [
                'rgba(37, 99, 235, 0.6)',   // Blue
                'rgba(59, 130, 246, 0.5)',   // Light Blue
                'rgba(99, 102, 241, 0.4)',  // Indigo
                'rgba(139, 92, 246, 0.3)',  // Purple
                'rgba(236, 72, 153, 0.3)'   // Pink
            ];
            return colors[Math.floor(Math.random() * colors.length)];
        }

        drawParticle(particle) {
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = particle.color.replace('0.6', particle.opacity);
            this.ctx.fill();
        }

        drawConnection(p1, p2, distance) {
            const opacity = (1 - distance / 150) * 0.3;
            if (opacity > 0) {
                this.ctx.beginPath();
                this.ctx.moveTo(p1.x, p1.y);
                this.ctx.lineTo(p2.x, p2.y);
                this.ctx.strokeStyle = `rgba(37, 99, 235, ${opacity})`;
                this.ctx.lineWidth = 0.5;
                this.ctx.stroke();
            }
        }

        updateParticle(particle) {
            // Update position
            particle.x += particle.vx;
            particle.y += particle.vy;

            // Bounce off edges
            if (particle.x < 0 || particle.x > this.canvas.width) particle.vx *= -1;
            if (particle.y < 0 || particle.y > this.canvas.height) particle.vy *= -1;

            // Keep particles in bounds
            particle.x = Math.max(0, Math.min(this.canvas.width, particle.x));
            particle.y = Math.max(0, Math.min(this.canvas.height, particle.y));

            // Attract to mouse
            const dx = this.mouse.x - particle.x;
            const dy = this.mouse.y - particle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 100) {
                const force = (100 - distance) / 100;
                particle.vx += (dx / distance) * force * 0.01;
                particle.vy += (dy / distance) * force * 0.01;
            }

            // Damping
            particle.vx *= 0.99;
            particle.vy *= 0.99;
        }

        animate() {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            // Update and draw particles
            this.particles.forEach(particle => {
                this.updateParticle(particle);
                this.drawParticle(particle);
            });

            // Draw connections
            for (let i = 0; i < this.particles.length; i++) {
                for (let j = i + 1; j < this.particles.length; j++) {
                    const dx = this.particles[i].x - this.particles[j].x;
                    const dy = this.particles[i].y - this.particles[j].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < 150) {
                        this.drawConnection(this.particles[i], this.particles[j], distance);
                    }
                }
            }

            this.animationId = requestAnimationFrame(() => this.animate());
        }

        setupEventListeners() {
            // Mouse move
            window.addEventListener('mousemove', (e) => {
                const rect = this.canvas.getBoundingClientRect();
                this.mouse.x = e.clientX - rect.left;
                this.mouse.y = e.clientY - rect.top;
            });

            // Resize
            let resizeTimeout;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    this.resize();
                    this.particles = [];
                    this.createParticles();
                }, 250);
            });
        }

        destroy() {
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
            }
        }
    }

    // Initialize particle system when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        const heroSection = document.getElementById('hero');
        if (heroSection) {
            // Create canvas element
            const canvas = document.createElement('canvas');
            canvas.id = 'particleCanvas';
            canvas.className = 'particle-canvas';
            heroSection.appendChild(canvas);

            // Initialize particle system
            new ParticleSystem('particleCanvas');
        }
    });

})();

