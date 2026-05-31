// vehicleData.js — vehicle data utility for the car loan calculator

export const VEHICLES = [
  // ─── Toyota ───────────────────────────────────────────────────────────────
  {
    make: 'Toyota',
    model: 'Corolla',
    trims: [
      { name: 'LE',  msrp: 22050 },
      { name: 'SE',  msrp: 24260 },
      { name: 'XSE', msrp: 26180 },
      { name: 'XLE', msrp: 27410 },
    ],
    insuranceTier: 'low',
    maintenanceTier: 'low',
  },
  {
    make: 'Toyota',
    model: 'Camry',
    trims: [
      { name: 'LE',  msrp: 28855 },
      { name: 'SE',  msrp: 30910 },
      { name: 'XSE', msrp: 33680 },
      { name: 'XLE', msrp: 35700 },
    ],
    insuranceTier: 'mid',
    maintenanceTier: 'low',
  },
  {
    make: 'Toyota',
    model: 'RAV4',
    trims: [
      { name: 'LE',             msrp: 28975 },
      { name: 'XLE',            msrp: 31275 },
      { name: 'XSE',            msrp: 33600 },
      { name: 'TRD Off-Road',   msrp: 36190 },
    ],
    insuranceTier: 'mid',
    maintenanceTier: 'low',
  },
  {
    make: 'Toyota',
    model: 'Highlander',
    trims: [
      { name: 'L',       msrp: 36420 },
      { name: 'LE',      msrp: 39120 },
      { name: 'XLE',     msrp: 43120 },
      { name: 'Limited', msrp: 49720 },
    ],
    insuranceTier: 'high',
    maintenanceTier: 'low',
  },
  {
    make: 'Toyota',
    model: 'Tacoma',
    trims: [
      { name: 'SR',        msrp: 31500 },
      { name: 'SR5',       msrp: 35115 },
      { name: 'TRD Sport', msrp: 39610 },
      { name: 'Limited',   msrp: 45020 },
    ],
    insuranceTier: 'mid',
    maintenanceTier: 'low',
  },
  {
    make: 'Toyota',
    model: 'Tundra',
    trims: [
      { name: 'SR5',      msrp: 40065 },
      { name: 'Limited',  msrp: 51475 },
      { name: 'Platinum', msrp: 59875 },
    ],
    insuranceTier: 'high',
    maintenanceTier: 'low',
  },
  {
    make: 'Toyota',
    model: 'Prius',
    trims: [
      { name: 'LE',      msrp: 27950 },
      { name: 'XLE',     msrp: 32175 },
      { name: 'Limited', msrp: 36040 },
    ],
    insuranceTier: 'low',
    maintenanceTier: 'low',
  },

  // ─── Honda ────────────────────────────────────────────────────────────────
  {
    make: 'Honda',
    model: 'Civic',
    trims: [
      { name: 'LX',      msrp: 23950 },
      { name: 'Sport',   msrp: 25450 },
      { name: 'EX',      msrp: 27100 },
      { name: 'Touring', msrp: 30700 },
    ],
    insuranceTier: 'low',
    maintenanceTier: 'low',
  },
  {
    make: 'Honda',
    model: 'Accord',
    trims: [
      { name: 'LX',      msrp: 28395 },
      { name: 'Sport',   msrp: 30295 },
      { name: 'EX-L',    msrp: 33895 },
      { name: 'Touring', msrp: 38895 },
    ],
    insuranceTier: 'mid',
    maintenanceTier: 'low',
  },
  {
    make: 'Honda',
    model: 'CR-V',
    trims: [
      { name: 'LX',      msrp: 31410 },
      { name: 'EX',      msrp: 33610 },
      { name: 'EX-L',    msrp: 36410 },
      { name: 'Touring', msrp: 39810 },
    ],
    insuranceTier: 'mid',
    maintenanceTier: 'low',
  },
  {
    make: 'Honda',
    model: 'Pilot',
    trims: [
      { name: 'LX',         msrp: 38050 },
      { name: 'EX-L',       msrp: 43050 },
      { name: 'TrailSport', msrp: 47050 },
      { name: 'Elite',      msrp: 52050 },
    ],
    insuranceTier: 'high',
    maintenanceTier: 'low',
  },
  {
    make: 'Honda',
    model: 'HR-V',
    trims: [
      { name: 'LX',   msrp: 23950 },
      { name: 'Sport', msrp: 26350 },
      { name: 'EX-L',  msrp: 28450 },
    ],
    insuranceTier: 'low',
    maintenanceTier: 'low',
  },

  // ─── Ford ─────────────────────────────────────────────────────────────────
  {
    make: 'Ford',
    model: 'F-150',
    trims: [
      { name: 'XL',         msrp: 34585 },
      { name: 'XLT',        msrp: 40110 },
      { name: 'Lariat',     msrp: 50585 },
      { name: 'King Ranch', msrp: 62545 },
    ],
    insuranceTier: 'high',
    maintenanceTier: 'mid',
  },
  {
    make: 'Ford',
    model: 'Escape',
    trims: [
      { name: 'S',        msrp: 28000 },
      { name: 'SE',       msrp: 30000 },
      { name: 'ST-Line',  msrp: 33000 },
      { name: 'Titanium', msrp: 36500 },
    ],
    insuranceTier: 'mid',
    maintenanceTier: 'mid',
  },
  {
    make: 'Ford',
    model: 'Explorer',
    trims: [
      { name: 'Base',     msrp: 36760 },
      { name: 'XLT',      msrp: 40160 },
      { name: 'ST-Line',  msrp: 43160 },
      { name: 'Limited',  msrp: 49160 },
    ],
    insuranceTier: 'high',
    maintenanceTier: 'mid',
  },
  {
    make: 'Ford',
    model: 'Bronco Sport',
    trims: [
      { name: 'Base',      msrp: 29995 },
      { name: 'Big Bend',  msrp: 32995 },
      { name: 'Badlands',  msrp: 38995 },
    ],
    insuranceTier: 'mid',
    maintenanceTier: 'mid',
  },
  {
    make: 'Ford',
    model: 'Mustang',
    trims: [
      { name: 'EcoBoost',         msrp: 30920 },
      { name: 'EcoBoost Premium', msrp: 37165 },
      { name: 'GT',               msrp: 41660 },
    ],
    insuranceTier: 'high',
    maintenanceTier: 'mid',
  },

  // ─── Chevrolet ────────────────────────────────────────────────────────────
  {
    make: 'Chevrolet',
    model: 'Silverado 1500',
    trims: [
      { name: 'Work Truck', msrp: 35900 },
      { name: 'LT',         msrp: 43900 },
      { name: 'RST',        msrp: 49800 },
      { name: 'LTZ',        msrp: 55200 },
    ],
    insuranceTier: 'high',
    maintenanceTier: 'mid',
  },
  {
    make: 'Chevrolet',
    model: 'Equinox',
    trims: [
      { name: 'LS', msrp: 28900 },
      { name: 'LT', msrp: 31500 },
      { name: 'RS', msrp: 34800 },
    ],
    insuranceTier: 'mid',
    maintenanceTier: 'mid',
  },
  {
    make: 'Chevrolet',
    model: 'Colorado',
    trims: [
      { name: 'Work Truck', msrp: 30400 },
      { name: 'LT',         msrp: 35900 },
      { name: 'Z71',        msrp: 41400 },
    ],
    insuranceTier: 'mid',
    maintenanceTier: 'mid',
  },
  {
    make: 'Chevrolet',
    model: 'Tahoe',
    trims: [
      { name: 'LS',  msrp: 56400 },
      { name: 'LT',  msrp: 62400 },
      { name: 'Z71', msrp: 70400 },
    ],
    insuranceTier: 'high',
    maintenanceTier: 'mid',
  },

  // ─── Ram ──────────────────────────────────────────────────────────────────
  {
    make: 'Ram',
    model: '1500',
    trims: [
      { name: 'Tradesman', msrp: 35840 },
      { name: 'Big Horn',  msrp: 42680 },
      { name: 'Laramie',   msrp: 52780 },
    ],
    insuranceTier: 'high',
    maintenanceTier: 'mid',
  },

  // ─── Jeep ─────────────────────────────────────────────────────────────────
  {
    make: 'Jeep',
    model: 'Grand Cherokee',
    trims: [
      { name: 'Laredo',   msrp: 38100 },
      { name: 'Altitude', msrp: 42100 },
      { name: 'Limited',  msrp: 48100 },
      { name: 'Overland', msrp: 57100 },
    ],
    insuranceTier: 'high',
    maintenanceTier: 'mid',
  },
  {
    make: 'Jeep',
    model: 'Wrangler',
    trims: [
      { name: 'Sport',   msrp: 33895 },
      { name: 'Sahara',  msrp: 43695 },
      { name: 'Rubicon', msrp: 48695 },
    ],
    insuranceTier: 'mid',
    maintenanceTier: 'mid',
  },
  {
    make: 'Jeep',
    model: 'Gladiator',
    trims: [
      { name: 'Sport',    msrp: 38595 },
      { name: 'Overland', msrp: 48595 },
    ],
    insuranceTier: 'mid',
    maintenanceTier: 'mid',
  },

  // ─── Nissan ───────────────────────────────────────────────────────────────
  {
    make: 'Nissan',
    model: 'Altima',
    trims: [
      { name: 'S',  msrp: 25490 },
      { name: 'SV', msrp: 27490 },
      { name: 'SR', msrp: 29490 },
      { name: 'SL', msrp: 32490 },
    ],
    insuranceTier: 'low',
    maintenanceTier: 'mid',
  },
  {
    make: 'Nissan',
    model: 'Rogue',
    trims: [
      { name: 'S',  msrp: 28740 },
      { name: 'SV', msrp: 31040 },
      { name: 'SL', msrp: 36540 },
    ],
    insuranceTier: 'mid',
    maintenanceTier: 'mid',
  },
  {
    make: 'Nissan',
    model: 'Frontier',
    trims: [
      { name: 'S',      msrp: 32160 },
      { name: 'SV',     msrp: 36160 },
      { name: 'Pro-4X', msrp: 42160 },
    ],
    insuranceTier: 'mid',
    maintenanceTier: 'mid',
  },

  // ─── Hyundai ──────────────────────────────────────────────────────────────
  {
    make: 'Hyundai',
    model: 'Elantra',
    trims: [
      { name: 'SE',      msrp: 21500 },
      { name: 'SEL',     msrp: 23500 },
      { name: 'N Line',  msrp: 26500 },
      { name: 'Limited', msrp: 27900 },
    ],
    insuranceTier: 'low',
    maintenanceTier: 'mid',
  },
  {
    make: 'Hyundai',
    model: 'Tucson',
    trims: [
      { name: 'SE',      msrp: 27250 },
      { name: 'SEL',     msrp: 29250 },
      { name: 'N Line',  msrp: 32750 },
      { name: 'Limited', msrp: 36250 },
    ],
    insuranceTier: 'mid',
    maintenanceTier: 'mid',
  },
  {
    make: 'Hyundai',
    model: 'Santa Fe',
    trims: [
      { name: 'SE',      msrp: 33000 },
      { name: 'SEL',     msrp: 36000 },
      { name: 'XRT',     msrp: 39000 },
      { name: 'Limited', msrp: 43000 },
    ],
    insuranceTier: 'mid',
    maintenanceTier: 'mid',
  },

  // ─── Kia ──────────────────────────────────────────────────────────────────
  {
    make: 'Kia',
    model: 'Forte',
    trims: [
      { name: 'LX',      msrp: 20415 },
      { name: 'LXS',     msrp: 22015 },
      { name: 'GT-Line', msrp: 24215 },
      { name: 'GT',      msrp: 26115 },
    ],
    insuranceTier: 'low',
    maintenanceTier: 'mid',
  },
  {
    make: 'Kia',
    model: 'Sportage',
    trims: [
      { name: 'LX',     msrp: 27190 },
      { name: 'S',      msrp: 29690 },
      { name: 'X-Line', msrp: 32690 },
      { name: 'SX',     msrp: 37190 },
    ],
    insuranceTier: 'mid',
    maintenanceTier: 'mid',
  },
  {
    make: 'Kia',
    model: 'Telluride',
    trims: [
      { name: 'LX', msrp: 35590 },
      { name: 'S',  msrp: 38590 },
      { name: 'EX', msrp: 41590 },
      { name: 'SX', msrp: 46590 },
    ],
    insuranceTier: 'high',
    maintenanceTier: 'mid',
  },

  // ─── Subaru ───────────────────────────────────────────────────────────────
  {
    make: 'Subaru',
    model: 'Impreza',
    trims: [
      { name: 'Base',    msrp: 22795 },
      { name: 'Premium', msrp: 25295 },
      { name: 'Sport',   msrp: 27495 },
    ],
    insuranceTier: 'low',
    maintenanceTier: 'low',
  },
  {
    make: 'Subaru',
    model: 'Outback',
    trims: [
      { name: 'Base',          msrp: 28895 },
      { name: 'Premium',       msrp: 31295 },
      { name: 'Onyx Edition',  msrp: 34495 },
      { name: 'Limited',       msrp: 37295 },
    ],
    insuranceTier: 'mid',
    maintenanceTier: 'low',
  },
  {
    make: 'Subaru',
    model: 'Forester',
    trims: [
      { name: 'Base',    msrp: 27995 },
      { name: 'Premium', msrp: 30495 },
      { name: 'Sport',   msrp: 32295 },
      { name: 'Touring', msrp: 36495 },
    ],
    insuranceTier: 'mid',
    maintenanceTier: 'low',
  },

  // ─── Mazda ────────────────────────────────────────────────────────────────
  {
    make: 'Mazda',
    model: 'Mazda3',
    trims: [
      { name: '2.0 S',     msrp: 24400 },
      { name: '2.5 S',     msrp: 27400 },
      { name: '2.5 Turbo', msrp: 32400 },
    ],
    insuranceTier: 'low',
    maintenanceTier: 'low',
  },
  {
    make: 'Mazda',
    model: 'CX-5',
    trims: [
      { name: 'S',             msrp: 28650 },
      { name: 'Select',        msrp: 30650 },
      { name: 'Preferred',     msrp: 33650 },
      { name: 'Grand Touring', msrp: 37650 },
    ],
    insuranceTier: 'mid',
    maintenanceTier: 'low',
  },

  // ─── Tesla ────────────────────────────────────────────────────────────────
  {
    make: 'Tesla',
    model: 'Model 3',
    trims: [
      { name: 'Standard Range', msrp: 38990 },
      { name: 'Long Range',     msrp: 45990 },
      { name: 'Performance',    msrp: 50990 },
    ],
    insuranceTier: 'high',
    maintenanceTier: 'low',
  },
  {
    make: 'Tesla',
    model: 'Model Y',
    trims: [
      { name: 'Standard Range', msrp: 43990 },
      { name: 'Long Range',     msrp: 48990 },
      { name: 'Performance',    msrp: 54990 },
    ],
    insuranceTier: 'high',
    maintenanceTier: 'low',
  },

  // ─── BMW ──────────────────────────────────────────────────────────────────
  {
    make: 'BMW',
    model: '3 Series',
    trims: [
      { name: '330i',  msrp: 44900 },
      { name: 'M340i', msrp: 57900 },
    ],
    insuranceTier: 'luxury',
    maintenanceTier: 'high',
  },
  {
    make: 'BMW',
    model: 'X5',
    trims: [
      { name: 'sDrive40i', msrp: 65900 },
      { name: 'xDrive40i', msrp: 68900 },
    ],
    insuranceTier: 'luxury',
    maintenanceTier: 'high',
  },

  // ─── Mercedes-Benz ────────────────────────────────────────────────────────
  {
    make: 'Mercedes-Benz',
    model: 'C-Class',
    trims: [
      { name: 'C300',    msrp: 47050 },
      { name: 'AMG C43', msrp: 62050 },
    ],
    insuranceTier: 'luxury',
    maintenanceTier: 'high',
  },
  {
    make: 'Mercedes-Benz',
    model: 'GLC',
    trims: [
      { name: 'GLC300',    msrp: 49900 },
      { name: 'AMG GLC43', msrp: 67900 },
    ],
    insuranceTier: 'luxury',
    maintenanceTier: 'high',
  },

  // ─── Audi ─────────────────────────────────────────────────────────────────
  {
    make: 'Audi',
    model: 'A4',
    trims: [
      { name: '40 TFSI', msrp: 40900 },
      { name: '45 TFSI', msrp: 46900 },
      { name: 'S4',      msrp: 55900 },
    ],
    insuranceTier: 'luxury',
    maintenanceTier: 'high',
  },
  {
    make: 'Audi',
    model: 'Q5',
    trims: [
      { name: '45 TFSI', msrp: 46900 },
      { name: 'SQ5',     msrp: 59900 },
    ],
    insuranceTier: 'luxury',
    maintenanceTier: 'high',
  },

  // ─── Volkswagen ───────────────────────────────────────────────────────────
  {
    make: 'Volkswagen',
    model: 'Jetta',
    trims: [
      { name: 'S',   msrp: 21895 },
      { name: 'SE',  msrp: 24895 },
      { name: 'SEL', msrp: 28895 },
    ],
    insuranceTier: 'low',
    maintenanceTier: 'mid',
  },
  {
    make: 'Volkswagen',
    model: 'Tiguan',
    trims: [
      { name: 'S',         msrp: 28895 },
      { name: 'SE',        msrp: 31895 },
      { name: 'SEL',       msrp: 36895 },
      { name: 'SEL R-Line', msrp: 39895 },
    ],
    insuranceTier: 'mid',
    maintenanceTier: 'mid',
  },

  // ─── GMC ──────────────────────────────────────────────────────────────────
  {
    make: 'GMC',
    model: 'Sierra 1500',
    trims: [
      { name: 'Pro', msrp: 36800 },
      { name: 'SLE', msrp: 44800 },
      { name: 'SLT', msrp: 54800 },
    ],
    insuranceTier: 'high',
    maintenanceTier: 'mid',
  },
  {
    make: 'GMC',
    model: 'Terrain',
    trims: [
      { name: 'S',   msrp: 28400 },
      { name: 'SE',  msrp: 30800 },
      { name: 'SLE', msrp: 34800 },
    ],
    insuranceTier: 'mid',
    maintenanceTier: 'mid',
  },

  // ─── Dodge ────────────────────────────────────────────────────────────────
  {
    make: 'Dodge',
    model: 'Charger',
    trims: [
      { name: 'SXT',       msrp: 33095 },
      { name: 'R/T',       msrp: 42095 },
      { name: 'Scat Pack', msrp: 51095 },
    ],
    insuranceTier: 'high',
    maintenanceTier: 'mid',
  },
  {
    make: 'Dodge',
    model: 'Durango',
    trims: [
      { name: 'SXT', msrp: 35000 },
      { name: 'GT',  msrp: 41000 },
      { name: 'R/T', msrp: 47000 },
    ],
    insuranceTier: 'high',
    maintenanceTier: 'mid',
  },
  {
    make: 'Dodge',
    model: 'Dakota',
    trims: [
      { name: 'SXT', msrp: 20000 },
      { name: 'ST',  msrp: 22000 },
      { name: 'R/T', msrp: 25000 },
    ],
    insuranceTier: 'mid',
    maintenanceTier: 'mid',
  },

  // ─── Ford (older / additional) ────────────────────────────────────────────
  {
    make: 'Ford',
    model: 'Explorer (Classic)',
    trims: [
      { name: 'XLS',         msrp: 24500 },
      { name: 'XLT',         msrp: 28500 },
      { name: 'Eddie Bauer', msrp: 34000 },
      { name: 'Limited',     msrp: 38500 },
    ],
    insuranceTier: 'high',
    maintenanceTier: 'mid',
  },
  {
    make: 'Ford',
    model: 'Explorer Sport Trac',
    trims: [
      { name: 'XLS',       msrp: 24000 },
      { name: 'XLT',       msrp: 27500 },
      { name: 'Adrenalin', msrp: 30000 },
      { name: 'Limited',   msrp: 33000 },
    ],
    insuranceTier: 'high',
    maintenanceTier: 'mid',
  },
  {
    make: 'Ford',
    model: 'Ranger',
    trims: [
      { name: 'XL',    msrp: 14000 },
      { name: 'XLT',   msrp: 17500 },
      { name: 'Sport', msrp: 20000 },
    ],
    insuranceTier: 'mid',
    maintenanceTier: 'low',
  },
  {
    make: 'Ford',
    model: 'F-250 Super Duty',
    trims: [
      { name: 'XL',         msrp: 28000 },
      { name: 'XLT',        msrp: 34000 },
      { name: 'Lariat',     msrp: 44000 },
      { name: 'King Ranch', msrp: 54000 },
    ],
    insuranceTier: 'high',
    maintenanceTier: 'high',
  },
  {
    make: 'Ford',
    model: 'Crown Victoria',
    trims: [
      { name: 'Base', msrp: 25000 },
      { name: 'LX',   msrp: 27500 },
    ],
    insuranceTier: 'mid',
    maintenanceTier: 'mid',
  },
  {
    make: 'Ford',
    model: 'Edge',
    trims: [
      { name: 'SE',      msrp: 27000 },
      { name: 'SEL',     msrp: 32000 },
      { name: 'Titanium', msrp: 38000 },
    ],
    insuranceTier: 'mid',
    maintenanceTier: 'mid',
  },
  {
    make: 'Ford',
    model: 'Fusion',
    trims: [
      { name: 'S',       msrp: 22000 },
      { name: 'SE',      msrp: 25000 },
      { name: 'Titanium', msrp: 29000 },
    ],
    insuranceTier: 'low',
    maintenanceTier: 'low',
  },
  {
    make: 'Ford',
    model: 'Maverick',
    trims: [
      { name: 'XL',     msrp: 21000 },
      { name: 'XLT',    msrp: 25000 },
      { name: 'Lariat', msrp: 31000 },
    ],
    insuranceTier: 'mid',
    maintenanceTier: 'low',
  },

  // ─── Chevrolet (older / additional) ──────────────────────────────────────
  {
    make: 'Chevrolet',
    model: 'Trailblazer (Classic)',
    trims: [
      { name: 'LS',  msrp: 26000 },
      { name: 'LT',  msrp: 29000 },
      { name: 'LTZ', msrp: 34000 },
    ],
    insuranceTier: 'high',
    maintenanceTier: 'mid',
  },
  {
    make: 'Chevrolet',
    model: 'Impala',
    trims: [
      { name: 'LS',  msrp: 22000 },
      { name: 'LT',  msrp: 25000 },
      { name: 'LTZ', msrp: 28000 },
    ],
    insuranceTier: 'mid',
    maintenanceTier: 'mid',
  },
  {
    make: 'Chevrolet',
    model: 'Malibu',
    trims: [
      { name: 'LS',  msrp: 21000 },
      { name: 'LT',  msrp: 24000 },
      { name: 'LTZ', msrp: 27000 },
    ],
    insuranceTier: 'low',
    maintenanceTier: 'mid',
  },
  {
    make: 'Chevrolet',
    model: 'Traverse',
    trims: [
      { name: 'LS',  msrp: 28000 },
      { name: 'LT',  msrp: 33000 },
      { name: 'LTZ', msrp: 38000 },
    ],
    insuranceTier: 'mid',
    maintenanceTier: 'mid',
  },
  {
    make: 'Chevrolet',
    model: 'Silverado 2500HD',
    trims: [
      { name: 'Work Truck', msrp: 36000 },
      { name: 'LT',         msrp: 46000 },
      { name: 'LTZ',        msrp: 56000 },
    ],
    insuranceTier: 'high',
    maintenanceTier: 'high',
  },
  {
    make: 'Chevrolet',
    model: 'Avalanche',
    trims: [
      { name: 'LS', msrp: 38000 },
      { name: 'LT', msrp: 43000 },
    ],
    insuranceTier: 'high',
    maintenanceTier: 'mid',
  },

  // ─── Jeep (additional) ────────────────────────────────────────────────────
  {
    make: 'Jeep',
    model: 'Liberty',
    trims: [
      { name: 'Sport',    msrp: 19500 },
      { name: 'Limited',  msrp: 23000 },
      { name: 'Renegade', msrp: 27000 },
    ],
    insuranceTier: 'mid',
    maintenanceTier: 'mid',
  },
  {
    make: 'Jeep',
    model: 'Compass',
    trims: [
      { name: 'Sport',    msrp: 20000 },
      { name: 'Latitude', msrp: 24000 },
      { name: 'Limited',  msrp: 28000 },
    ],
    insuranceTier: 'mid',
    maintenanceTier: 'mid',
  },
  {
    make: 'Jeep',
    model: 'Cherokee',
    trims: [
      { name: 'Latitude',   msrp: 26000 },
      { name: 'Trailhawk',  msrp: 32000 },
      { name: 'Limited',    msrp: 36000 },
    ],
    insuranceTier: 'mid',
    maintenanceTier: 'mid',
  },

  // ─── Nissan (additional) ──────────────────────────────────────────────────
  {
    make: 'Nissan',
    model: 'Pathfinder',
    trims: [
      { name: 'S',  msrp: 33000 },
      { name: 'SV', msrp: 36000 },
      { name: 'SL', msrp: 43000 },
    ],
    insuranceTier: 'high',
    maintenanceTier: 'mid',
  },
  {
    make: 'Nissan',
    model: 'Xterra',
    trims: [
      { name: 'X',      msrp: 23000 },
      { name: 'S',      msrp: 26000 },
      { name: 'Pro-4X', msrp: 31000 },
    ],
    insuranceTier: 'high',
    maintenanceTier: 'mid',
  },
  {
    make: 'Nissan',
    model: 'Titan',
    trims: [
      { name: 'S',      msrp: 36000 },
      { name: 'SV',     msrp: 41000 },
      { name: 'Pro-4X', msrp: 47000 },
    ],
    insuranceTier: 'high',
    maintenanceTier: 'mid',
  },

  // ─── Honda (additional) ───────────────────────────────────────────────────
  {
    make: 'Honda',
    model: 'Odyssey',
    trims: [
      { name: 'LX',      msrp: 32000 },
      { name: 'EX',      msrp: 36000 },
      { name: 'EX-L',    msrp: 42000 },
      { name: 'Touring', msrp: 48000 },
    ],
    insuranceTier: 'mid',
    maintenanceTier: 'low',
  },
  {
    make: 'Honda',
    model: 'Element',
    trims: [
      { name: 'LX', msrp: 21000 },
      { name: 'EX', msrp: 23500 },
    ],
    insuranceTier: 'mid',
    maintenanceTier: 'low',
  },
  {
    make: 'Honda',
    model: 'Ridgeline',
    trims: [
      { name: 'Sport', msrp: 35000 },
      { name: 'RTL',   msrp: 39000 },
      { name: 'RTL-E', msrp: 45000 },
    ],
    insuranceTier: 'mid',
    maintenanceTier: 'low',
  },

  // ─── Toyota (additional) ──────────────────────────────────────────────────
  {
    make: 'Toyota',
    model: '4Runner',
    trims: [
      { name: 'SR5',           msrp: 35000 },
      { name: 'TRD Off-Road',  msrp: 39000 },
      { name: 'Limited',       msrp: 47000 },
      { name: 'TRD Pro',       msrp: 52000 },
    ],
    insuranceTier: 'high',
    maintenanceTier: 'low',
  },
  {
    make: 'Toyota',
    model: 'Sequoia',
    trims: [
      { name: 'SR5',      msrp: 49000 },
      { name: 'Limited',  msrp: 59000 },
      { name: 'Platinum', msrp: 70000 },
    ],
    insuranceTier: 'high',
    maintenanceTier: 'low',
  },
  {
    make: 'Toyota',
    model: 'Sienna',
    trims: [
      { name: 'LE',      msrp: 35000 },
      { name: 'XLE',     msrp: 42000 },
      { name: 'Limited', msrp: 52000 },
    ],
    insuranceTier: 'mid',
    maintenanceTier: 'low',
  },
  {
    make: 'Toyota',
    model: 'FJ Cruiser',
    trims: [
      { name: 'Base',        msrp: 26000 },
      { name: 'Trail Teams', msrp: 30000 },
    ],
    insuranceTier: 'high',
    maintenanceTier: 'mid',
  },

  // ─── GMC (additional) ─────────────────────────────────────────────────────
  {
    make: 'GMC',
    model: 'Yukon',
    trims: [
      { name: 'SLE',    msrp: 52000 },
      { name: 'SLT',    msrp: 59000 },
      { name: 'Denali', msrp: 72000 },
    ],
    insuranceTier: 'high',
    maintenanceTier: 'mid',
  },
  {
    make: 'GMC',
    model: 'Canyon',
    trims: [
      { name: 'Elevation', msrp: 29000 },
      { name: 'AT4',       msrp: 36000 },
    ],
    insuranceTier: 'mid',
    maintenanceTier: 'mid',
  },

  // ─── Cadillac ─────────────────────────────────────────────────────────────
  {
    make: 'Cadillac',
    model: 'Escalade',
    trims: [
      { name: 'Standard',  msrp: 78000 },
      { name: 'ESV',       msrp: 82000 },
      { name: 'Sport',     msrp: 95000 },
    ],
    insuranceTier: 'luxury',
    maintenanceTier: 'luxury',
  },

  // ─── Lincoln ──────────────────────────────────────────────────────────────
  {
    make: 'Lincoln',
    model: 'Navigator',
    trims: [
      { name: 'Standard',    msrp: 77000 },
      { name: 'Reserve',     msrp: 83000 },
      { name: 'Black Label', msrp: 100000 },
    ],
    insuranceTier: 'luxury',
    maintenanceTier: 'luxury',
  },

  // ─── Chrysler ─────────────────────────────────────────────────────────────
  {
    make: 'Chrysler',
    model: '300',
    trims: [
      { name: 'Touring', msrp: 28000 },
      { name: 'S',       msrp: 33000 },
      { name: 'Limited', msrp: 39000 },
    ],
    insuranceTier: 'mid',
    maintenanceTier: 'mid',
  },

  // ─── Buick ────────────────────────────────────────────────────────────────
  {
    make: 'Buick',
    model: 'Enclave',
    trims: [
      { name: 'Preferred', msrp: 43000 },
      { name: 'Essence',   msrp: 48000 },
      { name: 'Avenir',    msrp: 56000 },
    ],
    insuranceTier: 'high',
    maintenanceTier: 'mid',
  },

  // ─── Mitsubishi ───────────────────────────────────────────────────────────
  {
    make: 'Mitsubishi',
    model: 'Outlander',
    trims: [
      { name: 'ES',  msrp: 26000 },
      { name: 'SE',  msrp: 29000 },
      { name: 'SEL', msrp: 34000 },
    ],
    insuranceTier: 'low',
    maintenanceTier: 'mid',
  },

  // ─── Subaru (additional) ──────────────────────────────────────────────────
  {
    make: 'Subaru',
    model: 'Crosstrek',
    trims: [
      { name: 'Base',    msrp: 22000 },
      { name: 'Premium', msrp: 25000 },
      { name: 'Limited', msrp: 29000 },
    ],
    insuranceTier: 'low',
    maintenanceTier: 'low',
  },
  {
    make: 'Subaru',
    model: 'Legacy',
    trims: [
      { name: 'Base',    msrp: 23000 },
      { name: 'Premium', msrp: 25000 },
      { name: 'Limited', msrp: 30000 },
    ],
    insuranceTier: 'low',
    maintenanceTier: 'low',
  },

  // ─── Kia (additional) ─────────────────────────────────────────────────────
  {
    make: 'Kia',
    model: 'Sorento',
    trims: [
      { name: 'LX', msrp: 29000 },
      { name: 'S',  msrp: 32000 },
      { name: 'EX', msrp: 36000 },
      { name: 'SX', msrp: 42000 },
    ],
    insuranceTier: 'mid',
    maintenanceTier: 'mid',
  },
  {
    make: 'Kia',
    model: 'Soul',
    trims: [
      { name: 'LX', msrp: 18000 },
      { name: 'S',  msrp: 20000 },
      { name: 'EX', msrp: 23000 },
    ],
    insuranceTier: 'low',
    maintenanceTier: 'mid',
  },

  // ─── Hyundai (additional) ─────────────────────────────────────────────────
  {
    make: 'Hyundai',
    model: 'Kona',
    trims: [
      { name: 'SE',     msrp: 21000 },
      { name: 'SEL',    msrp: 24000 },
      { name: 'N Line', msrp: 29000 },
    ],
    insuranceTier: 'low',
    maintenanceTier: 'mid',
  },
  {
    make: 'Hyundai',
    model: 'Ioniq 5',
    trims: [
      { name: 'Standard Range', msrp: 41000 },
      { name: 'Long Range',     msrp: 46000 },
      { name: 'AWD',            msrp: 49000 },
    ],
    insuranceTier: 'mid',
    maintenanceTier: 'low',
  },

  // ─── Volkswagen (additional) ──────────────────────────────────────────────
  {
    make: 'Volkswagen',
    model: 'Passat',
    trims: [
      { name: 'S',   msrp: 23000 },
      { name: 'SE',  msrp: 27000 },
      { name: 'SEL', msrp: 32000 },
    ],
    insuranceTier: 'low',
    maintenanceTier: 'mid',
  },
  {
    make: 'Volkswagen',
    model: 'Atlas',
    trims: [
      { name: 'S',   msrp: 34000 },
      { name: 'SE',  msrp: 39000 },
      { name: 'SEL', msrp: 47000 },
    ],
    insuranceTier: 'mid',
    maintenanceTier: 'mid',
  },

  // ─── Mazda (additional) ───────────────────────────────────────────────────
  {
    make: 'Mazda',
    model: 'CX-9',
    trims: [
      { name: 'Sport',     msrp: 35000 },
      { name: 'Touring',   msrp: 40000 },
      { name: 'Signature', msrp: 48000 },
    ],
    insuranceTier: 'mid',
    maintenanceTier: 'low',
  },

  // ─── Rivian ───────────────────────────────────────────────────────────────
  {
    make: 'Rivian',
    model: 'R1T',
    trims: [
      { name: 'Standard', msrp: 67000 },
      { name: 'Large',    msrp: 73000 },
      { name: 'Max',      msrp: 84000 },
    ],
    insuranceTier: 'high',
    maintenanceTier: 'low',
  },
];

// ─── Depreciation ─────────────────────────────────────────────────────────────

/**
 * Cumulative depreciation factor from original MSRP.
 * Multiply the original MSRP by this value to get current market value.
 * Key = years since purchase (0 = brand new).
 */
export const DEPR_FROM_NEW = {
  0: 1.00,
  1: 0.82,
  2: 0.71,
  3: 0.63,
  4: 0.56,
  5: 0.50,
};

/**
 * Annual depreciation rate for year 1 of a new vehicle.
 * Apply once on the full MSRP to step from year 0 → year 1.
 */
export const ANNUAL_DEPR_NEW_Y1 = 0.18;

/**
 * Annual depreciation rate for subsequent years (new vehicles year 2+)
 * and for all years of used vehicles.
 */
export const ANNUAL_DEPR_REST = 0.12;

// ─── Condition Factors ────────────────────────────────────────────────────────

/**
 * Multiplicative adjustment to market value based on vehicle condition.
 * Apply to the depreciated value before presenting to the user.
 */
export const CONDITION_FACTORS = {
  excellent: 1.00,
  good:      0.88,
  fair:      0.76,
  poor:      0.62,
};

// ─── Insurance Cost Ranges ────────────────────────────────────────────────────

/**
 * Annual insurance cost ranges [min, max] in USD by insurance tier.
 * Use the midpoint or a weighted estimate when displaying a single figure.
 */
export const INSURANCE_RANGES = {
  low:    [1000, 1500],
  mid:    [1500, 2200],
  high:   [2200, 3000],
  luxury: [3000, 4800],
};

// ─── Maintenance Cost Ranges ──────────────────────────────────────────────────

/**
 * Annual maintenance cost ranges [min, max] in USD by maintenance tier.
 * Covers routine service (oil changes, tires, brakes, fluids, filters).
 */
export const MAINTENANCE_RANGES = {
  low:    [350,  550],
  mid:    [550,  850],
  high:   [800,  1300],
  luxury: [1200, 2200],
};
