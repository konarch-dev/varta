const path = require('path');
const dotenv = require('dotenv');
const crypto = require('crypto');

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const { prisma } = require(path.resolve(__dirname, '../dist/index.js'));

const VERIFIED_VIDEOS = [
  {
    url: 'https://vjs.zencdn.net/v/oceans.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
    mimeType: 'video/mp4',
    sizeBytes: 15400000,
    width: 1280,
    height: 720,
  },
  {
    url: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80',
    mimeType: 'video/mp4',
    sizeBytes: 8400000,
    width: 854,
    height: 480,
  },
  {
    url: 'https://filesamples.com/samples/video/mp4/sample_960x540.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80',
    mimeType: 'video/mp4',
    sizeBytes: 4200000,
    width: 960,
    height: 540,
  },
  {
    url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800&auto=format&fit=crop&q=80',
    mimeType: 'video/mp4',
    sizeBytes: 3100000,
    width: 640,
    height: 360,
  },
];

const STATE_GROUPS = [
  {
    name: 'VARTA | Mana Andhra',
    slug: 'varta-mana-andhra',
    description: 'The official Andhra Pradesh community on VARTA! Celebrating Telugu heritage, Visakhapatnam coastal tech, Amaravati growth, Tirumala Tirupati spirituality, Kuchipudi arts, and Andhra cuisine.',
    category: 'India Trends',
    avatarUrl: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=800&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=1200&auto=format&fit=crop&q=80',
    posts: [
      {
        content: 'శుభోదయం ఆంధ్రప్రదేశ్! Visakhapatnam is rapidly emerging as a leading IT, fintech, and port hub on the eastern seaboard. The coastline and skyline are evolving beautifully! 🌊🚀 #ManaAndhra #Vizag #AndhraPradesh #IndiaTrends',
        mediaUrl: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=1000&auto=format&fit=crop&q=80',
      },
      {
        content: 'Tirumala Tirupati Devasthanam: Experiencing the divine calmness and world-class pilgrim amenities at the sacred Seven Hills. Om Namo Venkateshaya! 🛕🙏 #Tirupati #SpiritualAndhra #ManaAndhra',
        mediaUrl: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=1000&auto=format&fit=crop&q=80',
      },
      {
        content: 'From fiery Guntur chillies and spicy Gongura Pachadi to delicate Bandar Laddu and Rayalaseema Ragi Sankati—Andhra cuisine is unmatched in flavor! What is your favorite dish? 🌶️🍲 #AndhraFood #ManaAndhra',
        mediaUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=1000&auto=format&fit=crop&q=80',
      },
      {
        content: 'Kuchipudi classical dance—centuries of grace, expression, and story-telling rooted in Krishna district. Proud of our living classical heritage! 💃✨ #Kuchipudi #TeluguCulture #ManaAndhra',
        isVideo: true,
      },
    ],
    comments: [
      'Vizag tech park infrastructure is expanding so fast! Proud of Andhra development 🚀',
      'Tirupati darshan arrangements have been seamless. Divine experience 🙏',
      'Nothing beats hot rice with spicy Gongura pickle and pure ghee! 😋',
    ],
  },
  {
    name: 'VARTA | Arunachal Voices',
    slug: 'varta-arunachal-voices',
    description: 'Land of the Dawn-Lit Mountains! Connecting Arunachal Pradesh across 26 major indigenous tribes, Tawang Monastery, scenic Ziro Valley, biodiversity hotspots, and Eastern frontier development.',
    category: 'India Trends',
    avatarUrl: 'https://images.unsplash.com/photo-1626014303757-646734d6739b?w=800&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80',
    posts: [
      {
        content: 'First rays of the sun touching the snow-kissed peaks of Arunachal Pradesh! Witnessing morning prayer chants echo through the 400-year-old Tawang Monastery. Breathtaking serenity 🏔️🌅 #ArunachalVoices #Tawang #IncredibleIndia',
        mediaUrl: 'https://images.unsplash.com/photo-1626014303757-646734d6739b?w=1000&auto=format&fit=crop&q=80',
      },
      {
        content: 'Ziro Valley: Home to the Apatani tribe, world-renowned organic paddy-fish cultivation, and the soulful Ziro Festival of Music. Pure harmony with nature! 🌾🎶 #ZiroValley #ArunachalPradesh #EcoTourism',
        mediaUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1000&auto=format&fit=crop&q=80',
      },
      {
        content: 'The frontier highway network across Arunachal is unlocking remote valleys, empowering local homestays, and bolstering national security. New India in action! 🛣️🇮🇳 #Infrastructure #ArunachalVoices',
        isVideo: true,
      },
      {
        content: 'Preserving our indigenous languages, bamboo architecture, and handwoven tribal textiles across 26 tribes. Unity in immense diversity! 🧵🎋 #TribalHeritage #ArunachalVoices',
        mediaUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1000&auto=format&fit=crop&q=80',
      },
    ],
    comments: [
      'Tawang in the winter snowfall looks straight out of a fairy tale! ❄️🏔️',
      'Ziro Festival of Music is on my bucket list this autumn. Magical vibes!',
      'Road connectivity to the border villages has improved drastically. Great work!',
    ],
  },
  {
    name: 'VARTA | Axom Xomaj',
    slug: 'varta-axom-xomaj',
    description: 'The vibrant heart of Assam! Celebrating Rongali Bihu rhythms, Kaziranga one-horned rhinos, lush emerald tea estates, the mighty Brahmaputra, Sualkuchi golden Muga silk, and Guwahati innovation.',
    category: 'India Trends',
    avatarUrl: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1571536802807-30451e3955d8?w=1200&auto=format&fit=crop&q=80',
    posts: [
      {
        content: 'ৰঙালী বিহুৰ আন্তৰিক ওলগ জনালোঁ! The dhol and pepa beats resonate across the Brahmaputra valley. May this season bring bountiful harvests and joy to every home! 🪘🌾 #AxomXomaj #RongaliBihu #AssamPride',
        mediaUrl: 'https://images.unsplash.com/photo-1571536802807-30451e3955d8?w=1000&auto=format&fit=crop&q=80',
      },
      {
        content: 'Early morning safari in Kaziranga National Park: spotted the majestic Greater One-Horned Rhinoceros grazing peacefully in the mist. Conservation success story of India! 🦏🌿 #Kaziranga #WildlifeIndia #AxomXomaj',
        isVideo: true,
      },
      {
        content: 'Sipping fresh, aromatic first-flush Assam orthodox tea right by the rolling emerald slopes of Upper Assam. The world drinks what Assam grows! ☕🍃 #AssamTea #ChaiLovers #AxomXomaj',
        mediaUrl: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1000&auto=format&fit=crop&q=80',
      },
      {
        content: 'Guwahati is rapidly becoming the commercial and startup gateway to Southeast Asia under the Act East policy. Tech, waterways, and infrastructure taking flight! 🚀🚢 #Guwahati #ActEast #AxomXomaj',
        mediaUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1000&auto=format&fit=crop&q=80',
      },
    ],
    comments: [
      'Bihu celebrations always bring so much joy and nostalgic energy! 🪘',
      'Assam tea garden mornings are heavenly. Nothing compares to the freshness!',
      'Kaziranga conservation team deserves salute for protecting the rhinos 🦏',
    ],
  },
  {
    name: 'VARTA | Apna Bihar',
    slug: 'varta-apna-bihar',
    description: "The sacred land of Nalanda, Mahavira, and Buddha! Celebrating Bihar's intellectual powerhouse, Madhubani art, Chhath Puja devotion, Litti Chokha delicacies, and energetic youth entrepreneurship.",
    category: 'India Trends',
    avatarUrl: 'https://images.unsplash.com/photo-1600100397608-f010f443b353?w=800&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1200&auto=format&fit=crop&q=80',
    posts: [
      {
        content: 'जय छठी मइया! The four days of Mahaparv Chhath bring unmatched discipline, purity, and environmental reverence as millions offer arghya to the setting and rising Sun. 🙏🌅 #ApnaBihar #ChhathPuja #BiharCulture',
        mediaUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1000&auto=format&fit=crop&q=80',
      },
      {
        content: 'Walking through the revitalized Nalanda Mahavihara—where scholars from across Asia gathered to study philosophy, astronomy, and science 1500 years ago. Pure intellectual pride! 🏛️📚 #Nalanda #ApnaBihar #Heritage',
        mediaUrl: 'https://images.unsplash.com/photo-1600100397608-f010f443b353?w=1000&auto=format&fit=crop&q=80',
      },
      {
        content: 'Authentic roasted Litti stuffed with spiced sattu, served with smoked baingan chokha and melting desi ghee. The king of comfort foods! 🍲🔥 #LittiChokha #BihariCuisine #ApnaBihar',
        isVideo: true,
      },
      {
        content: 'Bihar youth are spearheading top startups, competitive exams, and grassroots civil engineering projects across the nation. The powerhouse of perseverance! 💪🇮🇳 #BiharYouth #ApnaBihar',
        mediaUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1000&auto=format&fit=crop&q=80',
      },
    ],
    comments: [
      'Chhath Puja ghat devotion is something that leaves everyone teary-eyed 🙏',
      'Litti Chokha on a winter evening is pure emotion! 😋',
      'The new Nalanda University campus revival is truly a global milestone 🏛️',
    ],
  },
  {
    name: 'VARTA | Mor Chhattisgarh',
    slug: 'varta-mor-chhattisgarh',
    description: 'धान का कटोरा (The Rice Bowl of India)! Bastar tribal handicrafts, Chitrakote "Niagara of India", dense Sal forests, cleanest state awards, and rich Chhattisgarhi folk traditions.',
    category: 'India Trends',
    avatarUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80',
    posts: [
      {
        content: 'जय जोहार छत्तीसगढ़! Chitrakote Waterfalls in full monsoon glory—the horse-shoe shaped cascade on the Indravati river is rightly known as India’s Niagara. 🌊✨ #MorChhattisgarh #Chitrakote #Bastar',
        mediaUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000&auto=format&fit=crop&q=80',
      },
      {
        content: 'Bastar Bell Metal (Dhokra) art and terracotta crafts created by indigenous artisans are winning global accolades. Centuries of metallurgy preserved with love! 🏺⚒️ #BastarArt #Dhokra #MorChhattisgarh',
        mediaUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1000&auto=format&fit=crop&q=80',
      },
      {
        content: 'Raipur & Naya Raipur: setting national benchmarks for urban planning, smart logistics, green corridors, and cleanest cities. Sustainable modernization! 🏙️🌿 #CleanRaipur #ChhattisgarhDevelopment',
        isVideo: true,
      },
      {
        content: 'A bowl of warm Chila with spicy tomato-garlic chutney and Fara—the quintessential morning breakfast in every Chhattisgarhi home. Pure desi taste! 🥞😋 #ChhattisgarhFlavors #MorChhattisgarh',
        mediaUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=1000&auto=format&fit=crop&q=80',
      },
    ],
    comments: [
      'Chitrakote waterfall roar during August is an unforgettable experience! 🌊',
      'Dhokra art in Bastar is world-class. Supported 2 local tribal sculptors recently!',
      'Naya Raipur green avenues are very well organized 🌿',
    ],
  },
  {
    name: 'VARTA | Goemkar Connect',
    slug: 'varta-goemkar-connect',
    description: 'The definitive voice of Goa! Konkani heritage, vibrant festivals (Shigmo, Sao Joao), UNESCO churches of Old Goa, beach life, cashew feni traditions, and emerging tech remote work hubs.',
    category: 'India Trends',
    avatarUrl: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=1200&auto=format&fit=crop&q=80',
    posts: [
      {
        content: 'Deu Boro Dis! Morning cycle ride through the colorful heritage houses and cobblestone lanes of Fontainhas, Panaji. The architectural charm of Old Goa is timeless 🚲🏡 #GoemkarConnect #GoaHeritage #Panaji',
        mediaUrl: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=1000&auto=format&fit=crop&q=80',
      },
      {
        content: 'Shigmo festival fervor: Folk dances, vibrant temple processions, and the rhythmic beat of the dhol-tasha echoing through the villages. Goa beyond just beaches! 🥁🎭 #Shigmo #GoanCulture #GoemkarConnect',
        isVideo: true,
      },
      {
        content: 'Fresh catch of the day: Spicy fish curry thali with red rice, fried pomfret, and a refreshing glass of kokum solkadhi. Heaven on a banana leaf! 🐟🍛 #GoanCuisine #Solkadhi #GoemkarConnect',
        mediaUrl: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=1000&auto=format&fit=crop&q=80',
      },
      {
        content: 'Goa is evolving into India’s preferred creative nomad and startup ecosystem. Clean sea air, fast fiber, and productive community spaces! 💻🌊 #DigitalNomad #TechGoa #GoemkarConnect',
        mediaUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1000&auto=format&fit=crop&q=80',
      },
    ],
    comments: [
      'Fontainhas in Panaji has that vintage Portuguese colonial warmth! 🏡',
      'Goan fish thali with solkadhi is unmatched anywhere along the coast 🍛',
      'Remote working from South Goa has doubled my productivity and peace of mind 🌊',
    ],
  },
  {
    name: 'VARTA | Aapnu Gujarat',
    slug: 'varta-aapnu-gujarat',
    description: 'જય જય ગરવી ગુજરાત! Vibrant entrepreneurship, GIFT City international finance hub, Statue of Unity, 9 nights of Navratri Garba, Rann of Kutch white desert, and iconic Gujarati cuisine.',
    category: 'India Trends',
    avatarUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=1200&auto=format&fit=crop&q=80',
    posts: [
      {
        content: 'જય શ્રી કૃષ્ણ! GIFT City Gandhinagar is rewriting global financial services with IFSC banking, aircraft leasing, and fintech innovation. Gujarat leading the trillion-dollar dream! 🏙️💼 #AapnuGujarat #GIFTCity #VibrantGujarat',
        mediaUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1000&auto=format&fit=crop&q=80',
      },
      {
        content: 'The sound of wooden dandiyas colliding under the starlit sky! Nothing in the world rivals the 9-day energy and devotion of Navratri in Gujarat. 💃🎶 #Navratri #Garba #AapnuGujarat',
        isVideo: true,
      },
      {
        content: 'Standing before the Statue of Unity at Kevadia—182 meters of sheer national pride honoring Sardar Vallabhbhai Patel. An engineering marvel on the Narmada! 🇮🇳🗿 #StatueOfUnity #SardarPatel #AapnuGujarat',
        mediaUrl: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=1000&auto=format&fit=crop&q=80',
      },
      {
        content: 'Fafda, Jalebi, piping hot Khaman Dhokla, and Kadhi on a Sunday morning. Gujarati culinary tradition makes everyone smile! 😋🥨 #GujaratiFood #FafdaJalebi #AapnuGujarat',
        mediaUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1000&auto=format&fit=crop&q=80',
      },
    ],
    comments: [
      'GIFT City infra feels like Singapore right here in Gujarat! 🚀',
      'The Navratri Garba vibes in Vadodara and Ahmedabad are unforgettable 💃',
      'Sunday morning fafda jalebi queue is sacred ritual! 😄',
    ],
  },
  {
    name: 'VARTA | Apna Haryana',
    slug: 'varta-apna-haryana',
    description: 'दूध-दही का खाना, नंबर वन हरियाणा! The sports cradle of India producing Olympic medalists, Gurugram cyber hub, fertile agricultural belt, Haryanvi music beats, and warm community brotherhood.',
    category: 'India Trends',
    avatarUrl: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=800&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop&q=80',
    posts: [
      {
        content: 'म्हारा हरियाणा! From wrestling akhadas in Rohtak to Olympic podiums in Paris and Tokyo—Haryana athletes consistently raise the tricolor high! Proud sporting state! 🤼‍♂️🥇 #ApnaHaryana #DhaakadHaryana #SportsCapital',
        mediaUrl: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=1000&auto=format&fit=crop&q=80',
      },
      {
        content: 'Gurugram Cyber Hub: Home to Fortune 500 headquarters, unicorn startups, and futuristic mobility corridors. Haryana’s economic engine firing on all cylinders! 🏙️💻 #Gurugram #HaryanaTrends #TechIndia',
        mediaUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1000&auto=format&fit=crop&q=80',
      },
      {
        content: 'Makkhan and freshly churned lassi with Bajre ki Roti and Sarson ka Saag on a winter afternoon in the village chaupal. Pure goodness! 🥛🫓 #HaryanaFood #DesiKhaana #ApnaHaryana',
        isVideo: true,
      },
      {
        content: 'Haryana’s farmers adopting micro-irrigation, solar tube-wells, and direct seeded rice (DSR) techniques. Modern agritech meets deep agrarian wisdom! 🌾🚜 #KisanBharat #Agritech #ApnaHaryana',
        mediaUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1000&auto=format&fit=crop&q=80',
      },
    ],
    comments: [
      'Haryana athletes bring the real fire to the Olympics! Dhakad state 💪🥇',
      'Gurugram Cyber Hub nightlife and tech meetings are electric 🏙️',
      'Fresh white makkhan with Bajre ki roti is the ultimate power meal 🥛',
    ],
  },
  {
    name: 'VARTA | Devbhoomi Himachal',
    slug: 'varta-devbhoomi-himachal',
    description: 'The Abode of Gods! Pristine Himalayan heights, Shimla colonial heritage, Manali alpine valleys, Spiti cold desert, apple orchards, Kinnauri shawls, and sustainable mountain living.',
    category: 'India Trends',
    avatarUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&auto=format&fit=crop&q=80',
    posts: [
      {
        content: 'Morning greetings from the snow-clad peaks of Himachal Pradesh! The pine-scented air and stillness of the mountains are the purest rejuvenation for the soul 🏔️❄️ #DevbhoomiHimachal #HimachalPradesh #Pahadi',
        mediaUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1000&auto=format&fit=crop&q=80',
      },
      {
        content: 'Spiti Valley expedition: Crossing Kunzum Pass into the high-altitude cold desert with 1000-year-old Key Monastery perched against the barren mountains. Unearthly beauty! 🌌🏍️ #SpitiValley #Himachal #RoadTrip',
        isVideo: true,
      },
      {
        content: 'Harvest season in Kotgarh and Kinnaur: Plucking juicy, crisp Royal Delicious Himachal apples. Golden sunshine trapped inside sweet mountain fruit! 🍎🌿 #HimachalApples #Orchards #DevbhoomiHimachal',
        mediaUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1000&auto=format&fit=crop&q=80',
      },
      {
        content: 'A traditional Himachali Dham served on leaf plates—Madra, Khatta, Mah ki dal, and Meetha. Celebrations in the hills are incomplete without this feast! 🍲😋 #HimachaliDham #PahadiFood #DevbhoomiHimachal',
        mediaUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=1000&auto=format&fit=crop&q=80',
      },
    ],
    comments: [
      'The morning mist over Rohtang and Solang valley is pure peace 🏔️',
      'Himachali Dham cooked by traditional Boti chefs is out of this world!',
      'Spiti stargazing at night shows the entire Milky Way clearly ✨',
    ],
  },
  {
    name: 'VARTA | Johar Jharkhand',
    slug: 'varta-johar-jharkhand',
    description: 'जोहार झारखंड! Land of forests, waterfalls of Ranchi (Hundru, Jonha), Parasnath sacred peak, Sarhul flower festival, vibrant tribal music, steel city Jamshedpur, and cricket legend MS Dhoni.',
    category: 'India Trends',
    avatarUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80',
    posts: [
      {
        content: 'जोहार! Celebrating Sarhul festival with Sal tree blossoms, traditional Mandar drum beats, and community joy across Jharkhand. Nature worship at its purest! 🌸🥁 #JoharJharkhand #Sarhul #TribalHeritage',
        mediaUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1000&auto=format&fit=crop&q=80',
      },
      {
        content: 'Jamshedpur: India’s first planned industrial city built with visionary green cover, world-class sports academies, and steel manufacturing pride. Tatanagar shines! 🏭🌳 #Jamshedpur #SteelCity #JoharJharkhand',
        isVideo: true,
      },
      {
        content: 'Hundru and Dassam Falls cascading down the Subarnarekha river plateau after the rains. The natural water parks of Ranchi are a treat for travelers! 🌊🍃 #RanchiWaterfalls #JharkhandTourism #JoharJharkhand',
        mediaUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000&auto=format&fit=crop&q=80',
      },
      {
        content: 'Dhuska served with spicy chana curry and mutton curry—the beloved street delicacy of Jharkhand that warms every heart. Crisp on the outside, soft inside! 🫓🍲 #Dhuska #JharkhandFlavors #JoharJharkhand',
        mediaUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1000&auto=format&fit=crop&q=80',
      },
    ],
    comments: [
      'Sarhul flower blossoms celebrate our deepest bond with mother nature 🌸',
      'Jamshedpur Jubilee Park and clean roads are so well maintained 🌳',
      'Hot Dhuska with chana dal aloo ghugni on a rainy day in Ranchi is bliss!',
    ],
  },
  {
    name: 'VARTA | Namma Karnataka',
    slug: 'varta-namma-karnataka',
    description: 'ಸಿರಿಗನ್ನಡಂ ಗೆಲ್ಗೆ! Silicon Valley of India (Bengaluru), royal Mysore Dasara, architectural wonders of Hampi & Belur, lush Coorg coffee plantations, Yakshagana theater, and Kannada pride.',
    category: 'India Trends',
    avatarUrl: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=1200&auto=format&fit=crop&q=80',
    posts: [
      {
        content: 'ನಮಸ್ಕಾರ ಕರ್ನಾಟಕ! Bengaluru continues to power India’s digital destiny as the deep-tech, AI, and aerospace startup nucleus of the nation. Code, innovate, and conquer! 💻🚀 #NammaKarnataka #BengaluruTech #StartupCity',
        mediaUrl: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=1000&auto=format&fit=crop&q=80',
      },
      {
        content: 'Walking among the ruins of the Vijayanagara Empire in Hampi. The stone chariot, Vittala Temple musical pillars, and Tungabhadra river boulders are awe-inspiring! 🛕✨ #Hampi #HeritageKarnataka #NammaKarnataka',
        mediaUrl: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=1000&auto=format&fit=crop&q=80',
      },
      {
        content: 'Crispy Benne Dosa from Davanagere, piping hot Bisi Bele Bath, and a tumbler of aromatic Chikmagalur filter coffee. The holy trinity of Karnataka breakfasts! ☕🥞 #KarnatakaFood #FilterCoffee #NammaKarnataka',
        isVideo: true,
      },
      {
        content: 'Mysuru Dasara: The majestic golden Ambari procession and 100,000 bulbs illuminating Mysore Palace. Royal grandeur that captures the imagination of the world! 🐘👑 #MysoreDasara #KarnatakaPride #NammaKarnataka',
        mediaUrl: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=1000&auto=format&fit=crop&q=80',
      },
    ],
    comments: [
      'Bengaluru weather + hot filter coffee = absolute perfection ☕🌧️',
      'Hampi Vittala temple stone chariot architecture leaves me speechless every visit!',
      'Mysuru Dasara lighting is royal splendour at its peak 👑',
    ],
  },
  {
    name: 'VARTA | Nammude Keralam',
    slug: 'varta-nammude-keralam',
    description: "കേരളത്തിലേക്ക് സ്വാഗതം! God's Own Country. Serene Alleppey houseboats, Munnar tea mist, Onam celebrations, Kathakali and Theyyam rituals, Ayurvedic rejuvenation, and coastal harmony.",
    category: 'India Trends',
    avatarUrl: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?w=1200&auto=format&fit=crop&q=80',
    posts: [
      {
        content: 'നമസ്കാരം! Drifting through the tranquil Vembanad backwaters on a traditional Kettuvallam houseboat as kingfishers dive into the emerald waters. Pure poetry in motion 🌴🛶 #NammudeKeralam #KeralaBackwaters #GodsOwnCountry',
        mediaUrl: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?w=1000&auto=format&fit=crop&q=80',
      },
      {
        content: 'The divine, fiery presence of a Theyyam ritual in North Malabar: centuries of folklore, sacred energy, and hypnotic chenda drum beats under the banyan trees. 👺🔥 #Theyyam #KeralaCulture #NammudeKeralam',
        isVideo: true,
      },
      {
        content: 'Grand Onasadya on a banana leaf: 26 vegetarian delicacies from crispy banana chips (upperi) to sweet pradhaman and avial. A culinary symphony of balance! 🍃🍛 #Onam #KeralaSadya #NammudeKeralam',
        mediaUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=1000&auto=format&fit=crop&q=80',
      },
      {
        content: 'Kochi-Muziris Biennale: South Asia’s premier contemporary art exhibition bringing global artists, poets, and thinkers to the historic warehouses of Fort Kochi. 🎨🌊 #KochiBiennale #ArtAndCulture #NammudeKeralam',
        mediaUrl: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1000&auto=format&fit=crop&q=80',
      },
    ],
    comments: [
      'Alleppey backwaters at sunrise are the definition of serenity 🛶',
      'The sheer energy of Theyyam in Kannur gives you genuine goosebumps 🔥',
      'Onasadya payasam and avial is the tastiest feast on the planet 🍛',
    ],
  },
  {
    name: 'VARTA | Apna Madhya Pradesh',
    slug: 'varta-apna-madhya-pradesh',
    description: "हिंदुस्तान का दिल! Indore (India's cleanest city 7x), Bhopal city of lakes, Kanha & Bandhavgarh tiger sanctuaries, Khajuraho temple carvings, Ujjain Mahakal Lok, and Sanchi Stupa.",
    category: 'India Trends',
    avatarUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1561047029-3000c68339ca?w=1200&auto=format&fit=crop&q=80',
    posts: [
      {
        content: 'जय महाकाल! Ujjain Mahakal Lok corridor: experiencing the divine aura along the holy Kshipra river with mesmerizing evening aarti and ancient cosmic energy. 🙏✨ #Mahakal #Ujjain #ApnaMadhyaPradesh',
        mediaUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1000&auto=format&fit=crop&q=80',
      },
      {
        content: 'Indore does it again! 7 consecutive years as India’s cleanest city. The civic pride, door-to-door waste segregation, and community ownership are an inspiration! 🏙️🧹 #CleanestCity #IndorePride #ApnaMadhyaPradesh',
        isVideo: true,
      },
      {
        content: 'Midnight food stroll at Sarafa Bazaar and 56 Dukan: steaming hot Poha-Jalebi with Sev, Bhutte ka Kees, and Garadu. Indore is truly food paradise! 😋🍲 #IndoriFood #Sarafa #ApnaMadhyaPradesh',
        mediaUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1000&auto=format&fit=crop&q=80',
      },
      {
        content: 'Tiger State of India! Madhya Pradesh is home to over 780 Royal Bengal Tigers across Kanha, Pench, and Bandhavgarh. Wildlife conservation at its greatest! 🐅🌿 #TigerState #WildlifeMadhyaPradesh #IncredibleIndia',
        mediaUrl: 'https://images.unsplash.com/photo-1561047029-3000c68339ca?w=1000&auto=format&fit=crop&q=80',
      },
    ],
    comments: [
      'Mahakal Lok corridor at night is extraordinarily peaceful and magnificent 🙏',
      'Indore street food at 1 AM in Sarafa is an unmatched experience 🍲',
      'Spotted a tigress with three cubs in Bandhavgarh! Truly Incredible India 🐅',
    ],
  },
  {
    name: 'VARTA | Aapla Maharashtra',
    slug: 'varta-aapla-maharashtra',
    description: 'जय महाराष्ट्र! Maximum City Mumbai, Oxford of the East Pune, Chhatrapati Shivaji Maharaj forts, grand Ganesh Utsav celebrations, Lavani folk beats, Sahyadri monsoon treks, and industrial might.',
    category: 'India Trends',
    avatarUrl: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1200&auto=format&fit=crop&q=80',
    posts: [
      {
        content: 'गणपती बाप्पा मोरया! The roar of the dhol-tasha pathaks during Ganeshotsav in Pune and Lalbaugcha Raja in Mumbai brings goosebumps like nothing else in the world. 🥁🌺 #Ganeshotsav #AaplaMaharashtra #Bappa',
        mediaUrl: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=1000&auto=format&fit=crop&q=80',
      },
      {
        content: 'Trekking to Rajgad and Raigad forts in the Sahyadri mountains during the monsoon. Standing where Chhatrapati Shivaji Maharaj forged the dream of Swarajya! 🚩⚔️ #ShivajiMaharaj #Sahyadri #AaplaMaharashtra',
        isVideo: true,
      },
      {
        content: 'Hot Misal Pav served with spicy tarri, crunchy farsan, chopped onions, and lemon in Kolhapur and Pune. Pair it with a Mumbai Vada Pav for the ultimate feast! 🌶️🍞 #MisalPav #VadaPav #MaharashtraFood',
        mediaUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1000&auto=format&fit=crop&q=80',
      },
      {
        content: 'Mumbai Coastal Road and Atal Setu: transformed connectivity uniting the Mumbai Metropolitan Region. Maharashtra continues to anchor India’s economic superpower rise! 🌉🚗 #MumbaiInfrastructure #AaplaMaharashtra',
        mediaUrl: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1000&auto=format&fit=crop&q=80',
      },
    ],
    comments: [
      'Ganeshotsav dhol tasha beats give you pure energy! Jai Maharashtra 🚩',
      'The drive on Atal Setu over Mumbai harbor cut my travel time by 1 hour 🌉',
      'Kolhapuri misal with extra rassa is the supreme breakfast test of bravery 🌶️',
    ],
  },
  {
    name: 'VARTA | Manipur Voices',
    slug: 'varta-manipur-voices',
    description: 'The Jewel of India! Loktak Lake and floating Phumdis, Keibul Lamjao national park (home to Sangai deer), classical Manipuri Raas Leela, boxing champions, and handloom craftsmanship.',
    category: 'India Trends',
    avatarUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80',
    posts: [
      {
        content: 'Loktak Lake: The only floating national park on Earth! Cruising past the circular green phumdis while catching a glimpse of the rare and graceful dancing Sangai deer. 🦌🌊 #ManipurVoices #LoktakLake #KeibulLamjao',
        mediaUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000&auto=format&fit=crop&q=80',
      },
      {
        content: 'Manipuri classical Raas Leela dance: The delicate footwork, tubular mirrors, and devotional Vaishnavite Radha-Krishna compositions represent sublime Indian art. 💃🪞 #ManipuriDance #ClassicalIndia #ManipurVoices',
        isVideo: true,
      },
      {
        content: 'Ima Keithel (Mother’s Market) in Imphal: A multi-century-old all-women operated commercial market empowering thousands of local women entrepreneurs. Inspiring legacy! 🧺👩‍🌾 #ImaKeithel #WomenEmpowerment #ManipurVoices',
        mediaUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1000&auto=format&fit=crop&q=80',
      },
      {
        content: 'The sports cradle: From boxing and weightlifting legends to traditional polo (Sagol Kangjei), Manipur’s athletes have etched India’s name across world podiums! 🥊🥇 #ManipurSports #Champions #ManipurVoices',
        mediaUrl: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=1000&auto=format&fit=crop&q=80',
      },
    ],
    comments: [
      'Loktak lake floating phumdis are truly an ecological wonder of the world 🌊',
      'Ima Keithel market is an incredible testament to women leadership in commerce!',
      'Manipur athletes have unbelievable determination and discipline 🥇',
    ],
  },
  {
    name: 'VARTA | Meghalaya Connect',
    slug: 'varta-meghalaya-connect',
    description: 'Abode of the Clouds! Living Root Bridges of Nohwet, Cherrapunji and Mawsynram rains, crystal clear Umngot river at Dawki, Shillong rock music capital, and Khasi & Garo matrilineal culture.',
    category: 'India Trends',
    avatarUrl: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=800&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200&auto=format&fit=crop&q=80',
    posts: [
      {
        content: 'Crossing the centuries-old bio-engineered Double Decker Living Root Bridge in Cherrapunji. Indigenous Khasi tribes weaving rubber tree roots across roaring rivers—sustainable genius! 🌿🌉 #MeghalayaConnect #LivingRootBridges',
        mediaUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1000&auto=format&fit=crop&q=80',
      },
      {
        content: 'Boating on the Umngot River in Dawki: The water is so transparent that boats look like they are floating mid-air above smooth river pebbles! 🛶💎 #Dawki #Meghalaya #IncredibleIndia',
        isVideo: true,
      },
      {
        content: 'Shillong: India’s rock music capital! From indie acoustic cafes in Police Bazar to packed autumn Cherry Blossom festivals, music is in the very breath of Meghalaya. 🎸🌸 #Shillong #CherryBlossom #MeghalayaConnect',
        mediaUrl: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=1000&auto=format&fit=crop&q=80',
      },
      {
        content: 'Savoring hot Jadoh cooked with aromatic short-grain hill rice, paired with spicy Dohneiiong (pork with black sesame). Khasi culinary heritage at its tastiest! 🍲😋 #KhasiFood #MeghalayaConnect',
        mediaUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=1000&auto=format&fit=crop&q=80',
      },
    ],
    comments: [
      'Dawki river transparency is unbelievable until you see it with your own eyes! 💎',
      'The trek down to Nohkalikai falls in Sohra was pure magic 🌧️',
      'Shillong cafes have the best live indie acoustic musicians in India 🎸',
    ],
  },
  {
    name: 'VARTA | Mizo Hnam',
    slug: 'varta-mizo-hnam',
    description: 'Chibai Mizoram! The land of rolling hills and bamboo groves. Cheraw bamboo dance, Chapchar Kut spring festival, serene Aizawl cliffside architecture, high literacy, and community brotherhood (Tlawmngaihna).',
    category: 'India Trends',
    avatarUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80',
    posts: [
      {
        content: 'Chibai! The mesmerizing rhythm and agility of Cheraw (the bamboo dance): colorful traditional Puan shawls, clicking bamboo poles, and joyful celebrations! 🎋💃 #MizoHnam #CherawDance #MizoramPride',
        mediaUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1000&auto=format&fit=crop&q=80',
      },
      {
        content: 'Aizawl perched on mountain ridges: One of India’s most disciplined and civic-minded cities. No unnecessary honking, zero road rage, and clean streets! 🚗🏙️ #Aizawl #CivicSense #MizoHnam',
        mediaUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1000&auto=format&fit=crop&q=80',
      },
      {
        content: 'Chapchar Kut festival: When the entire Mizo community gathers in song, dance, and traditional feasts to celebrate the coming of spring. Truly heartwarming! 🌸🎶 #ChapcharKut #MizoCulture #MizoHnam',
        isVideo: true,
      },
      {
        content: 'Tlawmngaihna: The core Mizo moral code of selflessness, hospitality, and helping neighbors before oneself. A philosophy the entire world can learn from. 🤝❤️ #Tlawmngaihna #Mizoram #MizoHnam',
        mediaUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1000&auto=format&fit=crop&q=80',
      },
    ],
    comments: [
      'Aizawl zero-honking traffic discipline is an example for every metro in India! 🚗',
      'The harmony and community support in Mizo society is deeply inspiring ❤️',
      'Cheraw bamboo dance speed and coordination is extraordinary to watch 🎋',
    ],
  },
  {
    name: 'VARTA | Naga Heritage',
    slug: 'varta-naga-heritage',
    description: 'The Land of Festivals! The world-famous Hornbill Festival in Kisama, trekking the emerald Dzukou Valley, traditional handwoven Naga shawls, 16 distinct warrior tribes, and Kohima bravery.',
    category: 'India Trends',
    avatarUrl: 'https://images.unsplash.com/photo-1561047029-3000c68339ca?w=800&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&auto=format&fit=crop&q=80',
    posts: [
      {
        content: 'The Hornbill Festival at Kisama Heritage Village: 16 vibrant Naga tribes coming together with warrior chants, indigenous archery, log drums, and unmatched camaraderie! 🪶🥁 #NagaHeritage #HornbillFestival #Nagaland',
        mediaUrl: 'https://images.unsplash.com/photo-1561047029-3000c68339ca?w=1000&auto=format&fit=crop&q=80',
      },
      {
        content: 'Trekking through the mythical Dzukou Valley: rolling emerald meadows, endemic Dzukou lilies, and crystal streams tucked between Nagaland and Manipur. Pure paradise! 🌿🌸 #DzukouValley #NagalandTourism',
        isVideo: true,
      },
      {
        content: 'The intricate geometric motifs and natural vegetable dyes of traditional Naga shawls—each pattern tells the proud story of clan, honor, and courage. 🧵✨ #NagaTextiles #Handloom #NagaHeritage',
        mediaUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1000&auto=format&fit=crop&q=80',
      },
      {
        content: 'Smoked meat cooked with fermented bamboo shoot (Bastanga) and fiery Raja Mircha (Bhut Jolokia). Flavor profiles that are bold, pungent, and unforgettable! 🌶️🍲 #NagaCuisine #BhutJolokia #NagaHeritage',
        mediaUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=1000&auto=format&fit=crop&q=80',
      },
    ],
    comments: [
      'Hornbill festival in December is the single best cultural gathering in Asia! 🪶',
      'Dzukou Valley trek under clear autumn skies will stay in my heart forever 🌿',
      'Raja Mircha chutney requires courage! Deliciously fiery 🌶️',
    ],
  },
  {
    name: 'VARTA | Ama Odisha',
    slug: 'varta-ama-odisha',
    description: 'ବନ୍ଦେ ଉତ୍କଳ ଜନନୀ! Sacred Jagannath Puri Ratha Yatra, Konark Sun Temple chariot wheels, Chilika Lake Irrawaddy dolphins, Odissi classical dance, Pahala Rasagola, and Bhubaneswar tech growth.',
    category: 'India Trends',
    avatarUrl: 'https://images.unsplash.com/photo-1600100397608-f010f443b353?w=800&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1200&auto=format&fit=crop&q=80',
    posts: [
      {
        content: 'ଜୟ ଜଗନ୍ନାଥ! The grand Ratha Yatra of Puri: millions of devotees pulling the colossal chariots of Lord Jagannath, Balabhadra, and Subhadra along Bada Danda. Unparalleled devotion! 🚩🙏 #PuriRathaYatra #JayJagannath #AmaOdisha',
        mediaUrl: 'https://images.unsplash.com/photo-1600100397608-f010f443b353?w=1000&auto=format&fit=crop&q=80',
      },
      {
        content: 'Standing before the 13th-century Konark Sun Temple: The stone wheels designed as sundials calculate time down to the exact second. Genius ancient Indian astronomy! ☀️🏛️ #KonarkSunTemple #AncientAstronomy #AmaOdisha',
        mediaUrl: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1000&auto=format&fit=crop&q=80',
      },
      {
        content: 'Chilika Lake boat cruise: Asia’s largest brackish lagoon where endangered Irrawaddy dolphins breach beside migratory flamingos. An ecological treasure! 🐬🌊 #ChilikaLake #EcoTourism #AmaOdisha',
        isVideo: true,
      },
      {
        content: 'Warm, melt-in-mouth Pahala Rasagola, Chhena Poda with caramelized crust, and Pakhala Bhata on a hot afternoon. Odisha’s culinary heritage is pure ambrosia! 🍯😋 #ChhenaPoda #Rasagola #OdiaFood #AmaOdisha',
        mediaUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1000&auto=format&fit=crop&q=80',
      },
    ],
    comments: [
      'Ratha Yatra energy in Puri gives tears of joy! Jay Jagannath 🙏',
      'The engineering and symmetry of Konark wheels is breathtaking ☀️',
      'Authentic Chhena Poda right out of the sal leaf oven is bliss 🍯',
    ],
  },
  {
    name: 'VARTA | Sadda Punjab',
    slug: 'varta-sadda-punjab',
    description: 'ਜੀ ਆਇਆਂ ਨੂੰ! Land of Five Rivers. Golden Temple Amritsar, spirited Bhangra and Giddha, lush yellow Sarson fields, Makki di Roti with Sarson da Saag, and Punjabi music taking over the globe.',
    category: 'India Trends',
    avatarUrl: 'https://images.unsplash.com/photo-1588714477688-cf28a50e94f7?w=800&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&auto=format&fit=crop&q=80',
    posts: [
      {
        content: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! Sitting by the Amrit Sarovar at Sri Harmandir Sahib (Golden Temple) at dawn. The golden reflection, soulful Gurbani kirtan, and peaceful langar nourish body and soul 🙏✨ #GoldenTemple #Amritsar #SaddaPunjab',
        mediaUrl: 'https://images.unsplash.com/photo-1588714477688-cf28a50e94f7?w=1000&auto=format&fit=crop&q=80',
      },
      {
        content: 'Bhangra beats echoing across fields! The infectious energy, dhol rhythm, and zest for life that defines Punjab is now a global music phenomenon. Chak de phatte! 🥁🔥 #Bhangra #PunjabiMusic #SaddaPunjab',
        isVideo: true,
      },
      {
        content: 'Freshly patted Makki di Roti dripping with homemade white butter (makkhan), served with slow-cooked Sarson da Saag and jaggery (gur). The soul of winter in Punjab! 🫓🧈 #SarsonKaSaag #DesiKhaana #SaddaPunjab',
        mediaUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1000&auto=format&fit=crop&q=80',
      },
      {
        content: 'Ludhiana and Jalandhar: Powering India’s sports manufacturing, hosiery exports, and agricultural mechanization. Hard work and enterprise in every Punjabi vein! 🚜⚙️ #PunjabIndustry #SaddaPunjab',
        mediaUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1000&auto=format&fit=crop&q=80',
      },
    ],
    comments: [
      'The peace you feel sitting beside the Sarovar at the Golden Temple is eternal 🙏',
      'Nothing beats hot Makki di roti with yellow sarson saag on a chilly morning! 🫓',
      'Punjabi music taking over global charts from London to Toronto! Proud 🎶',
    ],
  },
  {
    name: 'VARTA | Apno Rajasthan',
    slug: 'varta-apno-rajasthan',
    description: 'पधारो म्हारे देस! Royal hill forts of Mewar & Marwar, golden dunes of Jaisalmer, palaces of Jaipur & Udaipur, Ghoomar dance, Dal Baati Churma, and centuries of regal craftsmanship.',
    category: 'India Trends',
    avatarUrl: 'https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?w=800&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1572978938886-1a05e2dc590a?w=1200&auto=format&fit=crop&q=80',
    posts: [
      {
        content: 'खम्मा घणी! Standing on the ramparts of Mehrangarh Fort in Jodhpur, gazing across the mesmerizing ocean of blue Brahmin houses below. Royalty etched into sandstone! 🏰💙 #ApnoRajasthan #Jodhpur #BlueCity #Mehrangarh',
        mediaUrl: 'https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?w=1000&auto=format&fit=crop&q=80',
      },
      {
        content: 'Sunset on the golden sand dunes of Jaisalmer with folk singers playing the Kamaycha and women performing the spellbinding Kalbeliya dance. Magic in the Thar desert! 🐪🌅 #Jaisalmer #TharDesert #ApnoRajasthan',
        isVideo: true,
      },
      {
        content: 'Authentic Dal Baati Churma served with fiery garlic chutney, roasted papad, and a bowl of Gatte ki Sabzi. The quintessential royal Rajasthani meal! 🍲🔥 #DalBaatiChurma #RajasthaniFood #ApnoRajasthan',
        mediaUrl: 'https://images.unsplash.com/photo-1572978938886-1a05e2dc590a?w=1000&auto=format&fit=crop&q=80',
      },
      {
        content: 'Jaipur: The World Craft City! Block printed Sanganeri and Bagru textiles, Blue Pottery, and Meenakari jewelry celebrated across global fashion runways. 🧵🏺 #JaipurCrafts #BlockPrint #ApnoRajasthan',
        mediaUrl: 'https://images.unsplash.com/photo-1561047029-3000c68339ca?w=1000&auto=format&fit=crop&q=80',
      },
    ],
    comments: [
      'Mehrangarh Fort is without doubt one of the grandest forts on earth 🏰',
      'The folk melodies in Jaisalmer under the starlit desert give goosebumps 🐪',
      'Dal Baati Churma with garlic chutney is heavenly richness 😋',
    ],
  },
  {
    name: 'VARTA | Sikkim Sangam',
    slug: 'varta-sikkim-sangam',
    description: 'In the sacred lap of Mt. Kanchenjunga! India’s first 100% organic state. Rumtek Monastery, pristine Gurudongmar Lake, Nathu La pass on the ancient Silk Route, and clean mountain peace in Gangtok.',
    category: 'India Trends',
    avatarUrl: 'https://images.unsplash.com/photo-1626014303757-646734d6739b?w=800&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80',
    posts: [
      {
        content: 'Tashi Delek! The sunrise striking the crown of Mt. Kanchenjunga from Tiger Hill and Gangtok. The world’s third-highest peak glowing in deep orange gold! 🏔️✨ #SikkimSangam #Kanchenjunga #Gangtok',
        mediaUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1000&auto=format&fit=crop&q=80',
      },
      {
        content: 'India’s first 100% certified organic state! Sikkim proved that zero-chemical agriculture, pristine soil conservation, and high farmer prosperity can coexist beautifully. 🌿🌱 #OrganicSikkim #GreenIndia #SikkimSangam',
        isVideo: true,
      },
      {
        content: 'Nathu La Pass at 14,140 feet: The historic Indo-China trade route where Indian army jawans guard our frontiers amid sub-zero winds and fluttering prayer flags. Salute! 🇮🇳❄️ #NathuLa #IndianArmy #SikkimSangam',
        mediaUrl: 'https://images.unsplash.com/photo-1626014303757-646734d6739b?w=1000&auto=format&fit=crop&q=80',
      },
      {
        content: 'Steaming hot Tibetan momos with spicy dhangtse chili dip, followed by a comforting bowl of Thukpa at MG Marg, Gangtok. The perfect hill comfort food! 🥟🍜 #SikkimFood #Momos #Thukpa #SikkimSangam',
        mediaUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=1000&auto=format&fit=crop&q=80',
      },
    ],
    comments: [
      'Gurudongmar lake at 17,800 ft is a life-altering experience. Sacred and pristine 🏔️',
      'Cleanest mountain state award goes to Sikkim every single time!',
      'Hot Thukpa at MG Marg on a chilly foggy evening is bliss 🍜',
    ],
  },
  {
    name: 'VARTA | Namma Tamil Nadu',
    slug: 'varta-namma-tamil-nadu',
    description: 'வணக்கம் தமிழ்நாடு! Sangam literature, ancient Dravidian gopurams of Madurai Meenakshi & Thanjavur Brihadisvara, Chennai SaaS and automotive capital, Bharatanatyam, and filter kaapi rituals.',
    category: 'India Trends',
    avatarUrl: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=1200&auto=format&fit=crop&q=80',
    posts: [
      {
        content: 'வணக்கம்! The architectural genius of the 1,000-year-old Brihadisvara Temple (Thanjavur Periya Kovil): A granite vimana towering without binding mortar that has withstood earthquakes. Unmatched Chola engineering! 🛕✨ #NammaTamilNadu #Thanjavur #CholaArchitecture',
        mediaUrl: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=1000&auto=format&fit=crop&q=80',
      },
      {
        content: 'Chennai: The SaaS Capital and Detroit of South Asia! Powering global enterprise software from OMR and manufacturing millions of automobiles for world markets. Industrial powerhouse! 🚗💻 #ChennaiTech #SaaSCapital #TamilNaduTrends',
        isVideo: true,
      },
      {
        content: 'Crispy ghee podi roast dosa, soft idlis dipped in hot tiffin sambar, and a foaming tumbler of degree filter coffee. Morning ritual perfected over generations! 🥞☕ #SouthIndianFood #FilterKaapi #NammaTamilNadu',
        mediaUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=1000&auto=format&fit=crop&q=80',
      },
      {
        content: 'Margazhi Music and Dance Festival: When the sabhas of Chennai come alive with the divine ragas of Carnatic music and the sublime sculpturesque postures of Bharatanatyam. 🎶💃 #Margazhi #Bharatanatyam #TamilCulture',
        mediaUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1000&auto=format&fit=crop&q=80',
      },
    ],
    comments: [
      'Brihadisvara Temple vimana shadow mystery and granite carving is breathtaking 🛕',
      'Chennai OMR SaaS founders are creating multi-billion dollar companies 💻',
      'Filter coffee from a brass davara tumbler can start anyone’s morning right! ☕',
    ],
  },
  {
    name: 'VARTA | Mana Telangana',
    slug: 'varta-mana-telangana',
    description: 'జై తెలంగాణ! Cyberabad and T-Hub technology innovation, historic Charminar and Golconda Fort, world-famous Hyderabadi Dum Biryani, colorful Bathukamma floral festival, and UNESCO Ramappa Temple.',
    category: 'India Trends',
    avatarUrl: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80',
    posts: [
      {
        content: 'నమస్కారం! Hyderabad’s T-Hub, the world’s largest innovation campus, is breeding AI, aerospace, and life-sciences startups that compete globally. Telangana on the fast track! 🚀💻 #ManaTelangana #HyderabadTech #THub',
        mediaUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1000&auto=format&fit=crop&q=80',
      },
      {
        content: 'Nothing on Earth compares to an authentic handi of Hyderabadi Mutton Dum Biryani, garnished with fried onions, mint, and served with spicy Mirchi ka Salan. Culinary perfection! 🍲🔥 #HyderabadiBiryani #ManaTelangana #Foodie',
        isVideo: true,
      },
      {
        content: 'Bathukamma: The vibrant floral festival where women arrange seasonal wildflowers in conical tiers, singing melodious folk songs celebrating nature and life. 🌺💐 #Bathukamma #TelanganaCulture #ManaTelangana',
        mediaUrl: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=1000&auto=format&fit=crop&q=80',
      },
      {
        content: 'UNESCO World Heritage Ramappa Temple: Built with floating bricks and intricately carved basalt stone pillars that have stood pristine for over 800 years. Kakatiya marvel! 🛕🧱 #RamappaTemple #Kakatiya #ManaTelangana',
        mediaUrl: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=1000&auto=format&fit=crop&q=80',
      },
    ],
    comments: [
      'T-Hub scale and infrastructure is unmatched in India! Proud Hyderabadi 🚀',
      'Biryani at midnight in Old City near Charminar is pure happiness 🍲',
      'Ramappa temple floating bricks show ancient Indian scientific mastery 🛕',
    ],
  },
  {
    name: 'VARTA | Tripura Connect',
    slug: 'varta-tripura-connect',
    description: 'Land of Fourteen Gods! The floating Neermahal Water Palace, historic Ujjayanta Palace in Agartala, rock-cut bas-reliefs of Unakoti, bamboo handicraft excellence, and eco-tourism.',
    category: 'India Trends',
    avatarUrl: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=800&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80',
    posts: [
      {
        content: 'Neermahal Palace: Eastern India’s only water palace, floating in the middle of Rudrasagar Lake. Blending Hindu and Mughal architecture into an exquisite lakeside spectacle! 🏰🌊 #TripuraConnect #Neermahal #TripuraTourism',
        mediaUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000&auto=format&fit=crop&q=80',
      },
      {
        content: 'Unakoti (one less than a crore): Ancient rock-cut sculptures of Lord Shiva carved into the forested hillside. The 30-foot Unakotiswara Kal Bhairava is awe-inspiring! 🪨🙏 #Unakoti #AncientIndia #TripuraConnect',
        isVideo: true,
      },
      {
        content: 'Tripura’s master artisans crafting lightweight, durable furniture and artistic decor from natural bamboo and cane. Sustainable green design at its finest! 🎋🪑 #BambooCraft #TripuraHandicrafts #TripuraConnect',
        mediaUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1000&auto=format&fit=crop&q=80',
      },
      {
        content: 'Tripuri traditional food: Savoring spicy Mui Borok made with fermented fish (berma) and local herbs, paired with sweet Queen Pineapples from Agartala. Unique delicacies! 🍍🍲 #TripuraFlavors #NorthEastFood #TripuraConnect',
        mediaUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=1000&auto=format&fit=crop&q=80',
      },
    ],
    comments: [
      'Neermahal illuminated on Rudrasagar lake at dusk is magnificent 🏰',
      'Unakoti rock carvings are deeply mysterious and spiritual 🪨',
      'Tripura Queen pineapples are the sweetest in the country 🍍',
    ],
  },
  {
    name: 'VARTA | Apna Uttar Pradesh',
    slug: 'varta-apna-uttar-pradesh',
    description: 'The cultural & spiritual heartbeat of Bharat! Sacred Kashi ghats, Ayodhya Ram Mandir, Lucknow Nawabi tehzeeb & Chikankari embroidery, Agra Taj Mahal, and industrial expressway corridors.',
    category: 'India Trends',
    avatarUrl: 'https://images.unsplash.com/photo-1561047029-3000c68339ca?w=800&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=1200&auto=format&fit=crop&q=80',
    posts: [
      {
        content: 'हर हर महादेव! Evening Maha Aarti on the ghats of Varanasi: The synchronized brass lamps, incense smoke curling towards the twilight sky, and bells echoing across holy Ganga. Spiritual bliss! 🪔🌊 #Kashi #Varanasi #ApnaUttarPradesh',
        mediaUrl: 'https://images.unsplash.com/photo-1561047029-3000c68339ca?w=1000&auto=format&fit=crop&q=80',
      },
      {
        content: 'Ayodhya: The historic Pran Pratishtha of Shri Ram Janmabhoomi Mandir. Nagara-style pink Bansi Paharpur sandstone craftsmanship standing as an eternal symbol of cultural resurgence! 🛕🏹 #Ayodhya #RamMandir #ApnaUttarPradesh',
        mediaUrl: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=1000&auto=format&fit=crop&q=80',
      },
      {
        content: 'Lucknow: The city of tehzeeb, delicate white-on-white Chikankari embroidery, and legendary Galouti Kebabs that melt upon touching your tongue. True nawabi finesse! 🪡🍢 #Lucknow #Chikankari #ApnaUttarPradesh',
        isVideo: true,
      },
      {
        content: 'Noida International Airport (Jewar) and the network of world-class expressways: Uttar Pradesh is powering into a trillion-dollar economy with record manufacturing investments! ✈️🛣️ #ExpresswayState #UPRising #ApnaUttarPradesh',
        mediaUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1000&auto=format&fit=crop&q=80',
      },
    ],
    comments: [
      'Ganga aarti at Dashashwamedh Ghat in Varanasi cleanses the soul 🙏🪔',
      'Ayodhya temple architecture is a glorious tribute to our heritage 🛕',
      'The speed of Purvanchal and Bundelkhand expressways is world-class 🛣️',
    ],
  },
  {
    name: 'VARTA | Devbhoomi Uttarakhand',
    slug: 'varta-devbhoomi-uttarakhand',
    description: 'Simply Heaven! Sacred Char Dham (Kedarnath, Badrinath, Gangotri, Yamunotri), Yoga Capital Rishikesh, Valley of Flowers, Jim Corbett tiger reserve, and pristine Garhwali & Kumaoni culture.',
    category: 'India Trends',
    avatarUrl: 'https://images.unsplash.com/photo-1626014303757-646734d6739b?w=800&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&auto=format&fit=crop&q=80',
    posts: [
      {
        content: 'जय केदार! Standing before the ancient stone sanctum of Kedarnath Temple at 11,755 ft with towering snow-clad Himalayan peaks guarding the shrine. An experience beyond words! 🛕❄️ #Kedarnath #CharDham #DevbhoomiUttarakhand',
        mediaUrl: 'https://images.unsplash.com/photo-1626014303757-646734d6739b?w=1000&auto=format&fit=crop&q=80',
      },
      {
        content: 'Rishikesh: Yoga Capital of the World! Meditating on the banks of emerald Ganga, watching the lamps float downriver during Parmarth Niketan aarti, and experiencing river rafting thrill. 🧘‍♂️🌊 #Rishikesh #YogaCapital #Uttarakhand',
        isVideo: true,
      },
      {
        content: 'Trek through the Valley of Flowers: A UNESCO World Heritage paradise blooming with hundreds of wild alpine flowers against mist-covered glaciers. Nature’s greatest masterpiece! 🌸🌿 #ValleyOfFlowers #HimalayanTrek',
        mediaUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1000&auto=format&fit=crop&q=80',
      },
      {
        content: 'Warm Garhwali comfort: Savoring Aloo ke Gutke, hot Bhatt ki Churkani, and crunchy Jhangore ki Kheer in a cozy mountain homestay. Pure pahadi warmth! 🍲😋 #PahadiFood #UttarakhandFlavors #DevbhoomiUttarakhand',
        mediaUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=1000&auto=format&fit=crop&q=80',
      },
    ],
    comments: [
      'Kedarnath temple trek tests your willpower and rewards your soul 🙏❄️',
      'Rishikesh Ganga aarti vibrations cannot be matched anywhere 🌊',
      'Bhatt ki churkani with red rice is the ultimate winter mountain comfort 🍲',
    ],
  },
  {
    name: 'VARTA | Amader Bangla',
    slug: 'varta-amader-bangla',
    description: 'জয় বাংলা! Durga Puja carnival (UNESCO Intangible Heritage), Kolkata yellow taxis and Howrah Bridge, Darjeeling tea gardens, Sundarbans mangrove tigers, Rabindrasangeet, and Rosogolla bliss.',
    category: 'India Trends',
    avatarUrl: 'https://images.unsplash.com/photo-1558431382-27e303142255?w=800&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1200&auto=format&fit=crop&q=80',
    posts: [
      {
        content: 'শুভ বিজয়া ও শারদীয়ার প্রীতি ও শুভেচ্ছা! Durga Puja in Kolkata: Art galleries sprawling across every street corner, dhak beats echoing, and millions walking through illuminated pandals. Pure carnival magic! 🥁🌸 #DurgaPuja #KolkataCarnival #AmaderBangla',
        mediaUrl: 'https://images.unsplash.com/photo-1558431382-27e303142255?w=1000&auto=format&fit=crop&q=80',
      },
      {
        content: 'Early morning on the iconic Howrah Bridge: Yellow ambassador taxis cruising past as mist rises from the Hooghly river, with steaming cups of kulhad chai at the flower market. Timeless Kolkata! 🌁🚕 #HowrahBridge #CityOfJoy #AmaderBangla',
        mediaUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1000&auto=format&fit=crop&q=80',
      },
      {
        content: 'Sipping a cup of champagne-of-teas: Darjeeling Muscatel First Flush overlooking the Kanchenjunga range from a heritage tea plantation. Unrivaled aroma! ☕🏔️ #DarjeelingTea #AmaderBangla #BengalTea',
        isVideo: true,
      },
      {
        content: 'Freshly made warm, spongy Rosogollas dipped in light cardamom syrup, followed by Kosha Mangsho and Radhaballabhi on Sunday afternoon. Food is worship in Bengal! 🍯🍛 #Rosogolla #BanglaCuisine #AmaderBangla',
        mediaUrl: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1000&auto=format&fit=crop&q=80',
      },
    ],
    comments: [
      'Durga Puja pandal hopping in Kolkata is unmatched in sheer artistic creativity 🌸',
      'The morning view of Howrah bridge from the ghats is iconic 🌁',
      'Nothing compares to warm freshly made Nolen Gur Rosogolla in winter! 🍯',
    ],
  },
];

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomSubarray(arr, size) {
  const shuffled = arr.slice().sort(() => 0.5 - Math.random());
  return shuffled.slice(0, size);
}

async function main() {
  console.log(`🚀 Seeding ${STATE_GROUPS.length} Indian States Groups in "India Trends" category...\n`);

  // 1. Fetch users from DB
  const users = await prisma.user.findMany({
    select: { id: true, username: true },
  });

  if (users.length === 0) {
    console.error('❌ No users found in database! Please seed users first.');
    process.exit(1);
  }

  const rakaUser = users.find((u) => u.username === 'raka92') || users[0];
  console.log(`👤 Found ${users.length} users. Primary admin: @${rakaUser.username}`);

  let createdGroupCount = 0;
  let totalPostsCreated = 0;
  let totalCommentsCreated = 0;

  for (let i = 0; i < STATE_GROUPS.length; i++) {
    const config = STATE_GROUPS[i];
    console.log(`\n🏛️ [${i + 1}/${STATE_GROUPS.length}] Processing "${config.name}"...`);

    // Pick a community creator from users
    const creator = users[i % users.length];

    // Upsert Group
    let group = await prisma.group.findUnique({
      where: { slug: config.slug },
    });

    const groupPayload = {
      name: config.name,
      slug: config.slug,
      description: config.description,
      category: 'India Trends',
      avatarUrl: config.avatarUrl,
      coverUrl: config.coverUrl,
      creatorId: creator.id,
      isPrivate: false,
    };

    if (!group) {
      group = await prisma.group.create({
        data: groupPayload,
      });
      console.log(`  ✅ Created group "${group.name}" (ID: ${group.id})`);
    } else {
      group = await prisma.group.update({
        where: { id: group.id },
        data: groupPayload,
      });
      console.log(`  🔄 Updated existing group "${group.name}" (ID: ${group.id})`);
    }
    createdGroupCount++;

    // Enroll 25-45 members per group
    const candidateMembers = getRandomSubarray(users, Math.min(35, users.length));
    if (!candidateMembers.some((u) => u.id === rakaUser.id)) {
      candidateMembers.push(rakaUser);
    }
    if (!candidateMembers.some((u) => u.id === creator.id)) {
      candidateMembers.push(creator);
    }

    for (const member of candidateMembers) {
      await prisma.groupMember.upsert({
        where: {
          groupId_userId: {
            groupId: group.id,
            userId: member.id,
          },
        },
        update: {},
        create: {
          groupId: group.id,
          userId: member.id,
          role: member.id === creator.id ? 'ADMIN' : Math.random() < 0.15 ? 'MODERATOR' : 'MEMBER',
        },
      });
    }

    const memberCount = await prisma.groupMember.count({
      where: { groupId: group.id },
    });

    // Clear prior posts of this group for clean sync
    await prisma.postMedia.deleteMany({
      where: { post: { groupId: group.id } },
    });
    await prisma.post.deleteMany({
      where: { groupId: group.id },
    });

    // Insert posts
    const createdPosts = [];
    for (let pIdx = 0; pIdx < config.posts.length; pIdx++) {
      const pData = config.posts[pIdx];
      const author = pIdx === 0 ? creator : getRandomElement(candidateMembers);
      const postDate = new Date(Date.now() - (pIdx * 3 + 1) * 3600 * 1000);

      const likeCount = Math.floor(Math.random() * 85) + 20;
      const repostCount = Math.floor(Math.random() * 25) + 5;
      const bookmarkCount = Math.floor(Math.random() * 18) + 2;

      const mediaToCreate = [];
      if (pData.isVideo) {
        const vid = VERIFIED_VIDEOS[pIdx % VERIFIED_VIDEOS.length];
        mediaToCreate.push({
          type: 'VIDEO',
          url: vid.url,
          thumbnailUrl: vid.thumbnailUrl,
          mimeType: vid.mimeType,
          sizeBytes: vid.sizeBytes,
          width: vid.width,
          height: vid.height,
          order: 0,
          createdAt: postDate,
        });
      } else if (pData.mediaUrl) {
        mediaToCreate.push({
          type: 'IMAGE',
          url: pData.mediaUrl,
          thumbnailUrl: pData.mediaUrl,
          mimeType: 'image/jpeg',
          sizeBytes: 1200000,
          width: 1200,
          height: 800,
          order: 0,
          createdAt: postDate,
        });
      }

      const post = await prisma.post.create({
        data: {
          authorId: author.id,
          groupId: group.id,
          content: pData.content.slice(0, 490),
          likeCount,
          repostCount,
          replyCount: 0,
          bookmarkCount,
          createdAt: postDate,
          updatedAt: postDate,
          ...(mediaToCreate.length > 0 && {
            media: {
              create: mediaToCreate,
            },
          }),
        },
      });

      createdPosts.push(post);
      totalPostsCreated++;
    }

    // Insert comments/discussions
    if (createdPosts.length > 0 && config.comments && config.comments.length > 0) {
      for (let cIdx = 0; cIdx < config.comments.length; cIdx++) {
        const targetPost = createdPosts[cIdx % createdPosts.length];
        const commenter = getRandomElement(candidateMembers.filter((u) => u.id !== targetPost.authorId)) || candidateMembers[0];
        const commentDate = new Date(targetPost.createdAt.getTime() + (cIdx + 1) * 12 * 60 * 1000);

        await prisma.post.create({
          data: {
            authorId: commenter.id,
            parentId: targetPost.id,
            groupId: group.id,
            content: config.comments[cIdx].slice(0, 490),
            likeCount: Math.floor(Math.random() * 20) + 3,
            repostCount: 0,
            replyCount: 0,
            bookmarkCount: 0,
            createdAt: commentDate,
            updatedAt: commentDate,
          },
        });

        await prisma.post.update({
          where: { id: targetPost.id },
          data: { replyCount: { increment: 1 } },
        });

        totalCommentsCreated++;
      }
    }

    // Update group counts
    const postCount = await prisma.post.count({
      where: { groupId: group.id, parentId: null },
    });

    await prisma.group.update({
      where: { id: group.id },
      data: {
        memberCount,
        postCount,
      },
    });

    console.log(`  👥 Members: ${memberCount} | 📝 Posts: ${postCount} | 💬 Comments: ${config.comments.length}`);
  }

  console.log('\n======================================================');
  console.log(`🎉 Successfully seeded all ${createdGroupCount} Indian States Community Groups!`);
  console.log(`📊 Total State Groups: ${createdGroupCount}`);
  console.log(`📝 Total Root Posts Created: ${totalPostsCreated}`);
  console.log(`💬 Total Discussion Comments: ${totalCommentsCreated}`);
  console.log('======================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed with error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
