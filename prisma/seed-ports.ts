/**
 * EU Yachting Ports, Marinas & Shipyards seed data
 * Run after migration: npx ts-node prisma/seed-ports.ts
 */

export const portsData = [
  // ─── FRANCE ───
  { name: 'Port Vauban', code: 'FRNTB', type: 'marina', country: 'France', countryCode: 'FR', region: 'Côte d\'Azur', city: 'Antibes', lat: 43.5804, lng: 7.1285, maxDraft: 9.0, maxLOA: 163, hasCustoms: true, hasFuel: true, hasProvisions: true, hasCrane: true, hasStorage: true, requiresPortPass: true, requiresDriverID: true, popular: true },
  { name: 'Port Pierre Canto', type: 'marina', country: 'France', countryCode: 'FR', region: 'Côte d\'Azur', city: 'Cannes', lat: 43.5429, lng: 7.0286, maxDraft: 4.0, maxLOA: 75, hasFuel: true, hasProvisions: true, popular: true },
  { name: 'Vieux Port de Cannes', type: 'marina', country: 'France', countryCode: 'FR', region: 'Côte d\'Azur', city: 'Cannes', lat: 43.5510, lng: 7.0135, maxDraft: 3.5, maxLOA: 50, hasCustoms: true, hasFuel: true, hasProvisions: true, popular: true },
  { name: 'Port Hercule', code: 'MCMON', type: 'marina', country: 'Monaco', countryCode: 'MC', region: 'Côte d\'Azur', city: 'Monaco', lat: 43.7352, lng: 7.4206, maxDraft: 15.0, maxLOA: 200, hasCustoms: true, hasFuel: true, hasProvisions: true, hasCrane: true, requiresPortPass: true, requiresDriverID: true, popular: true },
  { name: 'Port de Nice', code: 'FRNIC', type: 'marina', country: 'France', countryCode: 'FR', region: 'Côte d\'Azur', city: 'Nice', lat: 43.6946, lng: 7.2846, maxDraft: 5.0, maxLOA: 60, hasCustoms: true, hasFuel: true, hasProvisions: true, popular: true },
  { name: 'Port de Saint-Tropez', type: 'marina', country: 'France', countryCode: 'FR', region: 'Côte d\'Azur', city: 'Saint-Tropez', lat: 43.2726, lng: 6.6364, maxDraft: 5.0, maxLOA: 80, hasCustoms: true, hasFuel: true, hasProvisions: true, popular: true },
  { name: 'Vieux Port de Marseille', code: 'FRMRS', type: 'marina', country: 'France', countryCode: 'FR', region: 'Provence', city: 'Marseille', lat: 43.2951, lng: 5.3625, hasCustoms: true, hasFuel: true, hasProvisions: true, popular: true },
  { name: 'Port de La Ciotat', type: 'shipyard', country: 'France', countryCode: 'FR', region: 'Provence', city: 'La Ciotat', lat: 43.1745, lng: 5.6097, hasCrane: true, hasStorage: true, maxLOA: 120 },
  { name: 'Port de Villefranche', type: 'anchorage', country: 'France', countryCode: 'FR', region: 'Côte d\'Azur', city: 'Villefranche-sur-Mer', lat: 43.6961, lng: 7.3117, maxDraft: 20.0, popular: true },
  { name: 'Port de Golfe-Juan', type: 'marina', country: 'France', countryCode: 'FR', region: 'Côte d\'Azur', city: 'Golfe-Juan', lat: 43.5621, lng: 7.0714, hasFuel: true },
  // ─── SPAIN ───
  { name: 'Club de Mar Mallorca', type: 'marina', country: 'Spain', countryCode: 'ES', region: 'Balearics', city: 'Palma de Mallorca', lat: 39.5594, lng: 2.6264, maxDraft: 8.0, maxLOA: 120, hasCustoms: true, hasFuel: true, hasProvisions: true, hasCrane: true, popular: true },
  { name: 'STP Palma (Shipyard)', type: 'shipyard', country: 'Spain', countryCode: 'ES', region: 'Balearics', city: 'Palma de Mallorca', lat: 39.5558, lng: 2.6316, hasCrane: true, hasStorage: true, maxLOA: 90 },
  { name: 'Marina Ibiza', type: 'marina', country: 'Spain', countryCode: 'ES', region: 'Balearics', city: 'Ibiza', lat: 38.9067, lng: 1.4397, maxDraft: 5.0, maxLOA: 60, hasFuel: true, hasProvisions: true, popular: true },
  { name: 'Port Vell', type: 'marina', country: 'Spain', countryCode: 'ES', region: 'Catalonia', city: 'Barcelona', lat: 41.3754, lng: 2.1836, maxDraft: 7.5, maxLOA: 130, hasCustoms: true, hasFuel: true, hasProvisions: true, hasCrane: true, popular: true },
  { name: 'Marina Port Vell', type: 'marina', country: 'Spain', countryCode: 'ES', region: 'Catalonia', city: 'Barcelona', lat: 41.3748, lng: 2.1810, maxDraft: 9.0, maxLOA: 190, hasCustoms: true, hasFuel: true, hasProvisions: true, popular: true },
  { name: 'Puerto Banús', type: 'marina', country: 'Spain', countryCode: 'ES', region: 'Andalusia', city: 'Marbella', lat: 36.4862, lng: -4.9527, maxDraft: 6.0, maxLOA: 50, hasFuel: true, hasProvisions: true, popular: true },
  { name: 'Valencia Marina', code: 'ESVLC', type: 'marina', country: 'Spain', countryCode: 'ES', region: 'Valencia', city: 'Valencia', lat: 39.4537, lng: -0.3254, hasCustoms: true, hasFuel: true },
  { name: 'MB92 Barcelona (Shipyard)', type: 'shipyard', country: 'Spain', countryCode: 'ES', region: 'Catalonia', city: 'Barcelona', lat: 41.3632, lng: 2.1645, hasCrane: true, hasStorage: true, maxLOA: 200, popular: true },
  // ─── ITALY ───
  { name: 'Marina di Porto Cervo', type: 'marina', country: 'Italy', countryCode: 'IT', region: 'Sardinia', city: 'Porto Cervo', lat: 41.0903, lng: 9.5325, maxDraft: 6.0, maxLOA: 90, hasFuel: true, hasProvisions: true, popular: true },
  { name: 'Porto di Genova', code: 'ITGOA', type: 'commercial_port', country: 'Italy', countryCode: 'IT', region: 'Liguria', city: 'Genoa', lat: 44.4076, lng: 8.9264, hasCustoms: true, hasFuel: true, hasCrane: true, popular: true },
  { name: 'Porto di Portofino', type: 'marina', country: 'Italy', countryCode: 'IT', region: 'Liguria', city: 'Portofino', lat: 44.3024, lng: 9.2096, maxDraft: 5.0, maxLOA: 60, popular: true },
  { name: 'Porto di Viareggio', type: 'marina', country: 'Italy', countryCode: 'IT', region: 'Tuscany', city: 'Viareggio', lat: 43.8620, lng: 10.2432, hasFuel: true, hasCrane: true, hasStorage: true },
  { name: 'Benetti Shipyard', type: 'shipyard', country: 'Italy', countryCode: 'IT', region: 'Tuscany', city: 'Viareggio', lat: 43.8644, lng: 10.2471, hasCrane: true, hasStorage: true, maxLOA: 100 },
  { name: 'Porto di Civitavecchia', code: 'ITCVV', type: 'commercial_port', country: 'Italy', countryCode: 'IT', region: 'Lazio', city: 'Civitavecchia', lat: 42.0931, lng: 11.7907, hasCustoms: true, hasFuel: true },
  { name: 'Marina di Capri', type: 'marina', country: 'Italy', countryCode: 'IT', region: 'Campania', city: 'Capri', lat: 40.5517, lng: 14.2399, maxDraft: 4.0, popular: true },
  { name: 'Porto di Napoli', code: 'ITNAP', type: 'commercial_port', country: 'Italy', countryCode: 'IT', region: 'Campania', city: 'Naples', lat: 40.8401, lng: 14.2680, hasCustoms: true, hasFuel: true, hasCrane: true },
  { name: 'Marina di Olbia', type: 'marina', country: 'Italy', countryCode: 'IT', region: 'Sardinia', city: 'Olbia', lat: 40.9226, lng: 9.5117, hasFuel: true, hasProvisions: true },
  { name: 'Venice Arsenale Marina', type: 'marina', country: 'Italy', countryCode: 'IT', region: 'Veneto', city: 'Venice', lat: 45.4336, lng: 12.3560, maxDraft: 4.0, hasCustoms: true, popular: true },
  { name: 'Fincantieri Trieste', type: 'shipyard', country: 'Italy', countryCode: 'IT', region: 'Friuli', city: 'Trieste', lat: 45.6301, lng: 13.7618, hasCrane: true, hasStorage: true, maxLOA: 300 },
  { name: 'La Spezia Marina', type: 'marina', country: 'Italy', countryCode: 'IT', region: 'Liguria', city: 'La Spezia', lat: 44.1071, lng: 9.8280, hasFuel: true, hasCustoms: true },
  // ─── GREECE ───
  { name: 'Flisvos Marina', type: 'marina', country: 'Greece', countryCode: 'GR', region: 'Attica', city: 'Athens', lat: 37.9291, lng: 23.6805, maxDraft: 7.0, maxLOA: 100, hasFuel: true, hasProvisions: true, popular: true },
  { name: 'Piraeus Marina Zea', type: 'marina', country: 'Greece', countryCode: 'GR', region: 'Attica', city: 'Piraeus', lat: 37.9399, lng: 23.6467, maxDraft: 6.0, maxLOA: 80, hasCustoms: true, hasFuel: true, popular: true },
  { name: 'Mykonos New Port', type: 'marina', country: 'Greece', countryCode: 'GR', region: 'Cyclades', city: 'Mykonos', lat: 37.4495, lng: 25.3246, maxDraft: 10.0, hasFuel: true, popular: true },
  { name: 'Santorini Athinios Port', type: 'commercial_port', country: 'Greece', countryCode: 'GR', region: 'Cyclades', city: 'Santorini', lat: 36.3835, lng: 25.4257, hasCustoms: true, popular: true },
  { name: 'Corfu Marina', type: 'marina', country: 'Greece', countryCode: 'GR', region: 'Ionian', city: 'Corfu', lat: 39.6243, lng: 19.9217, hasFuel: true, hasProvisions: true, popular: true },
  { name: 'Mandraki Marina Rhodes', type: 'marina', country: 'Greece', countryCode: 'GR', region: 'Dodecanese', city: 'Rhodes', lat: 36.4499, lng: 28.2279, hasFuel: true, hasCustoms: true, popular: true },
  { name: 'Lefkas Marina', type: 'marina', country: 'Greece', countryCode: 'GR', region: 'Ionian', city: 'Lefkada', lat: 38.8326, lng: 20.7087, hasFuel: true, hasProvisions: true },
  { name: 'Kos Marina', type: 'marina', country: 'Greece', countryCode: 'GR', region: 'Dodecanese', city: 'Kos', lat: 36.8932, lng: 27.0955, hasFuel: true },
  // ─── CROATIA ───
  { name: 'ACI Marina Split', type: 'marina', country: 'Croatia', countryCode: 'HR', region: 'Dalmatia', city: 'Split', lat: 43.5048, lng: 16.4404, maxDraft: 6.0, maxLOA: 80, hasFuel: true, hasProvisions: true, popular: true },
  { name: 'ACI Marina Dubrovnik', type: 'marina', country: 'Croatia', countryCode: 'HR', region: 'Dalmatia', city: 'Dubrovnik', lat: 42.6612, lng: 18.0674, maxDraft: 5.0, hasFuel: true, hasProvisions: true, popular: true },
  { name: 'Marina Zadar', type: 'marina', country: 'Croatia', countryCode: 'HR', region: 'Dalmatia', city: 'Zadar', lat: 44.1183, lng: 15.2278, hasFuel: true, hasProvisions: true },
  { name: 'ACI Marina Trogir', type: 'marina', country: 'Croatia', countryCode: 'HR', region: 'Dalmatia', city: 'Trogir', lat: 43.5138, lng: 16.2510, hasFuel: true },
  { name: 'Palmižana (Hvar)', type: 'anchorage', country: 'Croatia', countryCode: 'HR', region: 'Dalmatia', city: 'Hvar', lat: 43.1584, lng: 16.3963, popular: true },
  { name: 'Marina Rovinj', type: 'marina', country: 'Croatia', countryCode: 'HR', region: 'Istria', city: 'Rovinj', lat: 45.0818, lng: 13.6358, hasFuel: true },
  // ─── TURKEY ───
  { name: 'Palmarina Bodrum', type: 'marina', country: 'Turkey', countryCode: 'TR', region: 'Aegean', city: 'Bodrum', lat: 37.0404, lng: 27.4249, maxDraft: 7.0, maxLOA: 140, hasFuel: true, hasProvisions: true, hasCustoms: true, popular: true },
  { name: 'Netsel Marmaris Marina', type: 'marina', country: 'Turkey', countryCode: 'TR', region: 'Aegean', city: 'Marmaris', lat: 36.8502, lng: 28.2698, maxDraft: 5.0, maxLOA: 60, hasFuel: true, hasProvisions: true, popular: true },
  { name: 'Göcek Marina', type: 'marina', country: 'Turkey', countryCode: 'TR', region: 'Aegean', city: 'Göcek', lat: 36.7517, lng: 28.9442, hasFuel: true, popular: true },
  { name: 'Antalya Marina', type: 'marina', country: 'Turkey', countryCode: 'TR', region: 'Mediterranean', city: 'Antalya', lat: 36.8823, lng: 30.6954, hasCustoms: true, hasFuel: true },
  // ─── MONTENEGRO ───
  { name: 'Porto Montenegro', type: 'marina', country: 'Montenegro', countryCode: 'ME', region: 'Bay of Kotor', city: 'Tivat', lat: 42.4298, lng: 18.6919, maxDraft: 12.0, maxLOA: 250, hasCustoms: true, hasFuel: true, hasProvisions: true, hasCrane: true, hasStorage: true, requiresPortPass: false, popular: true },
  { name: 'Kotor Marina', type: 'marina', country: 'Montenegro', countryCode: 'ME', region: 'Bay of Kotor', city: 'Kotor', lat: 42.4247, lng: 18.7712, hasCustoms: true, popular: true },
  // ─── UK ───
  { name: 'Ocean Village Marina', type: 'marina', country: 'United Kingdom', countryCode: 'GB', region: 'Hampshire', city: 'Southampton', lat: 50.8961, lng: -1.3912, hasFuel: true, hasProvisions: true, hasCustoms: true, popular: true },
  { name: 'Hamble Point Marina', type: 'marina', country: 'United Kingdom', countryCode: 'GB', region: 'Hampshire', city: 'Hamble', lat: 50.8558, lng: -1.3089, hasFuel: true },
  { name: 'Lymington Marina', type: 'marina', country: 'United Kingdom', countryCode: 'GB', region: 'Hampshire', city: 'Lymington', lat: 50.7549, lng: -1.5316, hasFuel: true },
  { name: 'Cowes Yacht Haven', type: 'marina', country: 'United Kingdom', countryCode: 'GB', region: 'Isle of Wight', city: 'Cowes', lat: 50.7623, lng: -1.2986, hasFuel: true, popular: true },
  { name: 'Plymouth Royal William Marina', type: 'marina', country: 'United Kingdom', countryCode: 'GB', region: 'Devon', city: 'Plymouth', lat: 50.3685, lng: -4.1595, hasFuel: true, hasCustoms: true },
  { name: 'Falmouth Marina', type: 'marina', country: 'United Kingdom', countryCode: 'GB', region: 'Cornwall', city: 'Falmouth', lat: 50.1522, lng: -5.0558, hasFuel: true },
  { name: 'Poole Quay Boat Haven', type: 'marina', country: 'United Kingdom', countryCode: 'GB', region: 'Dorset', city: 'Poole', lat: 50.7150, lng: -1.9810, hasFuel: true, hasProvisions: true },
  { name: 'Pendennis Shipyard', type: 'shipyard', country: 'United Kingdom', countryCode: 'GB', region: 'Cornwall', city: 'Falmouth', lat: 50.1485, lng: -5.0501, hasCrane: true, hasStorage: true, maxLOA: 100 },
  { name: 'Sunseeker Poole (Shipyard)', type: 'shipyard', country: 'United Kingdom', countryCode: 'GB', region: 'Dorset', city: 'Poole', lat: 50.7180, lng: -1.9770, hasCrane: true, hasStorage: true },
  { name: 'Gibraltar Marina', code: 'GIGIB', type: 'marina', country: 'Gibraltar', countryCode: 'GI', region: 'Gibraltar', city: 'Gibraltar', lat: 36.1429, lng: -5.3546, maxDraft: 6.0, maxLOA: 100, hasCustoms: true, hasFuel: true, hasProvisions: true, popular: true },
  // ─── PORTUGAL ───
  { name: 'Doca de Belém', type: 'marina', country: 'Portugal', countryCode: 'PT', region: 'Lisbon', city: 'Lisbon', lat: 38.6931, lng: -9.2099, hasCustoms: true, hasFuel: true, popular: true },
  { name: 'Cascais Marina', type: 'marina', country: 'Portugal', countryCode: 'PT', region: 'Lisbon', city: 'Cascais', lat: 38.6922, lng: -9.4192, hasFuel: true, hasProvisions: true, popular: true },
  { name: 'Vilamoura Marina', type: 'marina', country: 'Portugal', countryCode: 'PT', region: 'Algarve', city: 'Vilamoura', lat: 37.0724, lng: -8.1172, maxDraft: 4.0, hasFuel: true, hasProvisions: true, popular: true },
  { name: 'Lagos Marina', type: 'marina', country: 'Portugal', countryCode: 'PT', region: 'Algarve', city: 'Lagos', lat: 37.0978, lng: -8.6743, hasFuel: true, hasProvisions: true },
  // ─── NETHERLANDS ───
  { name: 'Sixhaven Marina', type: 'marina', country: 'Netherlands', countryCode: 'NL', region: 'North Holland', city: 'Amsterdam', lat: 52.3876, lng: 4.9041, hasFuel: true },
  { name: 'Feadship De Vries (Shipyard)', type: 'shipyard', country: 'Netherlands', countryCode: 'NL', region: 'North Holland', city: 'Aalsmeer', lat: 52.2550, lng: 4.7636, hasCrane: true, hasStorage: true, maxLOA: 120 },
  { name: 'Rotterdam Europoort', code: 'NLRTM', type: 'commercial_port', country: 'Netherlands', countryCode: 'NL', region: 'South Holland', city: 'Rotterdam', lat: 51.9481, lng: 4.1365, hasCustoms: true, hasFuel: true, hasCrane: true },
  // ─── GERMANY ───
  { name: 'Lürssen Shipyard', type: 'shipyard', country: 'Germany', countryCode: 'DE', region: 'Bremen', city: 'Bremen', lat: 53.1059, lng: 8.7526, hasCrane: true, hasStorage: true, maxLOA: 180, popular: true },
  { name: 'Abeking & Rasmussen', type: 'shipyard', country: 'Germany', countryCode: 'DE', region: 'Lower Saxony', city: 'Lemwerder', lat: 53.1606, lng: 8.6214, hasCrane: true, hasStorage: true, maxLOA: 120 },
  { name: 'Hamburg Marina', type: 'marina', country: 'Germany', countryCode: 'DE', region: 'Hamburg', city: 'Hamburg', lat: 53.5446, lng: 9.9651, hasCustoms: true, hasFuel: true },
  // ─── MALTA ───
  { name: 'Grand Harbour Marina', type: 'marina', country: 'Malta', countryCode: 'MT', region: 'Valletta', city: 'Valletta', lat: 35.8910, lng: 14.5125, maxDraft: 7.0, maxLOA: 100, hasCustoms: true, hasFuel: true, hasProvisions: true, popular: true },
  { name: 'Msida Marina', type: 'marina', country: 'Malta', countryCode: 'MT', region: 'Msida', city: 'Msida', lat: 35.8976, lng: 14.4949, hasFuel: true },
].map(p => ({
  // Apply defaults, then override with actual data
  ...{
    code: null as string | null,
    maxDraft: null as number | null,
    maxLOA: null as number | null,
    hasCustoms: false,
    hasFuel: false,
    hasProvisions: false,
    hasCrane: false,
    hasStorage: false,
    vhfChannel: null as string | null,
    requiresPortPass: false,
    requiresDriverID: false,
    accessNotes: null as string | null,
    website: null as string | null,
    phone: null as string | null,
    timezone: null as string | null,
    popular: false,
  },
  ...p,
}))
