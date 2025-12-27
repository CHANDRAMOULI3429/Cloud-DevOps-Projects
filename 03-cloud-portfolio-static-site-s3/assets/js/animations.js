/**
 * Scroll Animations
 * Adds fade-in and slide animations on scroll
 */

(function() {
    'use strict';

    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Optional: stop observing after animation
                // observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Initialize animations when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        // Add animation classes to elements
        const aboutContent = document.querySelector('.about-content');
        if (aboutContent) {
            aboutContent.classList.add('fade-in');
            observer.observe(aboutContent);
        }

        // Animate skill categories
        const skillCategories = document.querySelectorAll('.skill-category');
        skillCategories.forEach((category, index) => {
            category.classList.add('fade-in');
            category.style.transitionDelay = `${index * 0.1}s`;
            observer.observe(category);
        });

        // Animate project cards
        const projectCards = document.querySelectorAll('.project-card');
        projectCards.forEach((card, index) => {
            card.classList.add('fade-in');
            card.style.transitionDelay = `${index * 0.1}s`;
            observer.observe(card);
        });

        // Animate contact items
        const contactItems = document.querySelectorAll('.contact-item');
        contactItems.forEach((item, index) => {
            item.classList.add('fade-in');
            item.style.transitionDelay = `${index * 0.1}s`;
            observer.observe(item);
        });

        // Animate section titles
        const sectionTitles = document.querySelectorAll('.section-title');
        sectionTitles.forEach(title => {
            title.classList.add('fade-in');
            observer.observe(title);
        });
    });

})();

