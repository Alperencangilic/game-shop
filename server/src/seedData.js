// Products used by seed.js. Game facts (price, developer, release date,
// requirements, image) come from the Steam store; descriptions are our own.
export const PRODUCTS = [
  {
    title: 'Grand Theft Auto V Enhanced',
    type: 'game',
    genre: 'Action',
    developer: 'Rockstar North',
    publisher: 'Rockstar Games',
    platforms: [
      'Windows'
    ],
    releaseDate: '2025-03-04',
    ageRating: 18,
    price: 4499,
    stock: 40,
    featured: 1,
    popularity: 9,
    imageUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3240220/header.jpg',
    description: 'Open-world crime game set in Los Santos. Follow three criminals through a story full of heists, or play GTA Online with friends.',
    requirements: {
      storageGb: 105,
      minimum: {
        os: 'Windows 10 (latest service pack)',
        cpu: 'Intel Core i7-4770 | AMD FX-9590',
        gpu: 'NVIDIA GeForce GTX 1630 (4GB VRAM) | AMD Radeon RX 6400 (4GB VRAM)',
        ramGb: 8,
        vramGb: 4
      },
      recommended: {
        os: 'Windows 11',
        cpu: 'Intel Core i5-9600K | AMD Ryzen 5 3600',
        gpu: 'NVIDIA GeForce RTX 3060 (8GB VRAM) | AMD Radeon RX 6600XT (8GB VRAM)',
        ramGb: 16,
        vramGb: 8
      }
    }
  },
  {
    title: 'Red Dead Redemption 2',
    type: 'game',
    genre: 'Adventure',
    developer: 'Rockstar Games',
    publisher: 'Rockstar Games',
    platforms: [
      'Windows'
    ],
    releaseDate: '2019-12-05',
    ageRating: 18,
    price: 5999,
    stock: 30,
    featured: 0,
    popularity: 8,
    imageUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1174180/header.jpg',
    description: 'Arthur Morgan and the Van der Linde gang try to survive at the end of the Wild West era. Huge open world and a long story.',
    requirements: {
      storageGb: 150,
      minimum: {
        os: 'Windows 10 - 64-bit',
        cpu: 'Intel Core i5-2500K / AMD FX-6300',
        gpu: 'Nvidia GeForce GTX 770 2GB / AMD Radeon R9 280 3GB',
        ramGb: 8,
        vramGb: 2
      },
      recommended: {
        os: 'Windows 10 - 64-bit',
        cpu: 'Intel Core i7-4770K / AMD Ryzen 5 1500X',
        gpu: 'Nvidia GeForce GTX 1060 6GB / AMD Radeon RX 480 4GB',
        ramGb: 12,
        vramGb: 6
      }
    }
  },
  {
    title: 'ELDEN RING',
    type: 'game',
    genre: 'RPG',
    developer: 'FromSoftware, Inc.',
    publisher: 'FromSoftware, Inc., Bandai Namco Entertainment',
    platforms: [
      'Windows'
    ],
    releaseDate: '2022-02-24',
    ageRating: 16,
    price: 5999,
    stock: 4,
    featured: 1,
    popularity: 9,
    imageUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1245620/f0b19c231f86fa0e633ff88a1a63459443017728/header_alt_assets_3.jpg',
    description: 'Action RPG by FromSoftware set in the Lands Between. Explore an open world, fight hard bosses and build your own character.',
    requirements: {
      storageGb: 60,
      minimum: {
        os: 'Windows 10',
        cpu: 'INTEL CORE I5-8400 or AMD RYZEN 3 3300X',
        gpu: 'NVIDIA GEFORCE GTX 1060 3 GB or AMD RADEON RX 580 4 GB',
        ramGb: 12,
        vramGb: 3
      },
      recommended: {
        os: 'Windows 10/11',
        cpu: 'INTEL CORE I7-8700K or AMD RYZEN 5 3600X',
        gpu: 'NVIDIA GEFORCE GTX 1070 8 GB or AMD RADEON RX VEGA 56 8 GB',
        ramGb: 16,
        vramGb: 8
      }
    }
  },
  {
    title: 'Cyberpunk 2077',
    type: 'game',
    genre: 'RPG',
    developer: 'CD PROJEKT RED',
    publisher: 'CD PROJEKT RED',
    platforms: [
      'Windows',
      'macOS'
    ],
    releaseDate: '2020-12-09',
    ageRating: 18,
    price: 5999,
    stock: 25,
    featured: 1,
    popularity: 8,
    imageUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1091500/e9047d8ec47ae3d94bb8b464fb0fc9e9972b4ac7/header.jpg',
    description: 'Open-world RPG in Night City. Play as V, a mercenary with a dangerous implant, and decide how the story ends.',
    requirements: {
      storageGb: 70,
      minimum: {
        os: '64-bit Windows 10',
        cpu: 'Core i7-6700 or Ryzen 5 1600',
        gpu: 'GeForce GTX 1060 6GB or Radeon RX 580 8GB or Arc A380',
        ramGb: 12,
        vramGb: 6
      },
      recommended: {
        os: '64-bit Windows 10',
        cpu: 'Core i7-12700 or Ryzen 7 7800X3D',
        gpu: 'GeForce RTX 2060 SUPER or Radeon RX 5700 XT or Arc A770',
        ramGb: 16,
        vramGb: 6
      }
    }
  },
  {
    title: 'The Witcher 3: Wild Hunt',
    type: 'game',
    genre: 'RPG',
    developer: 'CD PROJEKT RED',
    publisher: 'CD PROJEKT RED',
    platforms: [
      'Windows'
    ],
    releaseDate: '2015-05-18',
    ageRating: 18,
    price: 4999,
    stock: 35,
    featured: 0,
    popularity: 7,
    imageUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/292030/e8afc4252e3fee8ed2525ab2fd7675cca39aa38d/header_alt_assets_1.jpg',
    description: 'Play as monster hunter Geralt of Rivia and search for Ciri in a big fantasy world. Includes the next-gen update.',
    requirements: {
      storageGb: 50,
      minimum: {
        os: '64-bit Windows 11',
        cpu: 'Core i5-8400 / Ryzen 5 2600',
        gpu: 'GeForce GTX 1660 / Radeon RX 5500 XT 8GB / Arc A580',
        ramGb: 12,
        vramGb: 8
      },
      recommended: {
        os: '64-bit Windows 11',
        cpu: 'Intel Core i7 8700K / AMD Ryzen 5 3600X',
        gpu: 'RTX 2060 Super / AMD Radeon RX 6600 XT / Intel Arc B580',
        ramGb: 16,
        vramGb: 8
      }
    }
  },
  {
    title: 'Baldur\'s Gate 3',
    type: 'game',
    genre: 'RPG',
    developer: 'Larian Studios',
    publisher: 'Larian Studios',
    platforms: [
      'Windows',
      'macOS'
    ],
    releaseDate: '2023-08-03',
    ageRating: 18,
    price: 5999,
    stock: 20,
    featured: 1,
    popularity: 8,
    imageUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1086940/48a2fcbda8565bb45025e98fd8ebde8a7203f6a0/header.jpg',
    description: 'Story-heavy party RPG based on Dungeons & Dragons. Turn-based combat, lots of choices and co-op for up to 4 players.',
    requirements: {
      storageGb: 150,
      minimum: {
        os: 'Windows 10 64-bit',
        cpu: 'Intel I5 4690 / AMD FX 8350 / Snapdragon X Elite',
        gpu: 'Nvidia GTX 970 / RX 480 / Intel Arc A380 / Qualcomm Adreno X1 (4GB+ of VRAM)',
        ramGb: 8,
        vramGb: 4
      },
      recommended: {
        os: 'Windows 10 64-bit',
        cpu: 'Intel i7 8700K / AMD r5 3600',
        gpu: 'Nvidia 2060 Super / RX 5700 XT / Intel Arc A580 (8GB+ of VRAM)',
        ramGb: 16,
        vramGb: 8
      }
    }
  },
  {
    title: 'Hogwarts Legacy',
    type: 'game',
    genre: 'Adventure',
    developer: 'Avalanche Software',
    publisher: 'Warner Bros. Games',
    platforms: [
      'Windows'
    ],
    releaseDate: '2023-02-10',
    ageRating: 16,
    price: 5999,
    stock: 28,
    featured: 0,
    popularity: 7,
    imageUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/990080/be2971b1023bccb04f993887d70ef4d2060262cf/header.jpg',
    description: 'Open-world adventure in the wizarding world of the 1800s. Attend classes at Hogwarts, learn spells and explore the castle.',
    requirements: {
      storageGb: 85,
      minimum: {
        os: '64-bit Windows 10',
        cpu: 'Intel Core i5-6600 (3.3Ghz) or AMD Ryzen 5 1400 (3.2Ghz)',
        gpu: 'NVIDIA GeForce GTX 960 4GB or AMD Radeon RX 470 4GB',
        ramGb: 16,
        vramGb: 4
      },
      recommended: {
        os: '64-bit Windows 10',
        cpu: 'Intel Core i7-8700 (3.2Ghz) or AMD Ryzen 5 3600 (3.6 Ghz)',
        gpu: 'NVIDIA GeForce 1080 Ti or AMD Radeon RX 5700 XT or INTEL Arc A770',
        ramGb: 16,
        vramGb: 4
      }
    }
  },
  {
    title: 'Forza Horizon 5',
    type: 'game',
    genre: 'Racing',
    developer: 'Playground Games',
    publisher: 'Xbox Game Studios',
    platforms: [
      'Windows'
    ],
    releaseDate: '2021-11-08',
    ageRating: 3,
    price: 5999,
    stock: 22,
    featured: 1,
    popularity: 7,
    imageUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1551360/header.jpg',
    description: 'Open-world racing in Mexico with hundreds of cars. Race alone or online and join seasonal festival events.',
    requirements: {
      storageGb: 110,
      minimum: {
        os: 'Windows 10 version 18362.0 or higher',
        cpu: 'Intel i5-4460 or AMD Ryzen 3 1200',
        gpu: 'NVidia GTX 970, AMD RX 470, OR Intel Arc A380',
        ramGb: 8,
        vramGb: 2
      },
      recommended: {
        os: 'Windows 10 version 18362.0 or higher',
        cpu: 'Intel i5-8400 or AMD Ryzen 5 1500X',
        gpu: 'NVidia GTX 1070, AMD RX 590, OR Intel Arc A750',
        ramGb: 16,
        vramGb: 4
      }
    }
  },
  {
    title: 'EA SPORTS FC 26',
    type: 'game',
    genre: 'Sports',
    developer: 'EA Canada, EA Romania',
    publisher: 'Electronic Arts',
    platforms: [
      'Windows'
    ],
    releaseDate: '2025-09-25',
    ageRating: 3,
    price: 6999,
    stock: 50,
    featured: 0,
    popularity: 8,
    imageUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3405690/2d96aa1b06e453cd62dae9029d412f19e61932c3/header.jpg',
    description: 'Football game with real clubs, leagues and players. Includes Career Mode, Ultimate Team and online matches.',
    requirements: {
      storageGb: 100,
      minimum: {
        os: 'Windows 10/11 - 64-Bit (Latest Update).',
        cpu: 'AMD Ryzen 5 1600 or Intel Core i5 6600k',
        gpu: 'AMD RX 570 or Nvidia GTX 1050 Ti',
        ramGb: 8,
        vramGb: 2
      },
      recommended: {
        os: 'Windows 10/11 - 64-Bit (Latest Update).',
        cpu: 'AMD Ryzen 7 2700X or Intel Core i7 6700',
        gpu: 'AMD RX 5600 XT or Nvidia GTX 1660',
        ramGb: 12,
        vramGb: 4
      }
    }
  },
  {
    title: 'Stardew Valley',
    type: 'game',
    genre: 'Simulation',
    developer: 'ConcernedApe',
    publisher: 'ConcernedApe',
    platforms: [
      'Windows',
      'macOS',
      'Linux'
    ],
    releaseDate: '2016-02-26',
    ageRating: 7,
    price: 1499,
    stock: 60,
    featured: 0,
    popularity: 8,
    imageUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/413150/header.jpg',
    description: 'Farming life sim. Grow crops, raise animals, go fishing and make friends in a small town. Supports co-op.',
    requirements: {
      storageGb: 1,
      minimum: {
        os: 'Windows Vista or greater',
        cpu: '2 Ghz',
        gpu: '256 mb video memory, shader model 3.0+',
        ramGb: 2,
        vramGb: 1
      },
      recommended: {
        os: 'Windows 10',
        cpu: '2 GHz',
        gpu: '256 MB video memory, shader model 3.0+',
        ramGb: 4,
        vramGb: 1
      }
    }
  },
  {
    title: 'Hollow Knight',
    type: 'game',
    genre: 'Indie',
    developer: 'Team Cherry',
    publisher: 'Team Cherry',
    platforms: [
      'Windows',
      'macOS',
      'Linux'
    ],
    releaseDate: '2017-02-24',
    ageRating: 7,
    price: 1499,
    stock: 45,
    featured: 0,
    popularity: 6,
    imageUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/367520/3c3489495136b26b34f8a9543c7f5645b99d388c/header.jpg',
    description: 'Hand-drawn 2D action adventure in a ruined underground kingdom of insects, with tough boss fights.',
    requirements: {
      storageGb: 9,
      minimum: {
        os: 'Windows 10 version 21H1 (build 19043) or newer',
        cpu: 'Intel Core i3-3240, AMD FX-4300',
        gpu: 'GeForce GTX 560 Ti (1GB), Radeon HD 7750 (1GB)',
        ramGb: 4,
        vramGb: 1
      },
      recommended: {
        os: 'Windows 10 version 21H1 (build 19043) or newer',
        cpu: 'Intel Core i5-3470',
        gpu: 'GeForce GTX 1050 (2GB), Radeon R9 380 (2GB)',
        ramGb: 8,
        vramGb: 2
      }
    }
  },
  {
    title: 'Terraria',
    type: 'game',
    genre: 'Indie',
    developer: 'Re-Logic',
    publisher: 'Re-Logic',
    platforms: [
      'Windows',
      'macOS',
      'Linux'
    ],
    releaseDate: '2011-05-16',
    ageRating: 12,
    price: 999,
    stock: 80,
    featured: 0,
    popularity: 7,
    imageUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/105600/header.jpg',
    description: '2D sandbox game about digging, building and fighting. Craft items and beat bosses alone or with friends.',
    requirements: {
      storageGb: 1,
      minimum: {
        os: 'Windows 7 / 8 / 10',
        cpu: 'Dual core 2.0 GHz',
        gpu: '128 MB video memory, Shader Model 2.0+',
        ramGb: 3,
        vramGb: 1
      },
      recommended: {
        os: 'Windows 10 / 11',
        cpu: 'Dual core 3.0 GHz',
        gpu: '256 MB video memory, Shader Model 2.0+',
        ramGb: 4,
        vramGb: 1
      }
    }
  },
  {
    title: 'It Takes Two',
    type: 'game',
    genre: 'Adventure',
    developer: 'Hazelight Studios',
    publisher: 'Electronic Arts',
    platforms: [
      'Windows'
    ],
    releaseDate: '2021-03-25',
    ageRating: 12,
    price: 3999,
    stock: 18,
    featured: 0,
    popularity: 6,
    imageUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1426210/header.jpg',
    description: 'Co-op only adventure for two players with new mechanics in every level. A friend can join for free with Friend\'s Pass.',
    requirements: {
      storageGb: 50,
      minimum: {
        os: 'Windows 8.1 64-bit or Windows 10 64-bit',
        cpu: 'Intel Core i3-2100T or AMD FX 6100',
        gpu: 'Nvidia GeForce GTX 660 or AMD R7 260x',
        ramGb: 8,
        vramGb: 2
      },
      recommended: {
        os: 'Windows 8.1 64-bit or Windows 10 64-bit',
        cpu: 'Intel Core i5 3570K or AMD Ryzen 3 1300x',
        gpu: 'Nvidia GeForce GTX 980 or AMD R9 290X',
        ramGb: 16,
        vramGb: 4
      }
    }
  },
  {
    title: 'Euro Truck Simulator 2',
    type: 'game',
    genre: 'Simulation',
    developer: 'SCS Software',
    publisher: 'SCS Software',
    platforms: [
      'Windows',
      'macOS',
      'Linux'
    ],
    releaseDate: '2012-10-12',
    ageRating: 3,
    price: 1999,
    stock: 55,
    featured: 0,
    popularity: 6,
    imageUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/227300/4f6ff00d3732ed0da2e28a4e7182f0036df8ab90/header_alt_assets_8.jpg',
    description: 'Drive trucks across Europe, deliver cargo and grow your own transport company.',
    requirements: {
      storageGb: 25,
      minimum: {
        os: 'Windows 10 64-bit',
        cpu: 'Intel Core i5-6400 or AMD Ryzen 3 1200 or similar',
        gpu: 'NVIDIA GeForce GTX 660 or AMD Radeon RX 460 or Intel HD 630 (2GB VRAM)',
        ramGb: 8,
        vramGb: 2
      },
      recommended: {
        os: 'Windows 10 64-bit',
        cpu: 'Intel Core i5-9600 or AMD Ryzen 5 3600 or similar',
        gpu: 'NVIDIA GeForce GTX 1660 or AMD Radeon RX 590 (2GB VRAM)',
        ramGb: 12,
        vramGb: 2
      }
    }
  },
  {
    title: 'Rust',
    type: 'game',
    genre: 'Survival',
    developer: 'Facepunch Studios',
    publisher: 'Facepunch Studios',
    platforms: [
      'Windows',
      'macOS'
    ],
    releaseDate: '2018-02-08',
    ageRating: 18,
    price: 3999,
    stock: 33,
    featured: 0,
    popularity: 6,
    imageUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/252490/header.jpg',
    description: 'Multiplayer survival game. Gather resources, build a base and defend it against other players.',
    requirements: {
      storageGb: 45,
      minimum: {
        os: 'Windows 11 64bit',
        cpu: 'AMD Ryzen 5 1400 or Intel Core i5-6600',
        gpu: 'AMD Radeon RX 470, NVIDIA GeForce GTX 1060, Intel Arc A580',
        ramGb: 12,
        vramGb: 2
      },
      recommended: {
        os: 'Windows 11 64bit',
        cpu: 'AMD Ryzen 7 3700X or Intel Core i7-6700K',
        gpu: 'AMD Radeon RX 6600XT, NVIDIA GeForce RTX 3060, Intel Arc B580',
        ramGb: 16,
        vramGb: 4
      }
    }
  },
  {
    title: 'Sea of Thieves',
    type: 'game',
    genre: 'Adventure',
    developer: 'Rare Ltd',
    publisher: 'Xbox Game Studios',
    platforms: [
      'Windows'
    ],
    releaseDate: '2020-06-03',
    ageRating: 12,
    price: 3999,
    stock: 26,
    featured: 0,
    popularity: 5,
    imageUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1172620/579c6d544424019a032f4add98e8f923925c1cef/header.jpg',
    description: 'Pirate adventure with your crew. Sail ships, dig up treasure and fight skeletons and other players.',
    requirements: {
      storageGb: 100,
      minimum: {
        os: 'Windows 10 version 18362.0 or higher',
        cpu: 'Intel i3 4170 @ 3.7 GHz or AMD FX-6300 @ 3.5 GHz',
        gpu: 'Nvidia GeForce GTX 660 or AMD Radeon R9 270',
        ramGb: 8,
        vramGb: 2
      },
      recommended: {
        os: 'Windows 10 64-bit',
        cpu: 'Intel i7 4790 @4Ghz - AMD Ryzen 5 1600 @3.6Ghz',
        gpu: 'Nvidia Geforce GTX 1080ti - AMD Radeon Rx Vega 64 - Intel A750',
        ramGb: 16,
        vramGb: 4
      }
    }
  },
  {
    title: 'Black Myth: Wukong',
    type: 'game',
    genre: 'Action',
    developer: 'Game Science',
    publisher: 'Game Science',
    platforms: [
      'Windows'
    ],
    releaseDate: '2024-08-19',
    ageRating: 16,
    price: 5999,
    stock: 0,
    featured: 0,
    popularity: 7,
    imageUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2358720/header.jpg',
    description: 'Action RPG based on Chinese mythology and Journey to the West. Play as the Destined One and fight huge bosses.',
    requirements: {
      storageGb: 130,
      minimum: {
        os: 'Windows 10 64-bit',
        cpu: 'Intel Core i5-8400 / AMD Ryzen 5 1600',
        gpu: 'NVIDIA GeForce GTX 1060 6GB / AMD Radeon RX 580 8GB',
        ramGb: 16,
        vramGb: 6
      },
      recommended: {
        os: 'Windows 10 64-bit',
        cpu: 'Intel Core i7-9700 / AMD Ryzen 5 5500',
        gpu: 'NVIDIA GeForce RTX 2060 / AMD Radeon RX 5700 XT / INTEL Arc A750',
        ramGb: 16,
        vramGb: 6
      }
    }
  },
  {
    title: 'Palworld',
    type: 'game',
    genre: 'Survival',
    developer: 'Pocketpair',
    publisher: 'Pocketpair',
    platforms: [
      'Windows'
    ],
    releaseDate: '2026-07-09',
    ageRating: 12,
    price: 2999,
    stock: 38,
    featured: 0,
    popularity: 6,
    imageUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1623730/6912f19c43a95ff5fe514eedd35e68bf12335459/header.jpg',
    description: 'Survival crafting game where you catch creatures called Pals and use them to fight, build and work at your base.',
    requirements: {
      storageGb: 40,
      minimum: {
        os: 'Windows 10 (64-Bit)',
        cpu: 'Intel Core i5-9400F',
        gpu: 'GeForce GTX 1660',
        ramGb: 16,
        vramGb: 2
      },
      recommended: {
        os: 'Windows 11 (64-Bit)',
        cpu: 'Intel Core i5-12400 / AMD Ryzen 5 5600X',
        gpu: 'GeForce RTX 3060 Ti / Radeon RX 6700 XT',
        ramGb: 32,
        vramGb: 4
      }
    }
  },
  {
    title: 'Dead by Daylight',
    type: 'game',
    genre: 'Horror',
    developer: 'Behaviour Interactive Inc.',
    publisher: 'Behaviour Interactive Inc.',
    platforms: [
      'Windows'
    ],
    releaseDate: '2016-06-14',
    ageRating: 18,
    price: 1999,
    stock: 40,
    featured: 0,
    popularity: 5,
    imageUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/381210/23fed9f741423413769ad1617e41519d1a466cdc/header_alt_assets_10.jpg',
    description: 'Asymmetric multiplayer horror: one killer hunts four survivors who try to escape.',
    requirements: {
      storageGb: 50,
      minimum: {
        os: 'Windows 10 64-bit Operating System',
        cpu: 'Intel Core i3-4170 or AMD FX-8120',
        gpu: 'DX11 Compatible GeForce GTX 460 1GB or AMD HD 6850 1GB',
        ramGb: 8,
        vramGb: 1
      },
      recommended: {
        os: 'Windows 10 64-bit Operating System',
        cpu: 'Intel Core i3-4170 or AMD FX-8300 or higher',
        gpu: 'DX11 Compatible GeForce 760 or AMD HD 8800 or higher with 4GB of RAM',
        ramGb: 8,
        vramGb: 4
      }
    }
  },
  {
    title: 'Hades',
    type: 'game',
    genre: 'Indie',
    developer: 'Supergiant Games',
    publisher: 'Supergiant Games',
    platforms: [
      'Windows',
      'macOS'
    ],
    releaseDate: '2020-09-17',
    ageRating: 12,
    price: 2499,
    stock: 2,
    featured: 0,
    popularity: 6,
    imageUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1145360/header.jpg',
    description: 'Roguelike dungeon crawler. Play as Zagreus and try to escape the Underworld; every run is different.',
    requirements: {
      storageGb: 15,
      minimum: {
        os: 'Windows 7 SP1',
        cpu: 'Dual Core 2.4 GHz',
        gpu: '1GB VRAM / DirectX 10+ support',
        ramGb: 4,
        vramGb: 1
      },
      recommended: {
        os: 'Windows 7 SP1',
        cpu: 'Dual Core 3.0 GHz+',
        gpu: '2GB VRAM / DirectX 10+ support',
        ramGb: 8,
        vramGb: 2
      }
    }
  },
  {
    title: 'Among Us',
    type: 'game',
    genre: 'Casual',
    developer: 'Innersloth',
    publisher: 'Innersloth',
    platforms: [
      'Windows'
    ],
    releaseDate: '2018-11-16',
    ageRating: 7,
    price: 499,
    stock: 100,
    featured: 0,
    popularity: 7,
    imageUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/945360/header.jpg',
    description: 'Party game for 4-15 players. Crewmates finish tasks while impostors try to sabotage the ship.',
    requirements: {
      storageGb: 1,
      minimum: {
        os: 'Windows 10 x32bit',
        cpu: 'INTEL i3-4330',
        gpu: 'INTEL HD Graphics 4600',
        ramGb: 1,
        vramGb: 2
      },
      recommended: {
        os: 'Windows 10 x64bit',
        cpu: 'INTEL i3-4330',
        gpu: 'Nvidia GTX 650',
        ramGb: 4,
        vramGb: 4
      }
    }
  },
  {
    title: 'Resident Evil 4',
    type: 'game',
    genre: 'Horror',
    developer: 'CAPCOM Co., Ltd.',
    publisher: 'CAPCOM Co., Ltd.',
    platforms: [
      'Windows'
    ],
    releaseDate: '2023-03-23',
    ageRating: 18,
    price: 3999,
    stock: 0,
    featured: 0,
    popularity: 6,
    imageUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2050650/header.jpg',
    description: 'Remake of the 2005 survival horror classic. Leon S. Kennedy travels to rural Europe to rescue the president\'s daughter.',
    requirements: {
      storageGb: 67,
      minimum: {
        os: 'Windows 10 (64 bit)',
        cpu: 'AMD Ryzen 3 1200 / Intel Core i5-7500',
        gpu: 'AMD Radeon RX 560 with 4GB VRAM / NVIDIA GeForce GTX 1050 Ti with 4GB VRAM',
        ramGb: 8,
        vramGb: 4
      },
      recommended: {
        os: 'Windows 10 (64 bit)/Windows 11 (64 bit)',
        cpu: 'AMD Ryzen 5 3600 / Intel Core i7 8700',
        gpu: 'AMD Radeon RX 5700 / NVIDIA GeForce GTX 1070',
        ramGb: 16,
        vramGb: 4
      }
    }
  },
  {
    title: 'Marvel\'s Spider-Man Remastered',
    type: 'game',
    genre: 'Action',
    developer: 'Insomniac Games, Nixxes Software',
    publisher: 'PlayStation Publishing LLC',
    platforms: [
      'Windows'
    ],
    releaseDate: '2022-08-12',
    ageRating: 16,
    price: 5999,
    stock: 24,
    featured: 0,
    popularity: 6,
    imageUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1817070/header.jpg',
    description: 'Swing through Marvel\'s New York as Peter Parker. Includes the main story and The City That Never Sleeps DLC.',
    requirements: {
      storageGb: 75,
      minimum: {
        os: 'Windows 10 64-bit',
        cpu: 'Intel Core i3-4160, 3.6 GHz or AMD equivalent',
        gpu: 'NVIDIA GTX 950 or AMD Radeon RX 470',
        ramGb: 8,
        vramGb: 2
      },
      recommended: {
        os: 'Windows 10 64-bit',
        cpu: 'Intel Core i5-4670, 3.4 Ghz or AMD Ryzen5 1600, 3.2 Ghz',
        gpu: 'NVIDIA GTX 1060 6GB or AMD Radeon RX 580 8GB',
        ramGb: 16,
        vramGb: 6
      }
    }
  },
  {
    title: 'Sekiro: Shadows Die Twice',
    type: 'game',
    genre: 'Action',
    developer: 'FromSoftware, Inc.',
    publisher: 'Activision',
    platforms: [
      'Windows'
    ],
    releaseDate: '2019-03-21',
    ageRating: 18,
    price: 5999,
    stock: 15,
    featured: 0,
    popularity: 5,
    imageUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/814380/header.jpg',
    description: 'Action adventure by FromSoftware set in Sengoku-era Japan, with precise sword fights and difficult bosses.',
    requirements: {
      storageGb: 25,
      minimum: {
        os: 'Windows 7 64-bit | Windows 8 64-bit | Windows 10 64-bit',
        cpu: 'Intel Core i3-2100 | AMD FX-6300',
        gpu: 'NVIDIA GeForce GTX 760 | AMD Radeon HD 7950',
        ramGb: 4,
        vramGb: 2
      },
      recommended: {
        os: 'Windows 7 64-bit | Windows 8 64-bit | Windows 10 64-bit',
        cpu: 'Intel Core i5-2500K | AMD Ryzen 5 1400',
        gpu: 'NVIDIA GeForce GTX 970 | AMD Radeon RX 570',
        ramGb: 8,
        vramGb: 4
      }
    }
  },
  {
    title: 'The Elder Scrolls V: Skyrim Special Edition',
    type: 'game',
    genre: 'RPG',
    developer: 'Bethesda Game Studios',
    publisher: 'Bethesda Softworks',
    platforms: [
      'Windows'
    ],
    releaseDate: '2016-10-27',
    ageRating: 18,
    price: 3999,
    stock: 30,
    featured: 0,
    popularity: 6,
    imageUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/489830/header.jpg',
    description: 'Open-world fantasy RPG. Explore Skyrim, fight dragons and choose your own path. Includes the official add-ons.',
    requirements: {
      storageGb: 12,
      minimum: {
        os: 'Windows 7/8.1/10 (64-bit Version)',
        cpu: 'Intel i5-750/AMD Phenom II X4-945',
        gpu: 'NVIDIA GTX 470 1GB /AMD HD 7870 2GB',
        ramGb: 8,
        vramGb: 1
      },
      recommended: {
        os: 'Windows 7/8.1/10 (64-bit Version)',
        cpu: 'Intel i5-2400/AMD FX-8320',
        gpu: 'NVIDIA GTX 780 3GB /AMD R9 290 4GB',
        ramGb: 8,
        vramGb: 3
      }
    }
  },
  {
    title: 'Minecraft: Java & Bedrock Edition',
    type: 'game',
    genre: 'Survival',
    developer: 'Mojang Studios',
    publisher: 'Xbox Game Studios',
    platforms: [
      'Windows',
      'macOS',
      'Linux'
    ],
    releaseDate: '2011-11-18',
    ageRating: 7,
    price: 2999,
    stock: 65,
    featured: 1,
    popularity: 9,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Minecraft_Key-art.png/960px-Minecraft_Key-art.png',
    description: 'Sandbox game about building with blocks. Mine resources, survive the night and build anything. Includes Java and Bedrock editions for PC.',
    requirements: {
      storageGb: 4,
      minimum: {
        os: 'Windows 10',
        cpu: 'Intel Core i3-3210 / AMD A8-7600',
        gpu: 'Intel HD Graphics 4000 / AMD Radeon R5',
        ramGb: 4,
        vramGb: 1
      },
      recommended: {
        os: 'Windows 10 / 11',
        cpu: 'Intel Core i5-4690 / AMD A10-7800',
        gpu: 'GeForce 700 series / AMD Radeon Rx 200 series',
        ramGb: 8,
        vramGb: 2
      }
    }
  },
  {
    title: 'Valorant 475 VP',
    type: 'epin',
    genre: 'Game Currency',
    developer: 'Riot Games',
    publisher: 'Riot Games',
    platforms: [
      'Windows'
    ],
    releaseDate: '2020-06-02',
    ageRating: 16,
    price: 499,
    stock: 120,
    featured: 0,
    popularity: 9,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Valorant_logo_-_pink_color_version.svg/960px-Valorant_logo_-_pink_color_version.svg.png',
    description: '475 Valorant Points for your Riot account. Use VP to buy weapon skins and the battle pass.',
    requirements: null
  },
  {
    title: 'Valorant 1000 VP',
    type: 'epin',
    genre: 'Game Currency',
    developer: 'Riot Games',
    publisher: 'Riot Games',
    platforms: [
      'Windows'
    ],
    releaseDate: '2020-06-02',
    ageRating: 16,
    price: 999,
    stock: 90,
    featured: 0,
    popularity: 9,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Valorant_logo_-_pink_color_version.svg/960px-Valorant_logo_-_pink_color_version.svg.png',
    description: '1000 Valorant Points (950 + 50 bonus) for your Riot account.',
    requirements: null
  },
  {
    title: 'Valorant 2050 VP',
    type: 'epin',
    genre: 'Game Currency',
    developer: 'Riot Games',
    publisher: 'Riot Games',
    platforms: [
      'Windows'
    ],
    releaseDate: '2020-06-02',
    ageRating: 16,
    price: 1999,
    stock: 3,
    featured: 0,
    popularity: 7,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Valorant_logo_-_pink_color_version.svg/960px-Valorant_logo_-_pink_color_version.svg.png',
    description: '2050 Valorant Points (1900 + 150 bonus) for your Riot account.',
    requirements: null
  },
  {
    title: 'League of Legends 575 RP',
    type: 'epin',
    genre: 'Game Currency',
    developer: 'Riot Games',
    publisher: 'Riot Games',
    platforms: [
      'Windows',
      'macOS'
    ],
    releaseDate: '2009-10-27',
    ageRating: 12,
    price: 499,
    stock: 110,
    featured: 0,
    popularity: 8,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/League_of_Legends_2019_vector.svg/960px-League_of_Legends_2019_vector.svg.png',
    description: '575 Riot Points for League of Legends. Use RP for champions, skins and event passes.',
    requirements: null
  },
  {
    title: 'League of Legends 1380 RP',
    type: 'epin',
    genre: 'Game Currency',
    developer: 'Riot Games',
    publisher: 'Riot Games',
    platforms: [
      'Windows',
      'macOS'
    ],
    releaseDate: '2009-10-27',
    ageRating: 12,
    price: 1099,
    stock: 75,
    featured: 0,
    popularity: 8,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/League_of_Legends_2019_vector.svg/960px-League_of_Legends_2019_vector.svg.png',
    description: '1380 Riot Points for League of Legends.',
    requirements: null
  },
  {
    title: 'League of Legends 2800 RP',
    type: 'epin',
    genre: 'Game Currency',
    developer: 'Riot Games',
    publisher: 'Riot Games',
    platforms: [
      'Windows',
      'macOS'
    ],
    releaseDate: '2009-10-27',
    ageRating: 12,
    price: 2199,
    stock: 40,
    featured: 0,
    popularity: 6,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/League_of_Legends_2019_vector.svg/960px-League_of_Legends_2019_vector.svg.png',
    description: '2800 Riot Points for League of Legends.',
    requirements: null
  },
  {
    title: 'PUBG Mobile 60 UC',
    type: 'epin',
    genre: 'Game Currency',
    developer: 'Level Infinite',
    publisher: 'Level Infinite',
    platforms: [
      'Mobile'
    ],
    releaseDate: '2018-03-19',
    ageRating: 16,
    price: 99,
    stock: 200,
    featured: 0,
    popularity: 7,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/PUBG_Mobile_simple_logo_black.svg/960px-PUBG_Mobile_simple_logo_black.svg.png',
    description: '60 Unknown Cash for PUBG MOBILE. Redeem it with your player ID on the official redeem page.',
    requirements: null
  },
  {
    title: 'PUBG Mobile 325 UC',
    type: 'epin',
    genre: 'Game Currency',
    developer: 'Level Infinite',
    publisher: 'Level Infinite',
    platforms: [
      'Mobile'
    ],
    releaseDate: '2018-03-19',
    ageRating: 16,
    price: 499,
    stock: 150,
    featured: 0,
    popularity: 8,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/PUBG_Mobile_simple_logo_black.svg/960px-PUBG_Mobile_simple_logo_black.svg.png',
    description: '325 Unknown Cash (300 + 25 bonus) for PUBG MOBILE.',
    requirements: null
  },
  {
    title: 'PUBG Mobile 660 UC',
    type: 'epin',
    genre: 'Game Currency',
    developer: 'Level Infinite',
    publisher: 'Level Infinite',
    platforms: [
      'Mobile'
    ],
    releaseDate: '2018-03-19',
    ageRating: 16,
    price: 999,
    stock: 80,
    featured: 0,
    popularity: 7,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/PUBG_Mobile_simple_logo_black.svg/960px-PUBG_Mobile_simple_logo_black.svg.png',
    description: '660 Unknown Cash (600 + 60 bonus) for PUBG MOBILE.',
    requirements: null
  },
  {
    title: 'Fortnite 1000 V-Bucks',
    type: 'epin',
    genre: 'Game Currency',
    developer: 'Epic Games',
    publisher: 'Epic Games',
    platforms: [
      'Windows',
      'Mobile'
    ],
    releaseDate: '2017-07-21',
    ageRating: 12,
    price: 899,
    stock: 100,
    featured: 0,
    popularity: 7,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Fortnite_logo_padded.svg/960px-Fortnite_logo_padded.svg.png',
    description: '1000 V-Bucks code. Redeem it on your Epic Games account to buy outfits and the battle pass.',
    requirements: null
  },
  {
    title: 'Fortnite 2800 V-Bucks',
    type: 'epin',
    genre: 'Game Currency',
    developer: 'Epic Games',
    publisher: 'Epic Games',
    platforms: [
      'Windows',
      'Mobile'
    ],
    releaseDate: '2017-07-21',
    ageRating: 12,
    price: 2299,
    stock: 50,
    featured: 0,
    popularity: 5,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Fortnite_logo_padded.svg/960px-Fortnite_logo_padded.svg.png',
    description: '2800 V-Bucks code for Fortnite.',
    requirements: null
  },
  {
    title: 'Counter-Strike 2 Prime Status Upgrade',
    type: 'epin',
    genre: 'Add-on',
    developer: 'Valve',
    publisher: 'Valve',
    platforms: [
      'Windows',
      'Linux'
    ],
    releaseDate: '2023-09-27',
    ageRating: 18,
    price: 1499,
    stock: 60,
    featured: 0,
    popularity: 9,
    imageUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/730/162664aa5da85f418105350c5d67ca565f6c3713/header.jpg',
    description: 'Upgrades your Counter-Strike 2 account to Prime. Prime players are matched with other Prime players and can get item drops.',
    requirements: null
  },
  {
    title: 'Apex Legends 1000 Apex Coins',
    type: 'epin',
    genre: 'Game Currency',
    developer: 'Electronic Arts',
    publisher: 'Electronic Arts',
    platforms: [
      'Windows'
    ],
    releaseDate: '2019-02-04',
    ageRating: 16,
    price: 999,
    stock: 70,
    featured: 0,
    popularity: 5,
    imageUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1172470/60fcaedb88ccf94df30281533d828b86c6ffb9b6/header_alt_assets_5.jpg',
    description: '1000 Apex Coins for Apex Legends on PC. Use them for skins and the battle pass.',
    requirements: null
  },
  {
    title: 'Steam Wallet Code $20',
    type: 'epin',
    genre: 'Gift Card',
    developer: 'Valve',
    publisher: 'Valve',
    platforms: [
      'Windows',
      'macOS',
      'Linux'
    ],
    releaseDate: '2003-09-12',
    ageRating: 3,
    price: 2000,
    stock: 100,
    featured: 0,
    popularity: 8,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Steam_icon_logo.svg/960px-Steam_icon_logo.svg.png',
    description: 'Adds $20 to your Steam Wallet. Can be used for games, DLC and in-game items on Steam.',
    requirements: null
  },
  {
    title: 'Steam Wallet Code $50',
    type: 'epin',
    genre: 'Gift Card',
    developer: 'Valve',
    publisher: 'Valve',
    platforms: [
      'Windows',
      'macOS',
      'Linux'
    ],
    releaseDate: '2003-09-12',
    ageRating: 3,
    price: 5000,
    stock: 40,
    featured: 0,
    popularity: 6,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Steam_icon_logo.svg/960px-Steam_icon_logo.svg.png',
    description: 'Adds $50 to your Steam Wallet.',
    requirements: null
  },
  {
    title: 'Roblox 800 Robux',
    type: 'epin',
    genre: 'Game Currency',
    developer: 'Roblox Corporation',
    publisher: 'Roblox Corporation',
    platforms: [
      'Windows',
      'macOS',
      'Mobile'
    ],
    releaseDate: '2006-09-01',
    ageRating: 7,
    price: 999,
    stock: 90,
    featured: 0,
    popularity: 7,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Roblox_Logo_2022.svg/960px-Roblox_Logo_2022.svg.png',
    description: '800 Robux for your Roblox account. Use it for avatar items and game passes.',
    requirements: null
  }
];
