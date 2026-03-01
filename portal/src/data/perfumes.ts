// Local curated perfume database — searched client-side, no external API needed.
// Add entries here to expand the search results.

export interface LocalPerfume {
  name: string;
  brand: string;
  category: 'mens' | 'womens' | 'unisex';
  scentProfiles?: string[];
  notes?: { top?: string[]; middle?: string[]; base?: string[] };
}

export const PERFUME_DATABASE: LocalPerfume[] = [
  // ── Dior ──────────────────────────────────────────────────────────────────
  { name: 'Sauvage EDP', brand: 'Dior', category: 'mens', scentProfiles: ['aromatic', 'fresh'], notes: { top: ['Bergamot', 'Pepper'], middle: ['Lavender', 'Pink Pepper', 'Sichuan Pepper'], base: ['Ambroxan', 'Cedar', 'Labdanum'] } },
  { name: 'Sauvage EDT', brand: 'Dior', category: 'mens', scentProfiles: ['aromatic', 'fresh'], notes: { top: ['Bergamot', 'Pepper'], middle: ['Lavender', 'Pink Pepper'], base: ['Ambroxan', 'Cedar'] } },
  { name: 'Sauvage Parfum', brand: 'Dior', category: 'mens', scentProfiles: ['woody', 'aromatic'], notes: { top: ['Bergamot'], middle: ['Lavender'], base: ['Sandalwood', 'Vanilla'] } },
  { name: 'Bleu de Chanel EDP', brand: 'Chanel', category: 'mens', scentProfiles: ['woody', 'aromatic'], notes: { top: ['Grapefruit', 'Lemon'], middle: ['Ginger', 'Nutmeg', 'Jasmine'], base: ['Cedarwood', 'Sandalwood', 'Patchouli'] } },
  { name: 'Bleu de Chanel EDT', brand: 'Chanel', category: 'mens', scentProfiles: ['fresh', 'aromatic'], notes: { top: ['Grapefruit', 'Lemon', 'Mint'], middle: ['Ginger', 'Nutmeg'], base: ['Cedar', 'Labdanum'] } },
  { name: "J'adore EDP", brand: 'Dior', category: 'womens', scentProfiles: ['floral'], notes: { top: ['Ylang-Ylang', 'Champaca', 'Pear'], middle: ['Rose', 'Jasmine', 'Orchid'], base: ['Musk', 'Blackberry', 'Sandalwood'] } },
  { name: 'Miss Dior EDP', brand: 'Dior', category: 'womens', scentProfiles: ['floral', 'fresh'], notes: { top: ['Bergamot', 'Blood Orange'], middle: ['Peony', 'Rose'], base: ['Patchouli', 'Musk'] } },
  { name: 'Miss Dior Blooming Bouquet', brand: 'Dior', category: 'womens', scentProfiles: ['floral', 'fresh'], notes: { top: ['Sicilian Mandarin'], middle: ['Peony', 'Damascus Rose'], base: ['White Musk'] } },

  // ── Chanel ────────────────────────────────────────────────────────────────
  { name: 'Coco Mademoiselle EDP', brand: 'Chanel', category: 'womens', scentProfiles: ['floral', 'ambery'], notes: { top: ['Orange', 'Bergamot', 'Grapefruit'], middle: ['Rose', 'Jasmine', 'Mimosa'], base: ['Patchouli', 'Vanilla', 'Musk'] } },
  { name: 'Chanel N°5 EDP', brand: 'Chanel', category: 'womens', scentProfiles: ['floral', 'ambery'], notes: { top: ['Aldehydes', 'Bergamot', 'Neroli'], middle: ['Rose', 'Jasmine', 'Ylang-Ylang'], base: ['Vetiver', 'Sandalwood', 'Vanilla'] } },
  { name: 'Chance Eau Tendre EDP', brand: 'Chanel', category: 'womens', scentProfiles: ['floral', 'fresh'], notes: { top: ['Grapefruit', 'Quince'], middle: ['Jasmine', 'Iris'], base: ['Musk', 'Cedar'] } },
  { name: 'Chance Eau Fraîche EDT', brand: 'Chanel', category: 'womens', scentProfiles: ['fresh', 'floral'], notes: { top: ['Citrus', 'Teak'], middle: ['Jasmine', 'Iris'], base: ['Vetiver', 'Cedar'] } },
  { name: 'Allure Homme Sport EDT', brand: 'Chanel', category: 'mens', scentProfiles: ['fresh', 'aromatic'], notes: { top: ['Aldehydes', 'Blood Orange', 'Pepper'], middle: ['Cedar', 'Elemi'], base: ['Tonka Bean', 'White Musk'] } },

  // ── Giorgio Armani ────────────────────────────────────────────────────────
  { name: 'Acqua Di Gio EDP', brand: 'Giorgio Armani', category: 'mens', scentProfiles: ['fresh', 'aquatic'], notes: { top: ['Bergamot', 'Neroli', 'Mandarin'], middle: ['Patchouli', 'Sea Water', 'Cardamom'], base: ['Incense', 'Guaiac Wood', 'Patchouli'] } },
  { name: 'Acqua Di Gio EDT', brand: 'Giorgio Armani', category: 'mens', scentProfiles: ['fresh', 'aquatic'], notes: { top: ['Bergamot', 'Neroli'], middle: ['Marine Notes', 'Jasmine'], base: ['Cedarwood', 'Patchouli', 'Musk'] } },
  { name: 'Acqua Di Gio Profumo', brand: 'Giorgio Armani', category: 'mens', scentProfiles: ['fresh', 'aromatic'], notes: { top: ['Bergamot', 'Aquatic Notes'], middle: ['Geranium', 'Sage'], base: ['Incense', 'Patchouli'] } },
  { name: 'Acqua Di Gio Profondo', brand: 'Giorgio Armani', category: 'mens', scentProfiles: ['fresh', 'aquatic'] },
  { name: 'Stronger With You Intensely', brand: 'Emporio Armani', category: 'mens', scentProfiles: ['ambery', 'aromatic'], notes: { top: ['Pink Pepper', 'Juniper', 'Cardamom'], middle: ['Cinnamon', 'Sage'], base: ['Vanilla', 'Tonka Bean', 'Amber', 'Styrax'] } },
  { name: 'Stronger With You Only', brand: 'Emporio Armani', category: 'mens', scentProfiles: ['fresh', 'aromatic'] },
  { name: 'Si EDP', brand: 'Giorgio Armani', category: 'womens', scentProfiles: ['floral', 'fresh'], notes: { top: ['Blackcurrant Nectar', 'Mandarin Orange'], middle: ['Rose', 'Freesia'], base: ['Cashmeran', 'Patchouli', 'Vanilla'] } },
  { name: 'Si Intense EDP', brand: 'Giorgio Armani', category: 'womens', scentProfiles: ['floral', 'ambery'] },
  { name: 'My Way EDP', brand: 'Giorgio Armani', category: 'womens', scentProfiles: ['floral', 'woody'], notes: { top: ['Bergamot', 'Orange Blossom'], middle: ['Tuberose', 'Jasmine', 'Indian Magnolia'], base: ['Cedarwood', 'Virginia Cedar', 'Musk'] } },

  // ── YSL ───────────────────────────────────────────────────────────────────
  { name: 'Y EDP', brand: 'Yves Saint Laurent', category: 'mens', scentProfiles: ['fresh', 'aromatic'], notes: { top: ['Apple', 'Ginger', 'Bergamot'], middle: ['Sage', 'Juniper', 'Geranium'], base: ['Cedarwood', 'Vetiver', 'Amberwood'] } },
  { name: 'Y EDT', brand: 'Yves Saint Laurent', category: 'mens', scentProfiles: ['fresh', 'aromatic'] },
  { name: 'Black Opium EDP', brand: 'Yves Saint Laurent', category: 'womens', scentProfiles: ['ambery', 'floral'], notes: { top: ['Pink Pepper', 'Orange Blossom', 'Pear'], middle: ['Coffee', 'Jasmine'], base: ['Vanilla', 'Patchouli', 'Cedar', 'Cashmere'] } },
  { name: 'Libre EDP', brand: 'Yves Saint Laurent', category: 'womens', scentProfiles: ['floral', 'ambery'], notes: { top: ['Mandarin Orange', 'Lavender'], middle: ['Orange Blossom', 'Jasmine'], base: ['Vanilla', 'Musk', 'Cedar'] } },
  { name: 'Mon Paris EDP', brand: 'Yves Saint Laurent', category: 'womens', scentProfiles: ['floral', 'fresh'], notes: { top: ['Raspberry', 'Pear', 'Bergamot'], middle: ['Peony', 'Rose', 'Jasmine'], base: ['Musk', 'Patchouli', 'Ambrette'] } },
  { name: 'Manifesto EDP', brand: 'Yves Saint Laurent', category: 'womens', scentProfiles: ['floral', 'fresh'] },

  // ── Paco Rabanne ──────────────────────────────────────────────────────────
  { name: 'Invictus EDT', brand: 'Paco Rabanne', category: 'mens', scentProfiles: ['fresh', 'aromatic'], notes: { top: ['Grapefruit', 'Sea Notes', 'Blood Mandarin'], middle: ['Bay Laurel', 'Jasmine', 'Hedione'], base: ['Guaiac Wood', 'Oak Moss', 'Ambergris'] } },
  { name: 'Invictus EDP', brand: 'Paco Rabanne', category: 'mens', scentProfiles: ['fresh', 'ambery'] },
  { name: 'Invictus Victory EDP', brand: 'Paco Rabanne', category: 'mens', scentProfiles: ['ambery', 'aromatic'], notes: { top: ['Lemon', 'Pink Pepper', 'Coriander'], middle: ['Lavender', 'Apple'], base: ['Vanilla', 'Tonka Bean', 'Amberwood'] } },
  { name: 'One Million EDT', brand: 'Paco Rabanne', category: 'mens', scentProfiles: ['aromatic', 'ambery'], notes: { top: ['Blood Mandarin', 'Grapefruit', 'Mint'], middle: ['Rose', 'Cinnamon', 'Spices'], base: ['Leather', 'Amber', 'Woody Notes', 'Patchouli'] } },
  { name: 'One Million Lucky EDT', brand: 'Paco Rabanne', category: 'mens', scentProfiles: ['fresh', 'ambery'] },
  { name: 'Olympea EDP', brand: 'Paco Rabanne', category: 'womens', scentProfiles: ['floral', 'ambery'], notes: { top: ['Ginger Lily', 'Mandarin Orange'], middle: ['Jasmine'], base: ['Sandalwood', 'Vanilla', 'Cashmere'] } },
  { name: 'Lady Million EDT', brand: 'Paco Rabanne', category: 'womens', scentProfiles: ['floral', 'ambery'] },

  // ── Versace ───────────────────────────────────────────────────────────────
  { name: 'Eros EDT', brand: 'Versace', category: 'mens', scentProfiles: ['fresh', 'aromatic'], notes: { top: ['Mint', 'Green Apple', 'Lemon', 'Mandarin Orange'], middle: ['Ambroxan', 'Geranium', 'Tonka Bean'], base: ['Vanilla', 'Vetiver', 'Oak Moss', 'Cedarwood'] } },
  { name: 'Eros EDP', brand: 'Versace', category: 'mens', scentProfiles: ['ambery', 'aromatic'] },
  { name: 'Eros Flame EDP', brand: 'Versace', category: 'mens', scentProfiles: ['aromatic', 'ambery'] },
  { name: 'Dylan Blue EDT', brand: 'Versace', category: 'mens', scentProfiles: ['fresh', 'aromatic'], notes: { top: ['Grapefruit', 'Fig Leaves', 'Aquatic Notes'], middle: ['Patchouli', 'Papyrus', 'Saffron'], base: ['Mineral Musk', 'Incense', 'Tonka Bean'] } },
  { name: 'Crystal Noir EDT', brand: 'Versace', category: 'womens', scentProfiles: ['floral', 'ambery'] },
  { name: 'Bright Crystal EDT', brand: 'Versace', category: 'womens', scentProfiles: ['floral', 'fresh'], notes: { top: ['Pomegranate', 'Yuzu', 'Frosted Notes'], middle: ['Lotus', 'Magnolia', 'Peony'], base: ['Amber', 'Musk', 'Mahogany'] } },

  // ── Burberry ──────────────────────────────────────────────────────────────
  { name: 'Hero EDP', brand: 'Burberry', category: 'mens', scentProfiles: ['woody', 'aromatic'], notes: { top: ['Bergamot'], middle: ['Juniper', 'Black Pepper', 'Cardamom'], base: ['Cedarwood', 'Amber'] } },
  { name: 'Hero EDT', brand: 'Burberry', category: 'mens', scentProfiles: ['fresh', 'aromatic'] },
  { name: 'Her EDP', brand: 'Burberry', category: 'womens', scentProfiles: ['floral', 'fresh'] },
  { name: 'Brit for Him EDT', brand: 'Burberry', category: 'mens', scentProfiles: ['fresh', 'aromatic'] },

  // ── Bvlgari ───────────────────────────────────────────────────────────────
  { name: 'Man in Black EDP', brand: 'Bvlgari', category: 'mens', scentProfiles: ['ambery', 'aromatic'], notes: { top: ['Spices', 'Rum', 'Tuberose'], middle: ['Leather', 'Guaiac Wood', 'Iris'], base: ['Tonka Bean', 'Benzoin', 'Lava Rock Accord'] } },
  { name: 'Aqva Amara EDT', brand: 'Bvlgari', category: 'mens', scentProfiles: ['fresh', 'aromatic'] },
  { name: 'Omnia Crystalline EDT', brand: 'Bvlgari', category: 'womens', scentProfiles: ['fresh', 'floral'] },

  // ── Tom Ford ──────────────────────────────────────────────────────────────
  { name: 'Oud Wood EDP', brand: 'Tom Ford', category: 'unisex', scentProfiles: ['woody', 'ambery'], notes: { top: ['Oud', 'Rosewood', 'Cardamom'], middle: ['Sandalwood', 'Vetiver', 'Tonka Bean'], base: ['Amber', 'Vanilla', 'China Wood'] } },
  { name: 'Tobacco Vanille EDP', brand: 'Tom Ford', category: 'unisex', scentProfiles: ['ambery', 'aromatic'], notes: { top: ['Tobacco Leaf', 'Spices'], middle: ['Tobacco Blossom', 'Jasmine', 'Ginger'], base: ['Vanilla', 'Cacao', 'Tonka Bean', 'Dried Fruits'] } },
  { name: 'Black Orchid EDP', brand: 'Tom Ford', category: 'unisex', scentProfiles: ['floral', 'ambery'], notes: { top: ['Black Truffle', 'Bergamot', 'Black Currant'], middle: ['Black Orchid', 'Spices', 'Dark Chocolate'], base: ['Patchouli', 'Vanilla', 'Incense'] } },
  { name: 'Noir Extreme EDP', brand: 'Tom Ford', category: 'mens', scentProfiles: ['ambery', 'aromatic'], notes: { top: ['Cardamom', 'Kulfi Accord', 'Neroli'], middle: ['Rose', 'Jasmine', 'Almond'], base: ['Oud', 'Vanilla', 'Sandalwood'] } },
  { name: 'Soleil Blanc EDP', brand: 'Tom Ford', category: 'unisex', scentProfiles: ['floral', 'ambery'] },
  { name: 'Rose Prick EDP', brand: 'Tom Ford', category: 'unisex', scentProfiles: ['floral', 'woody'] },
  { name: 'Lost Cherry EDP', brand: 'Tom Ford', category: 'unisex', scentProfiles: ['floral', 'ambery'] },

  // ── Creed ─────────────────────────────────────────────────────────────────
  { name: 'Aventus EDP', brand: 'Creed', category: 'mens', scentProfiles: ['fresh', 'fruity'], notes: { top: ['Blackcurrant', 'Pineapple', 'Apple', 'Bergamot'], middle: ['Birch', 'Patchouli', 'Rose', 'Jasmine'], base: ['Musk', 'Oak Moss', 'Ambergris', 'Vanilla'] } },
  { name: 'Silver Mountain Water EDP', brand: 'Creed', category: 'unisex', scentProfiles: ['fresh', 'aquatic'], notes: { top: ['Green Tea', 'Bergamot', 'Mandarin Orange'], middle: ['Blackcurrant', 'Neroli'], base: ['Sandalwood', 'Musk', 'Galbanum'] } },
  { name: 'Aventus for Her EDP', brand: 'Creed', category: 'womens', scentProfiles: ['fresh', 'floral'] },
  { name: 'Green Irish Tweed EDP', brand: 'Creed', category: 'mens', scentProfiles: ['fresh', 'aromatic'] },

  // ── Valentino ──────────────────────────────────────────────────────────────
  { name: 'Born in Roma Intense EDP', brand: 'Valentino', category: 'mens', scentProfiles: ['aromatic', 'woody'], notes: { top: ['Ginger', 'Violet Leaf', 'Bergamot'], middle: ['Sage', 'Lavender'], base: ['Vetiver', 'Patchouli', 'Musk'] } },
  { name: 'Born in Roma EDP', brand: 'Valentino', category: 'mens', scentProfiles: ['fresh', 'aromatic'] },
  { name: 'Voce Viva EDP', brand: 'Valentino', category: 'womens', scentProfiles: ['floral', 'fresh'] },

  // ── Lancome ────────────────────────────────────────────────────────────────
  { name: 'La Vie Est Belle EDP', brand: 'Lancôme', category: 'womens', scentProfiles: ['floral', 'ambery'], notes: { top: ['Blackcurrant', 'Pear'], middle: ['Iris', 'Jasmine', 'Orange Blossom'], base: ['Patchouli', 'Vanilla', 'Praline', 'Musk'] } },
  { name: 'La Nuit Trésor EDP', brand: 'Lancôme', category: 'womens', scentProfiles: ['ambery', 'floral'], notes: { top: ['Bergamot', 'Peach', 'Litchi'], middle: ['Rose', 'Jasmine', 'Orris'], base: ['Vanilla', 'Patchouli', 'Sandalwood'] } },
  { name: 'Idôle EDP', brand: 'Lancôme', category: 'womens', scentProfiles: ['floral', 'fresh'] },

  // ── Carolina Herrera ──────────────────────────────────────────────────────
  { name: 'Good Girl EDP', brand: 'Carolina Herrera', category: 'womens', scentProfiles: ['floral', 'ambery'], notes: { top: ['Almond', 'Coffee'], middle: ['Jasmine', 'Tuberose'], base: ['Tonka Bean', 'Cacao', 'Praline', 'Sandalwood'] } },
  { name: 'Good Girl Supreme EDP', brand: 'Carolina Herrera', category: 'womens', scentProfiles: ['floral', 'ambery'] },
  { name: '212 VIP Rosé EDT', brand: 'Carolina Herrera', category: 'womens', scentProfiles: ['floral', 'fresh'] },

  // ── Viktor & Rolf ─────────────────────────────────────────────────────────
  { name: 'Flowerbomb EDP', brand: 'Viktor & Rolf', category: 'womens', scentProfiles: ['floral', 'ambery'], notes: { top: ['Bergamot', 'Green Tea', 'Osmanthus', 'Freesia'], middle: ['Orchid', 'Rose', 'Cattleya Orchid', 'Jasmine'], base: ['Patchouli', 'Amber', 'Musk'] } },
  { name: 'Spicebomb Extreme EDP', brand: 'Viktor & Rolf', category: 'mens', scentProfiles: ['ambery', 'aromatic'], notes: { top: ['Grapefruit', 'Black Pepper'], middle: ['Tobacco', 'Saffron'], base: ['Vanilla', 'Vetiver', 'Amber'] } },
  { name: 'Spicebomb EDT', brand: 'Viktor & Rolf', category: 'mens', scentProfiles: ['aromatic', 'fresh'] },

  // ── Maison Francis Kurkdjian ──────────────────────────────────────────────
  { name: 'Baccarat Rouge 540 EDP', brand: 'Maison Francis Kurkdjian', category: 'unisex', scentProfiles: ['ambery', 'floral'], notes: { top: ['Saffron', 'Jasmine'], middle: ['Amberwood', 'Ambergris'], base: ['Fir Resin', 'Cedar'] } },
  { name: 'Baccarat Rouge 540 Extrait', brand: 'Maison Francis Kurkdjian', category: 'unisex', scentProfiles: ['ambery', 'floral'] },
  { name: 'Grand Soir EDP', brand: 'Maison Francis Kurkdjian', category: 'unisex', scentProfiles: ['ambery', 'aromatic'] },
  { name: 'Oud Satin Mood EDP', brand: 'Maison Francis Kurkdjian', category: 'unisex', scentProfiles: ['floral', 'ambery'] },

  // ── Givenchy ──────────────────────────────────────────────────────────────
  { name: 'Gentleman Absolute EDP', brand: 'Givenchy', category: 'mens', scentProfiles: ['ambery', 'aromatic'], notes: { top: ['Bergamot', 'Cardamom'], middle: ['Iris', 'Vetiver'], base: ['Vanilla', 'Benzoin'] } },
  { name: 'L\'Interdit EDP', brand: 'Givenchy', category: 'womens', scentProfiles: ['floral', 'fresh'] },
  { name: 'Irresistible EDP', brand: 'Givenchy', category: 'womens', scentProfiles: ['floral', 'fresh'] },

  // ── Hermès ────────────────────────────────────────────────────────────────
  { name: 'Terre d\'Hermès EDP', brand: 'Hermès', category: 'mens', scentProfiles: ['woody', 'aromatic'], notes: { top: ['Orange', 'Grapefruit'], middle: ['Pepper', 'Pelargonium', 'Flint'], base: ['Vetiver', 'Benzoin', 'Cedar'] } },
  { name: 'Terre d\'Hermès EDT', brand: 'Hermès', category: 'mens', scentProfiles: ['woody', 'aromatic'] },
  { name: 'Twilly d\'Hermès EDP', brand: 'Hermès', category: 'womens', scentProfiles: ['floral', 'fresh'] },

  // ── Marc Jacobs ───────────────────────────────────────────────────────────
  { name: 'Daisy EDT', brand: 'Marc Jacobs', category: 'womens', scentProfiles: ['floral', 'fresh'], notes: { top: ['Violet Leaf', 'Strawberry', 'Blood Grapefruit'], middle: ['Violet', 'Jasmine', 'Gardenia'], base: ['White Woods', 'Musk', 'Vanilla'] } },
  { name: 'Daisy Love EDT', brand: 'Marc Jacobs', category: 'womens', scentProfiles: ['floral', 'fresh'] },
  { name: 'Lola EDP', brand: 'Marc Jacobs', category: 'womens', scentProfiles: ['floral', 'fresh'] },

  // ── Calvin Klein ──────────────────────────────────────────────────────────
  { name: 'CK One EDT', brand: 'Calvin Klein', category: 'unisex', scentProfiles: ['fresh', 'aromatic'], notes: { top: ['Bergamot', 'Cardamom', 'Pineapple'], middle: ['Jasmine', 'Lily', 'Iris'], base: ['Musk', 'Amber', 'Sandalwood'] } },
  { name: 'CK Eternity EDP', brand: 'Calvin Klein', category: 'womens', scentProfiles: ['floral', 'fresh'] },
  { name: 'Obsession EDP', brand: 'Calvin Klein', category: 'womens', scentProfiles: ['ambery', 'floral'] },

  // ── Dolce & Gabbana ───────────────────────────────────────────────────────
  { name: 'The One EDP for Men', brand: 'Dolce & Gabbana', category: 'mens', scentProfiles: ['ambery', 'aromatic'], notes: { top: ['Tobacco', 'Grapefruit', 'Coriander'], middle: ['Ginger', 'Cardamom', 'Orange Blossom'], base: ['Cedarwood', 'Amber', 'Musk', 'Vetiver'] } },
  { name: 'Light Blue EDT for Men', brand: 'Dolce & Gabbana', category: 'mens', scentProfiles: ['fresh', 'aromatic'] },
  { name: 'Light Blue EDT for Women', brand: 'Dolce & Gabbana', category: 'womens', scentProfiles: ['fresh', 'floral'] },
  { name: 'The One EDP for Women', brand: 'Dolce & Gabbana', category: 'womens', scentProfiles: ['floral', 'ambery'] },

  // ── Armaf ────────────────────────────────────────────────────────────────
  { name: 'Club de Nuit Intense Man EDT', brand: 'Armaf', category: 'mens', scentProfiles: ['fresh', 'fruity'], notes: { top: ['Lemon', 'Pineapple', 'Apple', 'Blackcurrant'], middle: ['Rose', 'Jasmine', 'Birch'], base: ['Musk', 'Ambergris', 'Vanilla', 'Patchouli'] } },
  { name: 'Club de Nuit Intense Woman EDP', brand: 'Armaf', category: 'womens', scentProfiles: ['floral', 'fresh'] },
  { name: 'Club de Nuit Sillage EDP', brand: 'Armaf', category: 'unisex', scentProfiles: ['fresh', 'ambery'] },
  { name: 'Milestone EDP', brand: 'Armaf', category: 'mens', scentProfiles: ['woody', 'aromatic'] },
  { name: 'Oud Share EDP', brand: 'Armaf', category: 'unisex', scentProfiles: ['woody', 'ambery'] },

  // ── Khadlaj ───────────────────────────────────────────────────────────────
  { name: 'Silver Onyx', brand: 'Khadlaj', category: 'mens', scentProfiles: ['woody', 'ambery'], notes: { top: ['Bergamot'], middle: ['Amber', 'Musk'], base: ['Cedarwood'] } },
  { name: 'Pace EDP', brand: 'Khadlaj', category: 'unisex', scentProfiles: ['woody', 'ambery'] },
  { name: 'Hareem Al Sultan Gold', brand: 'Khadlaj', category: 'womens', scentProfiles: ['ambery', 'floral'] },

  // ── Maison Asrar ─────────────────────────────────────────────────────────
  { name: 'Thriller EDP', brand: 'Maison Asrar', category: 'unisex', scentProfiles: ['ambery', 'floral'], notes: { top: ['Cardamom', 'Saffron'], middle: ['Rose', 'Jasmine'], base: ['Amber', 'Oud', 'Musk'] } },
  { name: 'Dark Fantasy EDP', brand: 'Maison Asrar', category: 'unisex', scentProfiles: ['ambery', 'woody'] },

  // ── Rayhaan ───────────────────────────────────────────────────────────────
  { name: 'Terra EDP', brand: 'Rayhaan', category: 'mens', scentProfiles: ['fresh', 'aromatic'], notes: { top: ['Lemon', 'Bergamot'], middle: ['Green Notes'], base: ['Vetiver'] } },
  { name: 'Oriana EDP', brand: 'Rayhaan', category: 'womens', scentProfiles: ['floral', 'ambery'] },

  // ── Escentric Molecules ───────────────────────────────────────────────────
  { name: 'Molecule 01', brand: 'Escentric Molecules', category: 'unisex', scentProfiles: ['woody', 'fresh'], notes: { base: ['Iso E Super'] } },
  { name: 'Escentric 01', brand: 'Escentric Molecules', category: 'unisex', scentProfiles: ['woody', 'fresh'] },
  { name: 'Molecule 02', brand: 'Escentric Molecules', category: 'unisex', scentProfiles: ['fresh', 'woody'] },

  // ── Le Labo ───────────────────────────────────────────────────────────────
  { name: 'Santal 33 EDP', brand: 'Le Labo', category: 'unisex', scentProfiles: ['woody', 'ambery'], notes: { top: ['Cardamom', 'Iris'], middle: ['Ambrette', 'Sandalwood', 'Cedarwood'], base: ['Leather', 'Amber', 'Musk'] } },
  { name: 'Rose 31 EDP', brand: 'Le Labo', category: 'unisex', scentProfiles: ['floral', 'woody'] },
  { name: 'Another 13 EDP', brand: 'Le Labo', category: 'unisex', scentProfiles: ['fresh', 'woody'] },

  // ── Issey Miyake ──────────────────────────────────────────────────────────
  { name: "L'Eau d'Issey EDT", brand: 'Issey Miyake', category: 'womens', scentProfiles: ['fresh', 'aquatic'] },
  { name: "L'Eau d'Issey pour Homme EDT", brand: 'Issey Miyake', category: 'mens', scentProfiles: ['fresh', 'aquatic'] },

  // ── Al Haramain ───────────────────────────────────────────────────────────
  { name: 'Amber Oud EDP', brand: 'Al Haramain', category: 'unisex', scentProfiles: ['ambery', 'woody'], notes: { top: ['Bergamot', 'Saffron'], middle: ['Rose', 'Oud'], base: ['Amber', 'Vanilla', 'Musk'] } },
  { name: 'L\'Aventure EDP', brand: 'Al Haramain', category: 'mens', scentProfiles: ['fresh', 'aromatic'] },

  // ── Arabian Oud ───────────────────────────────────────────────────────────
  { name: 'Kalemat EDP', brand: 'Arabian Oud', category: 'unisex', scentProfiles: ['ambery', 'floral'] },
  { name: 'Mukhalat Malaki', brand: 'Arabian Oud', category: 'unisex', scentProfiles: ['woody', 'ambery'] },

  // ── Jimmy Choo ────────────────────────────────────────────────────────────
  { name: 'Jimmy Choo Man Ice EDT', brand: 'Jimmy Choo', category: 'mens', scentProfiles: ['fresh', 'aromatic'] },
  { name: 'Jimmy Choo EDP', brand: 'Jimmy Choo', category: 'womens', scentProfiles: ['floral', 'ambery'] },

  // ── Gianni Versace / Parfums de Marly ────────────────────────────────────
  { name: 'Herod EDP', brand: 'Parfums de Marly', category: 'mens', scentProfiles: ['ambery', 'aromatic'], notes: { top: ['Pepper', 'Cinnamon'], middle: ['Tobacco', 'Vanilla Flower'], base: ['Sandalwood', 'Vanilla', 'Guaiac Wood'] } },
  { name: 'Layton EDP', brand: 'Parfums de Marly', category: 'mens', scentProfiles: ['fresh', 'ambery'] },
  { name: 'Percival EDP', brand: 'Parfums de Marly', category: 'unisex', scentProfiles: ['floral', 'ambery'] },
  { name: 'Delina EDP', brand: 'Parfums de Marly', category: 'womens', scentProfiles: ['floral', 'fresh'] },

  // ── Lattafa ───────────────────────────────────────────────────────────────
  { name: 'Khamrah EDP', brand: 'Lattafa', category: 'unisex', scentProfiles: ['ambery', 'aromatic'] },
  { name: 'Yara EDP', brand: 'Lattafa', category: 'womens', scentProfiles: ['floral', 'ambery'] },
  { name: 'Oud for Glory EDP', brand: 'Lattafa', category: 'unisex', scentProfiles: ['woody', 'ambery'] },
];

// Search the local database — returns up to `limit` results matching the query
export function searchPerfumes(query: string, limit = 8): LocalPerfume[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  return PERFUME_DATABASE.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q)
  ).slice(0, limit);
}
