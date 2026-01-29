(function() {
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '999999';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    let width = window.innerWidth;
    let height = window.innerHeight;
    let points = [];
    let fireworks = [];

    class Particle {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3 + 2;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.life = 1.0;
            this.decay = Math.random() * 0.015 + 0.015;
            this.color = `hsl(${Math.random() * 360}, 70%, 60%)`;
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.vy += 0.05;
            this.vx *= 0.96;
            this.vy *= 0.96;
            this.life -= this.decay;
        }
        draw(ctx) {
            ctx.globalAlpha = this.life;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }
    }

    window.addEventListener('mousedown', (e) => {
        for (let i = 0; i < 30; i++) {
            fireworks.push(new Particle(e.clientX, e.clientY));
        }
    });
    
    // Resize handling
    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    }
    window.addEventListener('resize', resize);
    resize();

    // Track mouse
    const mouse = { x: 0, y: 0 };
    window.addEventListener('mousemove', (e) => {
        // Add new point
        points.push({
            x: e.clientX,
            y: e.clientY,
            age: 0
        });
    });

    // Animation loop
    function animate() {
        ctx.clearRect(0, 0, width, height);
        
        // Update and draw fireworks
        for (let i = fireworks.length - 1; i >= 0; i--) {
            const p = fireworks[i];
            p.update();
            if (p.life <= 0) {
                fireworks.splice(i, 1);
            } else {
                p.draw(ctx);
            }
        }
        
        // Define path properties
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        
        if (points.length > 2) {
             // Draw smooth curve segments
             for (let i = 1; i < points.length - 1; i++) {
                const pPrev = points[i-1];
                const pCurr = points[i];
                const pNext = points[i+1];
                
                // Calculate control points and mid points
                const midX = (pCurr.x + pNext.x) / 2;
                const midY = (pCurr.y + pNext.y) / 2;
                
                // Start of this segment (which is the end of previous one)
                // For the first segment, it's just the previous point
                const startX = (i === 1) ? pPrev.x : (pPrev.x + pCurr.x) / 2;
                const startY = (i === 1) ? pPrev.y : (pPrev.y + pCurr.y) / 2;

                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.quadraticCurveTo(pCurr.x, pCurr.y, midX, midY);
                
                // Style based on current point's age
                const maxAge = 50;
                const life = 1 - (pCurr.age / maxAge);
                
                if (life <= 0) continue;
                
                // Color interpolation: Purple (Head) -> Pink (Tail)
                // Head: 138, 43, 226 | Tail: 255, 105, 180
                const r = 255 + (138 - 255) * life;
                const g = 105 + (43 - 105) * life;
                const b = 180 + (226 - 180) * life;
                
                ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${life * 0.5})`;
                ctx.lineWidth = 4 * life; // Tapering effect
                ctx.stroke();
            }

            // Connect the last mid-point to the actual mouse position (last point)
            const pLast = points[points.length - 1];
            const pPrev = points[points.length - 2];
            const startX = (pPrev.x + pLast.x) / 2;
            const startY = (pPrev.y + pLast.y) / 2;
            
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(pLast.x, pLast.y);
            
            const life = 1 - (pLast.age / 50);
            if (life > 0) {
                const r = 255 + (138 - 255) * life;
                const g = 105 + (43 - 105) * life;
                const b = 180 + (226 - 180) * life;
                ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${life * 0.5})`;
                ctx.lineWidth = 4 * life;
                ctx.stroke();
            }

        } else if (points.length > 1) {
            // Unchanged fallback logic just in case
            ctx.beginPath();
            // ... existing partial logic but simple line
            const p1 = points[0];
            const p2 = points[1];
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            
            const life = 1 - (p1.age / 50);
            if (life > 0) {
                 const r = 255 + (138 - 255) * life;
                 const g = 105 + (43 - 105) * life;
                 const b = 180 + (226 - 180) * life;
                 ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${life * 0.5})`;
                 ctx.lineWidth = 4 * life;
                 ctx.stroke();
            }
        }
        
        // Update points age
        for (let i = 0; i < points.length; i++) {
            points[i].age++;
        }
        
        // Remove old points
        // Keep points that are younger than maxAge
        const maxAge = 50;
        while (points.length > 0 && points[0].age >= maxAge) {
            points.shift();
        }

        requestAnimationFrame(animate);
    }
    
    animate();
})();
