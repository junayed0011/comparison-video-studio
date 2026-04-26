let data = null;
let duration = 0;
const fps = 30;

// Load data
async function init() {
    // Check for injected data first (fixes CORS on file://)
    if (window.manualData) {
        console.log("Using injected manualData");
        data = window.manualData;
        renderSlides();
        return;
    }

    try {
        const response = await fetch('../data.json');
        data = await response.json();
        renderSlides();
    } catch (e) {
        console.error("No data found, waiting for manual injection");
    }
}

function renderSlides() {
    const container = document.getElementById('slide-container');
    const titleContainer = document.getElementById('global-title');
    
    titleContainer.innerText = data.title;
    
    container.innerHTML = data.items.map((item, index) => `
        <div class="slide" id="slide-${index}">
            <div class="bg-gradient"></div>
            <div class="glass-card">
                <div class="image-container">
                    <img src="../assets/images/item_${index}.jpg" onerror="this.src='https://via.placeholder.com/600x600?text=${item.name}'">
                </div>
                <div class="content">
                    <p class="country">${item.country}</p>
                    <h1 class="name">${item.name}</h1>
                    <span class="role">${item.role}</span>
                    <p class="description">${item.description}</p>
                </div>
            </div>
        </div>
    `).join('');
}

window.setFrame = function(frameIndex) {
    if (!data) return;
    
    const totalFrames = window.totalFrames || (30 * 30); // Default 30s
    const itemsCount = data.items.length;
    const framesPerItem = totalFrames / itemsCount;
    
    const currentItemIndex = Math.floor(frameIndex / framesPerItem);
    const itemFrame = frameIndex % framesPerItem;
    
    // Update Progress Bar
    const progressBar = document.getElementById('progress-bar');
    if (progressBar) {
        const totalPercent = (frameIndex / totalFrames) * 100;
        progressBar.style.width = `${totalPercent}%`;
    }

    // Hide all slides
    const slides = document.querySelectorAll('.slide');
    slides.forEach((s, idx) => {
        if (idx === currentItemIndex) {
            if (!s.classList.contains('active')) {
                s.classList.add('active');
            }
        } else {
            s.classList.remove('active');
        }
    });
    
    // Animations for the active slide
    const currentSlide = document.getElementById(`slide-${currentItemIndex}`);
    if (currentSlide) {
        const card = currentSlide.querySelector('.glass-card');
        const imgContainer = currentSlide.querySelector('.image-container');
        const content = currentSlide.querySelector('.content');
        
        // Progress within this item (0 to 1)
        const itemProgress = itemFrame / framesPerItem;
        
        // 1. Entrance Animation (0 to 0.2)
        if (itemProgress < 0.2) {
            const entrance = itemProgress / 0.2;
            card.style.transform = `translateY(${(1 - entrance) * 100}px) scale(${0.8 + entrance * 0.2})`;
            card.style.opacity = entrance;
        } 
        // 2. Floating / Sustained Animation (0.2 to 0.8)
        else if (itemProgress < 0.8) {
            const float = Math.sin(frameIndex * 0.05) * 10;
            const rotate = Math.sin(frameIndex * 0.02) * 2;
            card.style.transform = `translateY(${float}px) rotateX(${rotate}deg) rotateY(${rotate * 0.5}deg)`;
            card.style.opacity = 1;
            
            // Image zoom effect
            const zoom = 1 + (itemProgress - 0.2) * 0.1;
            imgContainer.querySelector('img').style.transform = `scale(${zoom})`;
        }
        // 3. Exit Animation (0.8 to 1.0)
        else {
            const exit = (itemProgress - 0.8) / 0.2;
            card.style.transform = `translateY(${exit * -100}px) scale(${1 - exit * 0.2})`;
            card.style.opacity = 1 - exit;
        }

        // Parallax background
        const bg = currentSlide.querySelector('.bg-gradient');
        if (bg) {
            bg.style.transform = `translate(${Math.sin(frameIndex * 0.01) * 30}px, ${Math.cos(frameIndex * 0.01) * 30}px) scale(1.1)`;
        }
    }
};

window.playRealTime = function(durationSeconds) {
    let start = null;
    const totalFrames = durationSeconds * 30;
    
    function step(timestamp) {
        if (!start) start = timestamp;
        const progress = timestamp - start;
        const frameIndex = Math.floor((progress / 1000) * 30);
        
        if (frameIndex < totalFrames) {
            window.setFrame(frameIndex);
            window.requestAnimationFrame(step);
        }
    }
    window.requestAnimationFrame(step);
};

init();
