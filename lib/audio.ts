"use client"

// Lightweight custom SFX using WebAudio Oscillator (beeps, pops)
export class AudioManager {
  private ctx?: AudioContext
  private enabled = true

  setEnabled(on: boolean) { this.enabled = on }

  private ensure() {
    if (typeof window === 'undefined') return
    if (!this.ctx) this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
  }

  private tone(freq: number, duration = 0.12, type: OscillatorType = 'sine', volume = 0.2) {
    if (!this.enabled) return
    this.ensure(); if (!this.ctx) return
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = type
    osc.frequency.value = freq
    gain.gain.value = volume
    osc.connect(gain).connect(this.ctx.destination)
    osc.start()
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration)
    osc.stop(this.ctx.currentTime + duration)
  }

  success() {
    this.tone(660, 0.08, 'triangle', 0.25)
    setTimeout(() => this.tone(880, 0.10, 'triangle', 0.22), 60)
  }
  error() {
    this.tone(200, 0.12, 'sawtooth', 0.2)
    setTimeout(() => this.tone(150, 0.14, 'sawtooth', 0.18), 60)
  }
  drag() { this.tone(500, 0.05, 'sine', 0.05) }
  drop() { this.tone(420, 0.06, 'square', 0.08) }
  levelUp() { this.tone(523, 0.08, 'triangle', 0.2); setTimeout(()=>this.tone(659,0.08,'triangle',0.18),70); setTimeout(()=>this.tone(783,0.12,'triangle',0.16),140) }
}

export const audio = new AudioManager()
