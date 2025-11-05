export interface Constellation {
  id: string;
  name: string;
  abbreviation: string;
  visible: boolean;
  magnitude?: number;
}

/**
 * Mock constellation visibility data. This will be replaced by live data when
 * the backend supports it.
 */
export const MOCK_CONSTELLATIONS: Constellation[] = [
  { id: 'ori', name: 'Orion', abbreviation: 'Ori', visible: true, magnitude: 2.0 },
  { id: 'uma', name: 'Ursa Major', abbreviation: 'UMa', visible: true, magnitude: 1.9 },
  { id: 'umi', name: 'Ursa Minor', abbreviation: 'UMi', visible: false, magnitude: 2.2 },
  { id: 'cas', name: 'Cassiopeia', abbreviation: 'Cas', visible: true, magnitude: 2.4 },
  { id: 'lyr', name: 'Lyra', abbreviation: 'Lyr', visible: true, magnitude: 0.0 },
  { id: 'cyg', name: 'Cygnus', abbreviation: 'Cyg', visible: false, magnitude: 1.3 },
  { id: 'sco', name: 'Scorpius', abbreviation: 'Sco', visible: true, magnitude: 1.6 },
  { id: 'leo', name: 'Leo', abbreviation: 'Leo', visible: true, magnitude: 1.4 },
  { id: 'vir', name: 'Virgo', abbreviation: 'Vir', visible: false, magnitude: 3.0 },
  { id: 'taur', name: 'Taurus', abbreviation: 'Tau', visible: true, magnitude: 1.5 },
  { id: 'and', name: 'Andromeda', abbreviation: 'And', visible: false, magnitude: 2.9 },
  { id: 'psa', name: 'Piscis Austrinus', abbreviation: 'PsA', visible: true, magnitude: 1.1 }
];
