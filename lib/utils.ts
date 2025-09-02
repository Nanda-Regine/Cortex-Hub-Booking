export const FACILITIES = [
  {
    id: 'ecfilm',
    name: 'EC Film Hub',
    desc: 'Production suite for filming, audio capture, lighting, and post.',
    badges: ['4K Camera', 'Lighting', 'Audio Booth'],
  },
  {
    id: 'esports',
    name: 'E-Sports & Gaming Club',
    desc: 'Gaming events, tournaments, streaming, and esports dev.',
    badges: ['Casting', 'Streaming', 'Scrims'],
  },
  {
    id: 'robotics',
    name: 'Robotics & Coding Lab',
    desc: 'Prototyping workspace for robotics, sensors, ML, and high-precision electronics.',
    badges: ['Sensors', 'Microcontrollers', 'Workbenches'],
  
  },
  {
    id: 'electronics',
    name: 'Electronics & Hardware Lab',
    desc: 'Workbenches and measuring gear for hardware design & testing.',
    badges: ['Oscilloscope', 'Soldering', 'Bench PSUs'],
  },
  {
    id: 'arm',
    name: 'ARM Ecosystem Lab',
    desc: 'Specialized lab for embedded dev on ARM architectures.',
    badges: ['Dev Boards', 'Toolchains', 'Debugging'],
  },
  {
    id: 'automotive',
    name: 'Automotive Ethernet Lab',
    desc: 'Test environment for automotive networking & simulation.',
    badges: ['TSN', 'Switching', 'Simulation'],
  },
  {
    id: 'baremetal',
    name: 'Bare Metal as a Service Lab',
    desc: 'Access on-demand compute nodes and low-level environments.',
    badges: ['Provisioning', 'PXE', 'IPs'],
  },
  {
    id: 'studio',
    name: 'Studio Room',
    desc: 'Professional recording/mixing with equipment checklist.',
    badges: ['Audio', 'Video', 'Instruments'],
  },
] as const;

export type FacilityId = typeof FACILITIES[number]['id'];
export const cls = (...s: (string | false | undefined)[]) =>
  s.filter(Boolean).join(' ');
