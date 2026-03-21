// Comprehensive EU & UK ports, marinas, and yacht shipyards
// Ports and marinas are prioritised first when a city is searched

export interface PortEntry {
  name: string
  city: string
  country: string
  region: string
  type: 'port' | 'marina' | 'shipyard' | 'address'
  postcode?: string
  address?: string
  lat?: number
  lng?: number
}

export const ports: PortEntry[] = [
  // ─── FRANCE ───────────────────────────────────────────────────────────
  // Ports & Marinas
  { name: 'Port Vauban', city: 'Antibes', country: 'France', region: 'French Riviera', type: 'port', postcode: '06600', lat: 43.5804, lng: 7.1260 },
  { name: 'Port Gallice', city: 'Antibes', country: 'France', region: 'French Riviera', type: 'marina', postcode: '06160', lat: 43.5583, lng: 7.0475 },
  { name: 'Port de la Salis', city: 'Antibes', country: 'France', region: 'French Riviera', type: 'marina', postcode: '06160', lat: 43.5594, lng: 7.1177 },
  { name: 'Port Hercules', city: 'Monaco', country: 'Monaco', region: 'French Riviera', type: 'port', postcode: '98000', lat: 43.7348, lng: 7.4208 },
  { name: 'Port de Fontvieille', city: 'Monaco', country: 'Monaco', region: 'French Riviera', type: 'port', postcode: '98000', lat: 43.7278, lng: 7.4145 },
  { name: 'Port de Nice', city: 'Nice', country: 'France', region: 'French Riviera', type: 'port', postcode: '06300', lat: 43.6942, lng: 7.2856 },
  { name: 'Port Lympia', city: 'Nice', country: 'France', region: 'French Riviera', type: 'port', postcode: '06300', lat: 43.6947, lng: 7.2870 },
  { name: 'Port de Saint-Laurent-du-Var', city: 'Saint-Laurent-du-Var', country: 'France', region: 'French Riviera', type: 'marina' },
  { name: 'Port de Cannes - Vieux Port', city: 'Cannes', country: 'France', region: 'French Riviera', type: 'port', postcode: '06400', lat: 43.5513, lng: 7.0128 },
  { name: 'Port Pierre Canto', city: 'Cannes', country: 'France', region: 'French Riviera', type: 'marina' },
  { name: 'Port de Mandelieu-la-Napoule', city: 'Mandelieu-la-Napoule', country: 'France', region: 'French Riviera', type: 'marina' },
  { name: 'Port de Saint-Tropez', city: 'Saint-Tropez', country: 'France', region: 'French Riviera', type: 'port', postcode: '83990', lat: 43.2727, lng: 6.6366 },
  { name: 'Port Grimaud', city: 'Grimaud', country: 'France', region: 'French Riviera', type: 'marina' },
  { name: 'Port de Villefranche-sur-Mer', city: 'Villefranche-sur-Mer', country: 'France', region: 'French Riviera', type: 'port' },
  { name: 'Port de Beaulieu', city: 'Beaulieu-sur-Mer', country: 'France', region: 'French Riviera', type: 'marina' },
  { name: 'Port de Saint-Jean-Cap-Ferrat', city: 'Saint-Jean-Cap-Ferrat', country: 'France', region: 'French Riviera', type: 'marina' },
  { name: 'Port de Golfe-Juan', city: 'Golfe-Juan', country: 'France', region: 'French Riviera', type: 'port' },
  { name: 'Port Fréjus', city: 'Fréjus', country: 'France', region: 'French Riviera', type: 'port' },
  { name: 'Port de Toulon', city: 'Toulon', country: 'France', region: 'Provence', type: 'port' },
  { name: 'Port de Hyères', city: 'Hyères', country: 'France', region: 'Provence', type: 'port' },
  { name: 'Port de Marseille - Vieux Port', city: 'Marseille', country: 'France', region: 'Provence', type: 'port', postcode: '13001', lat: 43.2951, lng: 5.3697 },
  { name: 'Port de la Joliette', city: 'Marseille', country: 'France', region: 'Provence', type: 'port' },
  { name: 'Port de Bandol', city: 'Bandol', country: 'France', region: 'Provence', type: 'marina' },
  { name: 'Port de Sète', city: 'Sète', country: 'France', region: 'Occitanie', type: 'port' },
  { name: 'Port de la Grande-Motte', city: 'La Grande-Motte', country: 'France', region: 'Occitanie', type: 'marina' },
  { name: 'Port de La Ciotat', city: 'La Ciotat', country: 'France', region: 'Provence', type: 'port' },
  { name: 'Port Camargue', city: 'Le Grau-du-Roi', country: 'France', region: 'Occitanie', type: 'marina' },
  { name: 'Port de Bonifacio', city: 'Bonifacio', country: 'France', region: 'Corsica', type: 'port' },
  { name: 'Port de Porto-Vecchio', city: 'Porto-Vecchio', country: 'France', region: 'Corsica', type: 'port' },
  { name: 'Port de Ajaccio', city: 'Ajaccio', country: 'France', region: 'Corsica', type: 'port' },
  { name: 'Port de Calvi', city: 'Calvi', country: 'France', region: 'Corsica', type: 'marina' },
  // Shipyards
  { name: 'Compositeworks', city: 'La Ciotat', country: 'France', region: 'Provence', type: 'shipyard' },
  { name: 'MB92 La Ciotat', city: 'La Ciotat', country: 'France', region: 'Provence', type: 'shipyard' },
  { name: 'Monaco Marine', city: 'La Ciotat', country: 'France', region: 'Provence', type: 'shipyard' },
  { name: 'Chantier Naval de Marseille', city: 'Marseille', country: 'France', region: 'Provence', type: 'shipyard' },
  { name: 'Côte d\'Azur Shipyard', city: 'Antibes', country: 'France', region: 'French Riviera', type: 'shipyard' },
  { name: 'Antibes Yacht Services', city: 'Antibes', country: 'France', region: 'French Riviera', type: 'shipyard' },
  { name: 'Vilanova Grand Marina Shipyard (Mediterranean)', city: 'Villefranche-sur-Mer', country: 'France', region: 'French Riviera', type: 'shipyard' },

  // ─── SPAIN ────────────────────────────────────────────────────────────
  { name: 'Port de Barcelona', city: 'Barcelona', country: 'Spain', region: 'Catalonia', type: 'port', postcode: '08039', lat: 41.3751, lng: 2.1869 },
  { name: 'Marina Port Vell', city: 'Barcelona', country: 'Spain', region: 'Catalonia', type: 'marina', postcode: '08039', lat: 41.3759, lng: 2.1845 },
  { name: 'OneOcean Port Vell', city: 'Barcelona', country: 'Spain', region: 'Catalonia', type: 'marina' },
  { name: 'Port Olímpic', city: 'Barcelona', country: 'Spain', region: 'Catalonia', type: 'marina' },
  { name: 'Port Forum', city: 'Barcelona', country: 'Spain', region: 'Catalonia', type: 'marina' },
  { name: 'Marina Badalona', city: 'Badalona', country: 'Spain', region: 'Catalonia', type: 'marina' },
  { name: 'Club de Mar Palma', city: 'Palma de Mallorca', country: 'Spain', region: 'Balearic Islands', type: 'marina' },
  { name: 'Marina Port de Mallorca', city: 'Palma de Mallorca', country: 'Spain', region: 'Balearic Islands', type: 'marina' },
  { name: 'STP Palma (Shipyard)', city: 'Palma de Mallorca', country: 'Spain', region: 'Balearic Islands', type: 'shipyard' },
  { name: 'Astilleros de Mallorca', city: 'Palma de Mallorca', country: 'Spain', region: 'Balearic Islands', type: 'shipyard' },
  { name: 'Port Adriano', city: 'Calvià', country: 'Spain', region: 'Balearic Islands', type: 'marina' },
  { name: 'Puerto Portals', city: 'Portals Nous', country: 'Spain', region: 'Balearic Islands', type: 'marina' },
  { name: 'Port de Sóller', city: 'Sóller', country: 'Spain', region: 'Balearic Islands', type: 'port' },
  { name: 'Port d\'Alcúdia', city: 'Alcúdia', country: 'Spain', region: 'Balearic Islands', type: 'port' },
  { name: 'Marina Ibiza', city: 'Ibiza', country: 'Spain', region: 'Balearic Islands', type: 'marina' },
  { name: 'Ibiza Magna', city: 'Ibiza', country: 'Spain', region: 'Balearic Islands', type: 'marina' },
  { name: 'Port de Mahón', city: 'Mahón', country: 'Spain', region: 'Balearic Islands', type: 'port' },
  { name: 'Puerto de Valencia', city: 'Valencia', country: 'Spain', region: 'Valencia', type: 'port' },
  { name: 'Marina Real Juan Carlos I', city: 'Valencia', country: 'Spain', region: 'Valencia', type: 'marina' },
  { name: 'Puerto de Alicante', city: 'Alicante', country: 'Spain', region: 'Valencia', type: 'port' },
  { name: 'Puerto de Málaga', city: 'Málaga', country: 'Spain', region: 'Andalusia', type: 'port' },
  { name: 'Puerto Banús', city: 'Marbella', country: 'Spain', region: 'Andalusia', type: 'marina' },
  { name: 'La Bajadilla Marina', city: 'Marbella', country: 'Spain', region: 'Andalusia', type: 'marina' },
  { name: 'Puerto de Gibraltar (La Línea)', city: 'La Línea de la Concepción', country: 'Spain', region: 'Andalusia', type: 'port' },
  { name: 'Puerto de Tarragona', city: 'Tarragona', country: 'Spain', region: 'Catalonia', type: 'port' },
  { name: 'Port Tarraco', city: 'Tarragona', country: 'Spain', region: 'Catalonia', type: 'marina' },
  { name: 'Marina de Dénia', city: 'Dénia', country: 'Spain', region: 'Valencia', type: 'marina' },
  // Shipyards
  { name: 'MB92 Barcelona', city: 'Barcelona', country: 'Spain', region: 'Catalonia', type: 'shipyard' },
  { name: 'Marina Barcelona 92', city: 'Barcelona', country: 'Spain', region: 'Catalonia', type: 'shipyard' },
  { name: 'Astilleros de Barcelona', city: 'Barcelona', country: 'Spain', region: 'Catalonia', type: 'shipyard' },
  { name: 'Pinmar Palma', city: 'Palma de Mallorca', country: 'Spain', region: 'Balearic Islands', type: 'shipyard' },

  // ─── ITALY ────────────────────────────────────────────────────────────
  { name: 'Porto di Genova', city: 'Genoa', country: 'Italy', region: 'Liguria', type: 'port' },
  { name: 'Marina di Genova Aeroporto', city: 'Genoa', country: 'Italy', region: 'Liguria', type: 'marina' },
  { name: 'Porto di La Spezia', city: 'La Spezia', country: 'Italy', region: 'Liguria', type: 'port' },
  { name: 'Porto di Livorno', city: 'Livorno', country: 'Italy', region: 'Tuscany', type: 'port' },
  { name: 'Porto di Civitavecchia', city: 'Civitavecchia', country: 'Italy', region: 'Lazio', type: 'port' },
  { name: 'Porto di Napoli', city: 'Naples', country: 'Italy', region: 'Campania', type: 'port' },
  { name: 'Marina di Stabia', city: 'Castellammare di Stabia', country: 'Italy', region: 'Campania', type: 'marina' },
  { name: 'Porto di Capri', city: 'Capri', country: 'Italy', region: 'Campania', type: 'port' },
  { name: 'Marina di Portofino', city: 'Portofino', country: 'Italy', region: 'Liguria', type: 'marina' },
  { name: 'Porto di Santa Margherita Ligure', city: 'Santa Margherita Ligure', country: 'Italy', region: 'Liguria', type: 'marina' },
  { name: 'Porto di Sanremo', city: 'Sanremo', country: 'Italy', region: 'Liguria', type: 'marina' },
  { name: 'Porto Cervo Marina', city: 'Porto Cervo', country: 'Italy', region: 'Sardinia', type: 'marina' },
  { name: 'Marina di Olbia', city: 'Olbia', country: 'Italy', region: 'Sardinia', type: 'marina' },
  { name: 'Marina di Porto Rotondo', city: 'Porto Rotondo', country: 'Italy', region: 'Sardinia', type: 'marina' },
  { name: 'Porto di Cagliari', city: 'Cagliari', country: 'Italy', region: 'Sardinia', type: 'port' },
  { name: 'Marina di Palermo', city: 'Palermo', country: 'Italy', region: 'Sicily', type: 'marina' },
  { name: 'Porto di Palermo', city: 'Palermo', country: 'Italy', region: 'Sicily', type: 'port' },
  { name: 'Porto di Catania', city: 'Catania', country: 'Italy', region: 'Sicily', type: 'port' },
  { name: 'Porto di Siracusa', city: 'Siracusa', country: 'Italy', region: 'Sicily', type: 'port' },
  { name: 'Marina di Venezia', city: 'Venice', country: 'Italy', region: 'Veneto', type: 'marina' },
  { name: 'Porto di Trieste', city: 'Trieste', country: 'Italy', region: 'Friuli-Venezia Giulia', type: 'port' },
  { name: 'Porto di Ancona', city: 'Ancona', country: 'Italy', region: 'Marche', type: 'port' },
  { name: 'Porto di Brindisi', city: 'Brindisi', country: 'Italy', region: 'Puglia', type: 'port' },
  { name: 'Porto di Bari', city: 'Bari', country: 'Italy', region: 'Puglia', type: 'port' },
  { name: 'Marina Grande', city: 'Sorrento', country: 'Italy', region: 'Campania', type: 'marina' },
  { name: 'Porto di Amalfi', city: 'Amalfi', country: 'Italy', region: 'Campania', type: 'marina' },
  { name: 'Marina Cala de\' Medici', city: 'Castiglioncello', country: 'Italy', region: 'Tuscany', type: 'marina' },
  { name: 'Porto Ercole', city: 'Porto Ercole', country: 'Italy', region: 'Tuscany', type: 'marina' },
  // Shipyards
  { name: 'Benetti Shipyard', city: 'Viareggio', country: 'Italy', region: 'Tuscany', type: 'shipyard' },
  { name: 'Azimut-Benetti (Livorno)', city: 'Livorno', country: 'Italy', region: 'Tuscany', type: 'shipyard' },
  { name: 'Fincantieri', city: 'Trieste', country: 'Italy', region: 'Friuli-Venezia Giulia', type: 'shipyard' },
  { name: 'Sanlorenzo Shipyard', city: 'La Spezia', country: 'Italy', region: 'Liguria', type: 'shipyard' },
  { name: 'Ferretti Group (Ancona)', city: 'Ancona', country: 'Italy', region: 'Marche', type: 'shipyard' },
  { name: 'Riva Shipyard (Sarnico)', city: 'Sarnico', country: 'Italy', region: 'Lombardy', type: 'shipyard' },
  { name: 'CRN Shipyard', city: 'Ancona', country: 'Italy', region: 'Marche', type: 'shipyard' },
  { name: 'ISA Yachts (Palumbo)', city: 'Ancona', country: 'Italy', region: 'Marche', type: 'shipyard' },
  { name: 'Tankoa Yachts', city: 'Genoa', country: 'Italy', region: 'Liguria', type: 'shipyard' },
  { name: 'Baglietto Shipyard', city: 'La Spezia', country: 'Italy', region: 'Liguria', type: 'shipyard' },
  { name: 'Codecasa Shipyard', city: 'Viareggio', country: 'Italy', region: 'Tuscany', type: 'shipyard' },
  { name: 'Rossinavi Shipyard', city: 'Viareggio', country: 'Italy', region: 'Tuscany', type: 'shipyard' },
  { name: 'Perini Navi', city: 'Viareggio', country: 'Italy', region: 'Tuscany', type: 'shipyard' },
  { name: 'Overmarine (Mangusta)', city: 'Viareggio', country: 'Italy', region: 'Tuscany', type: 'shipyard' },
  { name: 'Palumbo Superyachts Napoli', city: 'Naples', country: 'Italy', region: 'Campania', type: 'shipyard' },

  // ─── CROATIA ──────────────────────────────────────────────────────────
  { name: 'ACI Marina Split', city: 'Split', country: 'Croatia', region: 'Dalmatia', type: 'marina' },
  { name: 'ACI Marina Dubrovnik', city: 'Dubrovnik', country: 'Croatia', region: 'Dalmatia', type: 'marina' },
  { name: 'Marina Frapa', city: 'Rogoznica', country: 'Croatia', region: 'Dalmatia', type: 'marina' },
  { name: 'D-Marin Mandalina', city: 'Šibenik', country: 'Croatia', region: 'Dalmatia', type: 'marina' },
  { name: 'Marina Kaštela', city: 'Kaštela', country: 'Croatia', region: 'Dalmatia', type: 'marina' },
  { name: 'ACI Marina Trogir', city: 'Trogir', country: 'Croatia', region: 'Dalmatia', type: 'marina' },
  { name: 'Marina Zadar', city: 'Zadar', country: 'Croatia', region: 'Dalmatia', type: 'marina' },
  { name: 'Marina Punat', city: 'Punat', country: 'Croatia', region: 'Kvarner', type: 'marina' },
  { name: 'Marina Veruda', city: 'Pula', country: 'Croatia', region: 'Istria', type: 'marina' },
  { name: 'Porto Montenegro (nearby)', city: 'Rijeka', country: 'Croatia', region: 'Kvarner', type: 'port' },

  // ─── MONTENEGRO ───────────────────────────────────────────────────────
  { name: 'Porto Montenegro', city: 'Tivat', country: 'Montenegro', region: 'Bay of Kotor', type: 'marina' },
  { name: 'Port of Kotor', city: 'Kotor', country: 'Montenegro', region: 'Bay of Kotor', type: 'port' },
  { name: 'Port of Bar', city: 'Bar', country: 'Montenegro', region: 'Coast', type: 'port' },

  // ─── GREECE ───────────────────────────────────────────────────────────
  { name: 'Piraeus Port', city: 'Piraeus', country: 'Greece', region: 'Attica', type: 'port' },
  { name: 'Flisvos Marina', city: 'Athens', country: 'Greece', region: 'Attica', type: 'marina' },
  { name: 'Alimos Marina', city: 'Athens', country: 'Greece', region: 'Attica', type: 'marina' },
  { name: 'Zea Marina', city: 'Piraeus', country: 'Greece', region: 'Attica', type: 'marina' },
  { name: 'Corfu Marina', city: 'Corfu', country: 'Greece', region: 'Ionian Islands', type: 'marina' },
  { name: 'Gouvia Marina', city: 'Corfu', country: 'Greece', region: 'Ionian Islands', type: 'marina' },
  { name: 'Lefkas Marina', city: 'Lefkada', country: 'Greece', region: 'Ionian Islands', type: 'marina' },
  { name: 'Rhodes Marina', city: 'Rhodes', country: 'Greece', region: 'Dodecanese', type: 'marina' },
  { name: 'Kos Marina', city: 'Kos', country: 'Greece', region: 'Dodecanese', type: 'marina' },
  { name: 'Port of Mykonos', city: 'Mykonos', country: 'Greece', region: 'Cyclades', type: 'port' },
  { name: 'Port of Santorini', city: 'Santorini', country: 'Greece', region: 'Cyclades', type: 'port' },
  { name: 'Port of Thessaloniki', city: 'Thessaloniki', country: 'Greece', region: 'Central Macedonia', type: 'port' },
  { name: 'Sani Marina', city: 'Halkidiki', country: 'Greece', region: 'Central Macedonia', type: 'marina' },
  { name: 'Port of Heraklion', city: 'Heraklion', country: 'Greece', region: 'Crete', type: 'port' },
  // Shipyards
  { name: 'Salamis Shipyard (Elefsis)', city: 'Elefsis', country: 'Greece', region: 'Attica', type: 'shipyard' },
  { name: 'Spanopoulos Group Shipyard', city: 'Piraeus', country: 'Greece', region: 'Attica', type: 'shipyard' },
  { name: 'Syros Shipyard (Neorion)', city: 'Syros', country: 'Greece', region: 'Cyclades', type: 'shipyard' },

  // ─── TURKEY ───────────────────────────────────────────────────────────
  { name: 'Yalikavak Marina', city: 'Bodrum', country: 'Turkey', region: 'Aegean', type: 'marina' },
  { name: 'Bodrum Marina', city: 'Bodrum', country: 'Turkey', region: 'Aegean', type: 'marina' },
  { name: 'Palmarina Bodrum', city: 'Bodrum', country: 'Turkey', region: 'Aegean', type: 'marina' },
  { name: 'D-Marin Göcek', city: 'Göcek', country: 'Turkey', region: 'Aegean', type: 'marina' },
  { name: 'Göcek Marina', city: 'Göcek', country: 'Turkey', region: 'Aegean', type: 'marina' },
  { name: 'Port of Marmaris', city: 'Marmaris', country: 'Turkey', region: 'Aegean', type: 'port' },
  { name: 'Marmaris Netsel Marina', city: 'Marmaris', country: 'Turkey', region: 'Aegean', type: 'marina' },
  { name: 'Port of Antalya', city: 'Antalya', country: 'Turkey', region: 'Mediterranean', type: 'port' },
  { name: 'Port of Fethiye', city: 'Fethiye', country: 'Turkey', region: 'Aegean', type: 'port' },
  // Shipyards
  { name: 'Bilgin Yachts', city: 'Istanbul', country: 'Turkey', region: 'Marmara', type: 'shipyard' },
  { name: 'Turquoise Yachts', city: 'Istanbul', country: 'Turkey', region: 'Marmara', type: 'shipyard' },
  { name: 'Bering Yachts', city: 'Antalya', country: 'Turkey', region: 'Mediterranean', type: 'shipyard' },
  { name: 'Alia Yachts', city: 'Antalya', country: 'Turkey', region: 'Mediterranean', type: 'shipyard' },
  { name: 'Numarine Shipyard', city: 'Istanbul', country: 'Turkey', region: 'Marmara', type: 'shipyard' },

  // ─── NETHERLANDS ──────────────────────────────────────────────────────
  { name: 'Port of Amsterdam', city: 'Amsterdam', country: 'Netherlands', region: 'North Holland', type: 'port' },
  { name: 'Sixhaven Marina', city: 'Amsterdam', country: 'Netherlands', region: 'North Holland', type: 'marina' },
  { name: 'Port of Rotterdam', city: 'Rotterdam', country: 'Netherlands', region: 'South Holland', type: 'port' },
  { name: 'City Marina Rotterdam', city: 'Rotterdam', country: 'Netherlands', region: 'South Holland', type: 'marina' },
  // Shipyards
  { name: 'Feadship (Royal Van Lent)', city: 'Kaag', country: 'Netherlands', region: 'South Holland', type: 'shipyard' },
  { name: 'Feadship (De Vries)', city: 'Aalsmeer', country: 'Netherlands', region: 'North Holland', type: 'shipyard' },
  { name: 'Feadship (Makkum)', city: 'Makkum', country: 'Netherlands', region: 'Friesland', type: 'shipyard' },
  { name: 'Oceanco', city: 'Alblasserdam', country: 'Netherlands', region: 'South Holland', type: 'shipyard' },
  { name: 'Amels (Damen Yachting)', city: 'Vlissingen', country: 'Netherlands', region: 'Zeeland', type: 'shipyard' },
  { name: 'Heesen Yachts', city: 'Oss', country: 'Netherlands', region: 'North Brabant', type: 'shipyard' },
  { name: 'Hakvoort Shipyard', city: 'Monnickendam', country: 'Netherlands', region: 'North Holland', type: 'shipyard' },
  { name: 'Moonen Yachts', city: 'Den Bosch', country: 'Netherlands', region: 'North Brabant', type: 'shipyard' },
  { name: 'Icon Yachts (formerly Estaship)', city: 'Harlingen', country: 'Netherlands', region: 'Friesland', type: 'shipyard' },
  { name: 'Mulder Shipyard', city: 'Zoeterwoude-Rijndijk', country: 'Netherlands', region: 'South Holland', type: 'shipyard' },
  { name: 'Balk Shipyard', city: 'Urk', country: 'Netherlands', region: 'Flevoland', type: 'shipyard' },
  { name: 'Van der Valk Shipyard', city: 'Waalwijk', country: 'Netherlands', region: 'North Brabant', type: 'shipyard' },
  { name: 'Damen Shipyards (Amsterdam)', city: 'Amsterdam', country: 'Netherlands', region: 'North Holland', type: 'shipyard' },

  // ─── GERMANY ──────────────────────────────────────────────────────────
  { name: 'Port of Hamburg', city: 'Hamburg', country: 'Germany', region: 'Hamburg', type: 'port' },
  { name: 'Port of Kiel', city: 'Kiel', country: 'Germany', region: 'Schleswig-Holstein', type: 'port' },
  { name: 'Port of Bremen', city: 'Bremen', country: 'Germany', region: 'Bremen', type: 'port' },
  { name: 'Port of Bremerhaven', city: 'Bremerhaven', country: 'Germany', region: 'Bremen', type: 'port' },
  // Shipyards
  { name: 'Lürssen Shipyard', city: 'Bremen', country: 'Germany', region: 'Bremen', type: 'shipyard' },
  { name: 'Blohm+Voss', city: 'Hamburg', country: 'Germany', region: 'Hamburg', type: 'shipyard' },
  { name: 'Nobiskrug Shipyard', city: 'Rendsburg', country: 'Germany', region: 'Schleswig-Holstein', type: 'shipyard' },
  { name: 'Abeking & Rasmussen', city: 'Lemwerder', country: 'Germany', region: 'Lower Saxony', type: 'shipyard' },
  { name: 'Meyer Werft', city: 'Papenburg', country: 'Germany', region: 'Lower Saxony', type: 'shipyard' },

  // ─── UK ───────────────────────────────────────────────────────────────
  { name: 'Port of Southampton', city: 'Southampton', country: 'United Kingdom', region: 'Hampshire', type: 'port', postcode: 'SO14 2AQ', lat: 50.8975, lng: -1.3968 },
  { name: 'Ocean Village Marina', city: 'Southampton', country: 'United Kingdom', region: 'Hampshire', type: 'marina', postcode: 'SO14 3TJ', lat: 50.8956, lng: -1.3882 },
  { name: 'Shamrock Quay Marina', city: 'Southampton', country: 'United Kingdom', region: 'Hampshire', type: 'marina', postcode: 'SO14 5QL', lat: 50.8932, lng: -1.3826 },
  { name: 'Port of London (Tilbury)', city: 'London', country: 'United Kingdom', region: 'Essex', type: 'port' },
  { name: 'St Katharine Docks', city: 'London', country: 'United Kingdom', region: 'London', type: 'marina' },
  { name: 'Limehouse Marina', city: 'London', country: 'United Kingdom', region: 'London', type: 'marina' },
  { name: 'Port of Poole', city: 'Poole', country: 'United Kingdom', region: 'Dorset', type: 'port' },
  { name: 'Poole Quay Boat Haven', city: 'Poole', country: 'United Kingdom', region: 'Dorset', type: 'marina' },
  { name: 'Port of Portsmouth', city: 'Portsmouth', country: 'United Kingdom', region: 'Hampshire', type: 'port' },
  { name: 'Gunwharf Quays Marina', city: 'Portsmouth', country: 'United Kingdom', region: 'Hampshire', type: 'marina' },
  { name: 'Haslar Marina', city: 'Gosport', country: 'United Kingdom', region: 'Hampshire', type: 'marina' },
  { name: 'Port of Plymouth', city: 'Plymouth', country: 'United Kingdom', region: 'Devon', type: 'port' },
  { name: 'Queen Anne\'s Battery Marina', city: 'Plymouth', country: 'United Kingdom', region: 'Devon', type: 'marina' },
  { name: 'Port of Falmouth', city: 'Falmouth', country: 'United Kingdom', region: 'Cornwall', type: 'port' },
  { name: 'Falmouth Marina', city: 'Falmouth', country: 'United Kingdom', region: 'Cornwall', type: 'marina' },
  { name: 'Cowes Yacht Haven', city: 'Cowes', country: 'United Kingdom', region: 'Isle of Wight', type: 'marina' },
  { name: 'Lymington Yacht Haven', city: 'Lymington', country: 'United Kingdom', region: 'Hampshire', type: 'marina' },
  { name: 'Port of Dover', city: 'Dover', country: 'United Kingdom', region: 'Kent', type: 'port' },
  { name: 'Ramsgate Royal Harbour Marina', city: 'Ramsgate', country: 'United Kingdom', region: 'Kent', type: 'marina' },
  { name: 'Port of Edinburgh (Leith)', city: 'Edinburgh', country: 'United Kingdom', region: 'Scotland', type: 'port' },
  { name: 'Port of Glasgow', city: 'Glasgow', country: 'United Kingdom', region: 'Scotland', type: 'port' },
  { name: 'Port of Liverpool', city: 'Liverpool', country: 'United Kingdom', region: 'Merseyside', type: 'port' },
  { name: 'Port of Bristol', city: 'Bristol', country: 'United Kingdom', region: 'Avon', type: 'port' },
  // Shipyards
  { name: 'Sunseeker International', city: 'Poole', country: 'United Kingdom', region: 'Dorset', type: 'shipyard' },
  { name: 'Princess Yachts', city: 'Plymouth', country: 'United Kingdom', region: 'Devon', type: 'shipyard' },
  { name: 'Pendennis Shipyard', city: 'Falmouth', country: 'United Kingdom', region: 'Cornwall', type: 'shipyard' },
  { name: 'Oyster Yachts', city: 'Southampton', country: 'United Kingdom', region: 'Hampshire', type: 'shipyard' },
  { name: 'Fairline Yachts', city: 'Oundle', country: 'United Kingdom', region: 'Northamptonshire', type: 'shipyard' },
  { name: 'Spirit Yachts', city: 'Ipswich', country: 'United Kingdom', region: 'Suffolk', type: 'shipyard' },

  // ─── GIBRALTAR ────────────────────────────────────────────────────────
  { name: 'Ocean Village Gibraltar', city: 'Gibraltar', country: 'Gibraltar', region: 'Gibraltar', type: 'marina' },
  { name: 'Marina Bay Gibraltar', city: 'Gibraltar', country: 'Gibraltar', region: 'Gibraltar', type: 'marina' },
  { name: 'Queensway Quay Marina', city: 'Gibraltar', country: 'Gibraltar', region: 'Gibraltar', type: 'marina' },
  { name: 'Gibdock Shipyard', city: 'Gibraltar', country: 'Gibraltar', region: 'Gibraltar', type: 'shipyard' },

  // ─── PORTUGAL ─────────────────────────────────────────────────────────
  { name: 'Port of Lisbon', city: 'Lisbon', country: 'Portugal', region: 'Lisbon', type: 'port' },
  { name: 'Marina de Cascais', city: 'Cascais', country: 'Portugal', region: 'Lisbon', type: 'marina' },
  { name: 'Port of Portimão', city: 'Portimão', country: 'Portugal', region: 'Algarve', type: 'port' },
  { name: 'Marina de Vilamoura', city: 'Vilamoura', country: 'Portugal', region: 'Algarve', type: 'marina' },
  { name: 'Marina de Lagos', city: 'Lagos', country: 'Portugal', region: 'Algarve', type: 'marina' },
  { name: 'Marina de Albufeira', city: 'Albufeira', country: 'Portugal', region: 'Algarve', type: 'marina' },
  { name: 'Porto Marina (Douro)', city: 'Porto', country: 'Portugal', region: 'Norte', type: 'marina' },

  // ─── MALTA ────────────────────────────────────────────────────────────
  { name: 'Port of Valletta', city: 'Valletta', country: 'Malta', region: 'Malta', type: 'port' },
  { name: 'Grand Harbour Marina', city: 'Valletta', country: 'Malta', region: 'Malta', type: 'marina' },
  { name: 'Msida Marina', city: 'Msida', country: 'Malta', region: 'Malta', type: 'marina' },
  { name: 'Palumbo Malta Shipyard', city: 'Cospicua', country: 'Malta', region: 'Malta', type: 'shipyard' },

  // ─── DENMARK ──────────────────────────────────────────────────────────
  { name: 'Port of Copenhagen', city: 'Copenhagen', country: 'Denmark', region: 'Zealand', type: 'port' },
  // Shipyard
  { name: 'Royal Danish Dockyard', city: 'Copenhagen', country: 'Denmark', region: 'Zealand', type: 'shipyard' },

  // ─── SWEDEN ───────────────────────────────────────────────────────────
  { name: 'Port of Gothenburg', city: 'Gothenburg', country: 'Sweden', region: 'Västra Götaland', type: 'port' },
  { name: 'Port of Stockholm', city: 'Stockholm', country: 'Sweden', region: 'Stockholm', type: 'port' },

  // ─── NORWAY ───────────────────────────────────────────────────────────
  { name: 'Port of Oslo', city: 'Oslo', country: 'Norway', region: 'Oslo', type: 'port' },
  { name: 'Port of Bergen', city: 'Bergen', country: 'Norway', region: 'Vestland', type: 'port' },

  // ─── FINLAND ──────────────────────────────────────────────────────────
  { name: 'Port of Helsinki', city: 'Helsinki', country: 'Finland', region: 'Uusimaa', type: 'port' },
  // Shipyard
  { name: 'Baltic Yachts', city: 'Jakobstad', country: 'Finland', region: 'Ostrobothnia', type: 'shipyard' },
  { name: 'Nautor\'s Swan', city: 'Pietarsaari', country: 'Finland', region: 'Ostrobothnia', type: 'shipyard' },

  // ─── BELGIUM ──────────────────────────────────────────────────────────
  { name: 'Port of Antwerp', city: 'Antwerp', country: 'Belgium', region: 'Flanders', type: 'port' },
  { name: 'Port of Zeebrugge', city: 'Bruges', country: 'Belgium', region: 'Flanders', type: 'port' },

  // ─── POLAND ───────────────────────────────────────────────────────────
  { name: 'Port of Gdańsk', city: 'Gdańsk', country: 'Poland', region: 'Pomerania', type: 'port' },
  { name: 'Port of Gdynia', city: 'Gdynia', country: 'Poland', region: 'Pomerania', type: 'port' },
  // Shipyard
  { name: 'Sunreef Yachts', city: 'Gdańsk', country: 'Poland', region: 'Pomerania', type: 'shipyard' },

  // ─── IRELAND ──────────────────────────────────────────────────────────
  { name: 'Port of Dublin', city: 'Dublin', country: 'Ireland', region: 'Leinster', type: 'port' },
  { name: 'Dun Laoghaire Marina', city: 'Dublin', country: 'Ireland', region: 'Leinster', type: 'marina' },
  { name: 'Port of Cork', city: 'Cork', country: 'Ireland', region: 'Munster', type: 'port' },
]

/**
 * Search ports by query string.
 * Ports and marinas are prioritised over shipyards.
 * Matches against name, city, country, and region.
 */
export function searchPorts(query: string, limit: number = 10): PortEntry[] {
  if (!query || query.length < 2) return []

  const q = query.toLowerCase().trim()

  // Score each entry — lower score = higher priority
  const scored = ports.map(p => {
    const nameL = p.name.toLowerCase()
    const cityL = p.city.toLowerCase()
    const countryL = p.country.toLowerCase()
    const regionL = p.region.toLowerCase()

    let score = 1000 // default no-match

    // Exact starts get highest priority
    if (nameL.startsWith(q)) score = 0
    else if (cityL.startsWith(q)) score = 1
    else if (nameL.includes(q)) score = 10
    else if (cityL.includes(q)) score = 11
    else if (regionL.includes(q)) score = 20
    else if (countryL.includes(q)) score = 25
    else {
      // Check individual words
      const words = q.split(/\s+/)
      const allMatch = words.every(w =>
        nameL.includes(w) || cityL.includes(w) || countryL.includes(w) || regionL.includes(w)
      )
      if (allMatch) score = 30
    }

    if (score >= 1000) return null

    // Prioritise ports > marinas > shipyards
    if (p.type === 'port') score += 0
    else if (p.type === 'marina') score += 0.1
    else if (p.type === 'shipyard') score += 0.2

    return { entry: p, score }
  }).filter(Boolean) as { entry: PortEntry; score: number }[]

  scored.sort((a, b) => a.score - b.score)

  return scored.slice(0, limit).map(s => s.entry)
}

export function formatPortDisplay(p: PortEntry): string {
  return `${p.name}, ${p.city}`
}

export function formatPortFull(p: PortEntry): string {
  return `${p.name}, ${p.city}, ${p.country}`
}
