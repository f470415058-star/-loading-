import { animate, createTimeline, createTimer, stagger, utils } from '../../dist/modules/index.js';

// --- Hero additive creature background (from additive-creature example, softened) ---
const creatureEl = document.querySelector('#creature');
const viewport = { w: window.innerWidth * 0.5, h: window.innerHeight * 0.5 };
const cursor = { x: 0, y: 0 };
const rows = 12;
const grid = [rows, rows];
const from = 'center';
const scaleStagger = stagger([1.8, 4.2], { ease: 'inQuad', grid, from });
const opacityStagger = stagger([0.65, 0.2], { grid, from });

for (let i = 0; i < rows * rows; i++) {
  creatureEl.appendChild(document.createElement('div'));
}

const particles = creatureEl.querySelectorAll('div');

utils.set(creatureEl, {
  width: rows * 9 + 'em',
  height: rows * 9 + 'em'
});

utils.set(particles, {
  x: 0,
  y: 0,
  scale: scaleStagger,
  opacity: opacityStagger,
  background: stagger([70, 30], {
    grid,
    from,
    modifier: v => `hsl(222, 85%, ${v}%)`
  }),
  boxShadow: stagger([7, 1], {
    grid,
    from,
    modifier: v => `0 0 ${utils.round(v, 0)}em 0 rgba(76, 111, 255, 0.45)`
  }),
  zIndex: stagger([rows * rows, 1], { grid, from, modifier: utils.round(0) }),
});

const pulse = () => {
  animate(particles, {
    keyframes: [
      {
        scale: 4.5,
        opacity: 0.85,
        delay: stagger(80, { start: 1400, grid, from }),
        duration: 140,
      },
      {
        scale: scaleStagger,
        opacity: opacityStagger,
        ease: 'inOutQuad',
        duration: 560,
      }
    ],
  });
};

const mainLoop = createTimer({
  frameRate: 14,
  onUpdate: () => {
    animate(particles, {
      x: cursor.x,
      y: cursor.y,
      delay: stagger(38, { grid, from }),
      duration: stagger(120, { start: 700, ease: 'inQuad', grid, from }),
      ease: 'inOut',
      composition: 'blend',
    });
  }
});

const autoMove = createTimeline()
  .add(cursor, {
    x: [-viewport.w * 0.45, viewport.w * 0.45],
    modifier: x => x + Math.sin(mainLoop.currentTime * 0.0007) * viewport.w * 0.55,
    duration: 3200,
    ease: 'inOutExpo',
    alternate: true,
    loop: true,
    onBegin: pulse,
    onLoop: pulse,
  }, 0)
  .add(cursor, {
    y: [-viewport.h * 0.45, viewport.h * 0.45],
    modifier: y => y + Math.cos(mainLoop.currentTime * 0.00012) * viewport.h * 0.55,
    duration: 1200,
    ease: 'inOutQuad',
    alternate: true,
    loop: true,
  }, 0);

const manualMovementTimeout = createTimer({
  duration: 1500,
  onComplete: () => autoMove.play(),
});

const followPointer = e => {
  const event = e.type === 'touchmove' ? e.touches[0] : e;
  cursor.x = event.pageX - viewport.w;
  cursor.y = event.pageY - viewport.h;
  autoMove.pause();
  manualMovementTimeout.restart();
};

document.addEventListener('mousemove', followPointer);
document.addEventListener('touchmove', followPointer);

// --- Feature cards: enter on scroll with stagger (advanced-grid-staggering style) ---
const featureCards = document.querySelectorAll('.feature-card');
const revealFeatures = () => {
  animate(featureCards, {
    opacity: 1,
    translateY: 0,
    scale: 1,
    delay: stagger(60, { from: 'first' }),
    duration: 520,
    ease: 'outQuad',
  });
};

const io = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      revealFeatures();
      io.disconnect();
    }
  });
}, { threshold: 0.2 });

featureCards.length && io.observe(featureCards[0]);

// --- Graph line drawing (svg-line-drawing inspired) ---
const graphLine = document.querySelector('#graph-line');
const graphShadow = document.querySelector('#graph-shadow');

if (graphLine) {
  const total = graphLine.getTotalLength();
  graphLine.style.strokeDasharray = total;
  graphLine.style.strokeDashoffset = total;

  const playGraph = () => {
    animate(graphLine, {
      strokeDashoffset: [total, 0],
      duration: 1200,
      easing: 'easeOutQuad',
    });
    animate(graphShadow, {
      opacity: [0, 0.18],
      translateY: [-6, 0],
      duration: 900,
      easing: 'easeOutQuad',
    });
  };

  const graphObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        playGraph();
        graphObserver.disconnect();
      }
    });
  }, { threshold: 0.3 });

  graphObserver.observe(graphLine);
}

// --- Cursor demo (animatable-follow-cursor inspired) ---
const cursorDot = document.querySelector('.cursor-dot');
const cursorTrail = document.querySelector('.cursor-trail');

if (cursorDot && cursorTrail) {
  const target = { x: 32, y: 40 };
  const trail = { x: 20, y: 20 };
  const points = [
    [20, 40],
    [160, 30],
    [220, 120],
    [120, 140],
    [260, 120],
    [60, 80],
  ];

  const loop = () => {
    const tl = createTimeline();
    points.forEach((p, i) => {
      tl.add(target, {
        x: target.x,
        y: target.y,
        duration: 0,
      }, 0);

      tl.add(target, {
        x: p[0],
        y: p[1],
        duration: 550,
        easing: 'easeInOutQuad',
      }, i * 380);
    });

    tl.add({}, {}, points.length * 380 + 400);

    const render = createTimer({
      frameRate: 60,
      onUpdate: () => {
        trail.x += (target.x - trail.x) * 0.12;
        trail.y += (target.y - trail.y) * 0.12;

        cursorDot.style.transform = `translate(${target.x}px, ${target.y}px)`;
        cursorTrail.style.transform = `translate(${trail.x}px, ${trail.y}px)`;
      }
    });

    tl.finished.then(() => {
      render.stop();
      loop();
    });
  };

  loop();
}

// --- CTA hover micro interaction ---
document.querySelectorAll('.btn.primary').forEach(btn => {
  btn.addEventListener('mouseenter', () => {
    animate(btn, {
      scale: [1, 1.02],
      duration: 200,
      easing: 'outQuad',
    });
  });
  btn.addEventListener('mouseleave', () => {
    animate(btn, {
      scale: 1,
      duration: 180,
      easing: 'outQuad',
    });
  });
});




