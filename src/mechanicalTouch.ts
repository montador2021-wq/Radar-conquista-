// Mechanical switch sound synthesizer and tactile/cursor feedback using Web Audio API
let audioCtx: AudioContext | null = null;
let isMuted = typeof window !== 'undefined' ? localStorage.getItem('conquista_app_mute_sounds') === 'true' : false;

export function isMechanicalMuted(): boolean {
  return isMuted;
}

export function setMechanicalMuted(muted: boolean) {
  isMuted = muted;
  if (typeof window !== 'undefined') {
    localStorage.setItem('conquista_app_mute_sounds', String(muted));
  }
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playMechanicalClickDown() {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    const time = ctx.currentTime;
    
    // Low-frequency key slap/impact (wood/plastic mechanical sound)
    const slapOsc = ctx.createOscillator();
    const slapGain = ctx.createGain();
    slapOsc.type = 'triangle';
    slapOsc.frequency.setValueAtTime(140, time);
    slapOsc.frequency.exponentialRampToValueAtTime(45, time + 0.08);
    
    slapGain.gain.setValueAtTime(0.08, time);
    slapGain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
    
    slapOsc.connect(slapGain);
    slapGain.connect(ctx.destination);
    slapOsc.start(time);
    slapOsc.stop(time + 0.08);

    // High-frequency tactile switch "click" (the metal leaf contact)
    const clickOsc = ctx.createOscillator();
    const clickGain = ctx.createGain();
    clickOsc.type = 'sine';
    clickOsc.frequency.setValueAtTime(2400, time);
    clickOsc.frequency.exponentialRampToValueAtTime(1100, time + 0.015);
    
    clickGain.gain.setValueAtTime(0.12, time);
    clickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.015);
    
    clickOsc.connect(clickGain);
    clickGain.connect(ctx.destination);
    clickOsc.start(time);
    clickOsc.stop(time + 0.015);
    
    // Filtered noise for the mechanical keycap texture/friction
    const bufferSize = ctx.sampleRate * 0.02; // 20ms
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1800, time);
    filter.Q.setValueAtTime(4, time);
    
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.03, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.02);
    
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(time);
    noise.stop(time + 0.02);
  } catch (err) {
    console.warn("Audio Context Click Down error:", err);
  }
}

export function playMechanicalClickUp() {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    const time = ctx.currentTime;
    
    // Release key slap/impact (rebound sound)
    const slapOsc = ctx.createOscillator();
    const slapGain = ctx.createGain();
    slapOsc.type = 'sine';
    slapOsc.frequency.setValueAtTime(200, time);
    slapOsc.frequency.exponentialRampToValueAtTime(100, time + 0.05);
    
    slapGain.gain.setValueAtTime(0.03, time);
    slapGain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
    
    slapOsc.connect(slapGain);
    slapGain.connect(ctx.destination);
    slapOsc.start(time);
    slapOsc.stop(time + 0.05);

    // High frequency release leaf click
    const clickOsc = ctx.createOscillator();
    const clickGain = ctx.createGain();
    clickOsc.type = 'sine';
    clickOsc.frequency.setValueAtTime(2800, time);
    clickOsc.frequency.exponentialRampToValueAtTime(1800, time + 0.01);
    
    clickGain.gain.setValueAtTime(0.04, time);
    clickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.01);
    
    clickOsc.connect(clickGain);
    clickGain.connect(ctx.destination);
    clickOsc.start(time);
    clickOsc.stop(time + 0.01);
  } catch (err) {
    console.warn("Audio Context Click Up error:", err);
  }
}

function ensureReflectionOverlay(el: HTMLElement) {
  if (el.querySelector('.reflection-glow')) return;
  
  // Create and append reflection glow
  const glow = document.createElement('span');
  glow.className = 'reflection-glow';
  
  // Ensure the element has relative or absolute position
  const style = window.getComputedStyle(el);
  if (style.position === 'static') {
    el.style.position = 'relative';
  }
  if (style.overflow !== 'hidden') {
    el.style.overflow = 'hidden';
  }
  
  el.appendChild(glow);
}

function createClickRipple(el: HTMLElement, clientX: number, clientY: number) {
  const rect = el.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  
  const ripple = document.createElement('span');
  ripple.className = 'click-ripple';
  
  const size = Math.max(rect.width, rect.height) * 2;
  ripple.style.width = `${size}px`;
  ripple.style.height = `${size}px`;
  ripple.style.left = `${x - size / 2}px`;
  ripple.style.top = `${y - size / 2}px`;
  
  el.appendChild(ripple);
  
  setTimeout(() => {
    ripple.remove();
  }, 400);
}

export function initMechanicalTouch() {
  if (typeof window === 'undefined') return;

  let currentPressedElement: HTMLElement | null = null;
  
  // Global Click down
  const handlePointerDown = (clientX: number, clientY: number, targetEl: HTMLElement) => {
    const interactive = targetEl.closest('button, [role="button"], .cursor-pointer, .mechanical-btn, a') as HTMLElement;
    if (interactive) {
      currentPressedElement = interactive;
      interactive.classList.add('is-pressed');
      playMechanicalClickDown();
      createClickRipple(interactive, clientX, clientY);
    }
  };

  const handlePointerUp = () => {
    if (currentPressedElement) {
      currentPressedElement.classList.remove('is-pressed');
      playMechanicalClickUp();
      currentPressedElement = null;
    }
  };

  // Listeners
  document.addEventListener('mousedown', (e) => {
    handlePointerDown(e.clientX, e.clientY, e.target as HTMLElement);
  }, { passive: true });
  
  document.addEventListener('mouseup', handlePointerUp, { passive: true });
  
  document.addEventListener('touchstart', (e) => {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      handlePointerDown(touch.clientX, touch.clientY, e.target as HTMLElement);
    }
  }, { passive: true });
  
  document.addEventListener('touchend', handlePointerUp, { passive: true });
  
  // Track cursor movement on elements to update reflection position ("conforme vai mexendo")
  document.addEventListener('mousemove', (e) => {
    const target = (e.target as HTMLElement).closest('button, [role="button"], .cursor-pointer, .mechanical-btn, a') as HTMLElement;
    if (target) {
      const rect = target.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      target.style.setProperty('--mouse-x', `${x}px`);
      target.style.setProperty('--mouse-y', `${y}px`);
      ensureReflectionOverlay(target);
    }
  }, { passive: true });
}
