class CustomCanvasElement extends HTMLElement {
    constructor() {
        super();

        // Create and append elements
        const wrapper = document.createElement('div');
        wrapper.classList.add('canvas-wrapper');

        this.canvasContainer = document.createElement('div');
        this.canvasContainer.classList.add('canvas-container');

        const canvas = document.createElement('canvas');
        canvas.id = 'hero-lightpass';
        this.canvasContainer.appendChild(canvas);

        wrapper.appendChild(this.canvasContainer);
        this.appendChild(wrapper);
    }

    static get observedAttributes() {
        return ['image-urls', 'padding-top'];
    }

    connectedCallback() {
        // Once the element is connected to the DOM, apply the styles
        const paddingTop = this.getAttribute('padding-top') || '0px';
        this.applyDynamicStyles(paddingTop);

        // Check if the page is fully loaded and image-urls attribute is present
        if (this.getAttribute('image-urls')) {
            this.checkPageLoadStatus();
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'image-urls' && newValue !== oldValue) {
            this.checkPageLoadStatus();
        }
        if (name === 'padding-top' && newValue !== oldValue) {
            this.applyDynamicStyles(newValue);
        }
    }

    applyDynamicStyles(paddingTop) {
        // Ensure the wrapper has the correct padding
        this.querySelector('.canvas-wrapper').style.paddingTop = paddingTop;

        // Create or update a <style> element
        let style = document.querySelector('#dynamic-styles');
        if (!style) {
            style = document.createElement('style');
            style.id = 'dynamic-styles';
            document.head.appendChild(style);
        }

        // Generate and apply CSS dynamically
        style.textContent = `
            .canvas-wrapper {
                position: relative;
                display: block;
                padding-top: ${paddingTop};
            }

            .canvas-container {
                position: relative;
                width: 100%;
                height: 100%;
            }

            .pin-spacer {
                margin-top: ${paddingTop} !important;
            }
        `;
    }

    checkPageLoadStatus() {
        if (document.readyState === 'complete') {
            this.loadScripts();
        } else {
            setTimeout(() => this.checkPageLoadStatus(), 100);
        }
    }

    loadScripts() {
        this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.10.4/gsap.min.js')
            .then(() => this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.10.4/ScrollTrigger.min.js'))
            .then(() => this.checkScriptsReady())
            .catch(error => console.error('Error loading scripts:', error));
    }

    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => resolve(script);
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    checkScriptsReady() {
        if (window.gsap && window.ScrollTrigger) {
            this.initCanvasAnimation();
        } else {
            setTimeout(() => this.checkScriptsReady(), 100);
        }
    }

    initCanvasAnimation() {
        const canvas = document.getElementById('hero-lightpass');
        const context = canvas.getContext('2d');

        // Get image URLs from attribute
        const imageUrlString = this.getAttribute('image-urls') || '[]';
        const imageUrls = JSON.parse(imageUrlString);
        const frameCount = imageUrls.length;
        const images = [];
        const airpods = {
            frame: 0
        };

        // Load the first image to determine aspect ratio
        const firstImage = new Image();
        firstImage.src = imageUrls[0];
        firstImage.onload = () => {
            const aspectRatio = firstImage.width / firstImage.height;

            // Set canvas dimensions to match the height of the custom element
            const containerHeight = this.clientHeight;
            canvas.height = containerHeight;

            // Calculate width based on aspect ratio and height
            const clientWidth = containerHeight * aspectRatio;
            canvas.width = clientWidth;

            // Load all images
            for (let i = 0; i < frameCount; i++) {
                const img = new Image();
                img.src = imageUrls[i];
                images.push(img);
            }

            // Ensure gsap and ScrollTrigger are scoped correctly
            const gsap = window.gsap;
            const ScrollTrigger = window.ScrollTrigger;

            gsap.registerPlugin(ScrollTrigger);

            gsap.to(airpods, {
                frame: frameCount - 1,
                snap: "frame",
                ease: "none",
                scrollTrigger: {
                    trigger: this.canvasContainer,  // Pin the canvas container
                    start: "top top",
                    end: "+=3500",
                    pin: this.canvasContainer,      // Pin only the container, not the wrapper
                    scrub: 0.5,
                    onLeave: () => {
                        gsap.to(airpods, { frame: frameCount - 1, duration: 10 });
                    },
                    onLeaveBack: () => {
                        gsap.to(airpods, { frame: frameCount - 1, duration: 10 });
                    }
                },
                onUpdate: render // Use animation onUpdate instead of scrollTrigger's onUpdate
            });

            images[0].onload = render;

            function render() {
                context.clearRect(0, 0, canvas.width, canvas.height);

                // Calculate the scale to cover the canvas
                const scale = Math.max(canvas.width / firstImage.width, canvas.height / firstImage.height);

                // Calculate the position to center the image
                const x = (canvas.width / 2) - (firstImage.width / 2) * scale;
                const y = (canvas.height / 2) - (firstImage.height / 2) * scale;

                // Draw the image with cropping (cover)
                context.drawImage(images[airpods.frame], x, y, firstImage.width * scale, firstImage.height * scale);
            }
        };
    }
}

customElements.define('custom-canvas-element', CustomCanvasElement);
