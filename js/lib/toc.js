// Table of Contents Auto-Highlight
(function () {
    'use strict';

    const tocLinks = document.querySelectorAll('.toc-link');
    const headings = document.querySelectorAll('.article .content h1, .article .content h2, .article .content h3, .article .content h4, .article .content h5, .article .content h6');
    
    if (tocLinks.length === 0 || headings.length === 0) {
        return;
    }

    let activeHeading = null;
    let isScrolling = false;

    // Create a mapping between headings and TOC links
    const headingToLink = new Map();
    headings.forEach(heading => {
        if (heading.id) {
            const link = document.querySelector(`.toc-link[href="#${heading.id}"]`);
            if (link) {
                headingToLink.set(heading, link);
            }
        }
    });

    // Function to highlight the active TOC link
    function highlightTOC(link) {
        if (activeHeading === link) return;
        
        tocLinks.forEach(l => l.classList.remove('active'));
        if (link) {
            link.classList.add('active');
            // Scroll the TOC to make the active link visible
            const tocContent = document.querySelector('.toc-content');
            if (tocContent) {
                const linkTop = link.offsetTop;
                const linkHeight = link.offsetHeight;
                const tocTop = tocContent.scrollTop;
                const tocHeight = tocContent.clientHeight;
                
                if (linkTop < tocTop || linkTop + linkHeight > tocTop + tocHeight) {
                    tocContent.scrollTop = linkTop - tocHeight / 2 + linkHeight / 2;
                }
            }
        }
        activeHeading = link;
    }

    // Function to find the current active heading
    function updateActiveHeading() {
        const scrollPosition = window.scrollY + 100; // Offset for better UX
        
        let currentHeading = null;
        
        headings.forEach(heading => {
            const headingTop = heading.offsetTop;
            if (scrollPosition >= headingTop) {
                currentHeading = heading;
            }
        });
        
        if (currentHeading) {
            const link = headingToLink.get(currentHeading);
            highlightTOC(link);
        } else if (headings.length > 0) {
            // If we're at the top, highlight the first heading
            const link = headingToLink.get(headings[0]);
            highlightTOC(link);
        }
    }

    // Throttle function to improve performance
    function throttle(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Add scroll event listener with throttling
    window.addEventListener('scroll', throttle(updateActiveHeading, 100));

    // Smooth scroll to heading when clicking TOC link
    tocLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            isScrolling = true;
            
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                const offsetTop = targetElement.offsetTop - 80; // Offset for fixed header
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
                
                // Update URL without jumping
                history.pushState(null, null, `#${targetId}`);
                
                // Highlight immediately
                highlightTOC(this);
                
                setTimeout(() => {
                    isScrolling = false;
                }, 1000);
            }
        });
    });

    // Initial highlight
    updateActiveHeading();

    // Handle page load with hash
    if (window.location.hash) {
        setTimeout(() => {
            const targetId = window.location.hash.substring(1);
            const targetLink = document.querySelector(`.toc-link[href="#${targetId}"]`);
            if (targetLink) {
                highlightTOC(targetLink);
            }
        }, 100);
    }
})();
